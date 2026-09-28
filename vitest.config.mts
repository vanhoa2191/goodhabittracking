import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const sourceRoot = fileURLToPath(new URL('./src', import.meta.url));
const serverOnlyShim = fileURLToPath(new URL('./tests/server-only.ts', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': sourceRoot,
      'server-only': serverOnlyShim,
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
  },
});
