import type { MedicineInfo } from '@/services/emergencyApi';

/** 응급 현장·구급차에서 자주 조회하는 의약품 키워드 */
export type EmergencyMedicineDefinition = {
  id: string;
  label: string;
  subtitle: string;
  section: 'kit' | 'ambulance';
  keywords: string[];
};

export const EMERGENCY_MEDICINE_DEFINITIONS: EmergencyMedicineDefinition[] = [
  {
    id: 'acetaminophen',
    label: '타이레놀 / 아세트아미노펜',
    subtitle: '해열·진통',
    section: 'kit',
    keywords: ['타이레놀', '아세트아미노펜'],
  },
  {
    id: 'ibuprofen',
    label: '이부프로펜',
    subtitle: '해열·진통·소염',
    section: 'kit',
    keywords: ['이부프로펜', '부루펜', '맥시부펜'],
  },
  {
    id: 'geborin',
    label: '게보린',
    subtitle: '두통·감기·발열',
    section: 'kit',
    keywords: ['게보린정'],
  },
  {
    id: 'aspirin',
    label: '아스피린',
    subtitle: '진통·항혈소판',
    section: 'kit',
    keywords: ['아스피린장용정100', '아스피린정500'],
  },
  {
    id: 'dimenhydrinate',
    label: '디멘히드리네이트',
    subtitle: '멀미·구역·구토',
    section: 'kit',
    keywords: ['디멘히드리네이트', '디멘정'],
  },
  {
    id: 'diphenhydramine',
    label: '디펜히드라민',
    subtitle: '알레르기·진정',
    section: 'kit',
    keywords: ['디펜히드라민'],
  },
  {
    id: 'loperamide',
    label: '로페라미드',
    subtitle: '급성 설사',
    section: 'kit',
    keywords: ['로페라미드', '로페민'],
  },
  {
    id: 'oral-rehydration',
    label: '경구수화제',
    subtitle: '탈수·전해질 보충',
    section: 'kit',
    keywords: ['경구수화', 'ORS'],
  },
  {
    id: 'dexamethasone',
    label: '덱사메타손',
    subtitle: '스테로이드·알레르기',
    section: 'ambulance',
    keywords: ['덱사메타손'],
  },
  {
    id: 'nitroglycerin',
    label: '니트roglycerin / 질산제',
    subtitle: '협심증·흉통',
    section: 'ambulance',
    keywords: ['질산글리세린', '니트로'],
  },
  {
    id: 'furosemide',
    label: '푸로세미드',
    subtitle: '이뇨·폐부종',
    section: 'ambulance',
    keywords: ['푸로세미드', '라식스'],
  },
  {
    id: 'atropine',
    label: '아트로핀',
    subtitle: '서맥·유기인 중독',
    section: 'ambulance',
    keywords: ['아트로핀'],
  },
  {
    id: 'diazepam',
    label: '디아제팜',
    subtitle: '경련·진정',
    section: 'ambulance',
    keywords: ['디아제팜'],
  },
  {
    id: 'salbutamol',
    label: '살부타몰',
    subtitle: '기관지 확장',
    section: 'ambulance',
    keywords: ['살부타몰', '벤토린'],
  },
  {
    id: 'adrenaline',
    label: '에피네프린 / 아드레날린',
    subtitle: '아나필락시스·심정지',
    section: 'ambulance',
    keywords: ['에피네프린', '아드레날린'],
  },
  {
    id: 'naloxone',
    label: '날록손',
    subtitle: '오피오이드 길항제',
    section: 'ambulance',
    keywords: ['날록손'],
  },
];

export type EmergencyMedicineQuickItem = {
  definition: EmergencyMedicineDefinition;
  medicine: MedicineInfo | null;
};
