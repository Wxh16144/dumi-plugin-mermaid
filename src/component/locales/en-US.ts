/**
 * 内置词条（英文）。
 *
 * 这份是**基准词表**：`MermaidLocaleKey` 由它推导，其他语言按 `Record<MermaidLocaleKey, string>`
 * 声明，缺词会在 `pnpm run type-check` 阶段直接报错。
 *
 * key 采用 dumi 主题同款的小写点分层级（参考 `previewer.actions.code.expand`）。
 */
const enUS = {
  'mermaid.tabs.label': 'View',
  'mermaid.tabs.preview': 'Preview',
  'mermaid.tabs.code': 'Code',

  'mermaid.actions.label': 'Diagram actions',
  'mermaid.actions.expand': 'Expand',
  'mermaid.actions.copy.source': 'Copy Mermaid code',
  'mermaid.actions.copy.image': 'Copy PNG image',

  'mermaid.dialog.label': 'Mermaid diagram',
  'mermaid.dialog.close': 'Close',

  'mermaid.panzoom.label': 'Pan and zoom',
  'mermaid.panzoom.up': 'Pan up',
  'mermaid.panzoom.down': 'Pan down',
  'mermaid.panzoom.left': 'Pan left',
  'mermaid.panzoom.right': 'Pan right',
  'mermaid.panzoom.in': 'Zoom in',
  'mermaid.panzoom.out': 'Zoom out',
  'mermaid.panzoom.reset': 'Reset view',

  'mermaid.feedback.copied': 'Copied!',
  'mermaid.feedback.downloaded': 'Downloaded',
};

export default enUS;

/** 词条 key，由英文基准词表推导 */
export type MermaidLocaleKey = keyof typeof enUS;
