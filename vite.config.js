import { defineConfig } from 'vite';

export default defineConfig({
  base: '/babylon_cs_introduce/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          babylon: ['@babylonjs/core'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
