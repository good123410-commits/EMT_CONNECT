export type GiftCard = {
  id: string;
  brand: string;
  name: string;
  pricePoints: number;
  imageEmoji: string;
  description: string;
};

export type GroupBuy = {
  id: string;
  itemName: string;
  vendorName: string;
  originalPrice: number;
  discountPrice: number;
  depositPoints: number;
  minThreshold: number;
  currentOrders: number;
  status: 'verifying' | 'active' | 'completed';
  deadline: string;
};

export const GIFT_CARDS: GiftCard[] = [
  {
    id: 'gc1',
    brand: '스타벅스',
    name: '아메리카노 Tall',
    pricePoints: 300,
    imageEmoji: '☕',
    description: '전국 스타벅스 매장 사용 가능',
  },
  {
    id: 'gc2',
    brand: 'CU',
    name: '5,000원 모바일 상품권',
    pricePoints: 500,
    imageEmoji: '🏪',
    description: 'CU 편의점 전용',
  },
  {
    id: 'gc3',
    brand: '배달의민족',
    name: '5,000원 배민포인트',
    pricePoints: 500,
    imageEmoji: '🛵',
    description: '배달의민족 앱 충전',
  },
  {
    id: 'gc4',
    brand: '문화상품권',
    name: '10,000원 문화상품권',
    pricePoints: 1000,
    imageEmoji: '🎫',
    description: '온·오프라인 문화시설 사용',
  },
  {
    id: 'gc5',
    brand: 'GS25',
    name: '3,000원 모바일 쿠폰',
    pricePoints: 300,
    imageEmoji: '🏬',
    description: 'GS25 편의점 전용',
  },
];

export const GROUP_BUYS: GroupBuy[] = [
  {
    id: 'gb1',
    itemName: '응급구조사 전용 스트레칭 밴드 세트',
    vendorName: 'EMS Gear Korea',
    originalPrice: 45000,
    discountPrice: 28000,
    depositPoints: 200,
    minThreshold: 30,
    currentOrders: 22,
    status: 'active',
    deadline: '2026-07-31',
  },
  {
    id: 'gb2',
    itemName: '휴대용 AED 훈련용 매트',
    vendorName: 'SafeTrain Co.',
    originalPrice: 89000,
    discountPrice: 59000,
    depositPoints: 500,
    minThreshold: 20,
    currentOrders: 8,
    status: 'verifying',
    deadline: '2026-08-15',
  },
  {
    id: 'gb3',
    itemName: '응급처치 가방 (1급 구조사용)',
    vendorName: 'MedSupply Pro',
    originalPrice: 120000,
    discountPrice: 85000,
    depositPoints: 800,
    minThreshold: 15,
    currentOrders: 15,
    status: 'completed',
    deadline: '2026-07-01',
  },
  {
    id: 'gb4',
    itemName: 'N95 마스크 50매 (공구)',
    vendorName: 'HealthBulk',
    originalPrice: 35000,
    discountPrice: 22000,
    depositPoints: 150,
    minThreshold: 50,
    currentOrders: 41,
    status: 'active',
    deadline: '2026-07-20',
  },
];

export const GROUP_BUY_STATUS_LABELS: Record<GroupBuy['status'], string> = {
  verifying: '검증 중',
  active: '모집 중',
  completed: '달성 완료',
};

export const GROUP_BUY_STATUS_COLORS: Record<GroupBuy['status'], string> = {
  verifying: '#eab308',
  active: '#22c55e',
  completed: '#64748b',
};
