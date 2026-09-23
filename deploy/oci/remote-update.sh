#!/usr/bin/env bash
# 서버에서 코드 갱신 + 의존성 + systemd 타이머 재적용
set -euo pipefail

APP_DIR="${EMT_CONNECT_APP_DIR:-/opt/emt-connect}"
BRANCH="${EMT_CONNECT_DEPLOY_BRANCH:-main}"

cd "$APP_DIR"

if [[ -d .git ]]; then
  git fetch origin
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
else
  echo "[remote-update] .git 없음 — git pull 생략"
fi

npm ci

if [[ "$(id -u)" -eq 0 ]]; then
  bash deploy/oci/install-systemd-timers.sh
else
  echo "[remote-update] systemd 재등록은 sudo 가 필요합니다:"
  echo "  sudo bash deploy/oci/install-systemd-timers.sh"
fi

echo "[remote-update] 완료 ($(date -Is))"
