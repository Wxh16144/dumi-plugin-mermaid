/** 图表面板默认展示的视图 */
export type MermaidView = 'preview' | 'code';

export type MermaidProps = {
  /** mermaid 图表源码 */
  code: string;
  /** 透传给 `mermaid.initialize`，需可序列化 */
  mermaidConfig?: Record<string, unknown>;
  /** 从外部地址（如 CDN）加载 mermaid 的 ESM 入口，由插件选项 `runtimeURL` 注入 */
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
};
