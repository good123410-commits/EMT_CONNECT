import { supabase } from '../lib/supabase';

export const KEMIX_MEDIA_BUCKET = 'kemix-media';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

const ATTACHMENT_TYPES = new Set([
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
  'application/octet-stream',
]);

const ATTACHMENT_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'txt', 'hwp',
]);

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return 'JPG, PNG, WEBP, GIF 이미지만 업로드할 수 있습니다.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return '이미지 크기는 5MB 이하여야 합니다.';
  }
  return null;
}

export function validateAttachmentFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const typeOk = ATTACHMENT_TYPES.has(file.type) || ATTACHMENT_EXTENSIONS.has(ext);
  if (!typeOk) {
    return 'PDF, Word, Excel, PPT, ZIP, TXT, HWP 파일만 업로드할 수 있습니다.';
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return '첨부파일 크기는 10MB 이하여야 합니다.';
  }
  return null;
}

function fileExtension(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName;
  }
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return map[file.type] ?? 'jpg';
}

export async function uploadAttachmentFile(file: File, folder: string): Promise<string> {
  const validationError = validateAttachmentFile(file);
  if (validationError) throw new Error(validationError);

  const safeName = file.name.replace(/[^\w.\-가-힣]/g, '_').slice(0, 80);
  const path = `${folder}/${crypto.randomUUID()}-${safeName}`;

  const { error } = await supabase.storage.from(KEMIX_MEDIA_BUCKET).upload(path, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
    cacheControl: '3600',
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(KEMIX_MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadImageFile(file: File, folder: string): Promise<string> {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const path = `${folder}/${crypto.randomUUID()}.${fileExtension(file)}`;

  const { error } = await supabase.storage.from(KEMIX_MEDIA_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
    cacheControl: '3600',
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(KEMIX_MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
