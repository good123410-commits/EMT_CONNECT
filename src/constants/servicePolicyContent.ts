export type ServicePolicySection = {
  id: string;
  title: string;
  body: string;
  /** 강조 표시할 핵심 문구 (본문 내 일치 텍스트 하이라이트) */
  highlights?: string[];
};

export const SERVICE_POLICY_TITLE = '서비스 운영 정책 및 면책 안내';

export const SERVICE_POLICY_INTRO =
  'EMS Connect는 응급 상황에서 시민과 현장 전문가가 안전하게 정보를 나눌 수 있도록 설계되었습니다. 아래 내용을 숙지해 주세요.';

export const SERVICE_POLICY_SECTIONS: ServicePolicySection[] = [
  {
    id: 'nature',
    title: '서비스 성격',
    body: '본 서비스는 응급 의료 정보의 신속한 접근을 돕는 정보 제공 플랫폼입니다. 의료기관·공공 데이터·현장 전문가 안내를 한곳에서 참고할 수 있도록 돕습니다.',
    highlights: ['정보 제공 플랫폼'],
  },
  {
    id: 'medical',
    title: '의료적 면책',
    body: '본 앱에서 제공하는 정보는 참고용이며, 전문적인 의학적 진단이나 치료를 대신할 수 없습니다. 증상·상황에 대한 최종 판단과 처치는 반드시 의료 전문가·119 지휘 체계에 따르십시오. 위급 상황 시에는 반드시 119에 신고하십시오.',
    highlights: [
      '참고용',
      '전문적인 의학적 진단이나 치료를 대신할 수 없습니다',
      '반드시 119에 신고하십시오',
    ],
  },
  {
    id: 'expert',
    title: '전문가 답변 가이드',
    body: '전문가(구급대원)가 제공하는 정보는 현장 실무 경험을 바탕으로 한 안내이며, 실시간 원격 진료와는 무관합니다. 커뮤니티 게시·답변은 응급 처치 교육·정보 공유 목적이며, 개별 환자에 대한 진단·처방을 의미하지 않습니다.',
    highlights: ['현장 실무 경험을 바탕으로 한 안내', '실시간 원격 진료와는 무관'],
  },
  {
    id: 'purpose',
    title: '운영 목적',
    body: '우리는 시민들이 올바른 의료 정보를 찾게 하여 응급 의료 자원의 효율적 운영과 불필요한 신고 감소를 목적으로 운영합니다. 정확한 시설 정보·거리 안내를 통해 적절한 도움을 받을 수 있도록 지원합니다.',
    highlights: ['응급 의료 자원의 효율적 운영', '불필요한 신고 감소'],
  },
];

export const SERVICE_POLICY_FOOTER =
  '본 안내는 관련 법령 및 앱 스토어 정책을 준수하기 위한 것이며, 서비스 이용 시 본 내용에 동의한 것으로 간주됩니다.';

/** 설정 화면용 전체 텍스트 (플레인) */
export const SERVICE_POLICY_PLAIN_TEXT = [
  SERVICE_POLICY_INTRO,
  ...SERVICE_POLICY_SECTIONS.map((s) => `[${s.title}]\n${s.body}`),
  SERVICE_POLICY_FOOTER,
].join('\n\n');
