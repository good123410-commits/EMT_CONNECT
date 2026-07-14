-- EMS_Connect: 생활응급처치 가이드 테이블
-- Supabase Dashboard > SQL Editor 에 붙여넣고 실행하세요.

CREATE TABLE IF NOT EXISTS emergency_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 기존 steps/precautions 스키마에서 마이그레이션하는 경우
ALTER TABLE emergency_guides ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE emergency_guides ADD COLUMN IF NOT EXISTS steps TEXT;
ALTER TABLE emergency_guides ADD COLUMN IF NOT EXISTS precautions TEXT;

UPDATE emergency_guides
SET content = TRIM(
    CONCAT_WS(
        E'\n\n',
        NULLIF(TRIM(steps), ''),
        CASE
            WHEN precautions IS NOT NULL AND TRIM(precautions) <> ''
            THEN '주의사항:' || E'\n' || TRIM(precautions)
            ELSE NULL
        END
    )
)
WHERE (content IS NULL OR TRIM(content) = '')
  AND (steps IS NOT NULL OR precautions IS NOT NULL);

ALTER TABLE emergency_guides ADD COLUMN IF NOT EXISTS severity TEXT;
ALTER TABLE emergency_guides ADD COLUMN IF NOT EXISTS font_id TEXT;
ALTER TABLE emergency_guides ADD COLUMN IF NOT EXISTS font_size INTEGER;

UPDATE emergency_guides
SET severity = CASE
    WHEN category IN ('기도폐쇄', '심정지', '출혈') THEN 'critical'
    WHEN category IN ('골절', '저체온') THEN 'urgent'
    ELSE 'moderate'
END
WHERE severity IS NULL OR TRIM(severity) = '';

CREATE INDEX IF NOT EXISTS idx_emergency_guides_severity ON emergency_guides (severity);
CREATE INDEX IF NOT EXISTS idx_emergency_guides_category ON emergency_guides (category);
CREATE INDEX IF NOT EXISTS idx_emergency_guides_title ON emergency_guides (title);
CREATE INDEX IF NOT EXISTS idx_emergency_guides_created_at ON emergency_guides (created_at DESC);

ALTER TABLE emergency_guides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "emergency_guides_public_read" ON emergency_guides;
CREATE POLICY "emergency_guides_public_read"
    ON emergency_guides
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "emergency_guides_authenticated_insert" ON emergency_guides;
CREATE POLICY "emergency_guides_authenticated_insert"
    ON emergency_guides
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

COMMENT ON TABLE emergency_guides IS '생활응급처치 가이드 (모바일 앱 + 관리자 작성)';
COMMENT ON COLUMN emergency_guides.title IS '가이드 제목';
COMMENT ON COLUMN emergency_guides.content IS '본문 (단계/주의사항 포함)';
COMMENT ON COLUMN emergency_guides.category IS '분류 (예: 화상, 기도폐쇄, 출혈)';
DROP POLICY IF EXISTS "emergency_guides_authenticated_delete" ON emergency_guides;
CREATE POLICY "emergency_guides_authenticated_delete"
    ON emergency_guides
    FOR DELETE
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "emergency_guides_public_delete" ON emergency_guides;
CREATE POLICY "emergency_guides_public_delete"
    ON emergency_guides
    FOR DELETE
    USING (true);

COMMENT ON COLUMN emergency_guides.severity IS '응급 등급: critical(긴급), urgent(응급), moderate(일반)';
COMMENT ON COLUMN emergency_guides.font_id IS '글꼴 id (guideFonts.ts 참조, 예: pretendard, noto-sans-kr)';
COMMENT ON COLUMN emergency_guides.font_size IS '본문 글자 크기(px), 기본 16';

-- Realtime 구독 활성화 (Dashboard > Database > Replication 에서 emergency_guides 체크)
-- ALTER PUBLICATION supabase_realtime ADD TABLE emergency_guides;

INSERT INTO emergency_guides (category, title, content) VALUES
(
    '화상',
    '열 화상 · 끓는 물 화상',
    '1. 즉시 119에 신고하고 환자를 안전한 장소로 이동합니다.
2. 화상 부위의 옷을 억지로 떼지 말고, 흐르는 찬물(약 15~20°C)에 20분 이상 식힙니다.
3. 화상 부위를 깨끗한 거즈나 멸균 드레싱으로 가볍게 덮습니다.
4. 환자를 따뜻하게 유지하고 의식·호흡 상태를 계속 관찰합니다.
5. 병원 이송 시 화상 부위를 심장보다 높게 두고 이동합니다.

주의사항:
버터·치약·소주 등 민간요법을 바르지 마세요.
얼음을 직접 대면 조직 손상이 악화될 수 있습니다.
2도 이상 화상, 얼굴·손·발·회음부 화상은 반드시 병원 치료가 필요합니다.'
),
(
    '기도폐쇄',
    '성인 기도폐쇄 (하임리히)',
    '1. 환자가 말을 못하고 손으로 목을 잡으면 기도폐쇄를 의심합니다.
2. 119에 신고하고 환자 뒤에 서서 한쪽 다리를 사이에 둡니다.
3. 한 주먹을 배꼽 위 명치 아래에 두고 다른 손으로 감싸 세게 위·안쪽으로 5회 밀어 올립니다.
4. 이물질이 나오지 않으면 5회 압박을 반복합니다.
5. 의식을 잃으면 바로 바닥에 눕히고 CPR을 시작합니다.

주의사항:
임산부·비만 환자는 가슴부 압박을 고려합니다.
이미 기침이 가능하면 억지로 밀어 올리지 말고 기침을 유도합니다.'
);
