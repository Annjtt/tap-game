import { defineConfig } from 'vite';

export default defineConfig({
  base: '/tap-game/', // ✅ Базовый путь для GitHub Pages
  build: {
    outDir: 'docs', // ✅ Выходная папка
  },
});