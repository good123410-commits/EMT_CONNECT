export const SECRET_POST_LIST_TITLE = '비밀글입니다.';

export function isPostAuthor(
  authorId: string | null | undefined,
  userId: string | null | undefined,
): boolean {
  return Boolean(authorId && userId && authorId === userId);
}

export function canViewSecretCommunityPost(
  isSecret: boolean | undefined,
  authorId: string | null | undefined,
  userId: string | null | undefined,
  isAdmin: boolean,
): boolean {
  if (!isSecret) return true;
  return isAdmin || isPostAuthor(authorId, userId);
}

export function resolveSecretPostTitle(
  title: string | null | undefined,
  isSecret: boolean | undefined,
  authorId: string | null | undefined,
  userId: string | null | undefined,
  isAdmin: boolean,
): string {
  if (!canViewSecretCommunityPost(isSecret, authorId, userId, isAdmin)) {
    return SECRET_POST_LIST_TITLE;
  }
  return title?.trim() || '제목 없음';
}
