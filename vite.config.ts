import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // 변환 서비스 API → 백엔드 (개발 시)
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // 성능 최적화: 청크 분리
    rollupOptions: {
      output: {
        manualChunks: {
          // Vue 코어를 별도 청크로 분리 (캐싱 효율)
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          // CAD 엔진을 별도 청크로 분리 (대용량)
          'cad-engine': ['@mlightcad/cad-viewer', '@mlightcad/cad-simple-viewer', '@mlightcad/data-model'],
          // UI 라이브러리
          'ui-vendor': ['lucide-vue-next'],
        },
      },
    },
    // 청크 크기 경고 임계값 (CAD 엔진이 큼)
    chunkSizeWarningLimit: 2000,
    // 소스맵 비활성화 (프로덕션 보안)
    sourcemap: false,
    // 에셋 인라이닝 임계값 (4KB 이하 인라인)
    assetsInlineLimit: 4096,
  },
})
