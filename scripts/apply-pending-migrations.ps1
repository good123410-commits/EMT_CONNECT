# KEMIX - Apply pending Supabase SQL migrations (remote)
# Usage:
#   .\scripts\apply-pending-migrations.ps1
#   .\scripts\apply-pending-migrations.ps1 -AccessToken "sbp_..."

param(
    [string] $AccessToken = '',
    [string[]] $Files = @(
        'supabase\migration_v45_kemix_members_fund_usage.sql',
        'supabase\migration_v46_kemix_resources_download.sql',
        'supabase\migration_v47_qa_board_rbac.sql',
        'supabase\migration_v48_admin_upsert_resource_fix.sql',
        'supabase\migration_v49_membership_rbac.sql',
        'supabase\migration_v50_admin_rpc_fix.sql',
        'supabase\migration_v51_kemix_resources_storage_fix.sql'
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
