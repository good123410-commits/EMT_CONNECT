export type DrugProtocolStep = {
  order: number;
  action: string;
  detail: string;
};

export type Drug = {
  id: string;
  productName: string;
  ingredient: string;
  category: string;
  indication: string;
  adultDose: string;
  pediatricDose: string;
  contraindications: string[];
  fieldProtocol: DrugProtocolStep[];
};

export const DRUGS: Drug[] = [
  {
    id: 'epi',
    productName: '에피네프린 (Adrenaline)',
    ingredient: '에피네프린',
    category: '심혈관·응급',
    indication: '아나필락시스, 심정지 (VF/pVT 제외)',
    adultDose: '0.3~0.5mg IM (1:1000), 5분 간격 반복',
    pediatricDose: '0.01mg/kg IM (최대 0.3mg)',
    contraindications: ['없음 (생명 위협 시)'],
    fieldProtocol: [
      { order: 1, action: '기도 확보', detail: '앙와위, 기도 확보 및 산소 투여 준비' },
      { order: 2, action: 'IM 주사', detail: '대퇴부 외측 또는 삼각근에 1:1000 에피네프린 IM' },
      { order: 3, action: '재평가', detail: '5분 후 반응 없으면 동일 용량 반복 (최대 3회)' },
      { order: 4, action: '이송', detail: '119 이송, 혈압·SpO2·의식 지속 모니터링' },
    ],
  },
  {
    id: 'nitro',
    productName: '니트로글리세린',
    ingredient: '니트로글리세린',
    category: '심혈관',
    indication: '급성 관상동맥증후군 (흉통)',
    adultDose: '0.4mg SL, 5분 간격 최대 3회',
    pediatricDose: '소아 사용 금지',
    contraindications: ['수축기 BP < 90mmHg', 'PDE5 억제제 24~48시간 내 복용', '우심실 infarct'],
    fieldProtocol: [
      { order: 1, action: '혈압 확인', detail: '수축기 90mmHg 이상인지 확인' },
      { order: 2, action: 'SL 투여', detail: '설하 0.4mg, 5분 간격 최대 3회' },
      { order: 3, action: '체위', detail: '반좌위, 편안한 환경 유지' },
      { order: 4, action: '이송', detail: '흉통 지속 시 119, 12유도 심전도 준비' },
    ],
  },
  {
    id: 'atropine',
    productName: '아트로핀',
    ingredient: '아트로핀',
    category: '항독·부교감',
    indication: '증성 서맥, OP 중독, 유기인 인산염 중독',
    adultDose: '0.5~1mg IV, 3~5분 간격 (최대 3mg)',
    pediatricDose: '0.02mg/kg IV (최소 0.1mg)',
    contraindications: ['좁각녹내장', '전립선 비대'],
    fieldProtocol: [
      { order: 1, action: '서맥 확인', detail: 'HR < 50 + 저혈압/실신/심장편출 저하' },
      { order: 2, action: 'IV 투여', detail: '0.5mg IV push, 3~5분 간격' },
      { order: 3, action: 'OP 중독', detail: '유기인 중독 시 2~5mg IV, 반복' },
      { order: 4, action: '모니터링', detail: 'HR, BP, pupil size 지속 관찰' },
    ],
  },
  {
    id: 'naloxone',
    productName: '날록손 (Narcan)',
    ingredient: '날록손',
    category: '마약 길항제',
    indication: '오피오이드 과다복용',
    adultDose: '0.4~2mg IN/IM/IV, 2~3분 간격 반복',
    pediatricDose: '0.1mg/kg IN/IM/IV',
    contraindications: ['알려진 알레르기 (상대적)'],
    fieldProtocol: [
      { order: 1, action: '호흡 확인', detail: 'RR < 12, 의식 저하, 모iosis 확인' },
      { order: 2, action: 'IN/IM 투여', detail: '비강 4mg 또는 IM 0.4~2mg' },
      { order: 3, action: '재투여', detail: '2~3분 후 반응 없으면 반복 (최대 10mg)' },
      { order: 4, action: '재발 주의', detail: '반감기 짧음, 119 이송 후 재평가' },
    ],
  },
  {
    id: 'dextrose',
    productName: 'D50W (포도당)',
    ingredient: '덱스트로스',
    category: '대사',
    indication: '저혈당 (혈당 < 60mg/dL)',
    adultDose: '25g (D50W 50ml) IV',
    pediatricDose: 'D10W 2~4ml/kg IV',
    contraindications: ['없음 (저혈당 응급)'],
    fieldProtocol: [
      { order: 1, action: '혈당 측정', detail: 'POCT 혈당기로 확인 (< 60mg/dL)' },
      { order: 2, action: 'IV 투여', detail: 'D50W 25g IV push (천천히)' },
      { order: 3, action: '재측정', detail: '15분 후 혈당 재측정' },
      { order: 4, action: '경구 당', detail: '의식 회복 시 경구 포도당/식이' },
    ],
  },
  {
    id: 'midazolam',
    productName: '미다졸람',
    ingredient: '미다졸람',
    category: '진정·항경련',
    indication: '현장 경련 (status epilepticus)',
    adultDose: '5~10mg IM/IN, 10분 간격 최대 20mg',
    pediatricDose: '0.2mg/kg IM/IN (최대 10mg)',
    contraindications: ['중증 호흡억제', '쇼크'],
    fieldProtocol: [
      { order: 1, action: '경련 시간', detail: '5분 이상 지속 시 약물 투여 고려' },
      { order: 2, action: 'IN/IM', detail: '비강 또는 대퇴부 IM 투여' },
      { order: 3, action: '기도', detail: '회복자세, 기도 확보, SpO2 모니터링' },
      { order: 4, action: '이송', detail: '119, 반복 경련 시 추가 투여' },
    ],
  },
];

export function searchDrugs(query: string): Drug[] {
  const q = query.trim().toLowerCase();
  if (!q) return DRUGS;
  return DRUGS.filter(
    (d) =>
      d.productName.toLowerCase().includes(q) ||
      d.ingredient.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.indication.toLowerCase().includes(q),
  );
}

export function getDrugById(id: string): Drug | undefined {
  return DRUGS.find((d) => d.id === id);
}
