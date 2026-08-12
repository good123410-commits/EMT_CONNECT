import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type {
  BambooMessage,
  CaseStudyPost,
  ChatMessage,
  JobPost,
} from '@/data/paramedicMockData';
import {
  subscribeEmsChatRoomsTable,
  subscribeEmsCommunityPostsTable,
} from '@/lib/realtimeSubscription';
import {
  createCommunityChatRoom,
  fetchActiveChatRooms,
  type CreateChatRoomInput,
  type EmsChatRoom,
} from '@/services/emsChatRoomService';
import type { ParamedicWriteTab } from '@/navigation/paramedicWriteTab';
import {
  createCaseStudyPost,
  createChatPost,
  createJobHirePost,
  createJobSeekPost,
  createBambooPost,
  EmsCommunityServiceError,
  fetchCommunityFeed,
  incrementCommunityLikes,
} from '@/services/emsCommunityService';

type ParamedicCommunityContextValue = {
  bambooMessages: BambooMessage[];
  caseStudies: CaseStudyPost[];
  chatMessages: ChatMessage[];
  chatRooms: EmsChatRoom[];
  jobPosts: JobPost[];
  loading: boolean;
  chatRoomsLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  reloadChatRooms: () => Promise<void>;
  postCaseStudy: (title: string, summary: string, body: string) => Promise<void>;
  postBambooMessage: (content: string, tags: string[]) => Promise<void>;
  postChatMessage: (roomId: string, content: string) => Promise<void>;
  createChatRoom: (input: CreateChatRoomInput) => Promise<EmsChatRoom>;
  postJobSeek: (title: string, content: string, location: string) => Promise<void>;
  postJobHire: (input: {
    title: string;
    company: string;
    location: string;
    salary: string;
    schedule: string;
    requirements: string;
    isUrgent?: boolean;
  }) => Promise<void>;
  likeCaseStudy: (id: string) => Promise<void>;
  likeMessage: (id: string) => Promise<void>;
  /** 현재 포커스된 EMS 하위 탭 */
  activeWriteTab: ParamedicWriteTab;
  setActiveWriteTab: (tab: ParamedicWriteTab) => void;
  /** 탭별 FAB 핸들러 등록 (포커스된 탭만 호출됨) */
  registerTabWriteHandler: (tab: ParamedicWriteTab, handler: (() => void) | null) => void;
  /** 현재 탭 이름으로 등록된 글쓰기 핸들러를 동기 호출 */
  invokeTabWriteHandler: (tab?: ParamedicWriteTab) => void;
  onGlobalWrite: () => void;
  /** @deprecated registerTabWriteHandler + useParamedicTabWrite 사용 */
  registerWriteHandler: (handler: (() => void) | null) => void;
};

const ParamedicCommunityContext = createContext<ParamedicCommunityContextValue | null>(null);

export function ParamedicCommunityProvider({ children }: { children: ReactNode }) {
  const [bambooMessages, setBambooMessages] = useState<BambooMessage[]>([]);
  const [caseStudies, setCaseStudies] = useState<CaseStudyPost[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatRooms, setChatRooms] = useState<EmsChatRoom[]>([]);
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatRoomsLoading, setChatRoomsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeWriteTab, setActiveWriteTab] = useState<ParamedicWriteTab>('QaBoard');
  const tabWriteHandlersRef = useRef<Partial<Record<ParamedicWriteTab, () => void>>>({});
  const activeWriteTabRef = useRef<ParamedicWriteTab>('QaBoard');

  const setActiveWriteTabSync = useCallback((tab: ParamedicWriteTab) => {
    activeWriteTabRef.current = tab;
    setActiveWriteTab(tab);
  }, []);

  const registerTabWriteHandler = useCallback(
    (tab: ParamedicWriteTab, handler: (() => void) | null) => {
      if (handler) {
        tabWriteHandlersRef.current[tab] = handler;
      } else {
        delete tabWriteHandlersRef.current[tab];
      }
    },
    [],
  );

  const invokeTabWriteHandler = useCallback((tab?: ParamedicWriteTab) => {
    const key = tab ?? activeWriteTabRef.current;
    const handler = tabWriteHandlersRef.current[key];
    if (handler) {
      handler();
      return;
    }
    Object.values(tabWriteHandlersRef.current).at(-1)?.();
  }, []);

  const onGlobalWrite = useCallback(() => {
    const tab = activeWriteTabRef.current;
    const handler = tabWriteHandlersRef.current[tab];
    if (handler) {
      handler();
      return;
    }
    const fallback = Object.values(tabWriteHandlersRef.current).at(-1);
    fallback?.();
  }, []);

  /** 레거시 단일 핸들러 — QaBoard 탭에 매핑 */
  const registerWriteHandler = useCallback(
    (handler: (() => void) | null) => {
      registerTabWriteHandler('QaBoard', handler);
    },
    [registerTabWriteHandler],
  );

  const reloadChatRooms = useCallback(async () => {
    try {
      const rooms = await fetchActiveChatRooms();
      setChatRooms(rooms);
    } catch (err) {
      const message =
        err instanceof EmsCommunityServiceError
          ? err.message
          : err instanceof Error
            ? err.message
            : '채팅방 목록을 불러오지 못했습니다.';
      setError(message);
    } finally {
      setChatRoomsLoading(false);
    }
  }, []);

  const reload = useCallback(async () => {
    try {
      const feed = await fetchCommunityFeed();
      setBambooMessages(feed.bamboo);
      setCaseStudies(feed.caseStudies);
      setChatMessages(feed.chatMessages);
      setJobPosts(feed.jobPosts);
      setError(null);
    } catch (err) {
      const message =
        err instanceof EmsCommunityServiceError
          ? err.message
          : err instanceof Error
            ? err.message
            : '커뮤니티 데이터를 불러오지 못했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    void reloadChatRooms();
    const unsubscribePosts = subscribeEmsCommunityPostsTable(() => {
      void reload();
    });
    const unsubscribeRooms = subscribeEmsChatRoomsTable(() => {
      void reloadChatRooms();
    });
    return () => {
      unsubscribePosts();
      unsubscribeRooms();
    };
  }, [reload, reloadChatRooms]);

  const postCaseStudy = useCallback(
    async (title: string, summary: string, body: string) => {
      const post = await createCaseStudyPost(title, summary, body);
      setCaseStudies((prev) => [post, ...prev.filter((item) => item.id !== post.id)]);
      void reload();
    },
    [reload],
  );

  const postBambooMessage = useCallback(async (content: string, tags: string[]) => {
    const post = await createBambooPost(content, tags);
    setBambooMessages((prev) => [post, ...prev.filter((item) => item.id !== post.id)]);
  }, []);

  const postChatMessage = useCallback(async (roomId: string, content: string) => {
    const post = await createChatPost(roomId, content);
    setChatMessages((prev) => [post, ...prev.filter((item) => item.id !== post.id)]);
    void reloadChatRooms();
  }, [reloadChatRooms]);

  const createChatRoom = useCallback(async (input: CreateChatRoomInput) => {
    const room = await createCommunityChatRoom(input);
    setChatRooms((prev) => [room, ...prev.filter((item) => item.id !== room.id)]);
    return room;
  }, []);

  const postJobSeek = useCallback(async (title: string, content: string, location: string) => {
    const post = await createJobSeekPost(title, content, location);
    setJobPosts((prev) => [post, ...prev.filter((item) => item.id !== post.id)]);
  }, []);

  const postJobHire = useCallback(
    async (input: {
      title: string;
      company: string;
      location: string;
      salary: string;
      schedule: string;
      requirements: string;
      isUrgent?: boolean;
    }) => {
      const post = await createJobHirePost(input);
      setJobPosts((prev) => [post, ...prev.filter((item) => item.id !== post.id)]);
    },
    [],
  );

  const likeCaseStudy = useCallback(async (id: string) => {
    const nextLikes = await incrementCommunityLikes(id);
    setCaseStudies((prev) =>
      prev.map((item) => (item.id === id ? { ...item, likes: nextLikes } : item)),
    );
  }, []);

  const likeMessage = useCallback(async (id: string) => {
    const nextLikes = await incrementCommunityLikes(id);
    setBambooMessages((prev) =>
      prev.map((item) => (item.id === id ? { ...item, likes: nextLikes } : item)),
    );
  }, []);

  const value = useMemo(
    () => ({
      bambooMessages,
      caseStudies,
      chatMessages,
      chatRooms,
      jobPosts,
      loading,
      chatRoomsLoading,
      error,
      reload,
      reloadChatRooms,
      postCaseStudy,
      postBambooMessage,
      postChatMessage,
      createChatRoom,
      postJobSeek,
      postJobHire,
      likeCaseStudy,
      likeMessage,
      activeWriteTab,
      setActiveWriteTab: setActiveWriteTabSync,
      registerTabWriteHandler,
      invokeTabWriteHandler,
      onGlobalWrite,
      registerWriteHandler,
    }),
    [
      bambooMessages,
      caseStudies,
      chatMessages,
      chatRooms,
      jobPosts,
      loading,
      chatRoomsLoading,
      error,
      reload,
      reloadChatRooms,
      postCaseStudy,
      postBambooMessage,
      postChatMessage,
      createChatRoom,
      postJobSeek,
      postJobHire,
      likeCaseStudy,
      likeMessage,
      activeWriteTab,
      setActiveWriteTabSync,
      onGlobalWrite,
      registerTabWriteHandler,
      invokeTabWriteHandler,
      registerWriteHandler,
    ],
  );

  return (
    <ParamedicCommunityContext.Provider value={value}>{children}</ParamedicCommunityContext.Provider>
  );
}

export function useParamedicCommunity() {
  const context = useContext(ParamedicCommunityContext);
  if (!context) {
    throw new Error('useParamedicCommunity must be used within ParamedicCommunityProvider');
  }
  return context;
}
