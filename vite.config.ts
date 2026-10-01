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
  },
  preview: { host: '0.0.0.0' },
  server: { host: '0.0.0.0', allowedHosts: true },
});
