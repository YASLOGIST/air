import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: {
    sourcemap: true,
    target: 'es2022',
    /* The only chunk above 500 KiB is the deliberately isolated vendor-three
       engine chunk (see budget tiers in scripts/check-bundle.mjs). */
    chunkSizeWarningLimit: 640,
    rollupOptions: {
      output: {
        /* three.js is deliberately isolated into one cacheable vendor chunk:
           it is fetched in parallel with — never serially before — the lazy
           section chunks that use it (ULD twin, corridor globe), and its long
           cache lifetime survives every app-code redeploy. Budgets for it are
           tracked separately in scripts/check-bundle.mjs. */
        manualChunks(id) {
          if (/node_modules\/three\//.test(id) || id.endsWith('node_modules/three/build/three.core.min.js')) {
            return 'vendor-three';
          }
          if (id.includes('node_modules/three')) return 'vendor-three';
          return undefined;
        },
      },
    },
  },
  preview: { host: '0.0.0.0' },
  server: { host: '0.0.0.0', allowedHosts: true },
});
