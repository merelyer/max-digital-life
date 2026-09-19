import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  main: { build: { rollupOptions: { input: resolve(rootDir, 'src/main/index.ts') } }, plugins: [externalizeDepsPlugin()] },
  preload: { build: { rollupOptions: { input: resolve(rootDir, 'src/main/preload.ts') } }, plugins: [externalizeDepsPlugin()] },
  renderer: { resolve: { alias: { '@renderer': resolve('src/renderer') } }, plugins: [react()] }
});
