import { defineConfig } from 'vitest/config';

export default defineConfig({
  // GitHub Pages serves the app from https://pmisiewicz.github.io/edukacja/
  base: '/edukacja/',
  test: {
    include: ['src/**/*.test.ts'],
  },
});
