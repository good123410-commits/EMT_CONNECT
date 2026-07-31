export const POST_TTL_MS = 24 * 60 * 60 * 1000;
export const REPORT_BLIND_THRESHOLD = 3;

export function computeExpiresAt(createdAtIso: string): string {
  const created = new Date(createdAtIso).getTime();
  return new Date(created + POST_TTL_MS).toISOString();
}

export function isPostExpired(post: { expiresAt: string }): boolean {
  return Date.now() >= new Date(post.expiresAt).getTime();
}

export function shouldBlindPost(reportCount: number): boolean {
  return reportCount >= REPORT_BLIND_THRESHOLD;
}

export function formatRemainingTtl(expiresAt: string): string {
  const remaining = new Date(expiresAt).getTime() - Date.now();
  if (remaining <= 0) return '만료';
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) return `${hours}시간 ${minutes}분 후 만료`;
  return `${minutes}분 후 만료`;
}

export function generateAnonymousLabel(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `익명${n}`;
}
