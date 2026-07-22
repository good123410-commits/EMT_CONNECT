-- migration_v26_kemix_media_storage.sql
-- KEMIX 웹·앱 공용 미디어 Storage 버킷

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kemix-media',
  'kemix-media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "kemix_media_public_read" ON storage.objects;
CREATE POLICY "kemix_media_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'kemix-media');

DROP POLICY IF EXISTS "kemix_media_auth_insert" ON storage.objects;
CREATE POLICY "kemix_media_auth_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'kemix-media');

DROP POLICY IF EXISTS "kemix_media_admin_all" ON storage.objects;
CREATE POLICY "kemix_media_admin_all"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'kemix-media' AND public.is_approved_admin())
  WITH CHECK (bucket_id = 'kemix-media' AND public.is_approved_admin());

NOTIFY pgrst, 'reload schema';
