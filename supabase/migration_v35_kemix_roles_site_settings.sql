-- migration_v35_kemix_roles_site_settings.sql
-- 유저 등급 확장 + 사이트 설정(site_settings) + 역할 변경 RPC
-- 선행: migration_v5

-- ============================================================
-- 1) user_profiles role 확장 (레거시 역할 유지)
-- ============================================================
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
-- 2) 관리자 판별 — super_admin / sub_admin / legacy admin
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
-- 3) site_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings_public_read" ON public.site_settings;
CREATE POLICY "site_settings_public_read"
  ON public.site_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "site_settings_admin_all" ON public.site_settings;
CREATE POLICY "site_settings_admin_all"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

INSERT INTO public.site_settings (key, title, content)
VALUES
  ('privacy_policy', '개인정보 처리방침', '<h2>개인정보 처리방침</h2><p>KEMIX(케믹스)는 이용자의 개인정보를 중요시하며, 관련 법령을 준수합니다.</p><h3>수집 항목</h3><ul><li>이메일, 이름(소셜 로그인 시 제공 정보)</li><li>서비스 이용 기록</li></ul><h3>문의</h3><p>개인정보 관련 문의: good1285@good1285.com</p>'),
  ('terms_of_service', '이용약관', '<h2>이용약관</h2><p>본 약관은 KEMIX 플랫폼 서비스 이용에 관한 조건을 규정합니다.</p><h3>서비스 이용</h3><p>응급의료 정보는 참고용이며, 응급 상황 시 119에 연락하세요.</p>'),
  ('service_info', 'KEMIX 서비스 정보', '<h2>KEMIX 서비스 정보</h2><p><strong>버전:</strong> v1.0</p><p><strong>운영:</strong> Korea EMT Medical Innovation eXchange</p><p>웹·모바일 통합 응급의료 플랫폼</p>')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_site_setting(p_key TEXT)
RETURNS public.site_settings
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.site_settings WHERE key = TRIM(p_key) LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_site_setting(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_site_settings()
RETURNS SETOF public.site_settings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN RAISE EXCEPTION 'not_authorized_admin'; END IF;
  RETURN QUERY SELECT * FROM public.site_settings ORDER BY key ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_site_settings() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_upsert_site_setting(
  p_key TEXT,
  p_title TEXT DEFAULT NULL,
  p_content TEXT DEFAULT ''
)
RETURNS public.site_settings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row public.site_settings;
BEGIN
  IF NOT public.is_approved_admin() THEN RAISE EXCEPTION 'not_authorized_admin'; END IF;
  IF TRIM(p_key) = '' THEN RAISE EXCEPTION 'required_fields_missing'; END IF;

  INSERT INTO public.site_settings (key, title, content)
  VALUES (TRIM(p_key), COALESCE(NULLIF(TRIM(p_title), ''), TRIM(p_key)), COALESCE(p_content, ''))
  ON CONFLICT (key) DO UPDATE SET
    title = COALESCE(NULLIF(TRIM(p_title), ''), site_settings.title),
    content = COALESCE(p_content, site_settings.content),
    updated_at = TIMEZONE('utc'::text, NOW())
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_upsert_site_setting(TEXT, TEXT, TEXT) TO authenticated;

-- ============================================================
-- 4) 유저 역할 변경 RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_user_id UUID,
  p_role TEXT
)
RETURNS public.user_profiles
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_profile public.user_profiles;
  v_role TEXT := TRIM(p_role);
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

  UPDATE public.user_profiles
  SET role = v_role
  WHERE id = p_user_id
  RETURNING * INTO v_profile;

  IF v_profile.id IS NULL THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  PERFORM public.write_audit_log(
    'user_role_changed',
    'user_profile',
    p_user_id::text,
    jsonb_build_object('role', v_role)
  );

  RETURN v_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, TEXT) TO authenticated;
