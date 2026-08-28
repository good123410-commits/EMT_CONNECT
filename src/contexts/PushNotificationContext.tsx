import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import {
  subscribeEmsChatMessageInserts,
  subscribeEmsCommunityCommentInserts,
  subscribeEmsPostReactionInserts,
  subscribeLocalCommunityMessageInserts,
  type EmsChatMessageRow,
  type EmsCommentRow,
  type EmsPostReactionRow,
  type LocalCommunityMessageRow,
} from '@/lib/pushRealtimeSubscriptions';
import { supabase } from '@/lib/supabaseClient';
import {
  getParticipatedLocalChatRoomIds,
  registerEmsChatRoomParticipation,
  registerLocalChatRoomParticipation,
  syncEmsChatParticipationFromServer,
} from '@/services/chatParticipationStorage';
import {
  fetchMyNotificationSettings,
  updateMyNotificationSettings,
} from '@/services/notificationSettingsService';
import {
  ensureNotificationPermissions,
  getExpoPushTokenIfGranted,
  showLocalPushNotification,
} from '@/services/pushNotificationService';
import { supportsNativePushNotifications } from '@/utils/expoGo';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type UserNotificationSettings,
} from '@/types/notificationSettings';

type PostMeta = {
  author_id: string | null;
  title: string | null;
  post_type: string;
  room_id: string | null;
};

type PushNotificationContextValue = {
  settings: UserNotificationSettings;
  settingsLoading: boolean;
  refreshSettings: () => Promise<void>;
  patchSettings: (patch: Partial<UserNotificationSettings>) => Promise<void>;
};

const PushNotificationContext = createContext<PushNotificationContextValue | null>(null);

const postMetaCache = new Map<string, { meta: PostMeta; expiresAt: number }>();
const POST_META_TTL_MS = 60_000;
const DEDUPE_TTL_MS = 8_000;
const recentNotificationKeys = new Map<string, number>();

let activeEmsChatRoomId: string | null = null;
let activeLocalChatRoomId: string | null = null;

export function setActiveEmsChatRoomForNotifications(roomId: string | null): void {
  activeEmsChatRoomId = roomId;
}

export function setActiveLocalChatRoomForNotifications(roomId: string | null): void {
  activeLocalChatRoomId = roomId;
}

export async function bootstrapEmsChatRoomParticipation(roomId: string): Promise<void> {
  await registerEmsChatRoomParticipation(roomId);
}

export async function bootstrapLocalChatRoomParticipation(roomId: string): Promise<void> {
  await registerLocalChatRoomParticipation(roomId);
}

function shouldDedupe(key: string): boolean {
  const now = Date.now();
  const prev = recentNotificationKeys.get(key);
  if (prev && now - prev < DEDUPE_TTL_MS) return true;
  recentNotificationKeys.set(key, now);
  return false;
}

async function fetchPostMeta(postId: string): Promise<PostMeta | null> {
  const cached = postMetaCache.get(postId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.meta;
  }

  const { data, error } = await supabase
    .from('ems_community_posts')
    .select('author_id, title, post_type, room_id')
    .eq('id', postId)
    .maybeSingle();

  if (error || !data) return null;

  const meta: PostMeta = {
    author_id: data.author_id ?? null,
    title: data.title ?? null,
    post_type: String(data.post_type ?? ''),
    room_id: data.room_id ?? null,
  };
  postMetaCache.set(postId, { meta, expiresAt: Date.now() + POST_META_TTL_MS });
  return meta;
}

function trimPreview(text: string, max = 72): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1)}…`;
}

export function PushNotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserNotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const settingsRef = useRef(settings);
  const emsRoomsRef = useRef<Set<string>>(new Set());
  const localRoomsRef = useRef<Set<string>>(new Set());
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user?.id]);

  const refreshSettings = useCallback(async () => {
    if (!user) {
      setSettings(DEFAULT_NOTIFICATION_SETTINGS);
      return;
    }
    setSettingsLoading(true);
    try {
      const next = await fetchMyNotificationSettings();
      setSettings(next);
    } finally {
      setSettingsLoading(false);
    }
  }, [user]);

  const patchSettings = useCallback(
    async (patch: Partial<UserNotificationSettings>) => {
      if (!user) return;
      setSettings((prev) => ({ ...prev, ...patch }));
      try {
        const saved = await updateMyNotificationSettings(patch);
        setSettings(saved);
      } catch (error) {
        await refreshSettings();
        throw error;
      }
    },
    [refreshSettings, user],
  );

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  const reloadParticipation = useCallback(async (userId: string) => {
    const [emsFromServer, localIds] = await Promise.all([
      syncEmsChatParticipationFromServer(userId),
      getParticipatedLocalChatRoomIds(),
    ]);
    emsRoomsRef.current = new Set(emsFromServer);
    localRoomsRef.current = new Set(localIds);
  }, []);

  const notifyIfAllowed = useCallback(
    async (key: string, enabled: boolean, title: string, body: string, data?: Record<string, string>) => {
      if (!enabled || !userIdRef.current) return;
      if (shouldDedupe(key)) return;
      await showLocalPushNotification({ title, body, data });
    },
    [],
  );

  const handleCommentInsert = useCallback(
    async (row: EmsCommentRow) => {
      const userId = userIdRef.current;
      if (!userId || row.author_id === userId) return;

      const meta = await fetchPostMeta(row.post_id);
      if (!meta?.author_id || meta.author_id !== userId) return;

      await notifyIfAllowed(
        `comment:${row.id}`,
        settingsRef.current.push_enabled_comments,
        '새 댓글',
        `${row.anonymous_label || '회원'}: ${trimPreview(row.content)}`,
        { type: 'comment', postId: row.post_id },
      );
    },
    [notifyIfAllowed],
  );

  const handleReactionInsert = useCallback(
    async (row: EmsPostReactionRow) => {
      const userId = userIdRef.current;
      if (!userId || row.user_id === userId) return;
      if (row.reaction !== 'like') return;

      const meta = await fetchPostMeta(row.post_id);
      if (!meta?.author_id || meta.author_id !== userId) return;

      await notifyIfAllowed(
        `like:${row.user_id}:${row.post_id}`,
        settingsRef.current.push_enabled_posts,
        '좋아요',
        meta.title?.trim()
          ? `「${trimPreview(meta.title, 40)}」에 좋아요가 달렸습니다`
          : '내 게시글에 좋아요가 달렸습니다',
        { type: 'like', postId: row.post_id },
      );
    },
    [notifyIfAllowed],
  );

  const handleEmsChatInsert = useCallback(
    async (row: EmsChatMessageRow) => {
      const userId = userIdRef.current;
      if (!userId || !row.room_id) return;
      if (row.author_id && row.author_id === userId) return;
      if (!emsRoomsRef.current.has(row.room_id)) return;
      if (activeEmsChatRoomId === row.room_id) return;

      await notifyIfAllowed(
        `ems-chat:${row.id}`,
        settingsRef.current.push_enabled_chats,
        '소통창 새 메시지',
        `${row.anonymous_label || '익명'}: ${trimPreview(row.content)}`,
        { type: 'ems_chat', roomId: row.room_id },
      );
    },
    [notifyIfAllowed],
  );

  const handleLocalChatInsert = useCallback(
    async (row: LocalCommunityMessageRow) => {
      const userId = userIdRef.current;
      if (!userId || !row.room_id) return;
      if (row.author_id && row.author_id === userId) return;
      if (!localRoomsRef.current.has(row.room_id)) return;
      if (activeLocalChatRoomId === row.room_id) return;

      await notifyIfAllowed(
        `local-chat:${row.id}`,
        settingsRef.current.push_enabled_chats,
        '우리동네 채팅',
        `${row.anonymous_label || '이웃'}: ${trimPreview(row.content)}`,
        { type: 'local_chat', roomId: row.room_id },
      );
    },
    [notifyIfAllowed],
  );

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    void (async () => {
      if (supportsNativePushNotifications()) {
        const granted = await ensureNotificationPermissions();
        if (!granted || cancelled) {
          await reloadParticipation(user.id);
          return;
        }

        const token = await getExpoPushTokenIfGranted();
        if (token && !cancelled) {
          try {
            await updateMyNotificationSettings({ expo_push_token: token });
          } catch {
            // migration 미적용 시 로컬 알림만 동작
          }
        }
      }

      if (!cancelled) {
        await reloadParticipation(user.id);
      }
    })();

    const unsubComments = subscribeEmsCommunityCommentInserts((payload) => {
      const row = payload.new as EmsCommentRow | null;
      if (row?.id) void handleCommentInsert(row);
    });

    const unsubReactions = subscribeEmsPostReactionInserts((payload) => {
      const row = payload.new as EmsPostReactionRow | null;
      if (row?.post_id) void handleReactionInsert(row);
    });

    const unsubEmsChat = subscribeEmsChatMessageInserts((payload) => {
      const row = payload.new as EmsChatMessageRow | null;
      if (row?.id) void handleEmsChatInsert(row);
    });

    const unsubLocalChat = subscribeLocalCommunityMessageInserts((payload) => {
      const row = payload.new as LocalCommunityMessageRow | null;
      if (row?.id) void handleLocalChatInsert(row);
    });

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        void reloadParticipation(user.id);
      }
    };
    const appStateSub = AppState.addEventListener('change', onAppState);

    return () => {
      cancelled = true;
      unsubComments();
      unsubReactions();
      unsubEmsChat();
      unsubLocalChat();
      appStateSub.remove();
    };
  }, [
    handleCommentInsert,
    handleEmsChatInsert,
    handleLocalChatInsert,
    handleReactionInsert,
    reloadParticipation,
    user?.id,
  ]);

  const value: PushNotificationContextValue = {
    settings,
    settingsLoading,
    refreshSettings,
    patchSettings,
  };

  return (
    <PushNotificationContext.Provider value={value}>{children}</PushNotificationContext.Provider>
  );
}

export function usePushNotificationSettings(): PushNotificationContextValue {
  const ctx = useContext(PushNotificationContext);
  if (!ctx) {
    throw new Error('usePushNotificationSettings must be used within PushNotificationProvider');
  }
  return ctx;
}

export function usePushNotificationSettingsOptional(): PushNotificationContextValue | null {
  return useContext(PushNotificationContext);
}
