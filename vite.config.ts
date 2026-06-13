/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

// Multi-page app: input paths are resolved relative to the Vite root (project dir).
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        support: 'support.html',
        privacy: 'privacy.html',
      },
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
});
