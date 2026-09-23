#Requires -Version 5.1
<#
  [비활성] Windows 작업 스케줄러 등록은 더 이상 지원하지 않습니다.
  정기 동기화는 OCI systemd 타이머(deploy/oci)에서 실행합니다.

  로컬 스케줄 제거:
    .\scripts\unregister-local-sync-tasks.ps1

  (하위 호환) -Unregister 도 동일 스크립트로 위임합니다.
#>
param(
  [switch] $Unregister,
  [int] $IntervalMinutes = 10
)

if ($PSBoundParameters.ContainsKey('IntervalMinutes') -and -not $Unregister) {
  Write-Host '[deprecated] 로컬 10분 스케줄 등록은 중단되었습니다. OCI systemd 를 사용하세요.' -ForegroundColor Yellow
  Write-Host '  deploy/oci/README.md' -ForegroundColor DarkGray
  exit 1
}

& (Join-Path $PSScriptRoot 'unregister-local-sync-tasks.ps1') -StopRunningSyncProcesses
exit $LASTEXITCODE
