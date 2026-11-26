import type { MermaidLoader } from './types';

/** 加载失败后重试一次，CDN 抖动时不必刷新页面 */
const RETRY_DELAY = 300;

/** 带上递增参数，绕开浏览器对「失败的动态 import」按地址缓存失败结果的行为 */
const withRetryParam = (url: string, attempt: number) => {
  if (attempt === 0) return url;

  return `${url}${url.includes('?') ? '&' : '?'}dumi-plugin-mermaid-retry=${attempt}`;
};

/**
 * cdn 实现：配置了 `runtimeURL` 时插件会把 `dumi-plugin-mermaid/mermaid-loader`
 * alias 到带默认地址的构建产物，本文件只负责按地址加载。
 * 构建期完全不依赖 `mermaid` 包。
 */
const loadMermaid: MermaidLoader = async (runtimeURL) => {
  if (!runtimeURL) {
    throw new Error(
      '[dumi-plugin-mermaid] 缺少 runtimeURL：请在插件选项里配置 runtimeURL，或通过组件 prop 传入',
    );
  }

  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return (await import(/* webpackIgnore: true */ withRetryParam(runtimeURL, attempt))).default;
    } catch (error) {
      lastError = error;

      if (attempt === 0) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          setTimeout(resolve, RETRY_DELAY);
        });
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`[dumi-plugin-mermaid] 无法从 ${runtimeURL} 加载 mermaid`);
};

/** 由插件在构建期生成同名导出并覆盖默认值，这里仅作为类型与回退来源 */
export const defaultRuntimeURL: string | undefined = undefined;

export default loadMermaid;
