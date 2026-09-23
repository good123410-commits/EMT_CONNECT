# OCI Always Free 서버 연동 (EMT_CONNECT)

공인 IP **132.145.126.224** 를 **재난안전데이터(safetydata.go.kr) 유치 IP** 및 **정기 동기화 크론** 용도로 사용하는 구성입니다.

| 용도 | 스크립트 | 주기 |
|------|----------|------|
| 재난 전광판 캐시 | `scripts/sync-disaster-ticker.mjs` | 10분 |
| 심야약국 CSV | `scripts/sync-midnight-pharmacies.mjs` | 매일 00:00 (KST) |

앱·Supabase 본체는 그대로 클라우드(Supabase)를 쓰고, **IP 제한 API 호출만 OCI에서** 실행합니다.

---

## 0. 노트북 로컬 스케줄 해제 (OCI 전환 시 1회)

Windows 작업 스케줄러·백그라운드 sync 프로세스를 제거합니다.

```powershell
cd C:\EMT_CONNECT
.\scripts\unregister-local-sync-tasks.ps1 -StopRunningSyncProcesses
```

---

## 1. 사전 준비 (로컬 PC)

1. OCI에서 받은 **SSH 프라이빗 키** 경로 확인 (예: `~/.ssh/oci_emt_connect`)
2. 키 권한 (Git Bash / WSL / macOS):

   ```bash
   chmod 600 ~/.ssh/oci_emt_connect
   ```

3. 접속 테스트:

   ```bash
   ssh -i ~/.ssh/oci_emt_connect opc@132.145.126.224
   ```

4. [safetydata.go.kr](https://www.safetydata.go.kr) 포털에서 **유치 IP = `132.145.126.224`** 등록

---

## 2. 서버 최초 세팅 (OCI에서 1회)

로컬에서 스크립트를 서버로 복사한 뒤 실행합니다.

```bash
scp -i ~/.ssh/oci_emt_connect deploy/oci/bootstrap-server.sh opc@132.145.126.224:/tmp/
ssh -i ~/.ssh/oci_emt_connect opc@132.145.126.224 'bash /tmp/bootstrap-server.sh'
```

또는 SSH 접속 후 저장소를 클론한 다음:

```bash
export EMT_CONNECT_REPO_URL=https://github.com/<YOUR_ORG>/EMT_CONNECT.git
bash deploy/oci/clone-and-setup.sh
sudo bash deploy/oci/bootstrap-server.sh
```

(비공개 저장소는 서버에 Deploy Key 또는 `git clone` HTTPS + PAT 설정)

### 환경 변수

```bash
sudo cp deploy/oci/env.server.example /opt/emt-connect/.env
sudo chown opc:opc /opt/emt-connect/.env
chmod 600 /opt/emt-connect/.env
nano /opt/emt-connect/.env   # Supabase·SAFETYDATA 키 입력
```

### systemd 타이머 등록

```bash
cd /opt/emt-connect
sudo bash deploy/oci/install-systemd-timers.sh
```

### 동작 확인

```bash
cd /opt/emt-connect
sudo -u opc bash -lc 'set -a && source .env && set +a && npm run sync:disaster-ticker:check'
sudo -u opc bash -lc 'set -a && source .env && set +a && npm run sync:disaster-ticker:dry-run'
```

---

## 3. 로컬에서 SSH 배포 (Windows)

PowerShell (OpenSSH 클라이언트 필요):

```powershell
.\scripts\oci\deploy-via-ssh.ps1 -SshKeyPath "$env:USERPROFILE\.ssh\oci_emt_connect"
```

옵션: `-Host 132.145.126.224`, `-User opc`, `-AppDir /opt/emt-connect`

---

## 4. GitHub Actions 자동 배포

워크플로: [`.github/workflows/deploy-oci-sync.yml`](../../.github/workflows/deploy-oci-sync.yml)

Repository **Secrets** (Settings → Secrets and variables → Actions):

| Secret | 값 |
|--------|-----|
| `OCI_SSH_HOST` | `132.145.126.224` |
| `OCI_SSH_USER` | `opc` |
| `OCI_SSH_PRIVATE_KEY` | SSH 프라이빗 키 **전체** PEM 내용 |
| `OCI_APP_DIR` | (선택) 기본 `/opt/emt-connect` |

Actions 탭에서 **Deploy OCI sync jobs** → **Run workflow** 로 수동 배포하거나, `main` push 시 `scripts/**` 변경이 있으면 자동 실행됩니다.

---

## 5. 운영 명령 (서버)

```bash
# 타이머 상태
systemctl list-timers 'emt-connect-*'

# 수동 1회 실행
sudo systemctl start emt-connect-disaster-ticker.service
sudo systemctl start emt-connect-pharmacies.service

# 최근 로그
journalctl -u emt-connect-disaster-ticker.service -n 50 --no-pager
journalctl -u emt-connect-pharmacies.service -n 50 --no-pager
```

---

## 6. (선택) KEMIX 웹 정적 호스팅

`web/` 빌드물을 같은 VM에 올릴 경우 nginx 예시: [`nginx-kemix-web.example.conf`](nginx-kemix-web.example.conf)

기본 배포 경로는 GitHub Pages이므로, OCI nginx는 **별도 도메인**이 있을 때만 사용하세요.

---

## 보안

- `.env`는 서버에만 두고 Git에 올리지 않습니다.
- SSH 키는 GitHub Secret / 로컬에만 보관합니다.
- OCI 보안 목록: **22/TCP** (관리 IP만 허용 권장), 불필요한 공개 포트는 열지 않습니다.
