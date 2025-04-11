import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

export default defineConfig({
  root: 'extension/src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'extension/src/popup/index.html'),
        background: path.resolve(__dirname, 'extension/src/background.ts'),
        content: path.resolve(__dirname, 'extension/src/content.ts'), // 👈 adicionado aqui
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'assets/background.js';
          }
          if (chunkInfo.name === 'content') {
            return 'assets/content.js';
          }
          return 'assets/[name]-[hash].js';
        },
      },
    },    
  },
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: '../manifest.json',
          dest: '.',
        },
        {
          src: '../public/icons/*',
          dest: 'icons',
        },
      ],
    }),
  ],
});
