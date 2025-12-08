import { defineConfig } from 'vite';

export default defineConfig({
  base: '/babylon_cs_introduce/',
  optimizeDeps: {
    // 預打包這些大型依賴，減少開發模式下的請求數量
    include: [
      '@babylonjs/core',
      '@babylonjs/loaders',
      '@babylonjs/materials',
      '@babylonjs/gui',
    ],
    // 排除 Havok（因為它包含 WASM，需要特殊處理）
    exclude: ['@babylonjs/havok'],
  },
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
    // 增加預熱檔案的耐心值
    warmup: {
      clientFiles: ['./src/main.ts', './src/modules/*.ts'],
    },
  },
});
