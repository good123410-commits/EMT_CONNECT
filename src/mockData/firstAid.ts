export type FirstAidStep = {
  order: number;
  title: string;
  description: string;
};

export type FirstAidGuide = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  severity: 'critical' | 'urgent' | 'moderate';
  summary: string;
  steps: FirstAidStep[];
  warnings: string[];
};

export const FIRST_AID_GUIDES: FirstAidGuide[] = [
  {
    id: 'cpr',
    title: '심정지 (CPR)',
    subtitle: '심폐소생술',
    icon: 'heart',
    severity: 'critical',
    summary: '의식과 호흡이 없을 때 즉시 119 신고 후 가슴압박을 시작합니다.',
    steps: [
      { order: 1, title: '119 신고', description: '주변에 도움을 요청하고 119에 신고합니다.' },
      { order: 2, title: '반응 확인', description: '어깨를 두드리며 "괜찮으세요?"라고 큰 소리로 확인합니다.' },
      { order: 3, title: '가슴압박', description: '가슴 정중앙에 손바닥을 대고 분당 100~120회, 5cm 깊이로 압박합니다.' },
      { order: 4, title: '인공호흡', description: 'AED가 없다면 30회 압박 후 2회 인공호흡을 반복합니다.' },
      { order: 5, title: 'AED 사용', description: 'AED가 도착하면 전원을 켜고 음성 안내에 따라 패드를 부착합니다.' },
    ],
    warnings: ['압박 중단 시간을 최소화하세요.', '소아의 경우 손가락 1~2개 또는 한 손으로 압박합니다.'],
  },
  {
    id: 'heimlich',
    title: '기도폐쇄 (하임리히)',
    subtitle: 'Heimlich Maneuver',
    icon: 'body',
    severity: 'critical',
    summary: '기도가 막혀 숨을 못 쉴 때 복부를 위로 밀어 올려 이물질을 배출합니다.',
    steps: [
      { order: 1, title: '기도폐쇄 확인', description: '손을 목에 대는 제스처, 말 못함, 청색증을 확인합니다.' },
      { order: 2, title: '등 두드리기', description: '어린아이·영유아는 5회 등 두드리기를 먼저 시도합니다.' },
      { order: 3, title: '하임리히 시행', description: '환자 뒤에서 주먹을 배꼽 위에 대고 다른 손으로 감싸 위로 밀어 올립니다.' },
      { order: 4, title: '반복', description: '이물질이 나올 때까지 5회씩 반복합니다.' },
      { order: 5, title: '119 신고', description: '이물질 배출 실패 시 즉시 119에 신고합니다.' },
    ],
    warnings: ['임신부·비만 환자는 가슴압박법을 사용합니다.', '의식을 잃으면 CPR을 시작합니다.'],
  },
  {
    id: 'fracture',
    title: '골절',
    subtitle: 'Fracture',
    icon: 'fitness',
    severity: 'urgent',
    summary: '골절 의심 시 움직임을 최소화하고 고정 후 이송합니다.',
    steps: [
      { order: 1, title: '출혈 확인', description: '개방성 골절 시 깨끗한 거즈로 출혈을 지혈합니다.' },
      { order: 2, title: '부목 고정', description: '골절 부위 위·아래 관절을 포함해 부목으로 고정합니다.' },
      { order: 3, title: '냉찜질', description: '부종 완화를 위해 얼음을 수건에 싸서 15~20분간 적용합니다.' },
      { order: 4, title: '이송', description: '119 신고 또는 병원 이송 시 부상 부위를 움직이지 않게 합니다.' },
    ],
    warnings: ['골절 부위를 직접 만지거나 교정하지 마세요.', '척추 손상 의심 시 절대 일으키지 마세요.'],
  },
  {
    id: 'burn',
    title: '화상',
    subtitle: 'Burn',
    icon: 'flame',
    severity: 'moderate',
    summary: '화상 부위를 즉시 찬물로 20분 이상 식힌 후 무균 드레싱합니다.',
    steps: [
      { order: 1, title: '열원 제거', description: '불·뜨거운 액체·화학물질 등 열원을 즉시 제거합니다.' },
      { order: 2, title: '냉각', description: '찬 물(15~25°C)로 20분 이상 흐르는 물에 식힙니다.' },
      { order: 3, title: '드레싱', description: '깨끗한 거즈나 멸균 드레싱으로 덮습니다.' },
      { order: 4, title: '병원 판단', description: '얼굴·손·발·회음부 화상, 3도 화상은 즉시 병원 방문합니다.' },
    ],
    warnings: ['물집을 터뜨리지 마세요.', '버터·치약 등 민간요법을 사용하지 마세요.'],
  },
  {
    id: 'bleeding',
    title: '대량 출혈',
    subtitle: 'Severe Bleeding',
    icon: 'water',
    severity: 'critical',
    summary: '직접 압박과 지혈대로 출혈을 통제한 후 119에 신고합니다.',
    steps: [
      { order: 1, title: '직접 압박', description: '깨끗한 거즈·천으로 상처를 10분 이상 강하게 누릅니다.' },
      { order: 2, title: '상처 고도', description: '출혈 부위를 심장보다 높이 올립니다.' },
      { order: 3, title: '지혈대', description: '압박으로 지혈 안 될 때 상처와 심장 사이에 지혈대를 적용합니다.' },
      { order: 4, title: '119 신고', description: '출혈이 심하거나 쇼크 증상 시 즉시 119에 신고합니다.' },
    ],
    warnings: ['지혈대는 15~20분 이상 유지하지 마세요.', '이물질이 박힌 경우 제거하지 마세요.'],
  },
  {
    id: 'stroke',
    title: '뇌졸중 (FAST)',
    subtitle: 'Stroke',
    icon: 'pulse',
    severity: 'critical',
    summary: 'FAST 검사로 뇌졸중을 조기 발견하고 골든타임 내 이송합니다.',
    steps: [
      { order: 1, title: 'F - Face', description: '얼굴이 한쪽으로 처지는지 확인합니다. "이를 보여주세요."' },
      { order: 2, title: 'A - Arm', description: '양팔을 들었을 때 한쪽 팔이 처지는지 확인합니다.' },
      { order: 3, title: 'S - Speech', description: '말이 어눌하거나 이해가 안 되는지 확인합니다.' },
      { order: 4, title: 'T - Time', description: '증상 발견 시간을 기록하고 즉시 119에 신고합니다.' },
    ],
    warnings: ['증상 발현 4.5시간 이내가 혈전용해제 투여 골든타임입니다.', '환자를 눕히고 옆으로 기울여 기도를 확보합니다.'],
  },
];

export function searchFirstAidGuides(query: string): FirstAidGuide[] {
  const q = query.trim().toLowerCase();
  if (!q) return FIRST_AID_GUIDES;
  return FIRST_AID_GUIDES.filter(
    (g) =>
      g.title.toLowerCase().includes(q) ||
      g.subtitle.toLowerCase().includes(q) ||
      g.summary.toLowerCase().includes(q),
  );
}
