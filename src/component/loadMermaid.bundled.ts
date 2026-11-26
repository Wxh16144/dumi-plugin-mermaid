type MermaidNamespace = typeof import('mermaid');

export type MermaidModule = MermaidNamespace['default'];

/** 加载 mermaid 模块，`runtimeURL` 由 bundled 实现忽略 */
export type MermaidLoader = (runtimeURL?: string) => Promise<MermaidModule>;

/**
 * 默认实现：从本地依赖按需加载 mermaid。
 * 未配置 `runtimeURL` 时使用本实现，mermaid 会打包进产物（按图类型拆成懒加载 chunk）。
 */
const loadMermaid: MermaidLoader = async () => (await import('mermaid')).default;

export default loadMermaid;
