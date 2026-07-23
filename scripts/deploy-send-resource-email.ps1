# KEMIX - Deploy send-resource-email Edge Function
# Usage:
#   .\scripts\deploy-send-resource-email.ps1
#   .\scripts\deploy-send-resource-email.ps1 -AccessToken "sbp_..."

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
Write-Host '  RESEND_API_KEY      - Resend API key (same as invitation email)'
Write-Host '  RESOURCE_EMAIL_FROM - optional, e.g. KEMIX <noreply@yourdomain.com>'
Write-Host ''

Write-Host 'Deploying: send-resource-email ...' -ForegroundColor Cyan
npx supabase functions deploy send-resource-email --no-verify-jwt
if ($LASTEXITCODE -ne 0) {
    Write-Host '[ERROR] Function deploy failed.' -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ''
Write-Host 'Done. Test email share from Resources page.' -ForegroundColor Green
