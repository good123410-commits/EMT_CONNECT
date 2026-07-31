/** 통합 생활권 (~54권역) — 인접 군·구를 묶은 운영 단위 */
export type LivingArea = {
  id: string;
  name: string;
  /** 포함 지역 요약 */
  coverage: string;
  /** 광역 그룹 (필터 탭용) */
  macroRegion: string;
};

export const LIVING_AREA_MACRO_REGIONS = [
  '수도권',
  '강원',
  '충청',
  '전라',
  '경상',
  '제주',
] as const;

export type LivingAreaMacroRegion = (typeof LIVING_AREA_MACRO_REGIONS)[number];

export const LIVING_AREAS: LivingArea[] = [
  { id: 'seoul-gangnam', name: '서울 강남·서초·송파', coverage: '강남·서초·송파', macroRegion: '수도권' },
  { id: 'seoul-gangbuk', name: '서울 강북·도심', coverage: '종로·중구·용산·성동', macroRegion: '수도권' },
  { id: 'seoul-dongbu', name: '서울 동부', coverage: '동대문·성동·광진·중랑·강동', macroRegion: '수도권' },
  { id: 'seoul-seobu', name: '서울 서부·북부', coverage: '마포·서대문·은평·노원·도봉', macroRegion: '수도권' },
  { id: 'seoul-southwest', name: '서울 남서부', coverage: '영등포·구로·금천·관악·동작', macroRegion: '수도권' },
  { id: 'incheon-west', name: '인천·경기 서부', coverage: '인천·김포·부천·시흥', macroRegion: '수도권' },
  { id: 'gyeonggi-suwon', name: '경기 남부 (수원권)', coverage: '수원·용인·화성·오산', macroRegion: '수도권' },
  { id: 'gyeonggi-seongnam', name: '경기 중부 (성남권)', coverage: '성남·광주·하남·과천', macroRegion: '수도권' },
  { id: 'gyeonggi-north', name: '경기 북부', coverage: '의정부·남양주·구리·양주·파주', macroRegion: '수도권' },
  { id: 'gyeonggi-east', name: '경기 동부', coverage: '안양·안산·평택·이천·여주', macroRegion: '수도권' },
  { id: 'gangwon-east', name: '강원 영동', coverage: '강릉·속초·동해·삼척·태백', macroRegion: '강원' },
  { id: 'gangwon-west', name: '강원 영서', coverage: '춘천·원주·홍천·횡성', macroRegion: '강원' },
  { id: 'gangwon-north', name: '강원 북부', coverage: '철원·화천·양구·인제·고성', macroRegion: '강원' },
  { id: 'chungbuk-cheongju', name: '충북 청주권', coverage: '청주·청원·보은·옥천', macroRegion: '충청' },
  { id: 'chungbuk-rural', name: '충북 내륙', coverage: '충주·제천·영동·괴산', macroRegion: '충청' },
  { id: 'chungnam-cheonan', name: '충남 천안·아산', coverage: '천안·아산·공주', macroRegion: '충청' },
  { id: 'chungnam-west', name: '충남 서부', coverage: '서산·당진·태안·보령', macroRegion: '충청' },
  { id: 'chungnam-east', name: '충남 동부', coverage: '논산·계룡·금산·부여', macroRegion: '충청' },
  { id: 'daejeon-sejong', name: '대전·세종', coverage: '대전 전역·세종시', macroRegion: '충청' },
  { id: 'jeonbuk-jeonju', name: '전북 전주권', coverage: '전주·완주·익산·김제', macroRegion: '전라' },
  { id: 'jeonbuk-south', name: '전북 남부', coverage: '정읍·남원·순창·임실', macroRegion: '전라' },
  { id: 'jeonbuk-north', name: '전북 북부', coverage: '군산·부안·고창·무주', macroRegion: '전라' },
  { id: 'jeonnam-gwangju', name: '광주·전남 서부', coverage: '광주·나주·화순·담양', macroRegion: '전라' },
  { id: 'jeonnam-mokpo', name: '전남 서남부', coverage: '목포·무안·영암·해남', macroRegion: '전라' },
  { id: 'jeonnam-east', name: '전남 동부', coverage: '순천·여수·광양·구례', macroRegion: '전라' },
  { id: 'jeonnam-central', name: '전남 중부', coverage: '장흥·강진·보성·곡성', macroRegion: '전라' },
  { id: 'gyeongbuk-daegu', name: '대구·경북 서부', coverage: '대구·칠곡·군위·성주', macroRegion: '경상' },
  { id: 'gyeongbuk-pohang', name: '경북 동부', coverage: '포항·경주·영덕·울진', macroRegion: '경상' },
  { id: 'gyeongbuk-andong', name: '경북 중부', coverage: '안동·문경·상주·영주', macroRegion: '경상' },
  { id: 'gyeongbuk-gyeongsan', name: '경북 남부', coverage: '경산·청도·고령·합천', macroRegion: '경상' },
  { id: 'gyeongnam-busan-central', name: '부산 중부', coverage: '해운대·수영·동래·연제', macroRegion: '경상' },
  { id: 'gyeongnam-busan-west', name: '부산 서부·북부', coverage: '사하·강서·북구·금정', macroRegion: '경상' },
  { id: 'gyeongnam-busan-south', name: '부산 남부·동부', coverage: '남구·동구·기장', macroRegion: '경상' },
  { id: 'gyeongnam-ulsan', name: '울산', coverage: '울산 전역', macroRegion: '경상' },
  { id: 'gyeongnam-changwon', name: '창원·마산·진해', coverage: '창원·김해·양산', macroRegion: '경상' },
  { id: 'gyeongnam-jinju', name: '진주·거제·통영', coverage: '진주·사천·거제·통영', macroRegion: '경상' },
  { id: 'gyeongnam-miryang', name: '밀양·함안·창녕', coverage: '밀양·함안·창녕·의령', macroRegion: '경상' },
  { id: 'jeju-north', name: '제주 북부', coverage: '제주시·조천·구좌', macroRegion: '제주' },
  { id: 'jeju-south', name: '제주 남부', coverage: '서귀포·남원·대정', macroRegion: '제주' },
  { id: 'incheon-central', name: '인천 동·중부', coverage: '인천 동구·남동·연수·미추홀', macroRegion: '수도권' },
  { id: 'gyeonggi-pyeongtaek', name: '평택·당진권', coverage: '평택·당진·송탄', macroRegion: '수도권' },
  { id: 'gyeonggi-gimpo', name: '김포·고양·양평', coverage: '김포·고양·양평·포천', macroRegion: '수도권' },
  { id: 'gyeonggi-yongin-south', name: '용인·이천·광주', coverage: '용인 남부·이천·광주', macroRegion: '수도권' },
  { id: 'gangwon-pyeongchang', name: '평창·정선·영월', coverage: '평창·정선·영월·한탄', macroRegion: '강원' },
  { id: 'chungbuk-jecheon', name: '충북 북부', coverage: '제천·단양·음성', macroRegion: '충청' },
  { id: 'chungnam-nonsan', name: '충남 논산·부여', coverage: '논산·계룡·부여·청양', macroRegion: '충청' },
  { id: 'jeonbuk-saemangeum', name: '전북 새만금', coverage: '군산·부안·고창', macroRegion: '전라' },
  { id: 'jeonnam-suncheon', name: '순천·광양', coverage: '순천·광양·구례·곡성', macroRegion: '전라' },
  { id: 'gyeongbuk-gimcheon', name: '김천·구미', coverage: '김천·구미·칠곡', macroRegion: '경상' },
  { id: 'gyeongbuk-yeongcheon', name: '영천·경산', coverage: '영천·청도·경산', macroRegion: '경상' },
  { id: 'gyeongnam-sacheon', name: '사천·남해·하동', coverage: '사천·남해·하동·산청', macroRegion: '경상' },
  { id: 'gyeongnam-geoje', name: '거제·통영·고성', coverage: '거제·통영·고성(경남)', macroRegion: '경상' },
  { id: 'gyeongnam-yeongcheon-gyeongju', name: '경주·영천', coverage: '경주·영천·청도', macroRegion: '경상' },
];

export function getLivingAreaById(id: string): LivingArea | undefined {
  return LIVING_AREAS.find((area) => area.id === id);
}

export function getLivingAreasByMacro(macro: LivingAreaMacroRegion | '전체'): LivingArea[] {
  if (macro === '전체') return LIVING_AREAS;
  return LIVING_AREAS.filter((area) => area.macroRegion === macro);
}
