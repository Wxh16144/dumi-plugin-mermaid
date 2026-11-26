import loadMermaid from 'dumi-plugin-mermaid/mermaid-loader';
import type { MermaidModule } from './loadMermaid.bundled';

/**
 * 已加载的 mermaid 模块，全局复用。
 * `runtimeURL` 由插件统一注入，整站只应有一个 mermaid 实例（initialize 改的是全局配置），因此只缓存一份。
 */
let modulePromise: Promise<MermaidModule> | undefined;

/** 已应用到 mermaid 全局实例的初始化配置，避免重复 initialize */
let appliedConfig: string | undefined;

/** initialize + render 串行队列，mermaid 的配置与渲染容器都是全局状态 */
let queue: Promise<unknown> = Promise.resolve();

function getMermaid(runtimeURL?: string) {
  if (modulePromise) return modulePromise;

  const promise = loadMermaid(runtimeURL).catch((error: unknown) => {
    // 加载失败不缓存，允许下次重试
    modulePromise = undefined;
    throw error;
  });

  modulePromise = promise;

  return promise;
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

  const task = queue.then(async () => {
    const mermaid = await getMermaid(runtimeURL);

    if (appliedConfig !== configKey) {
      mermaid.initialize({ startOnLoad: false, ...initConfig } as any);
      appliedConfig = configKey;
    }

    return mermaid.render(`mermaid-${uid}`, code);
  });

  // 单张图失败不应阻断后续图表
  queue = task.then(
    () => undefined,
    () => undefined,
  );

  return task;
}
