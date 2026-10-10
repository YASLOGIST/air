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
    /* esbuild (the Vite default) is fast but single-pass. Terser with two
       compress passes measured 15.7 KiB smaller raw / 3.8 KiB smaller gzip
       across the app tier, and 3.3 KiB smaller gzip on the three.js vendor
       chunk — enough to absorb a feature pass and still tighten the budgets
       in scripts/check-bundle.mjs. The cost is build time only (~5s → ~12s),
       which is paid once in CI, never by a visitor. */
    minify: 'terser',
    terserOptions: { compress: { passes: 2 }, format: { comments: false } },
    /* The only chunk above 500 KiB is the deliberately isolated vendor-three
       engine chunk (see budget tiers in scripts/check-bundle.mjs). */
    chunkSizeWarningLimit: 640,
    rollupOptions: {
      output: {
        /* three.js is deliberately isolated into one cacheable vendor chunk.
           When IntersectionObserver is available, the two scene modules are
           imported only after their canvases enter a 200px near-viewport; the
           large engine stays off the initial graph and survives app redeploys
           in cache. Older-browser eager fallback is preserved. Its budget and
           deferred-import invariant live in check-bundle.mjs. */
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
