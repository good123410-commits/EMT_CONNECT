-- v49 GRANT 실패 복구: admin_get_user_activity 등 v4 관리자 RPC 누락 시
-- v49 전체 재실행이 어려울 때 이 파일만 실행해도 됩니다.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs (actor_id);

CREATE OR REPLACE FUNCTION public.write_audit_log(
  p_action TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, details)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id, COALESCE(p_details, '{}'::jsonb))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_user_activity(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_questions JSONB := '[]'::jsonb;
  v_posts JSONB := '[]'::jsonb;
  v_answers JSONB := '[]'::jsonb;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  IF to_regclass('public.questions') IS NOT NULL THEN
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', q.id,
          'title', q.title,
          'status', q.status,
          'created_at', q.created_at
        )
        ORDER BY q.created_at DESC
      ),
      '[]'::jsonb
    )
    INTO v_questions
    FROM public.questions q
    WHERE q.user_id = p_user_id;
  END IF;

  IF to_regclass('public.hidden_posts') IS NOT NULL THEN
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', hp.id,
          'title', hp.title,
          'target_role', hp.target_role,
          'created_at', hp.created_at
        )
        ORDER BY hp.created_at DESC
      ),
      '[]'::jsonb
    )
    INTO v_posts
    FROM public.hidden_posts hp
    WHERE hp.author_id = p_user_id;
  END IF;

  IF to_regclass('public.answers') IS NOT NULL THEN
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'question_id', a.question_id,
          'created_at', a.created_at
        )
        ORDER BY a.created_at DESC
      ),
      '[]'::jsonb
    )
    INTO v_answers
    FROM public.answers a
    WHERE a.paramedic_id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'questions', v_questions,
    'posts', v_posts,
    'answers', v_answers
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_blocked(
  p_user_id UUID,
  p_blocked BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS public.user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.user_profiles;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot_block_self';
  END IF;

  UPDATE public.user_profiles
  SET is_blocked = p_blocked
  WHERE id = p_user_id
  RETURNING * INTO v_profile;

  IF v_profile.id IS NULL THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  PERFORM public.write_audit_log(
    CASE WHEN p_blocked THEN 'user_blocked' ELSE 'user_unblocked' END,
    'user',
    p_user_id::text,
    jsonb_build_object('reason', p_reason)
  );

  RETURN v_profile;
END;
$$;

CREATE TABLE IF NOT EXISTS public.emt_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  document_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE OR REPLACE FUNCTION public.admin_list_pending_verifications()
RETURNS SETOF public.emt_verifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  RETURN QUERY
  SELECT ev.*
  FROM public.emt_verifications ev
  WHERE ev.status = 'pending'
  ORDER BY ev.updated_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_user_activity(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_blocked(UUID, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_pending_verifications() TO authenticated;
