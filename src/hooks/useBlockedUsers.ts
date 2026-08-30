import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { blockUser, fetchBlockedUsers } from '@/services/userBlockService';
import type { BlockAuthorInput, BlockableAuthor } from '@/types/userBlocks';

export function useBlockedUsers() {
  const { user } = useAuth();
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const [blockedLabels, setBlockedLabels] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await fetchBlockedUsers();
      setBlockedUserIds(new Set(snapshot.userIds));
      setBlockedLabels(new Set(snapshot.labels));
    } catch {
      setBlockedUserIds(new Set());
      setBlockedLabels(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, user?.id]);

  const isSelf = useCallback(
    (authorId?: string | null) => Boolean(authorId && user?.id && authorId === user.id),
    [user?.id],
  );

  const isBlocked = useCallback(
    (target: BlockableAuthor) => {
      if (target.authorId && blockedUserIds.has(target.authorId)) {
        return true;
      }
      const label = target.anonymousLabel?.trim();
      return Boolean(label && blockedLabels.has(label));
    },
    [blockedLabels, blockedUserIds],
  );

  const blockAuthor = useCallback(
    async (input: BlockAuthorInput) => {
      await blockUser(input);
      await reload();
    },
    [reload],
  );

  const filterBlocked = useCallback(
    <T extends BlockableAuthor>(items: T[]) => items.filter((item) => !isBlocked(item)),
    [isBlocked],
  );

  const snapshot = useMemo(
    () => ({
      blockedUserIds: [...blockedUserIds],
      blockedLabels: [...blockedLabels],
    }),
    [blockedLabels, blockedUserIds],
  );

  return {
    loading,
    reload,
    blockAuthor,
    isBlocked,
    isSelf,
    filterBlocked,
    snapshot,
  };
}
