import { defineConfig } from 'vite';

export default defineConfig({
  base: '/tap-game/', // ✅ Указываем базовый путь для GitHub Pages
  build: {
    outDir: 'docs',
  },
});