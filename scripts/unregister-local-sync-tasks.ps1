#Requires -Version 5.1
<#
  노트북(Windows)에 등록된 공공데이터/동기화 자동 실행을 모두 해제합니다.
  정기 동기화는 OCI systemd 타이머(deploy/oci)에서만 실행합니다.

  사용:
    .\scripts\unregister-local-sync-tasks.ps1
    .\scripts\unregister-local-sync-tasks.ps1 -StopRunningSyncProcesses
#>
param(
  [switch] $StopRunningSyncProcesses,
  [switch] $DeepScan
)

$ErrorActionPreference = 'Continue'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

$knownTaskNames = @(
  'EMT-Connect-DisasterTickerSync'
  'EMT_Connect-DisasterTickerSync'
  'KEMIX-DisasterTickerSync'
  'EMT-Connect-PharmacySync'
  'EMT-Connect-SyncPharmacies'
)

$taskNamePatterns = @(
  '*EMT*Connect*'
  '*Disaster*Ticker*'
  '*disaster*ticker*'
  '*sync*pharmac*'
  '*KEMIX*sync*'
)

Write-Host '=== 로컬 동기화 스케줄 해제 (OCI 전환) ===' -ForegroundColor Cyan

$removed = @()

foreach ($name in $knownTaskNames) {
  try {
    $existing = Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
    if ($existing) {
      Unregister-ScheduledTask -TaskName $name -Confirm:$false
      $removed += $name
      Write-Host "[removed] 작업 스케줄: $name" -ForegroundColor Green
    }
  } catch {
    Write-Host "[skip] $name — $($_.Exception.Message)" -ForegroundColor DarkGray
  }
}

if (-not $DeepScan) {
  Write-Host '(전체 작업 스캔은 -DeepScan 옵션)' -ForegroundColor DarkGray
}

if ($DeepScan) {
try {
  $allTasks = Get-ScheduledTask -ErrorAction SilentlyContinue
  foreach ($task in $allTasks) {
    $name = $task.TaskName
    $path = $task.TaskPath
    $full = "$path$name".TrimEnd('\')

    $matchPattern = $false
    foreach ($pattern in $taskNamePatterns) {
      if ($name -like $pattern) {
        $matchPattern = $true
        break
      }
    }

    $actions = ($task | Get-ScheduledTaskInfo -ErrorAction SilentlyContinue)
    $taskActions = Get-ScheduledTask -TaskName $name -TaskPath $path -ErrorAction SilentlyContinue |
      ForEach-Object { $_.Actions }

    $actionText = ($taskActions | ForEach-Object { "$($_.Execute) $($_.Arguments)" }) -join ' '
    $matchScript =
      ($actionText -match 'sync-disaster-ticker') -or
      ($actionText -match 'sync-midnight-pharmacies') -or
      ($actionText -match 'run-disaster-ticker-sync') -or
      ($actionText -match 'EMT_CONNECT') -or
      ($actionText -match 'EMT-Connect')

    if (-not $matchPattern -and -not $matchScript) {
      continue
    }

    if ($removed -contains $name) {
      continue
    }

    try {
      Unregister-ScheduledTask -TaskName $name -TaskPath $path -Confirm:$false
      $removed += $full
      Write-Host "[removed] 작업 스케줄: $full" -ForegroundColor Green
      Write-Host "          $actionText" -ForegroundColor DarkGray
    } catch {
      Write-Host "[fail] $full — $($_.Exception.Message)" -ForegroundColor Yellow
    }
  }
} catch {
  Write-Host "[warn] Get-ScheduledTask 실패: $($_.Exception.Message)" -ForegroundColor Yellow
}
}

# schtasks 레거시 이름 (Get-ScheduledTask 와 중복 가능)
foreach ($name in $knownTaskNames) {
  $query = schtasks /Query /TN $name 2>$null
  if ($LASTEXITCODE -eq 0) {
    schtasks /Delete /TN $name /F 2>$null | Out-Null
    if ($removed -notcontains $name) {
      $removed += $name
      Write-Host "[removed] schtasks: $name" -ForegroundColor Green
    }
  }
}

$startupFolders = @(
  [Environment]::GetFolderPath('Startup')
  "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\StartUp"
)

foreach ($folder in $startupFolders) {
  if (-not (Test-Path -LiteralPath $folder)) { continue }
  Get-ChildItem -LiteralPath $folder -ErrorAction SilentlyContinue | ForEach-Object {
    $content = ''
    try {
      if ($_.Extension -eq '.ps1') {
        $content = Get-Content -LiteralPath $_.FullName -Raw -ErrorAction SilentlyContinue
      } elseif ($_.Extension -in '.bat', '.cmd', '.vbs') {
        $content = Get-Content -LiteralPath $_.FullName -Raw -ErrorAction SilentlyContinue
      }
    } catch {
      return
    }

    if ($content -match 'sync-disaster-ticker|run-disaster-ticker-sync|sync-midnight-pharmacies') {
      Write-Host "[warn] 시작 프로그램 후보: $($_.FullName)" -ForegroundColor Yellow
      Write-Host '       수동 삭제 또는 이름 변경 후 재부팅을 권장합니다.' -ForegroundColor Yellow
    }
  }
}

if ($StopRunningSyncProcesses) {
  Write-Host '=== 실행 중인 sync 프로세스 종료 시도 ===' -ForegroundColor Cyan
  $repoRootEscaped = [regex]::Escape($repoRoot)
  Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue | ForEach-Object {
    $cmd = $_.CommandLine
    if (-not $cmd) { return }
    if ($cmd -notmatch 'sync-disaster-ticker|sync-midnight-pharmacies') { return }
    if ($cmd -notmatch $repoRootEscaped) { return }
    try {
      Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop
      Write-Host "[stopped] PID $($_.ProcessId)" -ForegroundColor Green
    } catch {
      Write-Host "[fail] PID $($_.ProcessId) — $($_.Exception.Message)" -ForegroundColor Yellow
    }
  }
}

Write-Host ''
if ($removed.Count -eq 0) {
  Write-Host '등록된 로컬 동기화 작업 스케줄을 찾지 못했습니다 (이미 해제됐을 수 있음).' -ForegroundColor DarkGray
} else {
  Write-Host "제거한 작업 $($removed.Count)건:" -ForegroundColor Green
  $removed | ForEach-Object { Write-Host "  - $_" }
}

Write-Host ''
Write-Host '정기 동기화: OCI systemd (deploy/oci/README.md)' -ForegroundColor Cyan
Write-Host '수동 1회 테스트만 로컬에서: npm run sync:disaster-ticker:check' -ForegroundColor DarkGray
