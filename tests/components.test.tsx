import { describe, expect, it, vi } from 'vitest';

/**
 * 组件侧需要 dumi 的**浏览器入口**（`useIntl`），它只在站点构建时由 dumi 自己
 * 把 `dumi` 别名到 `client/theme-api`；而 node 环境里 `dumi` 解析到的是插件入口，
 * 并没有这个导出，所以这里给一个最小桩。
 *
 * 只 mock 精确的 `dumi`，core 侧的 `unistUtilVisit` 不受影响（那些测试各自导入 core）。
 */
vi.mock('dumi', () => ({
  useIntl: () => ({ locale: 'zh-CN', messages: {} }),
}));

describe('export', () => {
  it('should work', async () => {
    // @ts-ignore
    const all: any = await import('dumi-plugin-mermaid/component');

    expect(Object.keys(all)).toMatchSnapshot();
  });

  it('defaults to the switchable component', async () => {
    // @ts-ignore
    const all: any = await import('dumi-plugin-mermaid/component');

    expect(all.default).toBe(all.MermaidToggle);
  });
});
