import { DEFAULT_GUIDE_ICON, resolveGuideIcon, type GuideIconId } from '@/constants/guideIcons';
import { subscribeGuideCategoriesTable } from '@/lib/realtimeSubscription';
import { EMERGENCY_GUIDES_TABLE, supabase } from '@/lib/supabaseClient';

export const GUIDE_CATEGORIES_TABLE = 'guide_categories';

export type GuideCategory = {
  id: string;
  name: string;
  icon: GuideIconId;
  created_at: string;
};

const LEGACY_CATEGORY_ICONS: Record<string, GuideIconId> = {
  화상: 'flame',
  기도폐쇄: 'body',
  심정지: 'heart',
  출혈: 'water',
  골절: 'fitness',
  저체온: 'snow',
};

function isMissingTableError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('guide_categories') &&
    (normalized.includes('does not exist') ||
      normalized.includes('could not find') ||
      normalized.includes('schema cache'))
  );
}

function normalizeCategoryRow(row: {
  id: string;
  name: string;
  icon?: string | null;
  created_at: string;
}): GuideCategory {
  return {
    id: row.id,
    name: row.name.trim(),
    icon: resolveGuideIcon(row.icon),
    created_at: row.created_at,
  };
}

async function fetchCategoriesFromGuides(): Promise<GuideCategory[]> {
  const { data, error } = await supabase.from(EMERGENCY_GUIDES_TABLE).select('category');

  if (error) {
    return Object.entries(LEGACY_CATEGORY_ICONS).map(([name, icon], index) => ({
      id: `legacy-${index}`,
      name,
      icon,
      created_at: '',
    }));
  }

  const names = new Set<string>();
  for (const row of data ?? []) {
    const name = typeof row.category === 'string' ? row.category.trim() : '';
    if (name) names.add(name);
  }
  for (const name of Object.keys(LEGACY_CATEGORY_ICONS)) {
    names.add(name);
  }

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
    .select('id, name, icon, created_at')
    .order('name', { ascending: true });

  if (error) {
    if (isMissingTableError(error.message)) {
      return fetchCategoriesFromGuides();
    }
    throw new Error(`분류 목록 조회 실패: ${error.message}`);
  }

  const categories = (data ?? []).map((row) => normalizeCategoryRow(row));

  if (categories.length === 0) {
    return fetchCategoriesFromGuides();
  }

  return categories;
}

export function buildCategoryIconMap(categories: GuideCategory[]): Record<string, GuideIconId> {
  const map: Record<string, GuideIconId> = { ...LEGACY_CATEGORY_ICONS };

  for (const category of categories) {
    map[category.name] = category.icon;
  }

  return map;
}

export function isPersistedGuideCategory(category: GuideCategory): boolean {
  return !category.id.startsWith('legacy-');
}

export async function countGuidesInCategory(categoryName: string): Promise<number> {
  const trimmedName = categoryName.trim();
  if (!trimmedName) return 0;

  const { count, error } = await supabase
    .from(EMERGENCY_GUIDES_TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('category', trimmedName);

  if (error) {
    throw new Error(`분류 사용 현황 조회 실패: ${error.message}`);
  }

  return count ?? 0;
}

export async function deleteGuideCategory(category: GuideCategory): Promise<void> {
  if (!isPersistedGuideCategory(category)) {
    throw new Error('등록된 분류만 삭제할 수 있습니다. guide_categories 테이블에 없는 분류입니다.');
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
    if (isMissingTableError(error.message)) {
      throw new Error(
        '분류 테이블이 없습니다. Supabase에서 guide_categories.sql을 실행해 주세요.',
      );
    }
    throw new Error(`분류 삭제 실패: ${error.message}`);
  }

  if (!data?.length) {
    throw new Error(
      '분류가 삭제되지 않았습니다. Supabase에서 guide_categories DELETE 정책을 확인해 주세요.',
    );
  }
}

export async function createGuideCategory(name: string, icon: GuideIconId): Promise<GuideCategory> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('분류 이름을 입력해 주세요.');
  }

  const { data, error } = await supabase
    .from(GUIDE_CATEGORIES_TABLE)
    .insert({ name: trimmedName, icon })
    .select('id, name, icon, created_at')
    .single();

  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      throw new Error('이미 존재하는 분류입니다.');
    }
    if (isMissingTableError(error.message)) {
      throw new Error(
        '분류 테이블이 없습니다. Supabase에서 guide_categories.sql을 실행해 주세요.',
      );
    }
    throw new Error(`분류 추가 실패: ${error.message}`);
  }

  return normalizeCategoryRow(data);
}

export function subscribeGuideCategories(onChange: () => void): () => void {
  return subscribeGuideCategoriesTable(onChange);
}
