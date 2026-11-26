import type * as React from 'react';
import type { MermaidProps, MermaidView } from '../component/types';

export type MermaidViewerProps = MermaidProps & {
  /** 是否显示右上角工具组（放大、复制） */
  toolbar?: boolean;
  /** 是否启用右下角平移缩放面板 */
  panZoom?: boolean;
  className?: string;
};

/** 站点级替换图表组件时使用的 props（`component: 'dumi-plugin-mermaid/viewer'`） */
export type MermaidViewerToggleProps = MermaidViewerProps & {
  /** 默认展示的视图，对应插件选项 `defaultView` */
  defaultView?: MermaidView;
  /** 继续覆盖预览面板（极少用到，默认已经渲染 `MermaidViewer`） */
  renderPreview?: (props: MermaidProps) => React.ReactNode;
};
