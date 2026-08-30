#Requires -Version 5.1
<#
  Windows 작업 스케줄러에 재난 전광판 동기화(기본 10분) 등록.
  safetydata 유치아이피가 등록된 이 PC(고정 공인 IP, 예: 1.214.117.34)에서 실행하세요.

  사용:
    .\scripts\register-disaster-ticker-task.ps1
    .\scripts\register-disaster-ticker-task.ps1 -IntervalMinutes 10
    .\scripts\register-disaster-ticker-task.ps1 -Unregister
#>
param(
  [switch]$Unregister,
  [ValidateRange(1, 1440)]
  [int] $IntervalMinutes = 10
)

$ErrorActionPreference = 'Stop'
$taskName = 'EMT-Connect-DisasterTickerSync'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$runnerScript = Join-Path $repoRoot 'scripts\run-disaster-ticker-sync.ps1'
$powershellExe = (Get-Command powershell -ErrorAction SilentlyContinue).Source

if (-not $powershellExe) {
  throw 'powershell 가 PATH에 없습니다.'
}

if ($Unregister) {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "작업 스케줄 제거: $taskName"
  exit 0
}

$action = New-ScheduledTaskAction `
  -Execute $powershellExe `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$runnerScript`"" `
  -WorkingDirectory $repoRoot

# RepetitionDuration 생략 시 Windows 작업 스케줄러가 무한 반복합니다.
# ([TimeSpan]::MaxValue 는 스케줄러 한도를 넘어 등록 오류가 납니다.)
$startAt = (Get-Date).AddMinutes(1)
$trigger = New-ScheduledTaskTrigger `
  -Once `
  -At $startAt `
  -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes)

$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -MultipleInstances IgnoreNew `
  -ExecutionTimeLimit ([TimeSpan]::Zero)

$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null

Write-Host "등록 완료: $taskName (${IntervalMinutes}분마다 실행, 무한 반복)"
Write-Host "  시작: $startAt"
Write-Host "  실행: $runnerScript"
Write-Host "  경로: $repoRoot"
Write-Host ""
Write-Host '사전 확인: .\scripts\run-disaster-ticker-sync.ps1 -Check'
Write-Host '즉시 테스트: .\scripts\run-disaster-ticker-sync.ps1 -DryRun'
Write-Host '제거: .\scripts\register-disaster-ticker-task.ps1 -Unregister'
