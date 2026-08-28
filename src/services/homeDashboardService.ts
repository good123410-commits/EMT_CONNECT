import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HomeCommerceItem, HomeDashboardConfig } from '@/types/homeDashboard';

const CONFIG_KEY = 'kemix_home_dashboard_v1';

const DEFAULT_COMMERCE: HomeCommerceItem[] = [
  {
    id: 'commerce-thermometer',
    title: '가정용 체온계',
    description: '응급 상황 전 발열 여부를 빠르게 확인',
    imageUrl: null,
    partnerUrl: 'https://link.coupang.com/a/example-thermometer',
    partnerLabel: '쿠팡 파트너스',
    isActive: true,
    sortOrder: 0,
  },
  {
    id: 'commerce-first-aid',
    title: '휴대용 구급함 세트',
    description: '상비 응급 용품을 한 번에 준비',
    imageUrl: null,
    partnerUrl: 'https://link.coupang.com/a/example-firstaid',
    partnerLabel: '쿠팡 파트너스',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'commerce-cooling-patch',
    title: '소아 해열 패치·쿨링',
    description: '해열 보조용 외용 제품 (의료 행위 대체 아님)',
    imageUrl: null,
    partnerUrl: 'https://link.coupang.com/a/example-cooling',
    partnerLabel: '쿠팡 파트너스',
    isActive: true,
    sortOrder: 2,
  },
];

export const DEFAULT_HOME_DASHBOARD_CONFIG: HomeDashboardConfig = {
  commerceItems: DEFAULT_COMMERCE,
  updatedAt: new Date(0).toISOString(),
};

const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeHomeCommerce(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function sortCommerce(items: HomeCommerceItem[]): HomeCommerceItem[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function loadHomeCommerceConfig(): Promise<HomeDashboardConfig> {
  try {
    const raw = await AsyncStorage.getItem(CONFIG_KEY);
    if (!raw) return { ...DEFAULT_HOME_DASHBOARD_CONFIG };
    const parsed = JSON.parse(raw) as Partial<HomeDashboardConfig> & {
      banners?: unknown;
    };
    return {
      commerceItems: sortCommerce(
        Array.isArray(parsed.commerceItems)
          ? parsed.commerceItems
          : DEFAULT_HOME_DASHBOARD_CONFIG.commerceItems,
      ),
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return { ...DEFAULT_HOME_DASHBOARD_CONFIG };
  }
}

export async function saveHomeCommerceConfig(
  commerceItems: HomeCommerceItem[],
): Promise<HomeDashboardConfig> {
  if (__DEV__) {
    console.log(
      '[saveHomeCommerceConfig] saving itemIds:',
      commerceItems.map((item) => item.id),
    );
  }

  const next: HomeDashboardConfig = {
    commerceItems: sortCommerce(commerceItems),
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(next));
  notifyListeners();
  return next;
}

export function getActiveCommerceItems(config: HomeDashboardConfig): HomeCommerceItem[] {
  return config.commerceItems.filter((item) => item.isActive);
}

export function createCommerceItem(sortOrder: number): HomeCommerceItem {
  return {
    id: `commerce-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: '',
    description: '',
    imageUrl: null,
    partnerUrl: '',
    partnerLabel: '',
    isActive: true,
    sortOrder,
  };
}
