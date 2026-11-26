// @vitest-environment jsdom
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MermaidToggle from '../src/component/MermaidToggle';
import MermaidViewer from '../src/viewer/MermaidViewer';
import { resetTestIntl, setTestIntl } from './intl';

const state = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn(),
}));

// `dumi` 的 node 侧入口没有客户端 hooks；渲染组件的用例只需要语言上下文
vi.mock('dumi', async () => {
  const { testIntl } = await import('./intl');
  return { useIntl: () => ({ locale: testIntl.locale, messages: testIntl.messages }) };
});

vi.mock('dumi-plugin-mermaid/mermaid-loader', () => ({
  default: async () => ({ initialize: state.initialize, render: state.render }),
  defaultRuntimeURL: undefined,
}));

/** mermaid v11 的典型输出：百分比宽度 + 行内 max-width，外加 marker 的 id 引用 */
const SVG =
  '<svg id="mermaid-test" width="100%" style="max-width: 200px" viewBox="0 0 200 100">' +
  '<defs><marker id="arrow"/></defs>' +
  '<g><path marker-end="url(#arrow)"/><text>A</text></g></svg>';

const clipboard = { writeText: vi.fn(), write: vi.fn() };

let container: HTMLDivElement;
let root: Root;

const flush = async () => {
  // renderMermaid 的串行队列会跨一次宏任务
  await act(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  });
};

const render = async (element: React.ReactElement) => {
  await act(async () => {
    root.render(element);
  });
  await flush();
};

const byLabel = (label: string) => container.querySelector<HTMLElement>(`[aria-label="${label}"]`)!;

const stageStyle = () =>
  container.querySelector<HTMLElement>('.dumi-plugin-mermaid-viewer-stage')!.style.transform;

beforeEach(() => {
  state.render.mockResolvedValue({ svg: SVG });
  clipboard.writeText.mockReset();
  clipboard.write.mockReset();
  Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true });

  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  resetTestIntl();
  document.body.style.overflow = '';
});

describe('MermaidViewer', () => {
  it('渲染图表后展示工具组与平移缩放面板', async () => {
    await render(<MermaidViewer code="graph TD;A-->B" />);

    expect(container.querySelector('.dumi-plugin-mermaid svg')).not.toBeNull();
    expect(byLabel('Expand')).toBeTruthy();
    expect(byLabel('Copy Mermaid code')).toBeTruthy();
    expect(byLabel('Copy PNG image')).toBeTruthy();
    expect(byLabel('Zoom in')).toBeTruthy();
  });

  it('按当前语言渲染控件文案', async () => {
    setTestIntl('zh-CN');
    await render(<MermaidViewer code="graph TD;A-->B" />);

    expect(byLabel('放大')).toBeTruthy();
    expect(byLabel('重置视图')).toBeTruthy();
  });

  it('可以用 props 关掉工具组与平移缩放', async () => {
    await render(<MermaidViewer code="graph TD;A-->B" toolbar={false} panZoom={false} />);

    expect(container.querySelector('.dumi-plugin-mermaid-viewer-toolbar')).toBeNull();
    expect(container.querySelector('.dumi-plugin-mermaid-viewer-panzoom')).toBeNull();
  });

  it('缩放以容器中心为基准，复位回到初始视图', async () => {
    await render(<MermaidViewer code="graph TD;A-->B" />);

    await act(async () => byLabel('Zoom in').click());
    expect(stageStyle()).toContain('scale(1.25)');

    await act(async () => byLabel('Reset view').click());
    expect(stageStyle()).toContain('scale(1)');
    expect(stageStyle()).toContain('translate3d(0px, 0px, 0)');
  });

  it('放大后弹窗展示快照，Esc 关闭并还原滚动', async () => {
    await render(<MermaidViewer code="graph TD;A-->B" />);

    await act(async () => byLabel('Expand').click());

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(document.body.style.overflow).toBe('hidden');

    // 弹窗复用快照，不再渲染第二份图表；但不能用 `<img>`，否则节点链接点不了
    const snapshot = dialog!.querySelector('.dumi-plugin-mermaid-viewer-svg')!;
    expect(dialog!.querySelector('img')).toBeNull();

    const svg = snapshot.querySelector('svg')!;
    // 快照已摘掉 max-width 并补上显式尺寸，才能铺满面板
    expect(svg.getAttribute('width')).toBe('200');
    expect(svg.getAttribute('height')).toBe('100');
    expect(svg.getAttribute('style') ?? '').not.toContain('max-width');
    // id 加了前缀，避免与页面里那份重复；引用与 <style> 选择器也要同步改写
    expect(svg.getAttribute('id')).toBe('dumi-plugin-mermaid-modal-mermaid-test');
    expect(snapshot.innerHTML).toContain('url(#dumi-plugin-mermaid-modal-arrow)');
    expect(snapshot.innerHTML).toContain('id="dumi-plugin-mermaid-modal-arrow"');

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('弹窗内可以拖动平移，且不被原生拖拽打断', async () => {
    await render(<MermaidViewer code="graph TD;A-->B" />);

    await act(async () => byLabel('Expand').click());

    const viewport = document.querySelector<HTMLElement>(
      '[role="dialog"] .dumi-plugin-mermaid-viewer-viewport',
    )!;
    const stage = viewport.querySelector<HTMLElement>('.dumi-plugin-mermaid-viewer-stage')!;

    // jsdom 没有 PointerEvent，用 MouseEvent 派发同名事件并补上指针字段
    const fire = (type: string, clientX: number, clientY: number) => {
      const event = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
        buttons: 1,
        clientX,
        clientY,
      });
      Object.defineProperty(event, 'pointerId', { value: 1 });
      Object.defineProperty(event, 'pointerType', { value: 'mouse' });

      viewport.dispatchEvent(event);
    };

    await act(async () => {
      fire('pointerdown', 100, 100);
      fire('pointermove', 140, 130);
      fire('pointerup', 140, 130);
    });

    expect(stage.style.transform).toContain('translate3d(40px, 30px, 0)');
  });

  it('拖动后吞掉随后的 click，普通点击不吞', async () => {
    await render(<MermaidViewer code="graph TD;A-->B" />);

    const viewport = container.querySelector<HTMLElement>('.dumi-plugin-mermaid-viewer-viewport')!;
    const link = container.querySelector<SVGElement>('.dumi-plugin-mermaid svg')!;

    const fire = (type: string, x: number, y: number) => {
      const event = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
        buttons: 1,
        clientX: x,
        clientY: y,
      });
      Object.defineProperty(event, 'pointerId', { value: 1 });
      Object.defineProperty(event, 'pointerType', { value: 'mouse' });

      viewport.dispatchEvent(event);
    };

    // 拖动超过阈值后松手
    await act(async () => {
      fire('pointerdown', 100, 100);
      fire('pointermove', 140, 130);
      fire('pointerup', 140, 130);
    });

    const afterDrag = new MouseEvent('click', { bubbles: true, cancelable: true });
    await act(async () => {
      link.dispatchEvent(afterDrag);
    });
    expect(afterDrag.defaultPrevented).toBe(true);

    // 单纯点击（没有位移）不应被吞
    await act(async () => {
      fire('pointerdown', 100, 100);
      fire('pointerup', 100, 100);
    });

    const plainClick = new MouseEvent('click', { bubbles: true, cancelable: true });
    await act(async () => {
      link.dispatchEvent(plainClick);
    });
    expect(plainClick.defaultPrevented).toBe(false);
  });

  it('复制源码成功时给出已复制提示', async () => {
    clipboard.writeText.mockResolvedValue(undefined);
    await render(<MermaidViewer code="graph TD;A-->B" />);

    await act(async () => byLabel('Copy Mermaid code').click());
    await flush();

    expect(clipboard.writeText).toHaveBeenCalledWith('graph TD;A-->B');
    expect(container.textContent).toContain('Copied!');
  });

  it('剪贴板不可用时降级为下载并换掉提示文案', async () => {
    clipboard.writeText.mockRejectedValue(new Error('insecure context'));
    const createObjectURL = vi.fn(() => 'blob:diagram');
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = vi.fn();
    // jsdom 不支持真实下载，拦掉 <a> 的点击
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await render(<MermaidViewer code="graph TD;A-->B" />);

    await act(async () => byLabel('Copy Mermaid code').click());
    await flush();

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain('Downloaded');
    expect(container.textContent).not.toContain('Copied!');
  });
});

describe('MermaidToggle 的 preview 插槽', () => {
  it('renderPreview 接管预览面板，懒加载等行为仍由 Toggle 管', async () => {
    await render(
      <MermaidToggle
        code="graph TD;A-->B"
        renderPreview={(props) => (
          <MermaidViewer {...props} data-testid="custom" toolbar={false} panZoom={false} />
        )}
      />,
    );

    expect(container.querySelector('.dumi-plugin-mermaid-viewer')).not.toBeNull();
    // 自定义渲染仍然拿到 code，图表照常出图
    expect(container.querySelector('.dumi-plugin-mermaid svg')).not.toBeNull();
    // 预览标签本地化后仍然是 tab
    expect(container.querySelectorAll('[role="tab"]').length).toBe(2);
  });
});
