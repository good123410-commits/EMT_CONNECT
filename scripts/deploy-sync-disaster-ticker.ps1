# KEMIX - Deploy sync-disaster-ticker Edge Function + secrets guide
# Usage:
#   .\scripts\deploy-sync-disaster-ticker.ps1
#   .\scripts\deploy-sync-disaster-ticker.ps1 -AccessToken "sbp_..."

param(
    [string] $AccessToken = ''
)

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
. (Join-Path $PSScriptRoot '_supabase-common.ps1')
Initialize-KemixConsole
Ensure-KemixSupabaseAuth -AccessToken $AccessToken
Ensure-KemixSupabaseLinked

Write-Host ''
Write-Host 'Edge Function secrets (Dashboard > Edge Functions > Secrets):' -ForegroundColor Yellow
Write-Host '  SAFETYDATA_SERVICE_KEY_WEATHER'
Write-Host '  SAFETYDATA_SERVICE_KEY_FOREST'
Write-Host '  SAFETYDATA_SERVICE_KEY_DISASTER'
Write-Host '  DISASTER_TICKER_CRON_SECRET  (pg_cron x-cron-secret, 임의 문자열)'
Write-Host ''
Write-Host 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 는 배포 시 자동 주입됩니다.' -ForegroundColor DarkGray
Write-Host ''
Write-Host 'safetydata.go.kr 유치아이피: Supabase Edge Function egress IP 로 등록하세요.' -ForegroundColor Yellow
Write-Host '배포 후 dry-run 테스트:' -ForegroundColor Yellow
Write-Host '  curl -X POST "https://cdkyoeskhrwrpxgbmpqu.supabase.co/functions/v1/sync-disaster-ticker?dry_run=true" \'
Write-Host '    -H "x-cron-secret: <DISASTER_TICKER_CRON_SECRET>"'
Write-Host ''
Write-Host 'pg_cron 등록: supabase/migrations/sync_disaster_ticker_cron.sql (SQL Editor)' -ForegroundColor Yellow
Write-Host ''

Write-Host 'Deploying: sync-disaster-ticker ...' -ForegroundColor Cyan
npx supabase functions deploy sync-disaster-ticker --no-verify-jwt
if ($LASTEXITCODE -ne 0) {
    Write-Host '[ERROR] Function deploy failed.' -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ''
Write-Host 'Done. Register pg_cron SQL and safetydata portal IP next.' -ForegroundColor Green
