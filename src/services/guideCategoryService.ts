import { DEFAULT_GUIDE_ICON, resolveGuideIcon, type GuideIconId } from '@/constants/guideIcons';
import { subscribeKemiPostCategoriesTable } from '@/lib/realtimeSubscription';
import { supabase } from '@/lib/supabaseClient';

export const GUIDE_CATEGORIES_TABLE = 'kemix_post_categories';
const KEMI_POSTS_TABLE = 'kemi_posts';

export type GuideCategory = {
  id: string;
  name: string;
  icon: GuideIconId;
  created_at: string;
};

const SLUG_ICON_MAP: Record<string, GuideIconId> = {
  cpr: 'heart',
  trauma: 'fitness',
  poisoning: 'medkit',
  pediatric: 'body',
  burn: 'flame',
  general: 'medkit',
};

const LEGACY_CATEGORY_ICONS: Record<string, GuideIconId> = {
  화상: 'flame',
  기도폐쇄: 'body',
  심정지: 'heart',
  심폐소생술: 'heart',
  출혈: 'water',
  골절: 'fitness',
  저체온: 'snow',
  외상: 'fitness',
  중독: 'medkit',
  소아: 'body',
  기타: 'medkit',
};

const FALLBACK_CATEGORIES: GuideCategory[] = [
  { id: 'fb-cpr', name: '심폐소생술', icon: 'heart', created_at: '' },
  { id: 'fb-trauma', name: '외상', icon: 'fitness', created_at: '' },
  { id: 'fb-poisoning', name: '중독', icon: 'medkit', created_at: '' },
  { id: 'fb-pediatric', name: '소아', icon: 'body', created_at: '' },
  { id: 'fb-burn', name: '화상', icon: 'flame', created_at: '' },
  { id: 'fb-general', name: '기타', icon: 'medkit', created_at: '' },
];

function isMissingTableError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('kemix_post_categories') &&
    (normalized.includes('does not exist') ||
      normalized.includes('could not find') ||
      normalized.includes('schema cache'))
  );
}

function resolveCategoryIcon(name: string, slug?: string | null): GuideIconId {
  if (slug && SLUG_ICON_MAP[slug]) return SLUG_ICON_MAP[slug];
  return LEGACY_CATEGORY_ICONS[name] ?? DEFAULT_GUIDE_ICON;
}

function normalizeCategoryRow(row: {
  id: string;
  name: string;
  slug?: string | null;
  created_at?: string | null;
}): GuideCategory {
  const name = row.name.trim();
  return {
    id: row.id,
    name,
    icon: resolveCategoryIcon(name, row.slug),
    created_at: row.created_at ?? '',
  };
}

async function fetchCategoriesFromPosts(): Promise<GuideCategory[]> {
  const { data, error } = await supabase.from(KEMI_POSTS_TABLE).select('category');

  if (error) return FALLBACK_CATEGORIES;

  const names = new Set<string>();
  for (const row of data ?? []) {
    const name = typeof row.category === 'string' ? row.category.trim() : '';
    if (name) names.add(name);
  }

  if (names.size === 0) return FALLBACK_CATEGORIES;

  return Array.from(names)
    .sort((a, b) => a.localeCompare(b, 'ko'))
    .map((name, index) => ({
      id: `legacy-${index}`,
      name,
      icon: LEGACY_CATEGORY_ICONS[name] ?? DEFAULT_GUIDE_ICON,
      created_at: '',
    }));
}

export async function fetchGuideCategories(): Promise<GuideCategory[]> {
  const { data, error } = await supabase
    .from(GUIDE_CATEGORIES_TABLE)
    .select('id, name, slug, created_at')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    if (isMissingTableError(error.message)) {
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('list_active_post_categories');
        if (!rpcError && rpcData?.length) {
          return (rpcData as Array<{ id: string; name: string; slug: string; created_at?: string }>).map(
            (row) => normalizeCategoryRow(row),
          );
        }
      } catch {
        // fallback below
      }
      return fetchCategoriesFromPosts();
    }
    throw new Error(`분류 목록 조회 실패: ${error.message}`);
  }

  const categories = (data ?? []).map((row) => normalizeCategoryRow(row));
  return categories.length > 0 ? categories : FALLBACK_CATEGORIES;
}

export function buildCategoryIconMap(categories: GuideCategory[]): Record<string, GuideIconId> {
  const map: Record<string, GuideIconId> = { ...LEGACY_CATEGORY_ICONS };

  for (const category of categories) {
    map[category.name] = category.icon;
  }

  return map;
}

export function isPersistedGuideCategory(category: GuideCategory): boolean {
  return !category.id.startsWith('legacy-') && !category.id.startsWith('fb-');
}

export async function countGuidesInCategory(categoryName: string): Promise<number> {
  const trimmedName = categoryName.trim();
  if (!trimmedName) return 0;

  const { count, error } = await supabase
    .from(KEMI_POSTS_TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('category', trimmedName);

  if (error) {
    throw new Error(`분류 사용 현황 조회 실패: ${error.message}`);
  }

  return count ?? 0;
}

export async function deleteGuideCategory(category: GuideCategory): Promise<void> {
  if (!isPersistedGuideCategory(category)) {
    throw new Error('등록된 분류만 삭제할 수 있습니다.');
  }

  const postCount = await countGuidesInCategory(category.name);
  if (postCount > 0) {
    throw new Error(
      `"${category.name}" 분류를 사용하는 글이 ${postCount}개 있습니다. 글을 먼저 삭제하거나 다른 분류로 옮겨 주세요.`,
    );
  }

  const { data, error } = await supabase
    .from(GUIDE_CATEGORIES_TABLE)
    .delete()
    .eq('id', category.id)
    .select('id');

  if (error) {
    throw new Error(`분류 삭제 실패: ${error.message}`);
  }

  if (!data?.length) {
    throw new Error('분류가 삭제되지 않았습니다. Supabase DELETE 정책을 확인해 주세요.');
  }
}

export async function createGuideCategory(name: string, icon: GuideIconId): Promise<GuideCategory> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('분류 이름을 입력해 주세요.');
  }

  const slug = trimmedName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣-]/g, '')
    .slice(0, 40) || 'category';

  const { data, error } = await supabase
    .from(GUIDE_CATEGORIES_TABLE)
    .insert({ name: trimmedName, slug, display_order: 100, is_active: true })
    .select('id, name, slug, created_at')
    .single();

  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      throw new Error('이미 존재하는 분류입니다.');
    }
    throw new Error(`분류 추가 실패: ${error.message}`);
  }

  return {
    ...normalizeCategoryRow(data),
    icon: resolveGuideIcon(icon),
  };
}

export function subscribeGuideCategories(onChange: () => void): () => void {
  return subscribeKemiPostCategoriesTable(onChange);
}
