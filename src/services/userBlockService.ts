import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabaseClient';
import type { BlockAuthorInput, BlockedUserEntry } from '@/types/userBlocks';

const BLOCKED_LABELS_KEY = 'kemix_blocked_anonymous_labels_v1';

export class UserBlockServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserBlockServiceError';
  }
}

type BlockedUsersSnapshot = {
  userIds: string[];
  labels: string[];
};

function isMissingRpcError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('could not find the function') ||
    normalized.includes('pgrst202') ||
    normalized.includes('schema cache')
  );
}

async function loadLocalBlockedLabels(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(BLOCKED_LABELS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed.filter((label) => typeof label === 'string' && label.trim().length > 0));
  } catch {
    return new Set();
  }
}

async function saveLocalBlockedLabels(labels: Set<string>): Promise<void> {
  await AsyncStorage.setItem(BLOCKED_LABELS_KEY, JSON.stringify([...labels]));
}

export async function fetchBlockedUsers(): Promise<BlockedUsersSnapshot> {
  const localLabels = await loadLocalBlockedLabels();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      userIds: [],
      labels: [...localLabels],
    };
  }

  const { data, error } = await supabase.rpc('list_my_blocked_users');

  if (error) {
    if (isMissingRpcError(error.message)) {
      return {
        userIds: [],
        labels: [...localLabels],
      };
    }
    throw new UserBlockServiceError(error.message);
  }

  const rows = (data ?? []) as Array<{
    blocked_user_id?: string;
    blocked_label?: string | null;
  }>;

  const userIds = rows
    .map((row) => row.blocked_user_id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);

  const remoteLabels = rows
    .map((row) => row.blocked_label?.trim())
    .filter((label): label is string => Boolean(label));

  return {
    userIds,
    labels: [...new Set([...localLabels, ...remoteLabels])],
  };
}

export async function blockUser(input: BlockAuthorInput): Promise<void> {
  const label = input.anonymousLabel.trim();
  if (!label && !input.authorId) {
    throw new UserBlockServiceError('차단할 유저 정보가 없습니다.');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (input.authorId) {
    if (!user) {
      throw new UserBlockServiceError('로그인 후 유저를 차단할 수 있습니다.');
    }
    if (user.id === input.authorId) {
      throw new UserBlockServiceError('본인은 차단할 수 없습니다.');
    }

    const { error } = await supabase.rpc('block_user', {
      p_blocked_user_id: input.authorId,
      p_blocked_label: label || null,
    });

    if (error) {
      if (isMissingRpcError(error.message)) {
        throw new UserBlockServiceError(
          '차단 기능 DB가 설치되지 않았습니다. migration_v76_user_blocks.sql을 적용해 주세요.',
        );
      }
      throw new UserBlockServiceError(error.message);
    }
  }

  if (label) {
    const labels = await loadLocalBlockedLabels();
    labels.add(label);
    await saveLocalBlockedLabels(labels);
  }
}

export async function unblockUserById(blockedUserId: string): Promise<void> {
  const { error } = await supabase.rpc('unblock_user', {
    p_blocked_user_id: blockedUserId,
  });

  if (error && !isMissingRpcError(error.message)) {
    throw new UserBlockServiceError(error.message);
  }
}

export function mapBlockedUserRows(rows: unknown): BlockedUserEntry[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => {
      const entry = row as {
        blocked_user_id?: string;
        blocked_label?: string | null;
        created_at?: string;
      };
      if (!entry.blocked_user_id) return null;
      return {
        blockedUserId: entry.blocked_user_id,
        blockedLabel: entry.blocked_label ?? null,
        createdAt: entry.created_at ?? new Date().toISOString(),
      };
    })
    .filter((entry): entry is BlockedUserEntry => entry !== null);
}
