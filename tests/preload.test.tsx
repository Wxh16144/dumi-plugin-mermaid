// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import MermaidToggle from '../src/component/MermaidToggle';

// 预加载会写进 renderMermaid 的模块级缓存，单独一个文件保证从空缓存开始
const state = vi.hoisted(() => ({
  loader: vi.fn(async () => ({ initialize: vi.fn(), render: vi.fn() })),
}));

// `dumi` 的 node 侧入口没有客户端 hooks；渲染组件的用例只需要语言上下文
vi.mock('dumi', async () => {
  const { testIntl } = await import('./intl');
  return { useIntl: () => ({ locale: testIntl.locale, messages: testIntl.messages }) };
});

vi.mock('dumi-plugin-mermaid/mermaid-loader', () => ({
  default: () => state.loader(),
  defaultRuntimeURL: 'https://cdn.example.com/mermaid.esm.min.mjs',
}));

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const container = document.createElement('div');
document.body.appendChild(container);
const root = createRoot(container);

afterEach(() => {
  act(() => root.unmount());
});

it('聚焦工具栏时预加载 mermaid，但不触发渲染', async () => {
  await act(async () => {
    root.render(<MermaidToggle code="graph TD;A-->B" defaultView="code" />);
  });

  const tab = container.querySelector<HTMLButtonElement>('[role="tab"]')!;

  await act(async () => {
    tab.focus();
  });
  await act(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  });

  expect(state.loader).toHaveBeenCalledTimes(1);
});
