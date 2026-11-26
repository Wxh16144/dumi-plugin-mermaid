import { describe, expect, it, vi } from 'vitest';

// `dumi` 的 node 侧入口没有客户端 hooks；渲染组件的用例只需要语言上下文
vi.mock('dumi', async () => {
  const { testIntl } = await import('./intl');
  return { useIntl: () => ({ locale: testIntl.locale, messages: testIntl.messages }) };
});

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
