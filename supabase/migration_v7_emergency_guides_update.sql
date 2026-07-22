-- 가이드 수정(UPDATE) RLS — authenticated + anon(가이드 비밀코드만 쓰는 경우) 모두 허용
DROP POLICY IF EXISTS "emergency_guides_authenticated_update" ON public.emergency_guides;
CREATE POLICY "emergency_guides_authenticated_update"
    ON public.emergency_guides
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "emergency_guides_public_update" ON public.emergency_guides;
CREATE POLICY "emergency_guides_public_update"
    ON public.emergency_guides
    FOR UPDATE
    USING (true)
    WITH CHECK (true);
