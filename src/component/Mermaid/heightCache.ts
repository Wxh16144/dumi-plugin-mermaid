/** 图表高度只和源码有关，记住上次渲染高度用于骨架占位 */
const heights = new Map<string, number>();

/** 单个页面不会这么多图表，超过则整体丢弃，避免无限增长 */
const MAX_ENTRIES = 500;

export const getRenderedHeight = (code: string) => heights.get(code);

export const setRenderedHeight = (code: string, height: number) => {
  if (!(height > 0)) return;

  if (heights.size >= MAX_ENTRIES) heights.clear();
  heights.set(code, height);
};
