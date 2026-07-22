import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3025,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3022',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3025,
  },
});
