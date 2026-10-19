import type { MermaidLocaleOverrides } from './locales';

export type MermaidProps = {
  /** mermaid 图表源码 */
  code: string;
  /** 透传给 `mermaid.initialize`，需可序列化 */
  mermaidConfig?: Record<string, unknown>;
  /** 图表渲染完成后的回调，返回可独立使用的 SVG XML */
  onRender?: (svg: string) => void;
};

export type MermaidResult = {
  svg?: string;
  error?: string;
  /** 是否仍在渲染 */
  loading?: boolean;
};

export type MermaidViewerProps = MermaidProps & {
  /** 是否显示右上角工具组（放大、复制） */
  toolbar?: boolean;
  /** 是否启用右下角平移缩放面板 */
  panZoom?: boolean;
  /** 覆盖内置文案，形如 `{ 'en-US': { 'mermaid.actions.expand': 'Fullscreen' } }` */
  locales?: MermaidLocaleOverrides;
  className?: string;
};

/** 默认导出（带源码切换）的 props */
export type MermaidToggleProps = MermaidViewerProps;
