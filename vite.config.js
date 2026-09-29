import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    target: 'es2022',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          pdfjs: ['pdfjs-dist'],
          pdflib: ['pdf-lib'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
  optimizeDeps: {
    include: ['pdfjs-dist', 'pdf-lib'],
  },
});
