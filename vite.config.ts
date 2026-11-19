import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Исходники фронтенда лежат в src/main/react, а конфигурация - в корне проекта.
export default defineConfig({
  root: 'src/main/react',
  plugins: [react()],
  server: {
    port: 5173,
    // в разработке запросы к API уходят на Jetty (mvn / запуск Main), поэтому CORS не нужен
    // ключ со слэшем: иначе префикс '/api' перехватит и файл исходников /api.ts
    proxy: {
      '/api/': 'http://localhost:8080',
    },
  },
  build: {
    // Maven копирует src/main/resources в jar/classpath, поэтому статика попадает в приложение
    outDir: fileURLToPath(new URL('./src/main/resources/static', import.meta.url)),
    emptyOutDir: true,
    minify: true, // JavaScript
    cssMinify: true,
    rolldownOptions: {
      output: {
        // скрипты собираются как ES-модули с расширением .mjs
        entryFileNames: 'assets/[name]-[hash].mjs',
        chunkFileNames: 'assets/[name]-[hash].mjs',
      },
    },
  },
})
