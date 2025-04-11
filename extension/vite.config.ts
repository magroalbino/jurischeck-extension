import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'extension/dist',
    rollupOptions: {
      input: {
        popup: 'extension/src/popup/index.html',
        content: 'extension/src/content.ts',
        background: 'extension/src/background.ts',
      },
      output: {
        format: 'iife', // necessário para extensões Chrome
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  server: {
    open: true,
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
});
