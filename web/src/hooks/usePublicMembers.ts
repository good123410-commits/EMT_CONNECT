import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchPublicMembers, subscribePublicMembers } from '../services/memberService';
import type { PublicMember } from '../types';

export function usePublicMembers() {
  const [members, setMembers] = useState<PublicMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const rows = await fetchPublicMembers();
      setMembers(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const unsubscribe = subscribePublicMembers(() => void reload());
    return unsubscribe;
  }, [reload]);

  const regularMembers = useMemo(
    () => members.filter((m) => m.role === 'regular_member'),
    [members],
  );
  const associateMembers = useMemo(
    () => members.filter((m) => m.role === 'associate_member'),
    [members],
  );

  return { members, regularMembers, associateMembers, loading, error, reload };
}
