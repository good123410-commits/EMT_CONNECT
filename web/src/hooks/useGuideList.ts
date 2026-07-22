import { useCallback, useEffect, useState } from 'react';
import {
  fetchGuideCategories,
  fetchGuidesFiltered,
  subscribeGuideCategories,
  subscribeGuides,
  type GuideCategory,
  type KemixGuideSummary,
} from '../services/guideService';

export function useGuideList() {
  const [guides, setGuides] = useState<KemixGuideSummary[]>([]);
  const [categories, setCategories] = useState<GuideCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const reload = useCallback(async () => {
    try {
      const cats = await fetchGuideCategories();
      setCategories(cats);
      const rows = await fetchGuidesFiltered({
        limit: 100,
        categorySlug: activeCategory === 'all' ? null : activeCategory,
        search: debouncedSearch,
        categories: cats,
      });
      setGuides(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '가이드를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [activeCategory, debouncedSearch]);

  useEffect(() => {
    setLoading(true);
    void reload();
  }, [reload]);

  useEffect(() => {
    const unsubPosts = subscribeGuides(() => void reload());
    const unsubCats = subscribeGuideCategories(() => void reload());
    return () => {
      unsubPosts();
      unsubCats();
    };
  }, [reload]);

  return {
    guides,
    categories,
    activeCategory,
    setActiveCategory,
    search,
    setSearch,
    loading,
    error,
    reload,
  };
}
