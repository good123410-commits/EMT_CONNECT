export type TransportRequest = {
  id: string;
  from: string;
  to: string;
  patientInfo: string;
  notes: string;
  fare: number;
  distance: string;
  urgency: 'normal' | 'urgent';
  postedAt: string;
};

export type EmptyReturnRequest = {
  id: string;
  fromRegion: string;
  toRegion: string;
  from: string;
  to: string;
  patientInfo: string;
  notes: string;
  fare: number;
  distance: string;
  emptyReturnBonus: number;
  postedAt: string;
};

export const RETURN_DESTINATIONS = ['서울', '경기', '광주', '부산', '대전', '대구'] as const;
export type ReturnDestination = (typeof RETURN_DESTINATIONS)[number];

export const TRANSPORT_REQUESTS: TransportRequest[] = [
  {
    id: 'tr-001',
    from: '행복요양병원',
    to: '서울대학교병원',
    patientInfo: '65세 남성',
    notes: '산소호흡기 필요',
    fare: 185_000,
    distance: '28.4km',
    urgency: 'urgent',
    postedAt: '2분 전',
  },
  {
    id: 'tr-002',
    from: '은혜재활병원',
    to: '고려대학교안암병원',
    patientInfo: '58세 여성',
    notes: '거동 불편 · 휠체어',
    fare: 142_000,
    distance: '19.7km',
    urgency: 'normal',
    postedAt: '5분 전',
  },
  {
    id: 'tr-003',
    from: '새희망요양병원',
    to: '삼성서울병원',
    patientInfo: '71세 남성',
    notes: '인공호흡기 동반 · 전문의 수신 필수',
    fare: 210_000,
    distance: '32.1km',
    urgency: 'urgent',
    postedAt: '8분 전',
  },
  {
    id: 'tr-004',
    from: '평화요양병원',
    to: '세브란스병원',
    patientInfo: '43세 남성',
    notes: '골절 · 목보호대 착용',
    fare: 128_000,
    distance: '15.2km',
    urgency: 'normal',
    postedAt: '12분 전',
  },
  {
    id: 'tr-005',
    from: '한사랑요양병원',
    to: '아산병원',
    patientInfo: '82세 여성',
    notes: '저혈압 · 보호자 1명 동승',
    fare: 165_000,
    distance: '24.8km',
    urgency: 'normal',
    postedAt: '15분 전',
  },
];

export const EMPTY_RETURN_REQUESTS: EmptyReturnRequest[] = [
  {
    id: 'er-001',
    fromRegion: '목포',
    toRegion: '서울',
    from: '목포시립병원',
    to: '서울아산병원',
    patientInfo: '72세 여성',
    notes: '휠체어 승강기 필요',
    fare: 95_000,
    distance: '340km',
    emptyReturnBonus: 45_000,
    postedAt: '3분 전',
  },
  {
    id: 'er-002',
    fromRegion: '광주',
    toRegion: '서울',
    from: '광주기독병원',
    to: '서울대학교병원',
    patientInfo: '68세 남성',
    notes: '산소 2L/min',
    fare: 88_000,
    distance: '290km',
    emptyReturnBonus: 38_000,
    postedAt: '7분 전',
  },
  {
    id: 'er-003',
    fromRegion: '전주',
    toRegion: '경기',
    from: '전북대학교병원',
    to: '분당서울대병원',
    patientInfo: '55세 남성',
    notes: '경추 보호대',
    fare: 72_000,
    distance: '210km',
    emptyReturnBonus: 32_000,
    postedAt: '10분 전',
  },
  {
    id: 'er-004',
    fromRegion: '대구',
    toRegion: '서울',
    from: '대구파티마병원',
    to: '세브란스병원',
    patientInfo: '61세 여성',
    notes: '당뇨 · 혈당 체크 필요',
    fare: 102_000,
    distance: '280km',
    emptyReturnBonus: 42_000,
    postedAt: '14분 전',
  },
  {
    id: 'er-005',
    fromRegion: '순천',
    toRegion: '광주',
    from: '순천향병원',
    to: '전남대학교병원',
    patientInfo: '77세 남성',
    notes: '침대 고정 필요',
    fare: 48_000,
    distance: '95km',
    emptyReturnBonus: 22_000,
    postedAt: '18분 전',
  },
  {
    id: 'er-006',
    fromRegion: '부산',
    toRegion: '대구',
    from: '부산대학교병원',
    to: '영남대학교병원',
    patientInfo: '49세 남성',
    notes: '골절 · 정형외과 입원',
    fare: 55_000,
    distance: '110km',
    emptyReturnBonus: 25_000,
    postedAt: '22분 전',
  },
];

export function formatFare(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}
