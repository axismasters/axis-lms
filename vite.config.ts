import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// AXIS LMS v1.2 - Vite 설정
// 받은 파일들의 import 경로(@/lib/..., @/components/..., @/contexts/...)가 모두
// 'src/' 기준이므로, @ alias를 src/로 매핑한다. 새 빌드 설정/플러그인은 추가하지 않았다.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
