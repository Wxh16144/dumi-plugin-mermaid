/** 图表面板默认展示的视图 */
export type MermaidView = 'preview' | 'code';

/** mermaid 模块实例 */
export type MermaidModule = typeof import('mermaid')['default'];

/**
 * 加载 mermaid 的实现，由插件在构建期把 `dumi-plugin-mermaid/mermaid-loader`
 * alias 到「本地打包」或「CDN」其中一种。
 */
export type MermaidLoader = (runtimeURL?: string) => Promise<MermaidModule>;

export type MermaidProps = {
  /** mermaid 图表源码 */
  code: string;
  /** 透传给 `mermaid.initialize`，需可序列化 */
  mermaidConfig?: Record<string, unknown>;
  /** 覆盖插件选项里的 `runtimeURL`，仅在不希望走站点默认地址时使用 */
  runtimeURL?: string;
  /** 跳过「进入视口才加载」，挂载即渲染；用于打印、首屏外必须立即出图的场景 */
  eager?: boolean;
  /** 图表渲染完成后的回调，返回可独立使用的 SVG XML */
  onRender?: (svg: string) => void;
};

export type MermaidToggleProps = MermaidProps & {
  /** 默认展示的视图，对应插件选项 `defaultView`；仅在首次挂载时生效 */
  defaultView?: MermaidView;
};

export type MermaidResult = {
  svg?: string;
  error?: string;
  /** 是否仍在渲染 */
  loading?: boolean;
  /** 重新渲染，用于加载失败后的手动重试 */
  retry?: () => void;
};
