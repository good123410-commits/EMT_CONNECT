# KEMIX - Apply pending Supabase SQL migrations (remote)
# Usage:
#   .\scripts\apply-pending-migrations.ps1
#   .\scripts\apply-pending-migrations.ps1 -AccessToken "sbp_..."

param(
    [string] $AccessToken = '',
    [string[]] $Files = @(
        'supabase\migration_v45_kemix_members_fund_usage.sql',
        'supabase\migration_v46_kemix_resources_download.sql'
    )
)

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
. (Join-Path $PSScriptRoot '_supabase-common.ps1')
Initialize-KemixConsole
Ensure-KemixSupabaseAuth -AccessToken $AccessToken
Ensure-KemixSupabaseLinked

foreach ($file in $Files) {
    Invoke-KemixSupabaseDbFile -RelativePath $file
}

Write-Host ''
Write-Host 'All migrations applied.' -ForegroundColor Green
