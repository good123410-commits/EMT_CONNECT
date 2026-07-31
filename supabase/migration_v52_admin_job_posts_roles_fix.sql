-- 구인구직 admin RPC + role check 데이터 정리 + GRANT
-- 선행: migration_v4 (job_posts), migration_v35 (roles)

-- ============================================================
-- 1) 레거시 role 값 정리 (user_profiles_role_check 23514 방지)
-- ============================================================
UPDATE public.user_profiles
SET role = CASE
  WHEN role IS NULL OR TRIM(role) = '' THEN 'user'
  WHEN role IN ('emt', 'emt_certified', 'public', 'member') THEN 'paramedic'
  WHEN role IN ('superadmin') THEN 'super_admin'
  WHEN role IN ('subadmin') THEN 'sub_admin'
  WHEN role IN ('associate', 'associate_paramedic') THEN 'associate_member'
  WHEN role IN ('regular', 'regular_member') THEN 'regular_member'
  ELSE role
END
WHERE role IS NULL
   OR TRIM(role) = ''
   OR role NOT IN (
     'user',
     'associate_member',
     'regular_member',
     'sub_admin',
     'super_admin',
     'hospital',
     'paramedic',
     'private_ems',
     'admin'
   );

ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN (
    'user',
    'associate_member',
    'regular_member',
    'sub_admin',
    'super_admin',
    'hospital',
    'paramedic',
    'private_ems',
    'admin'
  ));

-- ============================================================
-- 2) 관리자 판별 (super_admin / sub_admin / legacy admin)
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
      AND up.role IN ('admin', 'super_admin', 'sub_admin')
  );
$$;

-- ============================================================
-- 3) audit log (v4 job RPC 의존)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

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

-- ============================================================
-- 4) job_posts 테이블 (v4 미적용 환경 대비)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.job_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_type TEXT NOT NULL DEFAULT 'hire' CHECK (post_type IN ('hire', 'seek')),
  title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  salary TEXT,
  schedule TEXT,
  requirements TEXT,
  content TEXT,
  is_urgent BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "job_posts_public_read" ON public.job_posts;
CREATE POLICY "job_posts_public_read"
  ON public.job_posts FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "job_posts_admin_all" ON public.job_posts;
CREATE POLICY "job_posts_admin_all"
  ON public.job_posts FOR ALL
  TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- ============================================================
-- 5) 구인/구직 admin RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_upsert_job_post(
  p_id UUID DEFAULT NULL,
  p_post_type TEXT DEFAULT 'hire',
  p_title TEXT DEFAULT '',
  p_company TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_salary TEXT DEFAULT NULL,
  p_schedule TEXT DEFAULT NULL,
  p_requirements TEXT DEFAULT NULL,
  p_content TEXT DEFAULT NULL,
  p_is_urgent BOOLEAN DEFAULT false,
  p_is_published BOOLEAN DEFAULT true
)
RETURNS public.job_posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.job_posts;
  v_title TEXT := NULLIF(BTRIM(p_title), '');
  v_type TEXT := COALESCE(NULLIF(BTRIM(p_post_type), ''), 'hire');
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  IF v_title IS NULL THEN
    RAISE EXCEPTION 'title_required';
  END IF;

  IF v_type NOT IN ('hire', 'seek') THEN
    RAISE EXCEPTION 'invalid_post_type';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.job_posts (
      post_type, title, company, location, salary, schedule,
      requirements, content, is_urgent, is_published, author_id
    )
    VALUES (
      v_type, v_title, p_company, p_location, p_salary, p_schedule,
      p_requirements, p_content, COALESCE(p_is_urgent, false),
      COALESCE(p_is_published, true), auth.uid()
    )
    RETURNING * INTO v_row;

    PERFORM public.write_audit_log(
      'job_post_created', 'job_post', v_row.id::text, to_jsonb(v_row)
    );
  ELSE
    UPDATE public.job_posts
    SET post_type = v_type,
        title = v_title,
        company = p_company,
        location = p_location,
        salary = p_salary,
        schedule = p_schedule,
        requirements = p_requirements,
        content = p_content,
        is_urgent = COALESCE(p_is_urgent, is_urgent),
        is_published = COALESCE(p_is_published, is_published),
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_id
    RETURNING * INTO v_row;

    IF v_row.id IS NULL THEN
      RAISE EXCEPTION 'job_post_not_found';
    END IF;

    PERFORM public.write_audit_log(
      'job_post_updated', 'job_post', v_row.id::text, to_jsonb(v_row)
    );
  END IF;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_job_post(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  DELETE FROM public.job_posts WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'job_post_not_found';
  END IF;

  PERFORM public.write_audit_log('job_post_deleted', 'job_post', p_id::text, '{}'::jsonb);
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_upsert_job_post(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.admin_delete_job_post(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
