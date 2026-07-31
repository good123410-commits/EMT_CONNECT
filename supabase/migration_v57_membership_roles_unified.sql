-- 회원 등급 4단계 일원화: admin | regular_member | associate_member | user
-- 선행: migration_v49, migration_v52

-- ============================================================
-- 1) 레거시 role → 4단계 매핑
-- ============================================================
UPDATE public.user_profiles
SET
  role = CASE
    WHEN role IN ('admin', 'super_admin', 'sub_admin') THEN 'admin'
    WHEN role = 'regular_member' THEN 'regular_member'
    WHEN role IN ('associate_member', 'paramedic', 'hospital', 'private_ems') THEN
      CASE WHEN membership_dues_paid THEN 'regular_member' ELSE 'associate_member' END
    WHEN role IN ('user', 'emt', 'emt_certified', 'public', 'member') OR role IS NULL OR TRIM(role) = '' THEN 'user'
    ELSE 'user'
  END,
  is_approved = CASE
    WHEN role IN ('admin', 'super_admin', 'sub_admin') THEN true
    WHEN role IN ('associate_member', 'regular_member', 'paramedic', 'hospital', 'private_ems') THEN true
  ELSE is_approved
  END,
  membership_dues_paid = CASE
    WHEN role IN ('admin', 'super_admin', 'sub_admin') THEN membership_dues_paid
    WHEN role = 'regular_member' OR (role IN ('paramedic', 'hospital', 'private_ems') AND membership_dues_paid) THEN true
    ELSE false
  END,
  membership_dues_paid_at = CASE
    WHEN role = 'regular_member' OR (role IN ('paramedic', 'hospital', 'private_ems') AND membership_dues_paid) THEN
      COALESCE(membership_dues_paid_at, TIMEZONE('utc'::text, NOW()))
    WHEN role IN ('associate_member', 'paramedic', 'hospital', 'private_ems', 'user') THEN NULL
    ELSE membership_dues_paid_at
  END
WHERE role IS NULL
   OR TRIM(role) = ''
   OR role NOT IN ('user', 'associate_member', 'regular_member', 'admin');

-- associate_member + 회비 납부 → 정회원 승격
UPDATE public.user_profiles
SET
  role = 'regular_member',
  membership_dues_paid = true,
  membership_dues_paid_at = COALESCE(membership_dues_paid_at, TIMEZONE('utc'::text, NOW()))
WHERE role = 'associate_member' AND membership_dues_paid = true;

ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('user', 'associate_member', 'regular_member', 'admin'));

-- ============================================================
-- 2) RBAC 헬퍼
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_approved_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.id = auth.uid()
      AND up.is_approved = true
      AND COALESCE(up.is_blocked, false) = false
      AND up.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_associate_paramedic()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.id = auth.uid()
      AND COALESCE(up.is_blocked, false) = false
      AND up.is_approved = true
      AND up.role IN ('associate_member', 'regular_member')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_regular_member()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.id = auth.uid()
      AND COALESCE(up.is_blocked, false) = false
      AND up.is_approved = true
      AND up.role IN ('regular_member', 'admin')
  );
$$;

-- ============================================================
-- 3) 관리자 — 등급/회비 RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_user_id UUID,
  p_role TEXT
)
RETURNS public.user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.user_profiles;
  v_role TEXT := TRIM(p_role);
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  IF p_user_id = auth.uid() AND v_role <> 'admin' THEN
    RAISE EXCEPTION 'cannot_demote_self';
  END IF;

  IF v_role NOT IN ('user', 'associate_member', 'regular_member', 'admin') THEN
    RAISE EXCEPTION 'invalid_role';
  END IF;

  UPDATE public.user_profiles
  SET
    role = v_role,
    is_approved = CASE WHEN v_role = 'user' THEN is_approved ELSE true END,
    membership_dues_paid = CASE
      WHEN v_role = 'regular_member' THEN true
      WHEN v_role = 'associate_member' THEN false
      WHEN v_role = 'user' THEN false
      ELSE membership_dues_paid
    END,
    membership_dues_paid_at = CASE
      WHEN v_role = 'regular_member' THEN COALESCE(membership_dues_paid_at, TIMEZONE('utc'::text, NOW()))
      WHEN v_role IN ('associate_member', 'user') THEN NULL
      ELSE membership_dues_paid_at
    END
  WHERE id = p_user_id
  RETURNING * INTO v_profile;

  IF v_profile.id IS NULL THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  PERFORM public.write_audit_log(
    'user_role_changed',
    'user_profile',
    p_user_id::text,
    jsonb_build_object('role', v_role, 'membership_dues_paid', v_profile.membership_dues_paid)
  );

  RETURN v_profile;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_dues_paid(
  p_user_id UUID,
  p_paid BOOLEAN
)
RETURNS public.user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.user_profiles;
  v_paid BOOLEAN := COALESCE(p_paid, false);
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  SELECT * INTO v_profile FROM public.user_profiles WHERE id = p_user_id;
  IF v_profile.id IS NULL THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  IF v_profile.role NOT IN ('associate_member', 'regular_member') THEN
    RAISE EXCEPTION 'dues_only_for_members';
  END IF;

  UPDATE public.user_profiles
  SET
    membership_dues_paid = v_paid,
    membership_dues_paid_at = CASE
      WHEN v_paid THEN COALESCE(membership_dues_paid_at, TIMEZONE('utc'::text, NOW()))
      ELSE NULL
    END,
    role = CASE
      WHEN v_paid THEN 'regular_member'
      ELSE 'associate_member'
    END,
    is_approved = true
  WHERE id = p_user_id
  RETURNING * INTO v_profile;

  PERFORM public.write_audit_log(
    'user_dues_changed',
    'user_profile',
    p_user_id::text,
    jsonb_build_object('membership_dues_paid', v_paid, 'role', v_profile.role)
  );

  RETURN v_profile;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_review_verification(
  p_verification_id UUID,
  p_status TEXT,
  p_notes TEXT DEFAULT NULL,
  p_target_role TEXT DEFAULT 'associate_member'
)
RETURNS public.emt_verifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.emt_verifications;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  IF p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;

  UPDATE public.emt_verifications
  SET status = p_status,
      reviewer_notes = p_notes,
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = p_verification_id
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'verification_not_found';
  END IF;

  IF p_status = 'approved' THEN
    UPDATE public.user_profiles
    SET role = 'associate_member',
        is_approved = true,
        membership_dues_paid = false,
        membership_dues_paid_at = NULL
    WHERE id = v_row.user_id;
  END IF;

  PERFORM public.write_audit_log(
    CASE WHEN p_status = 'approved' THEN 'verification_approved' ELSE 'verification_rejected' END,
    'verification',
    p_verification_id::text,
    jsonb_build_object('user_id', v_row.user_id, 'notes', p_notes, 'role', 'associate_member')
  );

  RETURN v_row;
END;
$$;

-- hidden_posts: 준회원/정회원/관리자
DROP POLICY IF EXISTS "hidden_posts_select" ON public.hidden_posts;
CREATE POLICY "hidden_posts_select" ON public.hidden_posts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND COALESCE(up.is_blocked, false) = false
        AND up.is_approved = true
        AND (
          up.role = 'admin'
          OR (up.role IN ('associate_member', 'regular_member') AND hidden_posts.target_role IN ('all', 'paramedic'))
        )
    )
  );

DROP POLICY IF EXISTS "hidden_posts_insert" ON public.hidden_posts;
CREATE POLICY "hidden_posts_insert" ON public.hidden_posts
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND COALESCE(up.is_blocked, false) = false
        AND up.is_approved = true
        AND (
          up.role = 'admin'
          OR (up.role IN ('associate_member', 'regular_member') AND hidden_posts.target_role IN ('all', 'paramedic'))
        )
    )
  );
