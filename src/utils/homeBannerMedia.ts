import type { HomeBanner, HomeBannerMediaType } from '@/types/homeDashboard';

export function inferMediaTypeFromUrl(url: string | null | undefined): HomeBannerMediaType | null {
  if (!url?.trim()) return null;
  const lower = url.trim().toLowerCase().split('?')[0] ?? '';
  if (/\.(mp4|webm|mov|m4v)$/.test(lower)) return 'video';
  if (lower.endsWith('.gif')) return 'gif';
  return null;
}

export function resolveHomeBannerMediaType(banner: HomeBanner): HomeBannerMediaType {
  const explicit = banner.mediaType;
  if (explicit === 'image' || explicit === 'video' || explicit === 'gif') {
    return explicit;
  }
  if (banner.videoUrl?.trim()) return 'video';
  const fromImage = inferMediaTypeFromUrl(banner.imageUrl);
  if (fromImage === 'gif' || fromImage === 'video') return fromImage;
  return 'image';
}

export function resolveBannerPosterUrl(banner: HomeBanner): string | null {
  const poster = banner.imageUrl?.trim();
  return poster || null;
}

export function resolveBannerVideoUrl(banner: HomeBanner): string | null {
  const video = banner.videoUrl?.trim();
  if (video) return video;
  if (resolveHomeBannerMediaType(banner) === 'video') {
    return banner.imageUrl?.trim() || null;
  }
  return null;
}

export function resolveBannerImageUrl(banner: HomeBanner): string | null {
  const mediaType = resolveHomeBannerMediaType(banner);
  if (mediaType === 'video') {
    return resolveBannerPosterUrl(banner);
  }
  return banner.imageUrl?.trim() || null;
}

export function homeBannerMediaLabel(mediaType: HomeBannerMediaType): string {
  switch (mediaType) {
    case 'video':
      return '영상';
    case 'gif':
      return 'GIF';
    case 'image':
      return '이미지';
    default: {
      const _exhaustive: never = mediaType;
      return _exhaustive;
    }
  }
}
