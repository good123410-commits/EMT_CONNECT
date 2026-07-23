# KEMIX - Deploy resources stack (SQL migrations + Edge Function)
# Usage:
#   .\scripts\deploy-resources-stack.ps1
#   .\scripts\deploy-resources-stack.ps1 -AccessToken "sbp_..."

param(
    [string] $AccessToken = ''
)

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
. (Join-Path $PSScriptRoot '_supabase-common.ps1')
Initialize-KemixConsole
Ensure-KemixSupabaseAuth -AccessToken $AccessToken

Write-Host '=== 1/2 SQL migrations ===' -ForegroundColor Cyan
& (Join-Path $PSScriptRoot 'apply-pending-migrations.ps1') @PSBoundParameters
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ''
Write-Host '=== 2/2 Edge Function ===' -ForegroundColor Cyan
& (Join-Path $PSScriptRoot 'deploy-send-resource-email.ps1') @PSBoundParameters
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ''
Write-Host 'Resources stack deploy completed.' -ForegroundColor Green
