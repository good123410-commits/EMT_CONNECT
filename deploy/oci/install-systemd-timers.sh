#!/usr/bin/env bash
# systemd oneshot + timer: 재난 전광판(10분), 심야약국(매일 KST 0시)
set -euo pipefail

APP_DIR="${EMT_CONNECT_APP_DIR:-/opt/emt-connect}"
APP_USER="${EMT_CONNECT_APP_USER:-opc}"
UNIT_DIR="/etc/systemd/system"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "sudo 로 실행하세요."
  exit 1
fi

if [[ ! -f "${APP_DIR}/.env" ]]; then
  echo "[warn] ${APP_DIR}/.env 가 없습니다. 타이머는 등록되지만 실행 시 실패할 수 있습니다."
fi

NODE_BIN="$(command -v node)"
REPO_SYSTEMD="${APP_DIR}/deploy/oci/systemd"

install_unit() {
  local name="$1"
  sed \
    -e "s|@APP_DIR@|${APP_DIR}|g" \
    -e "s|@APP_USER@|${APP_USER}|g" \
    -e "s|@NODE_BIN@|${NODE_BIN}|g" \
    "${REPO_SYSTEMD}/${name}" > "${UNIT_DIR}/${name}"
  chmod 644 "${UNIT_DIR}/${name}"
}

for f in emt-connect-disaster-ticker.service emt-connect-disaster-ticker.timer \
         emt-connect-pharmacies.service emt-connect-pharmacies.timer; do
  install_unit "$f"
done

systemctl daemon-reload
systemctl enable --now emt-connect-disaster-ticker.timer
systemctl enable --now emt-connect-pharmacies.timer

echo "[ok] 타이머 활성화됨:"
systemctl list-timers 'emt-connect-*' --no-pager
