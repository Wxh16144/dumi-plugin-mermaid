import type { MermaidLocaleKey } from './en-US';

/** 内置词条（简体中文）。用 `Record<MermaidLocaleKey, string>` 约束，保证不漏词 */
const zhCN: Record<MermaidLocaleKey, string> = {
  'mermaid.tabs.label': '视图',
  'mermaid.tabs.preview': '预览',
  'mermaid.tabs.code': '源码',

  'mermaid.actions.label': '图表操作',
  'mermaid.actions.expand': '放大',
  'mermaid.actions.copy.source': '复制 Mermaid 源码',
  'mermaid.actions.copy.image': '复制 PNG 图片',

  'mermaid.dialog.label': 'Mermaid 图表',
  'mermaid.dialog.close': '关闭',

  'mermaid.panzoom.label': '平移缩放',
  'mermaid.panzoom.up': '上移',
  'mermaid.panzoom.down': '下移',
  'mermaid.panzoom.left': '左移',
  'mermaid.panzoom.right': '右移',
  'mermaid.panzoom.in': '放大',
  'mermaid.panzoom.out': '缩小',
  'mermaid.panzoom.reset': '重置视图',

  'mermaid.feedback.copied': '已复制',
  'mermaid.feedback.downloaded': '已下载',
};

export default zhCN;
