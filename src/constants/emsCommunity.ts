/** EMS 커뮤니티(미래회) — 스토어 심사용 안내·외부 링크·서약 문구 */

export const EMS_COMMUNITY_TAB_LABEL = 'EMS 커뮤니티';

export const PARAMEDIC_GUARD_TITLE = '승인 전용 서비스';

export const PARAMEDIC_GUARD_MESSAGE =
  '1급 응급구조사 면허 소지자 전용 공간입니다. 관리자의 서류 검토 및 승인이 완료된 계정만 진입할 수 있습니다.';

/** 모금·공동구매·결제 — 앱 외부 웹만 허용 */
export const MIRAE_EXTERNAL_LINKS = {
  officialSite: 'https://example.com/mirae-ems',
  groupBuy: 'https://example.com/mirae-ems/group-buy',
  donation: 'https://example.com/mirae-ems/donation',
} as const;

export const COMMUNITY_PLEDGE_TITLE = 'EMS 커뮤니티 이용 서약서';

export const COMMUNITY_PLEDGE_ITEMS = [
  '환자 및 당사자의 개인정보·신원 정보를 게시하지 않으며, 케이스 공유 시 반드시 익명화합니다.',
  '비방·욕설·차별·허위 사실 유포를 하지 않습니다.',
  '현장 의료 판단을 대체하는 불법 의료 행위 안내를 하지 않습니다.',
  '커뮤니티 운영 정책 및 신고·제재 절차에 동의합니다.',
] as const;

/** @deprecated 동적 채팅방(ems_chat_rooms)으로 대체됨 — 신규 코드에서 사용하지 마세요 */
export const CHAT_ROOM_REGIONS = [
  { id: 'all', label: '통합방', description: '전국 구급대원 자유 소통' },
  { id: 'seoul', label: '서울', description: '수도권 현장 정보' },
  { id: 'gyeonggi', label: '경기', description: '경기권 거점 소통' },
  { id: 'busan', label: '부산', description: '영남권 현장 정보' },
  { id: 'other', label: '기타', description: '그 외 지역' },
] as const;

export type ChatRoomId = (typeof CHAT_ROOM_REGIONS)[number]['id'];

export const RESOURCE_CATEGORIES = ['프로토콜', '학술회', '교육', '기타'] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];
