-- EMS_Connect: 응급처치 가이드 분류 테이블
-- Supabase Dashboard > SQL Editor 에 붙여넣고 실행하세요.

CREATE TABLE IF NOT EXISTS guide_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL DEFAULT 'medkit',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_guide_categories_name ON guide_categories (name);

ALTER TABLE guide_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guide_categories_public_read" ON guide_categories;
CREATE POLICY "guide_categories_public_read"
    ON guide_categories
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "guide_categories_public_insert" ON guide_categories;
CREATE POLICY "guide_categories_public_insert"
    ON guide_categories
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "guide_categories_public_delete" ON guide_categories;
CREATE POLICY "guide_categories_public_delete"
    ON guide_categories
    FOR DELETE
    USING (true);

COMMENT ON TABLE guide_categories IS '응급처치 가이드 분류 (이름 + 아이콘)';
COMMENT ON COLUMN guide_categories.name IS '분류명 (예: 화상, 기도폐쇄)';
COMMENT ON COLUMN guide_categories.icon IS 'Ionicons 아이콘 id (예: flame, heart)';

INSERT INTO guide_categories (name, icon) VALUES
    ('화상', 'flame'),
    ('기도폐쇄', 'body'),
    ('심정지', 'heart'),
    ('출혈', 'water'),
    ('골절', 'fitness'),
    ('저체온', 'snow')
ON CONFLICT (name) DO NOTHING;
