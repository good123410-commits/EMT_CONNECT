import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

const webDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(webDir, '..');

export default defineConfig(({ mode }) => {
  // web/.env 우선, 루트 .env의 VITE_* 를 보조로 병합
  loadEnv(mode, repoRoot, 'VITE_');
  loadEnv(mode, webDir, 'VITE_');

  return {
    plugins: [react()],
    // Cloudflare Pages 및 커스텀 도메인(k-emix.com) 환경에 맞게 루트 경로('/') 적용
    base: '/',
    envDir: webDir,
    server: { port: 5173 },
    build: { outDir: 'dist' },
  };
});
