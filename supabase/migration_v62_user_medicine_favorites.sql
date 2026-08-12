-- 약물정보찾기: 유저 즐겨찾기 (user_favorites)

CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_seq TEXT NOT NULL,
  item_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT user_favorites_item_seq_nonempty CHECK (char_length(item_seq) >= 1),
  UNIQUE (user_id, item_seq)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_created
  ON public.user_favorites (user_id, created_at DESC);

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_favorites_own_select" ON public.user_favorites;
CREATE POLICY "user_favorites_own_select"
  ON public.user_favorites
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_favorites_own_insert" ON public.user_favorites;
CREATE POLICY "user_favorites_own_insert"
  ON public.user_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_favorites_own_delete" ON public.user_favorites;
CREATE POLICY "user_favorites_own_delete"
  ON public.user_favorites
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
