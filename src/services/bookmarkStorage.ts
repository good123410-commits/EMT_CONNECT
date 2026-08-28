import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BookmarkItem } from '@/types/bookmark';

const STORAGE_KEY = 'kemix_bookmarks_v1';

const listeners = new Set<() => void>();

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeBookmarks(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function sortBookmarks(items: BookmarkItem[]): BookmarkItem[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function loadBookmarks(): Promise<BookmarkItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BookmarkItem[];
    if (!Array.isArray(parsed)) return [];
    return sortBookmarks(
      parsed.filter(
        (item) =>
          item &&
          typeof item.id === 'string' &&
          typeof item.title === 'string' &&
          item.target &&
          typeof item.target.type === 'string',
      ),
    );
  } catch {
    return [];
  }
}

export async function saveBookmarks(items: BookmarkItem[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sortBookmarks(items)));
  notifyListeners();
}
