import { supabase } from '@/lib/supabaseClient';

type TransformOptions = {
  width?: number;
  height?: number;
  quality?: number;
  resize?: 'cover' | 'contain' | 'fill';
};

const DEFAULT_LIST_THUMB_WIDTH = 300;

/** Supabase Storage 공개 URL → 목록용 썸네일 URL (원본 대용량 로딩 방지) */
export function getStorageThumbnailUrl(
  bucket: string,
  path: string,
  options?: TransformOptions,
): string {
  const width = options?.width ?? DEFAULT_LIST_THUMB_WIDTH;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path, {
    transform: {
      width,
      height: options?.height,
      quality: options?.quality ?? 75,
      resize: options?.resize ?? 'contain',
    },
  });
  return data.publicUrl;
}

/** 이미 public URL인 경우 render/image 경로로 변환 (버킷·경로를 알 때) */
export function toTransformedPublicUrl(
  publicUrl: string,
  width = DEFAULT_LIST_THUMB_WIDTH,
): string {
  const marker = '/storage/v1/object/public/';
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return publicUrl;

  const rest = publicUrl.slice(idx + marker.length);
  const base = publicUrl.slice(0, idx);
  const params = new URLSearchParams({
    width: String(width),
    quality: '75',
    resize: 'contain',
  });
  return `${base}/storage/v1/render/image/public/${rest}?${params.toString()}`;
}
