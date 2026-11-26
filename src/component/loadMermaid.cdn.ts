import type { MermaidLoader } from './loadMermaid.bundled';

/**
 * cdn 实现：配置了 `runtimeURL` 时插件会把 `dumi-plugin-mermaid/mermaid-loader` alias 到本文件。
 * 构建期完全不依赖 `mermaid` 包，地址由组件经 prop 传入。
 */
const loadMermaid: MermaidLoader = async (runtimeURL) => {
  if (!runtimeURL) {
    throw new Error('[dumi-plugin-mermaid] 缺少 runtimeURL，无法从外部地址加载 mermaid');
  }

  return (await import(/* webpackIgnore: true */ runtimeURL)).default;
};

export default loadMermaid;
