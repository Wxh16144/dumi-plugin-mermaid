export type MermaidProps = {
  /** mermaid 图表源码 */
  code: string;
  /** 透传给 `mermaid.initialize`，需可序列化 */
  mermaidConfig?: Record<string, unknown>;
};
