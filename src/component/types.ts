export type MermaidProps = {
  /** mermaid 图表源码 */
  code: string;
  /** 透传给 `mermaid.initialize`，需可序列化 */
  mermaidConfig?: Record<string, unknown>;
  /** 图表渲染完成后的回调 */
  onRender?: (svg: string) => void;
};

export type MermaidResult = {
  svg?: string;
  error?: string;
};
