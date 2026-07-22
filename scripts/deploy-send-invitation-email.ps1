# EMS Connect — 초대 메일 Edge Function 배포
# 사전: supabase login 후 이 폴더의 상위(프로젝트 루트)에서 실행

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

Write-Host "프로젝트 연결 확인 (project_id: cdkyoeskhrwrpxgbmpqu)..." -ForegroundColor Cyan
npx supabase link --project-ref cdkyoeskhrwrpxgbmpqu

Write-Host ""
Write-Host "시크릿이 없으면 Dashboard > Edge Functions > Secrets 에서 설정하세요:" -ForegroundColor Yellow
Write-Host "  RESEND_API_KEY     — https://resend.com API 키"
Write-Host "  INVITE_EMAIL_FROM  — 예: EMS Connect <onboarding@resend.dev> (도메인 인증 후 변경)"
Write-Host ""

$setSecrets = Read-Host "지금 RESEND_API_KEY를 CLI로 등록할까요? (y/N)"
if ($setSecrets -eq "y" -or $setSecrets -eq "Y") {
  $key = Read-Host "RESEND_API_KEY 값 입력"
  if ($key) {
    npx supabase secrets set "RESEND_API_KEY=$key"
  }
}

Write-Host "함수 배포 중: send-invitation-email ..." -ForegroundColor Cyan
npx supabase functions deploy send-invitation-email --no-verify-jwt:$false

Write-Host ""
Write-Host "완료. 브라우저에서 인증/초대 탭 이메일 전송을 다시 시도하세요." -ForegroundColor Green
