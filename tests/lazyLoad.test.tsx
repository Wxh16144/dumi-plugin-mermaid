// @vitest-environment jsdom
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Mermaid from '../src/component/Mermaid';
import MermaidToggle from '../src/component/MermaidToggle';

const state = vi.hoisted(() => ({
  loader: vi.fn(),
  mermaid: {
    initialize: vi.fn(),
    render: vi.fn(),
  },
}));

// `dumi` 的 node 侧入口没有客户端 hooks；渲染组件的用例只需要语言上下文
vi.mock('dumi', async () => {
  const { testIntl } = await import('./intl');
  return { useIntl: () => ({ locale: testIntl.locale, messages: testIntl.messages }) };
});

vi.mock('dumi-plugin-mermaid/mermaid-loader', () => ({
  default: (runtimeURL?: string) => state.loader(runtimeURL),
  defaultRuntimeURL: undefined,
}));

type ObserverCallback = (entries: { isIntersecting: boolean }[]) => void;

/** 记录实例，便于测试里手动触发「进入视口」 */
const observers: MockIntersectionObserver[] = [];

class MockIntersectionObserver {
  elements: Element[] = [];

  constructor(private callback: ObserverCallback) {
    observers.push(this);
  }

  observe(element: Element) {
    this.elements.push(element);
  }

  disconnect() {
    this.elements = [];
  }

  trigger(isIntersecting = true) {
    this.callback([{ isIntersecting }]);
  }
}

// jsdom 没有实现 IntersectionObserver 与 matchMedia
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

/** 等 mermaid 的异步渲染链跑完 */
const flush = () =>
  act(async () => {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
  });

let root: Root | undefined;
let container: HTMLDivElement | undefined;

const render = async (node: React.ReactElement) => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root!.render(node);
  });

  return container;
};

const clickTab = async (target: HTMLElement, label: string) => {
  const button = Array.from(target.querySelectorAll('button')).find(
    (item) => item.textContent === label,
  )!;

  await act(async () => {
    button.click();
  });
};

beforeEach(() => {
  observers.length = 0;
  state.loader.mockReset();
  state.mermaid.initialize.mockReset();
  state.mermaid.render.mockReset();
  state.loader.mockImplementation(async () => state.mermaid);
  state.mermaid.render.mockImplementation(async (id: string) => ({
    svg: `<svg id="${id}"></svg>`,
  }));
});

afterEach(async () => {
  await act(async () => root?.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
  vi.restoreAllMocks();
});

describe('Mermaid 懒加载', () => {
  it('未进入视口时不加载 mermaid', async () => {
    const el = await render(<Mermaid code="graph TD;A-->B lazy" />);

    expect(observers).toHaveLength(1);
    expect(state.loader).not.toHaveBeenCalled();
    expect(el.querySelector('svg')).toBeNull();
    expect(el.querySelector('.dumi-plugin-mermaid')!.getAttribute('aria-busy')).toBe('true');
  });

  it('进入视口后加载并渲染', async () => {
    const el = await render(<Mermaid code="graph TD;A-->B inview" />);

    await act(async () => observers[0].trigger());
    await flush();

    expect(state.mermaid.render).toHaveBeenCalledTimes(1);
    expect(el.querySelector('svg')).not.toBeNull();
    expect(el.querySelector('[aria-busy]')).toBeNull();
  });

  it('eager 时挂载即渲染', async () => {
    const el = await render(<Mermaid code="graph TD;A-->B eager" eager />);

    await flush();

    expect(state.mermaid.render).toHaveBeenCalledTimes(1);
    expect(el.querySelector('svg')).not.toBeNull();
  });

  it('环境不支持 IntersectionObserver 时退化为立即渲染', async () => {
    vi.stubGlobal('IntersectionObserver', undefined);

    try {
      const el = await render(<Mermaid code="graph TD;A-->B fallback" />);

      await flush();

      expect(state.mermaid.render).toHaveBeenCalledTimes(1);
      expect(el.querySelector('svg')).not.toBeNull();
    } finally {
      vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    }
  });

  it('渲染失败时展示错误并允许重试', async () => {
    state.mermaid.render.mockRejectedValueOnce(new Error('bad syntax'));

    const el = await render(<Mermaid code="graph TD;A-->B retry" eager />);
    await flush();

    expect(el.querySelector('[role="alert"]')!.textContent).toContain('bad syntax');

    const retry = Array.from(el.querySelectorAll('button')).find(
      (item) => item.textContent === '重试',
    )!;
    await act(async () => retry.click());
    await flush();

    expect(state.mermaid.render).toHaveBeenCalledTimes(2);
    expect(el.querySelector('svg')).not.toBeNull();
  });

  it('再次渲染同一份源码时用上次高度占位', async () => {
    const rect = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({ height: 320 } as DOMRect);

    await render(<Mermaid code="graph TD;A-->B height" eager />);
    await flush();
    rect.mockRestore();

    await act(async () => root?.unmount());
    container?.remove();

    const el = await render(<Mermaid code="graph TD;A-->B height" />);

    expect((el.querySelector('.dumi-plugin-mermaid') as HTMLElement).style.minHeight).toBe('320px');
  });
});

describe('defaultView', () => {
  it('默认 code 时只渲染源码，点 Preview 才开始加载 mermaid', async () => {
    const el = await render(<MermaidToggle code="graph TD;A-->B code" defaultView="code" />);

    expect(el.querySelector('.dumi-default-source-code')).not.toBeNull();
    expect(state.loader).not.toHaveBeenCalled();
    expect(state.mermaid.render).not.toHaveBeenCalled();

    await clickTab(el, 'Preview');
    await flush();

    // 主动点开时不再等 IntersectionObserver
    expect(observers).toHaveLength(0);
    expect(state.mermaid.render).toHaveBeenCalledTimes(1);
    expect(el.querySelector('svg')).not.toBeNull();
  });

  it('不传 defaultView 时仍以预览优先', async () => {
    const el = await render(<MermaidToggle code="graph TD;A-->B default" />);

    expect(el.querySelector('.dumi-default-source-code')).toBeNull();

    await act(async () => observers[0].trigger());
    await flush();

    expect(state.mermaid.render).toHaveBeenCalledTimes(1);
  });
});

describe('切换视图', () => {
  const getPane = (target: HTMLElement) =>
    target.querySelector<HTMLElement>('.dumi-plugin-mermaid-toggle-pane');

  it('切回预览时复用已渲染的 SVG，不再重复渲染', async () => {
    const el = await render(<MermaidToggle code="graph TD;A-->B switch" />);

    await act(async () => observers[0].trigger());
    await flush();
    expect(state.mermaid.render).toHaveBeenCalledTimes(1);

    await clickTab(el, 'Code');
    expect(el.querySelector('.dumi-default-source-code')).not.toBeNull();

    await clickTab(el, 'Preview');
    await flush();

    expect(state.mermaid.render).toHaveBeenCalledTimes(1);
    expect(getPane(el)!.hidden).toBe(false);
    expect(el.querySelector('svg')).not.toBeNull();
  });

  it('切到源码时预览面板只是隐藏，不卸载', async () => {
    const el = await render(<MermaidToggle code="graph TD;A-->B hide" />);

    await act(async () => observers[0].trigger());
    await flush();

    await clickTab(el, 'Code');

    const pane = getPane(el);
    expect(pane).not.toBeNull();
    expect(pane!.hidden).toBe(true);
    expect(pane!.querySelector('svg')).not.toBeNull();
  });

  it('切换按钮与面板之间有正确的 tab 语义', async () => {
    const el = await render(<MermaidToggle code="graph TD;A-->B a11y" />);

    const [preview, code] = Array.from(el.querySelectorAll<HTMLButtonElement>('[role="tab"]'));

    expect(preview.getAttribute('aria-selected')).toBe('true');
    expect(preview.getAttribute('tabindex')).toBe('0');
    expect(code.getAttribute('aria-selected')).toBe('false');
    expect(code.getAttribute('tabindex')).toBe('-1');

    const panelId = preview.getAttribute('aria-controls')!;
    const panel = el.querySelector(`#${panelId}`)!;

    expect(panel.getAttribute('role')).toBe('tabpanel');
    expect(panel.getAttribute('aria-labelledby')).toBe(preview.id);
  });
});
