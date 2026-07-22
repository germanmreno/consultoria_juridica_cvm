import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/consultoria/',
  plugins: [react()],
  server: {
    port: 3025,
    strictPort: true,
    proxy: {
      '/consultoria/api': {
        target: 'http://localhost:3022',
        pathRewrite: { '^/consultoria': '' },
        changeOrigin: true,
      },
      '/consultoria/uploads': {
        target: 'http://localhost:3022',
        pathRewrite: { '^/consultoria': '' },
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3025,
  },
});
