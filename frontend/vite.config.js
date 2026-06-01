import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // 서비스 워커가 전체 경로를 제어할 수 있도록 허용
      'Service-Worker-Allowed': '/',
    },
  },
  build: {
    // PWA 호환성을 위해 모던 브라우저 타겟 유지
    target: 'es2015',
  },
})
