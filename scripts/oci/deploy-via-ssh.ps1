#Requires -Version 5.1
<#
  OCI 서버에 SSH로 remote-update.sh 실행 (git pull + npm ci + systemd)

  사용:
    .\scripts\oci\deploy-via-ssh.ps1 -SshKeyPath "$env:USERPROFILE\.ssh\oci_emt_connect"
    .\scripts\oci\deploy-via-ssh.ps1 -SshHost 132.145.126.224 -User opc -SshKeyPath "C:\keys\oci.pem"
#>
param(
  [string] $SshHost = '132.145.126.224',
  [string] $User = 'opc',
  [Parameter(Mandatory = $true)]
  [string] $SshKeyPath,
  [string] $AppDir = '/opt/emt-connect',
  [switch] $SkipSystemd
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $SshKeyPath)) {
  throw "SSH 키 파일을 찾을 수 없습니다: $SshKeyPath"
}

$ssh = Get-Command ssh -ErrorAction SilentlyContinue
if (-not $ssh) {
  throw 'OpenSSH 클라이언트(ssh)가 PATH에 없습니다. Windows 설정 → 선택적 기능 → OpenSSH Client'
}

$remoteScript = if ($SkipSystemd) {
  @"
set -euo pipefail
cd '$AppDir'
git fetch origin && git pull --ff-only origin main
npm ci
echo '[deploy] SkipSystemd — systemd 재등록 생략'
"@
} else {
  "cd '$AppDir' && bash deploy/oci/remote-update.sh"
}

Write-Host "배포 대상: ${User}@${SshHost}:${AppDir}" -ForegroundColor Cyan

& ssh.exe -i $SshKeyPath -o StrictHostKeyChecking=accept-new "${User}@${SshHost}" $remoteScript
exit $LASTEXITCODE
