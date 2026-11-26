// @vitest-environment jsdom
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Mermaid from '../src/component/Mermaid';
import MermaidToggle from '../src/component/MermaidToggle';

const mermaidMock = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn(async () => ({ svg: '<svg data-testid="mermaid-svg"></svg>' })),
}));

vi.mock('mermaid', () => ({ default: mermaidMock }));

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

beforeEach(() => {
  observers.length = 0;
  mermaidMock.initialize.mockClear();
  mermaidMock.render.mockClear();
});

afterEach(async () => {
  await act(async () => root?.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
});

describe('Mermaid 懒加载', () => {
  it('未进入视口时不加载 mermaid', async () => {
    const el = await render(<Mermaid code="graph TD;A-->B" />);

    expect(observers).toHaveLength(1);
    expect(mermaidMock.render).not.toHaveBeenCalled();
    expect(el.querySelector('svg')).toBeNull();
  });

  it('进入视口后加载并渲染', async () => {
    const el = await render(<Mermaid code="graph TD;A-->B" />);

    await act(async () => observers[0].trigger());
    await flush();

    expect(mermaidMock.render).toHaveBeenCalledTimes(1);
    expect(el.querySelector('svg')).not.toBeNull();
  });

  it('eager 时挂载即渲染', async () => {
    const el = await render(<Mermaid code="graph TD;A-->B" eager />);

    await flush();

    expect(mermaidMock.render).toHaveBeenCalledTimes(1);
    expect(el.querySelector('svg')).not.toBeNull();
  });

  it('环境不支持 IntersectionObserver 时退化为立即渲染', async () => {
    vi.stubGlobal('IntersectionObserver', undefined);

    try {
      const el = await render(<Mermaid code="graph TD;A-->B" />);

      await flush();

      expect(mermaidMock.render).toHaveBeenCalledTimes(1);
      expect(el.querySelector('svg')).not.toBeNull();
    } finally {
      vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    }
  });
});

describe('defaultView', () => {
  const clickTab = async (container: HTMLElement, label: string) => {
    const button = Array.from(container.querySelectorAll('button')).find(
      (item) => item.textContent === label,
    )!;

    await act(async () => {
      button.click();
    });
  };

  it('默认 code 时只渲染源码，点 Preview 才开始加载 mermaid', async () => {
    const el = await render(<MermaidToggle code="graph TD;A-->B" defaultView="code" />);

    expect(el.querySelector('.dumi-default-source-code')).not.toBeNull();
    expect(mermaidMock.initialize).not.toHaveBeenCalled();
    expect(mermaidMock.render).not.toHaveBeenCalled();

    await clickTab(el, 'Preview');
    await flush();

    // 主动点开时不再等 IntersectionObserver
    expect(observers).toHaveLength(0);
    expect(mermaidMock.render).toHaveBeenCalledTimes(1);
    expect(el.querySelector('svg')).not.toBeNull();
  });

  it('不传 defaultView 时仍以预览优先', async () => {
    const el = await render(<MermaidToggle code="graph TD;A-->B" />);

    expect(el.querySelector('.dumi-default-source-code')).toBeNull();

    await act(async () => observers[0].trigger());
    await flush();

    expect(mermaidMock.render).toHaveBeenCalledTimes(1);
  });
});

describe('切换视图', () => {
  const clickTab = async (container: HTMLElement, label: string) => {
    const button = Array.from(container.querySelectorAll('button')).find(
      (item) => item.textContent === label,
    )!;

    await act(async () => {
      button.click();
    });
  };

  const getPane = (container: HTMLElement) =>
    container.querySelector<HTMLElement>('.dumi-plugin-mermaid-toggle-pane');

  it('切回预览时复用已渲染的 SVG，不再重复渲染', async () => {
    const el = await render(<MermaidToggle code="graph TD;A-->B" />);

    await act(async () => observers[0].trigger());
    await flush();
    expect(mermaidMock.render).toHaveBeenCalledTimes(1);

    await clickTab(el, 'Code');
    expect(el.querySelector('.dumi-default-source-code')).not.toBeNull();

    await clickTab(el, 'Preview');
    await flush();

    expect(mermaidMock.render).toHaveBeenCalledTimes(1);
    expect(getPane(el)!.hidden).toBe(false);
    expect(el.querySelector('svg')).not.toBeNull();
  });

  it('切到源码时预览面板只是隐藏，不卸载', async () => {
    const el = await render(<MermaidToggle code="graph TD;A-->B" />);

    await act(async () => observers[0].trigger());
    await flush();

    await clickTab(el, 'Code');

    const pane = getPane(el);
    expect(pane).not.toBeNull();
    expect(pane!.hidden).toBe(true);
    expect(pane!.querySelector('svg')).not.toBeNull();
  });
});
