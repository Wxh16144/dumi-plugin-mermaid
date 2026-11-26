import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
import { name } from './package.json';

export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
    alias: {
      // 必须排在 `[name]` 之前：后者会匹配所有子路径，先命中就会解析到不存在的 `src/mermaid-loader`
      [`${name}/mermaid-loader`]: resolve(__dirname, './src/component/loadMermaid.bundled.ts'),
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
