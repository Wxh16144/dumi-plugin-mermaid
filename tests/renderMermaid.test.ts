import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const DEFAULT_URL = 'https://cdn.example.com/mermaid.esm.min.mjs';

const state = vi.hoisted(() => ({
  loader: vi.fn(),
  mermaid: {
    initialize: vi.fn(),
    render: vi.fn(),
  },
}));

vi.mock('dumi-plugin-mermaid/mermaid-loader', () => ({
  default: (runtimeURL?: string) => state.loader(runtimeURL),
  defaultRuntimeURL: DEFAULT_URL,
}));

/** renderMermaid 的缓存与队列都是模块级状态，每个用例重新加载一份 */
const loadRenderMermaid = async () => {
  vi.resetModules();
  return import('../src/component/renderMermaid');
};

let running = 0;
let maxRunning = 0;

beforeEach(() => {
  state.loader.mockReset();
  state.mermaid.initialize.mockReset();
  state.mermaid.render.mockReset();
  state.loader.mockImplementation(async () => state.mermaid);
  state.mermaid.render.mockImplementation(async (id: string) => {
    running += 1;
    maxRunning = Math.max(maxRunning, running);
    await new Promise((resolve) => {
      setTimeout(resolve, 1);
    });
    running -= 1;

    return { svg: `<svg id="${id}"></svg>` };
  });

  running = 0;
  maxRunning = 0;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('renderMermaid', () => {
  it('同一地址只加载一次模块，且渲染串行执行', async () => {
    const { default: renderMermaid } = await loadRenderMermaid();

    await Promise.all([
      renderMermaid('a', { theme: 'default' }, 'u1'),
      renderMermaid('b', { theme: 'default' }, 'u2'),
    ]);

    expect(state.loader).toHaveBeenCalledTimes(1);
    expect(state.loader).toHaveBeenCalledWith(DEFAULT_URL);
    expect(state.mermaid.initialize).toHaveBeenCalledTimes(1);
    expect(state.mermaid.render).toHaveBeenCalledTimes(2);
    expect(maxRunning).toBe(1);
  });

  it('不同 runtimeURL 使用各自的模块实例', async () => {
    const { default: renderMermaid } = await loadRenderMermaid();
    const otherURL = 'https://other.example.com/mermaid.esm.min.mjs';

    await renderMermaid('a', {}, 'u1');
    await renderMermaid('a', {}, 'u2', otherURL);
    await renderMermaid('a', {}, 'u3', otherURL);

    expect(state.loader).toHaveBeenCalledTimes(2);
    expect(state.loader).toHaveBeenNthCalledWith(2, otherURL);
  });

  it('初始化配置变化时才重新 initialize', async () => {
    const { default: renderMermaid } = await loadRenderMermaid();

    await renderMermaid('a', { theme: 'default' }, 'u1');
    await renderMermaid('b', { theme: 'default' }, 'u2');
    await renderMermaid('c', { theme: 'dark' }, 'u3');

    expect(state.mermaid.initialize).toHaveBeenCalledTimes(2);
    expect(state.mermaid.initialize).toHaveBeenLastCalledWith(
      expect.objectContaining({ startOnLoad: false, theme: 'dark' }),
    );
  });

  it('加载失败不缓存，下次可以重试', async () => {
    const { default: renderMermaid } = await loadRenderMermaid();
    state.loader.mockRejectedValueOnce(new Error('network down'));

    await expect(renderMermaid('a', {}, 'u1')).rejects.toThrow('network down');
    await expect(renderMermaid('a', {}, 'u1')).resolves.toBeTruthy();

    expect(state.loader).toHaveBeenCalledTimes(2);
  });

  it('单张图渲染失败不会阻断后续图表', async () => {
    const { default: renderMermaid } = await loadRenderMermaid();
    state.mermaid.render.mockRejectedValueOnce(new Error('bad syntax'));

    await expect(renderMermaid('a', {}, 'u1')).rejects.toThrow('bad syntax');
    await expect(renderMermaid('b', {}, 'u2')).resolves.toBeTruthy();
  });

  it('渲染超时后释放队列', async () => {
    const { default: renderMermaid } = await loadRenderMermaid();
    vi.useFakeTimers();
    state.mermaid.render.mockImplementationOnce(() => new Promise(() => {}));

    const timedOut = renderMermaid('a', {}, 'u1');
    const assertion = expect(timedOut).rejects.toThrow(/渲染超时/);
    await vi.advanceTimersByTimeAsync(15000);
    await assertion;

    const next = renderMermaid('b', {}, 'u2');
    // 队列在两张图之间让出一帧，这里把 nextTask(0) 和 mock 内部的定时器一起推过去
    await vi.advanceTimersByTimeAsync(5);
    await expect(next).resolves.toBeTruthy();

    vi.useRealTimers();
  });
});

describe('preloadMermaid', () => {
  it('只加载模块，不触发渲染', async () => {
    const { preloadMermaid } = await loadRenderMermaid();

    preloadMermaid();
    await vi.waitFor(() => {
      expect(state.loader).toHaveBeenCalledTimes(1);
    });

    expect(state.loader).toHaveBeenCalledWith(DEFAULT_URL);
    expect(state.mermaid.render).not.toHaveBeenCalled();
  });

  it('加载失败不抛出未处理的 rejection', async () => {
    const { preloadMermaid } = await loadRenderMermaid();
    state.loader.mockRejectedValueOnce(new Error('network down'));

    expect(() => preloadMermaid()).not.toThrow();
    await vi.waitFor(() => {
      expect(state.loader).toHaveBeenCalledTimes(1);
    });
  });
});
