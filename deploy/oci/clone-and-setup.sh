#!/usr/bin/env bash
# opc 사용자로 1회 실행 — 저장소 클론 (공개 repo 또는 deploy key 설정 후)
set -euo pipefail

REPO_URL="${EMT_CONNECT_REPO_URL:-}"
APP_DIR="${EMT_CONNECT_APP_DIR:-/opt/emt-connect}"

if [[ -z "$REPO_URL" ]]; then
  echo "사용: EMT_CONNECT_REPO_URL=https://github.com/ORG/EMT_CONNECT.git bash deploy/oci/clone-and-setup.sh"
  exit 1
fi

if [[ -d "${APP_DIR}/.git" ]]; then
  echo "이미 클론됨: ${APP_DIR}"
  exit 0
fi

sudo mkdir -p "$(dirname "$APP_DIR")"
sudo git clone "$REPO_URL" "$APP_DIR"
sudo chown -R "$(whoami):$(whoami)" "$APP_DIR"

cd "$APP_DIR"
npm ci

echo "다음: cp deploy/oci/env.server.example .env && 편집 후"
echo "      sudo bash deploy/oci/bootstrap-server.sh"
echo "      sudo bash deploy/oci/install-systemd-timers.sh"
