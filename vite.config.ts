import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'extension/src/popup/index.html'),
        background: resolve(__dirname, 'extension/src/background.ts'),
        content: resolve(__dirname, 'extension/src/content.ts'),
      },
      output: {
      },
    },
    outDir: 'extension/dist',
    emptyOutDir: true,
  },
});
