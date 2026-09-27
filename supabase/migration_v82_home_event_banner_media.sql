-- 홈 이벤트 배너: 이미지 / GIF / 숏폼 영상 지원

ALTER TABLE public.kemix_home_event_banners
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image';

ALTER TABLE public.kemix_home_event_banners
  ADD COLUMN IF NOT EXISTS video_url TEXT;

UPDATE public.kemix_home_event_banners
SET media_type = 'gif'
WHERE media_type = 'image'
  AND image_url IS NOT NULL
  AND lower(image_url) LIKE '%.gif';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'kemix_home_event_banners_media_type_check'
  ) THEN
    ALTER TABLE public.kemix_home_event_banners
      ADD CONSTRAINT kemix_home_event_banners_media_type_check
      CHECK (media_type IN ('image', 'video', 'gif'));
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.admin_upsert_home_event_banner(UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN, INTEGER);

CREATE OR REPLACE FUNCTION public.admin_upsert_home_event_banner(
  p_id UUID DEFAULT NULL,
  p_title TEXT DEFAULT '',
  p_description TEXT DEFAULT '',
  p_image_url TEXT DEFAULT NULL,
  p_link_url TEXT DEFAULT '',
  p_is_active BOOLEAN DEFAULT true,
  p_sort_order INTEGER DEFAULT 0,
  p_media_type TEXT DEFAULT 'image',
  p_video_url TEXT DEFAULT NULL
)
RETURNS public.kemix_home_event_banners
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.kemix_home_event_banners;
  v_media_type TEXT;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  v_media_type := COALESCE(NULLIF(TRIM(p_media_type), ''), 'image');
  IF v_media_type NOT IN ('image', 'video', 'gif') THEN
    RAISE EXCEPTION 'invalid_media_type';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.kemix_home_event_banners (
      title,
      description,
      image_url,
      link_url,
      is_active,
      sort_order,
      media_type,
      video_url
    ) VALUES (
      COALESCE(p_title, ''),
      COALESCE(p_description, ''),
      NULLIF(TRIM(p_image_url), ''),
      COALESCE(p_link_url, ''),
      COALESCE(p_is_active, true),
      COALESCE(p_sort_order, 0),
      v_media_type,
      NULLIF(TRIM(p_video_url), '')
    )
    RETURNING * INTO v_row;
  ELSE
    UPDATE public.kemix_home_event_banners
    SET
      title = COALESCE(p_title, title),
      description = COALESCE(p_description, description),
      image_url = NULLIF(TRIM(p_image_url), ''),
      link_url = COALESCE(p_link_url, link_url),
      is_active = COALESCE(p_is_active, is_active),
      sort_order = COALESCE(p_sort_order, sort_order),
      media_type = v_media_type,
      video_url = NULLIF(TRIM(p_video_url), ''),
      updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_id
    RETURNING * INTO v_row;

    IF v_row.id IS NULL THEN
      RAISE EXCEPTION 'banner_not_found';
    END IF;
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_upsert_home_event_banner(
  UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN, INTEGER, TEXT, TEXT
) TO authenticated;

NOTIFY pgrst, 'reload schema';
