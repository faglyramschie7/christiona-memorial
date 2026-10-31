import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Dev: `npm run dev` serves the Vue app on :5173 and proxies API/uploads to Express on :3000
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:3000',
      '/upload': 'http://127.0.0.1:3000'
    }
  },
  build: { outDir: 'dist' }
});
