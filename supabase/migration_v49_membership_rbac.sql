-- KEMIX 회원 등급 RBAC: 일반/준회원/정회원/관리자 + 회비 + 유저 목록 동기화
-- 선행: migration_v35, migration_v5

-- ============================================================
-- 1) 회비 상태 컬럼
-- ============================================================
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS membership_dues_paid BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS membership_dues_paid_at TIMESTAMPTZ;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs (actor_id);

CREATE OR REPLACE FUNCTION public.write_audit_log(
  p_action TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, details)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id, COALESCE(p_details, '{}'::jsonb))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_user_activity(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_questions JSONB := '[]'::jsonb;
  v_posts JSONB := '[]'::jsonb;
  v_answers JSONB := '[]'::jsonb;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  IF to_regclass('public.questions') IS NOT NULL THEN
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', q.id,
          'title', q.title,
          'status', q.status,
          'created_at', q.created_at
        )
        ORDER BY q.created_at DESC
      ),
      '[]'::jsonb
    )
    INTO v_questions
    FROM public.questions q
    WHERE q.user_id = p_user_id;
  END IF;

  IF to_regclass('public.hidden_posts') IS NOT NULL THEN
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', hp.id,
          'title', hp.title,
          'target_role', hp.target_role,
          'created_at', hp.created_at
        )
        ORDER BY hp.created_at DESC
      ),
      '[]'::jsonb
    )
    INTO v_posts
    FROM public.hidden_posts hp
    WHERE hp.author_id = p_user_id;
  END IF;

  IF to_regclass('public.answers') IS NOT NULL THEN
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'question_id', a.question_id,
          'created_at', a.created_at
        )
        ORDER BY a.created_at DESC
      ),
      '[]'::jsonb
    )
    INTO v_answers
    FROM public.answers a
    WHERE a.paramedic_id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'questions', v_questions,
    'posts', v_posts,
    'answers', v_answers
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_blocked(
  p_user_id UUID,
  p_blocked BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS public.user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.user_profiles;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot_block_self';
  END IF;

  UPDATE public.user_profiles
  SET is_blocked = p_blocked
  WHERE id = p_user_id
  RETURNING * INTO v_profile;

  IF v_profile.id IS NULL THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  PERFORM public.write_audit_log(
    CASE WHEN p_blocked THEN 'user_blocked' ELSE 'user_unblocked' END,
    'user',
    p_user_id::text,
    jsonb_build_object('reason', p_reason)
  );

  RETURN v_profile;
END;
$$;

-- ============================================================
-- 2) auth.users → user_profiles 동기화 (관리자 목록 미노출 방지)
-- ============================================================
INSERT INTO public.user_profiles (id, email, role, is_approved, membership_dues_paid, created_at)
SELECT
  u.id,
  u.email,
  'user',
  false,
  false,
  COALESCE(u.created_at, TIMEZONE('utc'::text, NOW()))
FROM auth.users u
LEFT JOIN public.user_profiles up ON up.id = u.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3) RLS — 관리자 SELECT/UPDATE
-- ============================================================
DROP POLICY IF EXISTS "user_profiles_update_admin" ON public.user_profiles;
CREATE POLICY "user_profiles_update_admin"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- ============================================================
-- 4) 멤버십 헬퍼
-- ============================================================
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
      AND up.role IN ('associate_member', 'regular_member', 'paramedic')
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
      AND up.role IN ('regular_member', 'super_admin', 'sub_admin', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.can_vote_in_polls()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_regular_member();
$$;

CREATE OR REPLACE FUNCTION public.can_access_paramedic_space()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_approved_admin() OR public.is_associate_paramedic();
$$;

CREATE OR REPLACE FUNCTION public.is_approved_paramedic()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_associate_paramedic();
$$;

GRANT EXECUTE ON FUNCTION public.is_associate_paramedic() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_regular_member() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_vote_in_polls() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_paramedic_space() TO authenticated;

-- ============================================================
-- 5) 커뮤니티 답변 / 투표 RBAC
-- ============================================================
CREATE OR REPLACE FUNCTION public.can_write_community_answer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_approved_admin() OR public.is_associate_paramedic();
$$;

CREATE OR REPLACE FUNCTION public.cast_poll_vote(
  p_poll_id UUID,
  p_option_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_poll public.polls;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'login_required';
  END IF;

  IF NOT public.can_vote_in_polls() THEN
    RAISE EXCEPTION 'regular_member_required';
  END IF;

  SELECT * INTO v_poll FROM public.polls WHERE id = p_poll_id AND is_published = true;
  IF v_poll.id IS NULL THEN
    RAISE EXCEPTION 'poll_not_found';
  END IF;

  IF NOT public.poll_is_votable(v_poll) THEN
    RAISE EXCEPTION 'poll_closed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.poll_options
    WHERE id = p_option_id AND poll_id = p_poll_id
  ) THEN
    RAISE EXCEPTION 'invalid_option';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.poll_votes
    WHERE poll_id = p_poll_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'already_voted';
  END IF;

  INSERT INTO public.poll_votes (poll_id, option_id, user_id)
  VALUES (p_poll_id, p_option_id, auth.uid());

  RETURN public.poll_row_to_json(p_poll_id, false);
END;
$$;

-- ============================================================
-- 6) 구급대원 비밀코드 제출 RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.submit_paramedic_code_request(
  p_code TEXT,
  p_document_url TEXT DEFAULT NULL
)
RETURNS public.emt_verifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_code TEXT := UPPER(TRIM(p_code));
  v_row public.emt_verifications;
  v_invite public.invitation_codes;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF v_code = '' THEN
    RAISE EXCEPTION 'code_required';
  END IF;

  SELECT * INTO v_invite
  FROM public.invitation_codes ic
  WHERE UPPER(ic.code) = v_code
    AND (ic.expires_at IS NULL OR ic.expires_at > TIMEZONE('utc'::text, NOW()))
    AND ic.used_by IS NULL
  ORDER BY ic.created_at DESC
  LIMIT 1;

  IF v_invite.id IS NULL THEN
    RAISE EXCEPTION 'invalid_code';
  END IF;

  INSERT INTO public.emt_verifications (user_id, document_url, status)
  VALUES (v_uid, COALESCE(NULLIF(TRIM(p_document_url), ''), 'code-only'), 'pending')
  RETURNING * INTO v_row;

  UPDATE public.user_profiles
  SET invitation_code = v_code
  WHERE id = v_uid;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_paramedic_code_request(TEXT, TEXT) TO authenticated;

-- ============================================================
-- 7) 관리자 — 유저 목록 동기화 + 회비/등급 관리
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_list_users(
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF public.user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  INSERT INTO public.user_profiles (id, email, role, is_approved, membership_dues_paid, created_at)
  SELECT
    u.id,
    u.email,
    'user',
    false,
    false,
    COALESCE(u.created_at, TIMEZONE('utc'::text, NOW()))
  FROM auth.users u
  LEFT JOIN public.user_profiles up ON up.id = u.id
  WHERE up.id IS NULL
  ON CONFLICT (id) DO NOTHING;

  RETURN QUERY
  SELECT up.*
  FROM public.user_profiles up
  WHERE (
    p_search IS NULL OR TRIM(p_search) = ''
    OR up.email ILIKE '%' || TRIM(p_search) || '%'
    OR up.name ILIKE '%' || TRIM(p_search) || '%'
    OR up.company_name ILIKE '%' || TRIM(p_search) || '%'
    OR up.nickname ILIKE '%' || TRIM(p_search) || '%'
  )
  ORDER BY up.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 200))
  OFFSET GREATEST(0, COALESCE(p_offset, 0));
END;
$$;

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
  v_dues_paid BOOLEAN;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  IF p_user_id = auth.uid() AND v_role NOT IN ('admin', 'super_admin', 'sub_admin') THEN
    RAISE EXCEPTION 'cannot_demote_self';
  END IF;

  IF v_role NOT IN (
    'user', 'associate_member', 'regular_member', 'sub_admin', 'super_admin',
    'hospital', 'paramedic', 'private_ems', 'admin'
  ) THEN
    RAISE EXCEPTION 'invalid_role';
  END IF;

  v_dues_paid := v_role = 'regular_member';

  UPDATE public.user_profiles
  SET
    role = v_role,
    is_approved = CASE
      WHEN v_role IN ('user') THEN is_approved
      ELSE true
    END,
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

  UPDATE public.user_profiles
  SET
    membership_dues_paid = v_paid,
    membership_dues_paid_at = CASE
      WHEN v_paid THEN COALESCE(membership_dues_paid_at, TIMEZONE('utc'::text, NOW()))
      ELSE NULL
    END,
    role = CASE
      WHEN v_paid AND role IN ('associate_member', 'paramedic') THEN 'regular_member'
      WHEN NOT v_paid AND role = 'regular_member' THEN 'associate_member'
      ELSE role
    END,
    is_approved = CASE
      WHEN role IN ('associate_member', 'regular_member', 'paramedic') OR v_paid THEN true
      ELSE is_approved
    END
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
  v_role TEXT := COALESCE(NULLIF(TRIM(p_target_role), ''), 'associate_member');
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
    IF v_role IN ('paramedic', 'associate_member') THEN
      v_role := 'associate_member';
    END IF;

    UPDATE public.user_profiles
    SET role = v_role,
        is_approved = true,
        membership_dues_paid = false,
        membership_dues_paid_at = NULL
    WHERE id = v_row.user_id;
  END IF;

  PERFORM public.write_audit_log(
    CASE WHEN p_status = 'approved' THEN 'verification_approved' ELSE 'verification_rejected' END,
    'verification',
    p_verification_id::text,
    jsonb_build_object('user_id', v_row.user_id, 'notes', p_notes, 'role', v_role)
  );

  RETURN v_row;
END;
$$;

-- hidden_posts: 테이블 미존재 시 생성 후 준회원/정회원 구급대원 접근 허용
CREATE TABLE IF NOT EXISTS public.hidden_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  target_role TEXT NOT NULL CHECK (target_role IN ('all', 'hospital', 'paramedic', 'private_ems', 'nurse')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_hidden_posts_target_role ON public.hidden_posts(target_role);
CREATE INDEX IF NOT EXISTS idx_hidden_posts_created_at ON public.hidden_posts(created_at DESC);

ALTER TABLE public.hidden_posts ENABLE ROW LEVEL SECURITY;

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
          (
            up.role IN ('associate_member', 'regular_member', 'paramedic', 'admin', 'super_admin', 'sub_admin')
            AND hidden_posts.target_role IN ('all', 'paramedic')
          )
          OR (up.role = 'hospital' AND hidden_posts.target_role IN ('all', 'hospital'))
          OR (up.role = 'private_ems' AND hidden_posts.target_role IN ('all', 'private_ems'))
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
          (
            up.role IN ('associate_member', 'regular_member', 'paramedic', 'admin', 'super_admin', 'sub_admin')
            AND hidden_posts.target_role IN ('all', 'paramedic')
          )
          OR (up.role = 'hospital' AND hidden_posts.target_role IN ('all', 'hospital'))
          OR (up.role = 'private_ems' AND hidden_posts.target_role IN ('all', 'private_ems'))
        )
    )
  );

CREATE TABLE IF NOT EXISTS public.emt_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  document_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE OR REPLACE FUNCTION public.admin_list_pending_verifications()
RETURNS SETOF public.emt_verifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  RETURN QUERY
  SELECT ev.*
  FROM public.emt_verifications ev
  WHERE ev.status = 'pending'
  ORDER BY ev.updated_at DESC;
END;
$$;

-- ============================================================
-- 8) GRANT (v4 누락분 포함)
-- ============================================================
GRANT EXECUTE ON FUNCTION public.admin_list_users(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_user_activity(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_blocked(UUID, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_dues_paid(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_verification(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_pending_verifications() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cast_poll_vote(UUID, UUID) TO authenticated;
