-- ============================================================
-- migration_v66: 콘텐츠 숏코드 관리 (관리자 CRUD + 역할별 노출)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.kemix_content_shortcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shortcut TEXT NOT NULL,
  title TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('call_button', 'ad_banner', 'template')),
  action_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  target_role TEXT NOT NULL DEFAULT 'all' CHECK (target_role IN ('admin', 'all')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT kemix_content_shortcodes_shortcut_unique UNIQUE (shortcut)
);

CREATE INDEX IF NOT EXISTS kemix_content_shortcodes_active_sort_idx
  ON public.kemix_content_shortcodes (is_active, sort_order ASC, created_at ASC);

CREATE OR REPLACE FUNCTION public.touch_kemix_content_shortcodes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS kemix_content_shortcodes_updated_at ON public.kemix_content_shortcodes;
CREATE TRIGGER kemix_content_shortcodes_updated_at
  BEFORE UPDATE ON public.kemix_content_shortcodes
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_kemix_content_shortcodes_updated_at();

ALTER TABLE public.kemix_content_shortcodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kemix_content_shortcodes_select_active ON public.kemix_content_shortcodes;
CREATE POLICY kemix_content_shortcodes_select_active
  ON public.kemix_content_shortcodes
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS kemix_content_shortcodes_admin_all ON public.kemix_content_shortcodes;
CREATE POLICY kemix_content_shortcodes_admin_all
  ON public.kemix_content_shortcodes
  FOR ALL
  TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- ============================================================
-- RPC: 활성 숏코드 목록 (클라이언트 렌더/피커)
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_active_content_shortcodes()
RETURNS SETOF public.kemix_content_shortcodes
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.kemix_content_shortcodes
  WHERE is_active = true
  ORDER BY sort_order ASC, created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.list_active_content_shortcodes() TO anon, authenticated;

-- ============================================================
-- RPC: 관리자 전체 목록
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_list_content_shortcodes()
RETURNS SETOF public.kemix_content_shortcodes
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
    SELECT * FROM public.kemix_content_shortcodes
    ORDER BY sort_order ASC, created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_content_shortcodes() TO authenticated;

-- ============================================================
-- RPC: 관리자 upsert
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_upsert_content_shortcode(
  p_id UUID DEFAULT NULL,
  p_shortcut TEXT DEFAULT NULL,
  p_title TEXT DEFAULT NULL,
  p_action_type TEXT DEFAULT 'template',
  p_action_payload JSONB DEFAULT '{}'::jsonb,
  p_target_role TEXT DEFAULT 'all',
  p_sort_order INTEGER DEFAULT 0,
  p_is_active BOOLEAN DEFAULT true
)
RETURNS public.kemix_content_shortcodes
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row public.kemix_content_shortcodes;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF COALESCE(trim(p_shortcut), '') = '' OR COALESCE(trim(p_title), '') = '' THEN
    RAISE EXCEPTION 'shortcut and title are required';
  END IF;

  IF p_action_type NOT IN ('call_button', 'ad_banner', 'template') THEN
    RAISE EXCEPTION 'invalid action_type';
  END IF;

  IF p_target_role NOT IN ('admin', 'all') THEN
    RAISE EXCEPTION 'invalid target_role';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.kemix_content_shortcodes (
      shortcut, title, action_type, action_payload, target_role, sort_order, is_active
    ) VALUES (
      trim(p_shortcut),
      trim(p_title),
      p_action_type,
      COALESCE(p_action_payload, '{}'::jsonb),
      p_target_role,
      COALESCE(p_sort_order, 0),
      COALESCE(p_is_active, true)
    )
    RETURNING * INTO v_row;
  ELSE
    UPDATE public.kemix_content_shortcodes
    SET
      shortcut = trim(p_shortcut),
      title = trim(p_title),
      action_type = p_action_type,
      action_payload = COALESCE(p_action_payload, '{}'::jsonb),
      target_role = p_target_role,
      sort_order = COALESCE(p_sort_order, 0),
      is_active = COALESCE(p_is_active, true)
    WHERE id = p_id
    RETURNING * INTO v_row;
  END IF;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'shortcode not found';
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_upsert_content_shortcode(
  UUID, TEXT, TEXT, TEXT, JSONB, TEXT, INTEGER, BOOLEAN
) TO authenticated;

-- ============================================================
-- RPC: 관리자 삭제
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_delete_content_shortcode(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  DELETE FROM public.kemix_content_shortcodes WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_content_shortcode(UUID) TO authenticated;

-- ============================================================
-- 기본 숏코드 시드
-- ============================================================
INSERT INTO public.kemix_content_shortcodes (
  shortcut, title, action_type, action_payload, target_role, sort_order
) VALUES
  (
    '[call:119]',
    '119 긴급 전화',
    'call_button',
    '{"phone":"119","label":"응급 신고 119"}'::jsonb,
    'admin',
    10
  ),
  (
    '[119_button]',
    '119 전화 버튼',
    'call_button',
    '{"phone":"119","label":"응급 신고"}'::jsonb,
    'admin',
    20
  ),
  (
    '[ad_banner]',
    '이벤트 배너',
    'ad_banner',
    '{}'::jsonb,
    'all',
    30
  ),
  (
    '[template:report]',
    '상황 보고 양식',
    'template',
    '{"body":"[상황 보고]\n• 발생 시각:\n• 발생 장소:\n• 환자 상태:\n• 조치 내용:"}'::jsonb,
    'all',
    40
  )
ON CONFLICT (shortcut) DO NOTHING;
