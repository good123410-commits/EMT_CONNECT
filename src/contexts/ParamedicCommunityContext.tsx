import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  BambooMessage,
  CaseStudyPost,
  ChatMessage,
  JobPost,
  ResourceDocument,
} from '@/data/paramedicMockData';
import {
  subscribeEmsChatRoomsTable,
  subscribeEmsCommunityPostsTable,
} from '@/lib/realtimeSubscription';
import {
  adminCreateChatRoom,
  fetchActiveChatRooms,
  type CreateChatRoomInput,
  type EmsChatRoom,
} from '@/services/emsChatRoomService';
import {
  adminDeleteResourceDocument,
  adminUpsertResourceDocument,
  createCaseStudyPost,
  createChatPost,
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
  resourceDocuments: ResourceDocument[];
  loading: boolean;
  chatRoomsLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  reloadChatRooms: () => Promise<void>;
  postCaseStudy: (title: string, summary: string, body: string, tags: string[]) => Promise<void>;
  postBambooMessage: (content: string, tags: string[]) => Promise<void>;
  postChatMessage: (roomId: string, content: string) => Promise<void>;
  createChatRoom: (input: CreateChatRoomInput) => Promise<EmsChatRoom>;
  postJobSeek: (title: string, content: string, location: string) => Promise<void>;
  upsertResourceDocument: (
    input: {
      title: string;
      category: string;
      description: string;
      url: string;
      isExternal?: boolean;
      id?: string;
    },
  ) => Promise<void>;
  deleteResourceDocument: (id: string) => Promise<void>;
  likeCaseStudy: (id: string) => Promise<void>;
  likeMessage: (id: string) => Promise<void>;
};

const ParamedicCommunityContext = createContext<ParamedicCommunityContextValue | null>(null);

export function ParamedicCommunityProvider({ children }: { children: ReactNode }) {
  const [bambooMessages, setBambooMessages] = useState<BambooMessage[]>([]);
  const [caseStudies, setCaseStudies] = useState<CaseStudyPost[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatRooms, setChatRooms] = useState<EmsChatRoom[]>([]);
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [resourceDocuments, setResourceDocuments] = useState<ResourceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatRoomsLoading, setChatRoomsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setResourceDocuments(feed.resources);
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
    async (title: string, summary: string, body: string, tags: string[]) => {
      const post = await createCaseStudyPost(title, summary, body, tags);
      setCaseStudies((prev) => [post, ...prev.filter((item) => item.id !== post.id)]);
    },
    [],
  );

  const postBambooMessage = useCallback(async (content: string, tags: string[]) => {
    const post = await createBambooPost(content, tags);
    setBambooMessages((prev) => [post, ...prev.filter((item) => item.id !== post.id)]);
  }, []);

  const postChatMessage = useCallback(async (roomId: string, content: string) => {
    const post = await createChatPost(roomId, content);
    setChatMessages((prev) => [post, ...prev.filter((item) => item.id !== post.id)]);
  }, []);

  const createChatRoom = useCallback(async (input: CreateChatRoomInput) => {
    const room = await adminCreateChatRoom(input);
    setChatRooms((prev) => [...prev.filter((item) => item.id !== room.id), room]);
    return room;
  }, []);

  const postJobSeek = useCallback(async (title: string, content: string, location: string) => {
    const post = await createJobSeekPost(title, content, location);
    setJobPosts((prev) => [post, ...prev.filter((item) => item.id !== post.id)]);
  }, []);

  const upsertResourceDocument = useCallback(
    async (input: {
      title: string;
      category: string;
      description: string;
      url: string;
      isExternal?: boolean;
      id?: string;
    }) => {
      const doc = await adminUpsertResourceDocument(input);
      setResourceDocuments((prev) => [doc, ...prev.filter((item) => item.id !== doc.id)]);
    },
    [],
  );

  const deleteResourceDocument = useCallback(async (id: string) => {
    await adminDeleteResourceDocument(id);
    setResourceDocuments((prev) => prev.filter((item) => item.id !== id));
  }, []);

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
      resourceDocuments,
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
      upsertResourceDocument,
      deleteResourceDocument,
      likeCaseStudy,
      likeMessage,
    }),
    [
      bambooMessages,
      caseStudies,
      chatMessages,
      chatRooms,
      jobPosts,
      resourceDocuments,
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
      upsertResourceDocument,
      deleteResourceDocument,
      likeCaseStudy,
      likeMessage,
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
