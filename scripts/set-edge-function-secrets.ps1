# EMS Connect — Edge Function 시크릿만 등록 (초대 메일)
# Resend 키: https://resend.com/api-keys  (re_ 로 시작)
# 대시보드: https://supabase.com/dashboard/project/cdkyoeskhrwrpxgbmpqu/settings/functions

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$projectRef = "cdkyoeskhrwrpxgbmpqu"

Write-Host "Supabase 프로젝트: $projectRef" -ForegroundColor Cyan
Write-Host "먼저 로그인이 필요하면: npx supabase login" -ForegroundColor Yellow
Write-Host ""

$resend = Read-Host "RESEND_API_KEY (re_...)"
if (-not $resend -or -not $resend.Trim()) {
  Write-Host "키가 비어 있어 종료합니다." -ForegroundColor Red
  exit 1
}

npx supabase secrets set --project-ref $projectRef "RESEND_API_KEY=$($resend.Trim())"

$from = Read-Host "INVITE_EMAIL_FROM (Enter=기본 onboarding@resend.dev 사용)"
if ($from -and $from.Trim()) {
  npx supabase secrets set --project-ref $projectRef "INVITE_EMAIL_FROM=$($from.Trim())"
}

Write-Host ""
Write-Host "시크릿 등록 완료. 1~2분 후 앱에서 이메일 전송을 다시 시도하세요." -ForegroundColor Green
Write-Host "테스트 계정은 Resend에서 본인 이메일로만 발송될 수 있습니다 (onboarding@resend.dev 사용 시)." -ForegroundColor Yellow
