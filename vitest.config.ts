import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
import { name } from './package.json';

export default defineConfig({
  test: {
    alias: {
      [name]: resolve(__dirname, './src'),
      [`${name}/(.*)`]: resolve(__dirname, './src/$1'),
      // only exists in dumi's build, point it to a lightweight stand-in for tests
      'dumi/theme/builtins/SourceCode': resolve(__dirname, './tests/mocks/source-code.tsx'),
      'dumi/theme/slots/Loading': resolve(__dirname, './tests/mocks/loading.tsx'),
    },
    coverage: {
      reporter: ['text', 'text-summary', 'json', 'lcov'],
      include: ['src/**/*'],
    },
  },
});
