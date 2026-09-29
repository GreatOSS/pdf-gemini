import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    target: 'es2022',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
  optimizeDeps: {
    include: ['pdfjs-dist', 'pdf-lib'],
  },
});
