import loadMermaid, { defaultRuntimeURL } from 'dumi-plugin-mermaid/mermaid-loader';
import type { MermaidModule } from './types';

/** 单张图渲染超时，避免一张异常图表把整条队列堵死 */
const RENDER_TIMEOUT = 15000;

type CacheEntry = {
  module: Promise<MermaidModule>;
  /** 已应用到该实例的初始化配置，`initialize` 改的是全局状态，不必重复调用 */
  appliedConfig?: string;
};

/** 按 mermaid 地址缓存模块：不同地址是不同的实例，全局配置也互不影响 */
const cache = new Map<string, CacheEntry>();

/** initialize + render 串行队列，mermaid 的配置与渲染容器都是全局状态 */
let queue: Promise<unknown> = Promise.resolve();

/**
 * 让出一次宏任务，两张图之间给浏览器留出渲染/响应的机会。
 * 否则连续渲染会挤在同一帧里，长文档滚动时会明显卡顿。
 */
const nextTask = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

const withTimeout = <T>(task: Promise<T>, ms: number) =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`[dumi-plugin-mermaid] 渲染超时（超过 ${ms}ms）`));
    }, ms);
    // 浏览器里 setTimeout 返回 number，没有 unref；Node 里避免测试/构建进程被挂住
    (timer as unknown as { unref?: () => void }).unref?.();

    task.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });

function getEntry(runtimeURL?: string) {
  const key = runtimeURL ?? '';
  const cached = cache.get(key);
  if (cached) return cached;

  const entry: CacheEntry = {
    module: loadMermaid(runtimeURL).catch((error: unknown) => {
      // 加载失败不缓存，允许下次重试；已被替换的条目不要顺手删掉
      if (cache.get(key) === entry) cache.delete(key);
      throw error;
    }),
  };

  cache.set(key, entry);

  return entry;
}

/** 只加载模块、不渲染：`defaultView: 'code'` 时可以在空闲时预热，点开即出图 */
export function preloadMermaid(runtimeURL?: string) {
  getEntry(runtimeURL ?? defaultRuntimeURL).module.catch(() => {
    // 预热失败交给真正渲染时的错误提示
  });
}

/**
 * 初始化并渲染一张图表。
 * `mermaid.initialize` 改写的是全局配置，所以 `initialize + render` 必须成对串行执行。
 */
export default function renderMermaid(
  code: string,
  initConfig: Record<string, unknown>,
  uid: string,
  runtimeURL?: string,
) {
  const configKey = JSON.stringify(initConfig);
  const url = runtimeURL ?? defaultRuntimeURL;

  const task = queue.then(async () => {
    const entry = getEntry(url);
    const mermaid = await entry.module;

    if (entry.appliedConfig !== configKey) {
      mermaid.initialize({ startOnLoad: false, ...initConfig } as any);
      entry.appliedConfig = configKey;
    }

    return withTimeout(mermaid.render(`mermaid-${uid}`, code), RENDER_TIMEOUT);
  });

  // 单张图失败不应阻断后续图表；下一张图也要等这一帧过去再开始
  queue = task.then(nextTask, nextTask);

  return task;
}
