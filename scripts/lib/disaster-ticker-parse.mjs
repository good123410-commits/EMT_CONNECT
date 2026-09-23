/** 전광판 소스별 최대 저장 건수 */
export const MAX_TICKER_ITEMS_PER_SOURCE = 10;

/** 파싱 실패·중복 제거 후에도 maxItems를 채우기 위한 API 요청 버퍼 */
export const FETCH_ROW_BUFFER = 20;

const WEATHER_WARNING_TYPES = {
  W: '강풍',
  R: '호우',
  C: '한파',
  D: '건조',
  O: '해일',
  N: '지진해일',
  V: '풍랑',
  T: '태풍',
  S: '대설',
  Y: '황사',
  H: '폭염',
  F: '안개',
};

const WEATHER_WARNING_LEVELS = {
  1: '예비특보',
  2: '주의보',
  3: '경보',
};

export function pickString(record, keys) {
  if (!record || typeof record !== 'object') return '';

  for (const key of keys) {
    const raw = record[key];
    if (typeof raw === 'string' && raw.trim()) return raw.trim();
    if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw);
  }

  const entries = Object.entries(record);
  for (const key of keys) {
    const lower = key.toLowerCase();
    for (const [entryKey, value] of entries) {
      if (entryKey.toLowerCase() !== lower) continue;
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    }
  }

  return '';
}

function collapseText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function firstMeaningfulLine(value) {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.replace(/^[o○•\-]\s*/, '').trim())
    .filter(Boolean);
  return lines[0] ?? collapseText(value);
}

function composeWeatherWarningText(record) {
  const direct = pickString(record, [
    'TTL',
    'ttl',
    'PRSNTN_CN',
    'prsntnCn',
    'WRN_MSG',
    'wrnMsg',
    'SPCL_WRN',
    'spclWrn',
    'WRN',
    'WRN_KO',
    'wrnKo',
    'T1',
    'T2',
    'TITLE',
    'SUBJECT',
    'MSG_CN',
    'msgCn',
    'CONTENT',
    'content',
    'WRN_CN',
    'wrnCn',
  ]);
  if (direct) return collapseText(direct);

  const bulletin = pickString(record, ['SPNE_FRMNT_PRCON_CN', 'spneFrmntPrconCn']);
  if (bulletin) return firstMeaningfulLine(bulletin);

  const typeCode = pickString(record, ['WRN_TP', 'wrnTp']);
  const levelCode = pickString(record, ['WRN_LVL', 'wrnLvl']);
  const typeName = WEATHER_WARNING_TYPES[typeCode] ?? typeCode;
  const levelName = WEATHER_WARNING_LEVELS[levelCode] ?? '';

  if (!typeName && !levelName) return '';
  if (typeName && levelName) return `${typeName}${levelName}`;
  return typeName || levelName;
}

function composeForestFireText(record) {
  const direct = pickString(record, [
    'FRSTFR_GRNDS_OPER_RSLT',
    'frstfrGrndsOperRslt',
    'FTRXTNGSH_ACTN_MTTR',
    'ftrxtngshActnMttr',
    'FRSTFR_OCRN_HONU_NM',
    'frstfrOcrnHonuNm',
    'FRFR_STT_CN',
    'frfrSttCn',
    'FRFR_INFO',
    'frfrInfo',
    'MSG_CN',
    'msgCn',
    'MSG',
    'msg',
    'CONTENT',
    'content',
    'TITLE',
    'title',
  ]);
  if (direct) return collapseText(direct);

  const status = pickString(record, [
    'frfrPrgrsStcdNm',
    'FRFR_PRGRS_STCD_NM',
    'FRFR_STEP_NM',
    'frfrStepIssuNm',
    'FRFR_STEP_ISSU_NM',
    'STATUS',
    'status',
  ]);
  const rate = pickString(record, ['frfrPotfrRt', 'FRFR_POTFR_RT']);
  const ignitedAt = pickString(record, ['FRSTFR_GNT_DT', 'frstfrGntDt']);
  const parts = [];
  if (status) parts.push(status);
  if (rate) parts.push(`진화율 ${rate}%`);
  if (parts.length === 0 && ignitedAt) parts.push(`산불 발생 ${collapseText(ignitedAt)}`);
  return parts.join(' ');
}

export function isJunkSyncedMessage(message) {
  const text = message.replace(/\s+/g, ' ').trim();
  if (!text || text.length < 8) return true;
  if (/^\d{4}[-./]\d{1,2}[-./]\d{1,2}(?:일)?$/.test(text)) return true;
  if (/^\d{8,14}$/.test(text)) return true;
  if (/^[\d\s·.,:/-]+$/.test(text)) return true;
  return false;
}

export function extractMessagesFromRecord(record, sourceCode) {
  if (sourceCode === 'weather') {
    const message = composeWeatherWarningText(record);
    const region = pickString(record, [
      'RLVT_ZONE',
      'rlvtZone',
      'SPNE_FRMNT_TM_TXT',
      'spneFrmntTmTxt',
      'STN_KO',
      'stnKo',
      'STN_NM',
      'stnNm',
      'REG_KO',
      'regKo',
      'REG_NAME',
      'regName',
      'AREA_NAME',
      'areaName',
      'REG_ID',
      'regId',
    ]);
    if (!message) return '';
    return [region, message].filter(Boolean).join(' · ');
  }

  if (sourceCode === 'forest_fire') {
    const message = composeForestFireText(record);
    const region = pickString(record, [
      'FRSTFR_DCLR_ADDR',
      'frstfrDclrAddr',
      'FRSTFR_GNT_PLC',
      'frstfrGntPlc',
      'frfrSttmnAddr',
      'FRFR_STTMN_ADDR',
      'frfrSttmnAddrDe',
      'FRFR_STTMN_ADDR_DE',
      'ADDR',
      'addr',
      'ADDR_NM',
      'addrNm',
      'AREA_NM',
      'areaNm',
      'SGG_NM',
      'sggNm',
      'FRFR_LCTN',
      'frfrLctn',
    ]);
    if (!message && !region) return '';
    return [region, message].filter(Boolean).join(' · ');
  }

  if (sourceCode === 'disaster_sms') {
    const message = pickString(record, [
      'MSG_CN',
      'msgCn',
      'MSG',
      'msg',
      'MSG_CONTENT',
      'msgContent',
      'EMRG_MSG',
      'emrgMsg',
      'DST_MSG',
      'dstMsg',
      'CONTENT',
      'content',
      'CN',
      'cn',
    ]);
    const region = pickString(record, [
      'RCPTN_RGN_NM',
      'rcptnRgnNm',
      'DST_SE_NM',
      'dstSeNm',
      'AREA_NAME',
      'areaName',
      'SGG_NM',
      'sggNm',
      'EMRG_AREA',
      'emrgArea',
    ]);
    if (!message) return '';
    return region ? `${region} · ${message}` : message;
  }

  return pickString(record, ['MSG_CN', 'msgCn', 'MSG', 'msg', 'CONTENT', 'content', 'TITLE', 'title']);
}
