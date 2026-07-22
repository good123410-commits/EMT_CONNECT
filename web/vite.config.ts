import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // Cloudflare Pages 및 커스텀 도메인(k-emix.com) 환경에 맞게 루트 경로('/') 적용
  base: "/",
  server: { port: 5173 },
  build: { outDir: "dist" },
});
