export type IsolationZone = {
  label: string;
  distanceM: number;
  color: string;
  description: string;
};

export type HazardousMaterial = {
  id: string;
  unNumber: string;
  name: string;
  nameEn: string;
  hazardClass: string;
  hazardLevel: 1 | 2 | 3 | 4;
  ergGuide: string;
  isolationZones: IsolationZone[];
  symptoms: string[];
  firstActions: string[];
};

export const HAZARDOUS_MATERIALS: HazardousMaterial[] = [
  {
    id: 'un1005',
    unNumber: 'UN 1005',
    name: '암모니아 (액화)',
    nameEn: 'Ammonia, anhydrous',
    hazardClass: '2.3 (독성 가스)',
    hazardLevel: 4,
    ergGuide: 'ERG 125',
    isolationZones: [
      { label: '초기 이격', distanceM: 100, color: '#ef4444', description: '소규모 누출·야간' },
      { label: '보호 이격', distanceM: 300, color: '#f97316', description: '대규모 누출·주간' },
      { label: '대피 권고', distanceM: 800, color: '#eab308', description: '탱크 파열·대형 사고' },
    ],
    symptoms: ['눈·호흡기 자극', '기침', '호흡곤란', '피부 화상'],
    firstActions: ['상풍 측 접근', '119·소방 신고', '누출원 차단 시도 금지 (비전문가)', '오염 구역 퇴거'],
  },
  {
    id: 'un1017',
    unNumber: 'UN 1017',
    name: '염소',
    nameEn: 'Chlorine',
    hazardClass: '2.3 (독성 가스)',
    hazardLevel: 4,
    ergGuide: 'ERG 124',
    isolationZones: [
      { label: '초기 이격', distanceM: 100, color: '#ef4444', description: '소규모 누출' },
      { label: '보호 이격', distanceM: 400, color: '#f97316', description: '대규모 누출' },
      { label: '대피 권고', distanceM: 1000, color: '#eab308', description: '탱크 사고' },
    ],
    symptoms: ['목·눈 자극', '호흡곤란', '폐부종'],
    firstActions: ['상풍 측 대피', '밀폐 공간 진입 금지', '119 신고', '오염 의복 제거'],
  },
  {
    id: 'un1170',
    unNumber: 'UN 1170',
    name: '에탄올',
    nameEn: 'Ethanol',
    hazardClass: '3 (인화성 액체)',
    hazardLevel: 2,
    ergGuide: 'ERG 127',
    isolationZones: [
      { label: '초기 이격', distanceM: 30, color: '#22c55e', description: '소규모 누출' },
      { label: '보호 이격', distanceM: 100, color: '#f97316', description: '대규모 누출·화재' },
      { label: '대피 권고', distanceM: 300, color: '#eab308', description: '탱크 화재' },
    ],
    symptoms: ['중추신경 억제', '호흡 억제 (흡입 시)', '화상 (농도 높을 때)'],
    firstActions: ['화기 제거', '환기', '119 신고', '화재 시 ABC 소화기 (소량)'],
  },
  {
    id: 'un1830',
    unNumber: 'UN 1830',
    name: '황산 (농축)',
    nameEn: 'Sulfuric acid',
    hazardClass: '8 (부식성)',
    hazardLevel: 3,
    ergGuide: 'ERG 157',
    isolationZones: [
      { label: '초기 이격', distanceM: 50, color: '#f97316', description: '소규모 누출' },
      { label: '보호 이격', distanceM: 150, color: '#ef4444', description: '대규모 누출' },
      { label: '대피 권고', distanceM: 500, color: '#eab308', description: '탱크 파열' },
    ],
    symptoms: ['피부·눈 화상', '호흡기 부식', '폐부종'],
    firstActions: ['물로 20분 이상 세척 (피부)', '오염 의복 제거', '119 신고', '중화 시도 금지'],
  },
  {
    id: 'un1075',
    unNumber: 'UN 1075',
    name: '액화석유가스 (LPG)',
    nameEn: 'Liquefied petroleum gas',
    hazardClass: '2.1 (인화성 가스)',
    hazardLevel: 3,
    ergGuide: 'ERG 115',
    isolationZones: [
      { label: '초기 이격', distanceM: 50, color: '#f97316', description: '소규모 누출' },
      { label: '보호 이격', distanceM: 300, color: '#ef4444', description: '대규모 누출' },
      { label: '대피 권고', distanceM: 800, color: '#eab308', description: 'BLEVE 위험' },
    ],
    symptoms: ['호흡기 자극', '마취 작용', '화상 (액체 접촉)'],
    firstActions: ['화기·전기 제거', '환기', '119·소방', '누출원 차단은 전문가만'],
  },
  {
    id: 'un2814',
    unNumber: 'UN 2814',
    name: '감염성 물질',
    nameEn: 'Infectious substance',
    hazardClass: '6.2 (감염성)',
    hazardLevel: 2,
    ergGuide: 'ERG 158',
    isolationZones: [
      { label: '초기 이격', distanceM: 25, color: '#22c55e', description: '포장 파손 없음' },
      { label: '보호 이격', distanceM: 75, color: '#f97316', description: '포장 파손·누출' },
      { label: '대피 권고', distanceM: 150, color: '#eab308', description: '대량 누출' },
    ],
    symptoms: ['접촉 부위 감염', '전신 감염 (노출 시)'],
    firstActions: ['PPE 착용', '오염 구역 격리', '119·질병관리청', '접촉 부위 즉시 세척'],
  },
];

export function searchHazardousMaterials(query: string): HazardousMaterial[] {
  const q = query.trim().toLowerCase();
  if (!q) return HAZARDOUS_MATERIALS;
  const normalized = q.replace(/^un\s*/i, '');
  return HAZARDOUS_MATERIALS.filter(
    (m) =>
      m.unNumber.toLowerCase().includes(q) ||
      m.unNumber.replace(/\s/g, '').toLowerCase().includes(normalized) ||
      m.name.toLowerCase().includes(q) ||
      m.nameEn.toLowerCase().includes(q),
  );
}

export function getHazardousMaterialById(id: string): HazardousMaterial | undefined {
  return HAZARDOUS_MATERIALS.find((m) => m.id === id);
}

export const HAZARD_LEVEL_LABELS: Record<HazardousMaterial['hazardLevel'], string> = {
  1: '낮음',
  2: '보통',
  3: '높음',
  4: '매우 높음',
};

export const HAZARD_LEVEL_COLORS: Record<HazardousMaterial['hazardLevel'], string> = {
  1: '#22c55e',
  2: '#eab308',
  3: '#f97316',
  4: '#ef4444',
};
