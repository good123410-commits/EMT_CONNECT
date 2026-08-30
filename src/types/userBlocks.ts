export type BlockedUserEntry = {
  blockedUserId: string;
  blockedLabel: string | null;
  createdAt: string;
};

export type BlockAuthorInput = {
  authorId?: string | null;
  anonymousLabel: string;
};

export type BlockableAuthor = {
  authorId?: string | null;
  anonymousLabel?: string | null;
};
