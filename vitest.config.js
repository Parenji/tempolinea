import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.js'],
    forceRerunTriggers: [
      'js/**/*.js',
      'index.html',
      'css/**/*.css',
    ],
    coverage: {
      provider: 'v8',
      include: ['js/**/*.js'],
      exclude: ['js/mini-map.js', 'js/tooltip.js', 'js/quick-create.js'],
    },
    setupFiles: ['./tests/setup.js'],
  },
});