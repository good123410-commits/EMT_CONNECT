-- migration_v31_kemix_attachment_storage.sql
-- 교육 안내 첨부파일 업로드 지원 (PDF, 문서 등)
-- 선행: migration_v26

UPDATE storage.buckets
SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain',
    'application/octet-stream'
  ]::text[]
WHERE id = 'kemix-media';

NOTIFY pgrst, 'reload schema';
