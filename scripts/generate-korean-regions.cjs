const fs = require('fs');
const path = require('path');

const data = require('../src/data/generated/sigungu_by_sido.json');

const SIDO_CODES = {
  '서울특별시': 'seoul',
  '부산광역시': 'busan',
  '대구광역시': 'daegu',
  '인천광역시': 'incheon',
  '광주광역시': 'gwangju',
  '대전광역시': 'daejeon',
  '울산광역시': 'ulsan',
  '세종특별자치시': 'sejong',
  '경기도': 'gyeonggi',
  '강원특별자치도': 'gangwon',
  '충청북도': 'chungbuk',
  '충청남도': 'chungnam',
  '전북특별자치도': 'jeonbuk',
  '전라남도': 'jeonnam',
  '경상북도': 'gyeongbuk',
  '경상남도': 'gyeongnam',
  '제주특별자치도': 'jeju',
};

const METRO_PREFIXES = [
  '부산',
  '인천',
  '울산',
  '대구',
  '광주',
  '대전',
  '수원',
  '성남',
  '고양',
  '부천',
  '안산',
  '안양',
  '용인',
  '화성',
  '천안',
  '청주',
  '전주',
];

const ROMAN = {
  강남: 'gangnam',
  무안: 'muan',
  종로: 'jongno',
  해운대: 'haeundae',
  강화: 'ganghwa',
  목포: 'mokpo',
  여수: 'yeosu',
  순천: 'suncheon',
  전주: 'jeonju',
  제주: 'jeju',
  수원: 'suwon',
  강동: 'gangdong',
  강북: 'gangbuk',
  강서: 'gangseo',
  관악: 'gwanak',
  광진: 'gwangjin',
  구로: 'guro',
  금천: 'geumcheon',
  노원: 'nowon',
  도봉: 'dobong',
  동대문: 'dongdaemun',
  동작: 'dongjak',
  마포: 'mapo',
  서대문: 'seodaemun',
  서초: 'seocho',
  성동: 'seongdong',
  성북: 'seongbuk',
  송파: 'songpa',
  양천: 'yangcheon',
  영등포: 'yeongdeungpo',
  용산: 'yongsan',
  은평: 'eunpyeong',
  중랑: 'jungnang',
};

function displaySigungu(sido, sg) {
  if (sido === '서울특별시') return sg;
  for (const p of METRO_PREFIXES) {
    if (sg.startsWith(p) && sg.length > p.length) return sg.slice(p.length);
  }
  return sg;
}

function makeCode(sido, sg) {
  const p = SIDO_CODES[sido];
  const disp = displaySigungu(sido, sg);
  const base = disp.replace(/(시|군|구)$/, '');
  const slug = ROMAN[base] || Buffer.from(sg, 'utf8').toString('base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
  return `${p}-${slug}`;
}

const provinces = [];
const flat = [];
const codeSet = new Set();

for (const sido of Object.keys(data).sort((a, b) => a.localeCompare(b, 'ko'))) {
  const sigunguList = data[sido].map((sg) => {
    const display = displaySigungu(sido, sg);
    let code = makeCode(sido, sg);
    let n = 2;
    while (codeSet.has(code)) {
      code = `${makeCode(sido, sg)}${n}`;
      n += 1;
    }
    codeSet.add(code);
    const unit = {
      code,
      sido,
      sigungu: sg,
      displayName: display,
      label: `${sido} ${display}`,
    };
    flat.push(unit);
    return unit;
  });
  provinces.push({ code: SIDO_CODES[sido], name: sido, sigungu: sigunguList });
}

const header = `/** 전국 시·도 / 시·군·구 단위 지역 목록 (시설 데이터 기반 ${flat.length}개) */\n\n`;

const body = `export type KoreanSigunguUnit = {
  code: string;
  sido: string;
  sigungu: string;
  displayName: string;
  label: string;
};

export type KoreanProvince = {
  code: string;
  name: string;
  sigungu: KoreanSigunguUnit[];
};

export const KOREAN_PROVINCES: KoreanProvince[] = ${JSON.stringify(provinces, null, 2)};

export const KOREAN_SIGUNGU_UNITS: KoreanSigunguUnit[] = ${JSON.stringify(flat, null, 2)};
`;

const outPath = path.join(__dirname, '../src/constants/koreanRegions.ts');
fs.writeFileSync(outPath, header + body);
console.log('written', outPath, 'units', flat.length);
