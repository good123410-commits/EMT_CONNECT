# EMS Connect — 재난 전광판 Edge Function 시크릿 등록
# 대시보드: https://supabase.com/dashboard/project/cdkyoeskhrwrpxgbmpqu/settings/functions

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

$projectRef = 'cdkyoeskhrwrpxgbmpqu'

Write-Host "Supabase 프로젝트: $projectRef" -ForegroundColor Cyan
Write-Host '먼저 로그인이 필요하면: npx supabase login' -ForegroundColor Yellow
Write-Host ''

function Read-RequiredSecret {
    param([string] $Label)
    $value = Read-Host $Label
    if (-not $value -or -not $value.Trim()) {
        throw "$Label 가 비어 있습니다."
    }
    return $value.Trim()
}

$weather = Read-RequiredSecret 'SAFETYDATA_SERVICE_KEY_WEATHER'
$forest = Read-RequiredSecret 'SAFETYDATA_SERVICE_KEY_FOREST'
$disaster = Read-RequiredSecret 'SAFETYDATA_SERVICE_KEY_DISASTER'
$cronSecret = Read-RequiredSecret 'DISASTER_TICKER_CRON_SECRET (pg_cron용 임의 문자열)'

npx supabase secrets set --project-ref $projectRef `
    "SAFETYDATA_SERVICE_KEY_WEATHER=$weather" `
    "SAFETYDATA_SERVICE_KEY_FOREST=$forest" `
    "SAFETYDATA_SERVICE_KEY_DISASTER=$disaster" `
    "DISASTER_TICKER_CRON_SECRET=$cronSecret"

Write-Host ''
Write-Host '시크릿 등록 완료. 1~2분 후 deploy-sync-disaster-ticker.ps1 로 배포하세요.' -ForegroundColor Green
Write-Host 'Vault(pg_cron): disaster_ticker_cron_secret 에 동일한 DISASTER_TICKER_CRON_SECRET 값을 등록하세요.' -ForegroundColor Yellow
