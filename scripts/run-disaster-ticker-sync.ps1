#Requires -Version 5.1
<#
  재난 전광판 API → Supabase 동기화 (로컬 1회 실행)
  .env 에 SAFETYDATA_* / SUPABASE_* 가 설정되어 있어야 합니다.
  safetydata 유치아이피: 이 PC 공인 IP(예: 1.214.117.34)와 포털 등록값이 일치해야 합니다.

  사용:
    .\scripts\run-disaster-ticker-sync.ps1 -Check
    .\scripts\run-disaster-ticker-sync.ps1 -DryRun
    .\scripts\run-disaster-ticker-sync.ps1
#>
param(
  [switch]$DryRun,
  [switch]$Check
)

$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $repoRoot

$envFile = Join-Path $repoRoot '.env'
if (-not (Test-Path $envFile)) {
  Write-Host '[WARN] .env 파일이 없습니다. 환경 변수를 직접 설정했는지 확인하세요.' -ForegroundColor Yellow
  Write-Host '       참고: .env.example' -ForegroundColor DarkGray
}

$nodeArgs = @('scripts/sync-disaster-ticker.mjs')
if ($Check) {
  $nodeArgs += '--check'
} elseif ($DryRun) {
  $nodeArgs += '--dry-run'
}

Write-Host "실행: node $($nodeArgs -join ' ')" -ForegroundColor Cyan
& node @nodeArgs
exit $LASTEXITCODE
