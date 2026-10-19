/**
 * 图表平移/缩放的纯计算，不依赖 DOM，便于单测。
 *
 * 坐标约定：以图表容器的中心为原点（对应 CSS `transform-origin: center`），
 * 因此 `x/y` 是相对中心的位移、`scale` 是围绕中心的缩放倍数。
 */
export type MermaidTransform = {
  scale: number;
  x: number;
  y: number;
};

/** 缩放下限：再小就看不清了 */
export const MIN_SCALE = 0.25;
/** 缩放上限：避免把位图化的文本拉到失真 */
export const MAX_SCALE = 4;
/** 每次缩放的倍率（按钮与滚轮共用） */
export const ZOOM_FACTOR = 1.25;
/** 每次平移的屏幕距离，单位为 px */
export const PAN_STEP = 48;

export const IDENTITY_TRANSFORM: MermaidTransform = { scale: 1, x: 0, y: 0 };

export const clampScale = (scale: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));

export const canZoomIn = (scale: number) => scale < MAX_SCALE - 1e-6;

export const canZoomOut = (scale: number) => scale > MIN_SCALE + 1e-6;

export const isIdentity = (transform: MermaidTransform) =>
  transform.scale === 1 && transform.x === 0 && transform.y === 0;

/**
 * 以 `(originX, originY)` 为不动点缩放。
 *
 * 设缩放前某点满足 `p = origin + scale * q`，缩放后要保证 `p` 不动，则
 * `x' = origin + (scale' / scale) * (x - origin)`。
 * 按钮缩放传 `(0, 0)` 即为「围绕中心缩放」。
 */
export const zoomAt = (
  transform: MermaidTransform,
  factor: number,
  originX = 0,
  originY = 0,
): MermaidTransform => {
  const scale = clampScale(transform.scale * factor);
  const ratio = scale / transform.scale;

  // 已经贴到上/下限时 ratio 为 1，位移保持不变，不会产生抖动
  return {
    scale,
    x: originX + ratio * (transform.x - originX),
    y: originY + ratio * (transform.y - originY),
  };
};

export const panBy = (transform: MermaidTransform, dx: number, dy: number): MermaidTransform => ({
  ...transform,
  x: transform.x + dx,
  y: transform.y + dy,
});

/** 固定两位小数，避免浮点误差在 style 里生成超长字符串 */
const round = (value: number) => Math.round(value * 100) / 100;

export const toCssTransform = (transform: MermaidTransform) =>
  `translate3d(${round(transform.x)}px, ${round(transform.y)}px, 0) scale(${round(
    transform.scale,
  )})`;
