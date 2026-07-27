import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    globals: true,
    reporters: ['default', 'junit'],
    outputFile: {
      junit: './test-results/vitest-junit.xml'
    }
  }
});
