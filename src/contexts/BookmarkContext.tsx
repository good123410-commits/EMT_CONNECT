import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  loadBookmarks,
  saveBookmarks,
  subscribeBookmarks,
} from '@/services/bookmarkStorage';
import type { BookmarkInput, BookmarkItem } from '@/types/bookmark';

type BookmarkContextValue = {
  bookmarks: BookmarkItem[];
  loading: boolean;
  reload: () => Promise<void>;
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (input: BookmarkInput) => void;
  removeBookmark: (id: string) => void;
  lastFeedback: string | null;
  clearFeedback: () => void;
};

const BookmarkContext = createContext<BookmarkContextValue | null>(null);

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const items = await loadBookmarks();
    setBookmarks(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
    return subscribeBookmarks(() => {
      void reload();
    });
  }, [reload]);

  const clearFeedback = useCallback(() => {
    setLastFeedback(null);
  }, []);

  const isBookmarked = useCallback(
    (id: string) => bookmarks.some((item) => item.id === id),
    [bookmarks],
  );

  const persist = useCallback(async (next: BookmarkItem[]) => {
    setBookmarks(next);
    await saveBookmarks(next);
  }, []);

  const toggleBookmark = useCallback(
    (input: BookmarkInput) => {
      const exists = bookmarks.some((item) => item.id === input.id);
      if (exists) {
        const next = bookmarks.filter((item) => item.id !== input.id);
        void persist(next);
        setLastFeedback('즐겨찾기에서 제거되었습니다');
        return;
      }

      const nextItem: BookmarkItem = {
        ...input,
        createdAt: new Date().toISOString(),
      };
      void persist([nextItem, ...bookmarks.filter((item) => item.id !== input.id)]);
      setLastFeedback('즐겨찾기에 추가되었습니다');
    },
    [bookmarks, persist],
  );

  const removeBookmark = useCallback(
    (id: string) => {
      if (!bookmarks.some((item) => item.id === id)) return;
      void persist(bookmarks.filter((item) => item.id !== id));
      setLastFeedback('즐겨찾기에서 제거되었습니다');
    },
    [bookmarks, persist],
  );

  const value = useMemo(
    () => ({
      bookmarks,
      loading,
      reload,
      isBookmarked,
      toggleBookmark,
      removeBookmark,
      lastFeedback,
      clearFeedback,
    }),
    [bookmarks, loading, reload, isBookmarked, toggleBookmark, removeBookmark, lastFeedback, clearFeedback],
  );

  return <BookmarkContext.Provider value={value}>{children}</BookmarkContext.Provider>;
}

export function useBookmarks(): BookmarkContextValue {
  const ctx = useContext(BookmarkContext);
  if (!ctx) {
    throw new Error('useBookmarks must be used within BookmarkProvider');
  }
  return ctx;
}

export function useOptionalBookmarks(): BookmarkContextValue | null {
  return useContext(BookmarkContext);
}
