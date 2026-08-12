-- E-Gen 심야약국 주간 운영시간 (GitHub Actions 일일 동기화)
CREATE TABLE IF NOT EXISTS public.night_pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_normalized TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  road_address TEXT,
  lot_address TEXT,
  weekly_hours JSONB NOT NULL DEFAULT '[]'::jsonb,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  source TEXT NOT NULL DEFAULT 'egen_csv'
);

CREATE INDEX IF NOT EXISTS idx_night_pharmacies_name ON public.night_pharmacies (name);
CREATE INDEX IF NOT EXISTS idx_night_pharmacies_synced_at ON public.night_pharmacies (synced_at DESC);

ALTER TABLE public.night_pharmacies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "night_pharmacies_public_read" ON public.night_pharmacies;
CREATE POLICY "night_pharmacies_public_read" ON public.night_pharmacies
  FOR SELECT USING (true);

COMMENT ON TABLE public.night_pharmacies IS 'E-Gen 심야약국 CSV 동기화 — phone_normalized 기준 주간 운영시간';
COMMENT ON COLUMN public.night_pharmacies.weekly_hours IS '[월,화,수,목,금,토,일,공휴일] e.g. "09:00~23:30"';
