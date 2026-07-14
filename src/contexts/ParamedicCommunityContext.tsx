import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  ANONYMOUS_LABELS,
  BAMBOO_MESSAGES,
  JOB_POSTS,
  type BambooMessage,
  type JobPost,
} from '@/data/paramedicMockData';

type ParamedicCommunityContextValue = {
  bambooMessages: BambooMessage[];
  jobPosts: JobPost[];
  postBambooMessage: (content: string, tags: string[]) => void;
  postJobSeek: (title: string, content: string, location: string) => void;
  likeMessage: (id: string) => void;
};

const ParamedicCommunityContext = createContext<ParamedicCommunityContextValue | null>(null);

function randomLabel(): string {
  return ANONYMOUS_LABELS[Math.floor(Math.random() * ANONYMOUS_LABELS.length)] ?? '익명';
}

export function ParamedicCommunityProvider({ children }: { children: ReactNode }) {
  const [bambooMessages, setBambooMessages] = useState(BAMBOO_MESSAGES);
  const [jobPosts, setJobPosts] = useState(JOB_POSTS);

  const postBambooMessage = useCallback((content: string, tags: string[]) => {
    const msg: BambooMessage = {
      id: `bm-${Date.now()}`,
      anonymousLabel: randomLabel(),
      region: randomLabel().replace('익명 · ', ''),
      content,
      tags,
      postedAt: '방금',
      likes: 0,
    };
    setBambooMessages((prev) => [msg, ...prev]);
  }, []);

  const postJobSeek = useCallback((title: string, content: string, location: string) => {
    const post: JobPost = {
      id: `jp-${Date.now()}`,
      type: 'seek',
      title,
      company: '구직자 등록',
      location,
      salary: '협의',
      schedule: '협의',
      requirements: content,
      postedAt: '방금',
    };
    setJobPosts((prev) => [post, ...prev]);
  }, []);

  const likeMessage = useCallback((id: string) => {
    setBambooMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, likes: m.likes + 1 } : m)),
    );
  }, []);

  const value = useMemo(
    () => ({ bambooMessages, jobPosts, postBambooMessage, postJobSeek, likeMessage }),
    [bambooMessages, jobPosts, postBambooMessage, postJobSeek, likeMessage],
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
