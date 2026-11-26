import type { MermaidLoader } from './types';

/**
 * 默认实现：从本地依赖按需加载 mermaid。
 * 未配置 `runtimeURL` 时插件使用本实现，mermaid 会打包进产物（按图类型拆成懒加载 chunk）。
 */
const loadMermaid: MermaidLoader = async () => (await import('mermaid')).default;

/** 本实现不接受外部地址，默认地址恒为空 */
export const defaultRuntimeURL: string | undefined = undefined;

export default loadMermaid;
