# Expo Go 실기기 연결 — LAN IP로 Metro 시작 (Windows)
# 같은 Wi-Fi + 방화벽에서 Node/8081 허용 필요. 안 되면: npm run start:tunnel

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

node scripts/ensure-expo-lan.mjs

$lanIp = (
  Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
      $_.IPAddress -notmatch '^127\.' -and
      $_.IPAddress -notmatch '^169\.254\.'
    } |
    Select-Object -First 1 -ExpandProperty IPAddress
)

if ($lanIp) {
  $env:REACT_NATIVE_PACKAGER_HOSTNAME = $lanIp
  Write-Host "[Expo Go] Metro LAN host: $lanIp (port 8081)"
} else {
  Write-Host "[Expo Go] LAN IP를 찾지 못했습니다. npm run start:tunnel 을 사용하세요."
}

npx expo start --lan --clear @args
