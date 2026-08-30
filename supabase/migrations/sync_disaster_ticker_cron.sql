-- 재난 전광판 Edge Function 30분 주기 호출 (pg_cron + pg_net)
--
-- 선행 조건
-- 1) Dashboard → Database → Extensions 에서 pg_cron, pg_net 활성화
-- 2) Edge Function 배포: scripts/deploy-sync-disaster-ticker.ps1
-- 3) Edge Function Secrets 등록:
--      SAFETYDATA_SERVICE_KEY_WEATHER
--      SAFETYDATA_SERVICE_KEY_FOREST
--      SAFETYDATA_SERVICE_KEY_DISASTER
--      DISASTER_TICKER_CRON_SECRET  (임의의 긴 문자열 — 아래 cron 호출에 사용)
-- 4) Vault 시크릿 등록 (SQL Editor):
--      SELECT vault.create_secret(
--        'https://cdkyoeskhrwrpxgbmpqu.supabase.co/functions/v1/sync-disaster-ticker',
--        'disaster_ticker_function_url',
--        'Disaster ticker Edge Function URL'
--      );
--      SELECT vault.create_secret(
--        '<DISASTER_TICKER_CRON_SECRET 값>',
--        'disaster_ticker_cron_secret',
--        'Cron header x-cron-secret for sync-disaster-ticker'
--      );
--
-- safetydata.go.kr 유치아이피: Edge Function egress IP를 포털에 등록해야 합니다.
-- (GitHub Actions / 로컬 PC IP가 아닌 Supabase 서버에서 나가는 IP)

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$
DECLARE
  v_job_id BIGINT;
BEGIN
  SELECT jobid
  INTO v_job_id
  FROM cron.job
  WHERE jobname = 'sync-disaster-ticker';

  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;
END $$;

SELECT cron.schedule(
  'sync-disaster-ticker',
  '*/30 * * * *',
  $cron$
  SELECT net.http_post(
    url := (
      SELECT decrypted_secret
      FROM vault.decrypted_secrets
      WHERE name = 'disaster_ticker_function_url'
      LIMIT 1
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'disaster_ticker_cron_secret'
        LIMIT 1
      )
    ),
    body := jsonb_build_object(
      'triggered_at', timezone('utc', now())::text,
      'source', 'pg_cron'
    ),
    timeout_milliseconds := 120000
  ) AS request_id;
  $cron$
);

-- 수동 테스트 (Vault 시크릿 등록 후):
-- SELECT net.http_post(
--   url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'disaster_ticker_function_url' LIMIT 1) || '?dry_run=true',
--   headers := jsonb_build_object(
--     'Content-Type', 'application/json',
--     'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'disaster_ticker_cron_secret' LIMIT 1)
--   ),
--   body := '{"manual": true}'::jsonb
-- );
