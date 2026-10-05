import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Expo Go 실기기는 PC의 LAN IP(예: 192.168.x.x:8081)로 Metro에 접속해야 합니다.
 * hostType이 localhost면 QR의 127.0.0.1은 휴대폰에서 연결되지 않습니다.
 */
const expoDir = join(process.cwd(), '.expo');
const settingsPath = join(expoDir, 'settings.json');

mkdirSync(expoDir, { recursive: true });

let settings = { hostType: 'lan' };

if (existsSync(settingsPath)) {
  try {
    const parsed = JSON.parse(readFileSync(settingsPath, 'utf8'));
    if (parsed && typeof parsed === 'object') {
      settings = { ...parsed, hostType: 'lan' };
    }
  } catch {
    settings = { hostType: 'lan' };
  }
}

writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');

if (process.env.EXPO_DEBUG) {
  console.log('[ensure-expo-lan] wrote', settingsPath, settings);
}
