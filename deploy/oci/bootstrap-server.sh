#!/usr/bin/env bash
# OCI VM 최초 1회: Node 22, git, 앱 디렉터리, opc 권한
set -euo pipefail

APP_DIR="${EMT_CONNECT_APP_DIR:-/opt/emt-connect}"
APP_USER="${EMT_CONNECT_APP_USER:-opc}"
NODE_MAJOR="${EMT_CONNECT_NODE_MAJOR:-22}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "sudo 로 실행하세요: sudo bash deploy/oci/bootstrap-server.sh"
  exit 1
fi

echo "[bootstrap] 패키지 설치 (git, curl)..."
if command -v dnf &>/dev/null; then
  dnf install -y git curl ca-certificates
elif command -v yum &>/dev/null; then
  yum install -y git curl ca-certificates
elif command -v apt-get &>/dev/null; then
  apt-get update -y
  apt-get install -y git curl ca-certificates
else
  echo "[bootstrap] 지원 패키지 매니저를 찾지 못했습니다. git/curl 을 수동 설치하세요."
fi

echo "[bootstrap] Node.js ${NODE_MAJOR} (NodeSource)..."
if ! command -v node &>/dev/null || [[ "$(node -v | sed 's/v//' | cut -d. -f1)" -lt "$NODE_MAJOR" ]]; then
  curl -fsSL "https://rpm.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  if command -v dnf &>/dev/null; then
    dnf install -y nodejs
  elif command -v yum &>/dev/null; then
    yum install -y nodejs
  fi
fi

node --version
npm --version

echo "[bootstrap] 앱 디렉터리: ${APP_DIR}"
mkdir -p "$APP_DIR"
chown -R "${APP_USER}:${APP_USER}" "$APP_DIR"

if [[ ! -f "${APP_DIR}/package.json" ]]; then
  echo "[bootstrap] ${APP_DIR} 에 package.json 이 없습니다."
  echo "  ${APP_USER} 계정으로 저장소를 클론하세요:"
  echo "    sudo -u ${APP_USER} git clone <REPO_URL> ${APP_DIR}"
  exit 0
fi

echo "[bootstrap] npm ci (postinstall 포함)..."
sudo -u "$APP_USER" bash -lc "cd '${APP_DIR}' && npm ci"

echo "[bootstrap] 완료. 다음:"
echo "  1) ${APP_DIR}/.env 작성 (deploy/oci/env.server.example 참고)"
echo "  2) sudo bash ${APP_DIR}/deploy/oci/install-systemd-timers.sh"
