/**
 * SVG 字符串级别的纯处理工具，不依赖 DOM，便于单测。
 *
 * 背景：mermaid 默认 `useMaxWidth: true`，会给根节点写入
 * `width="100%" style="max-width: {自然宽度}px"`。
 * 这带来两个问题：
 * 1. 弹窗里想放大图表时，`max-width` 是行内样式，CSS 无法覆盖，必须先把这段摘掉；
 * 2. 导出/绘制到 canvas 时需要显式像素尺寸，`width="100%"` 会让图片在部分浏览器里尺寸为 0。
 */

const SVG_OPEN_TAG = /<svg\b[^>]*>/i;

const getOpenTag = (svg: string) => SVG_OPEN_TAG.exec(svg)?.[0] ?? null;

const readAttribute = (tag: string, name: string) => {
  const matched = new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, 'i').exec(tag);
  return matched?.[1];
};

const dropAttribute = (tag: string, name: string) =>
  tag.replace(new RegExp(`\\s${name}\\s*=\\s*"[^"]*"`, 'i'), '');

/** 在起始标签闭合前插入属性，兼容 `<svg ...>` 与 `<svg ... />` */
const insertAttribute = (tag: string, attribute: string) => {
  const close = tag.endsWith('/>') ? '/>' : '>';
  return `${tag.slice(0, tag.length - close.length).trimEnd()} ${attribute}${close}`;
};

/** 用下标拼接替换起始标签，避免 `String.replace` 把 `$&` 之类的替换串当成语法 */
const replaceOpenTag = (svg: string, tag: string, nextTag: string) => {
  const start = svg.indexOf(tag);
  if (start < 0) return svg;
  return svg.slice(0, start) + nextTag + svg.slice(start + tag.length);
};

/** 解析 `viewBox` 得到宽高；非法或非正数返回 null */
export const readViewBox = (viewBox?: string | null) => {
  if (!viewBox) return null;

  const parts = viewBox
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value))) return null;

  const [, , width, height] = parts;
  if (width <= 0 || height <= 0) return null;

  return { width, height };
};

/** 读取 svg 的像素尺寸：优先 width/height 属性，其次 viewBox */
export const readSvgSize = (svg: string) => {
  const tag = getOpenTag(svg);
  if (!tag) return null;

  // 百分比尺寸对导出没有意义（`width="100%"` 会被 parseFloat 读成 100），只认像素值
  const toPixelSize = (value?: string) => {
    if (!value || value.includes('%')) return Number.NaN;
    return Number.parseFloat(value);
  };

  const width = toPixelSize(readAttribute(tag, 'width'));
  const height = toPixelSize(readAttribute(tag, 'height'));

  if (width > 0 && height > 0) return { width, height };

  // mermaid 只写 width="100%"，真正的尺寸藏在 viewBox 里
  return readViewBox(readAttribute(tag, 'viewBox'));
};

/** 摘掉 mermaid 注入的 `max-width`，让 svg 能跟随容器放大 */
export const stripMaxWidth = (svg: string) => {
  const tag = getOpenTag(svg);
  if (!tag) return svg;

  const style = readAttribute(tag, 'style');
  if (!style || !/max-width/i.test(style)) return svg;

  const kept = style
    .split(';')
    .map((declaration) => declaration.trim())
    .filter((declaration) => declaration && !/^max-width\s*:/i.test(declaration))
    .join('; ');

  const nextTag = kept
    ? insertAttribute(dropAttribute(tag, 'style'), `style="${kept}"`)
    : dropAttribute(tag, 'style');

  return replaceOpenTag(svg, tag, nextTag);
};

/** 按 viewBox 补上显式像素尺寸，导出与 canvas 绘制必需 */
export const withExplicitSize = (svg: string) => {
  const tag = getOpenTag(svg);
  if (!tag) return svg;

  const size = readViewBox(readAttribute(tag, 'viewBox'));
  if (!size) return svg;

  const nextTag = insertAttribute(
    dropAttribute(dropAttribute(tag, 'width'), 'height'),
    `width="${size.width}" height="${size.height}"`,
  );

  return replaceOpenTag(svg, tag, nextTag);
};

/** 导出成独立 SVG 文件/图片前的规范化：有显式尺寸、且不受 max-width 限制 */
export const toStandaloneSvg = (svg: string) => withExplicitSize(stripMaxWidth(svg));

/**
 * 给快照里所有 id 加前缀，并同步改写所有 `#id` 引用。
 *
 * 弹窗要把同一份 SVG 再插进 DOM 一次；不加前缀就与页面里的图表重复定义 id，
 * 而 mermaid 的 marker / clipPath 都靠 id 引用，重复后可能解析到另一份节点。
 *
 * 必须连 `#id` 一起改：mermaid 把配色写在 SVG 内的 `<style>` 里，
 * 选择器形如 `#mermaid-1 .node rect{...}`。只改 `id="..."` 会让这些规则全部失配，
 * 节点会退回 svg 默认的黑色填充。
 */
export const withIdPrefix = (svg: string, prefix: string) => {
  const ids = new Set<string>();
  // 只收集「节点上定义的 id」，避免把 `url(#x)` 里的 x 也当成定义
  svg.replace(/\sid="([^"]+)"/g, (_matched, id: string) => {
    ids.add(id);
    return _matched;
  });

  if (!ids.size) return svg;

  // 长 id 先替换，避免 `a` 是 `ab` 的前缀时把 `ab` 改坏
  const ordered = Array.from(ids).sort((a, b) => b.length - a.length);
  let next = svg;

  for (const id of ordered) {
    const renamed = `${prefix}${id}`;
    // `#id` 覆盖 url(#id) / href="#id" / `<style>` 里的选择器
    next = next.split(`id="${id}"`).join(`id="${renamed}"`).split(`#${id}`).join(`#${renamed}`);
  }

  return next;
};

/**
 * 把 SVG 字符串转成 `data:` URL。
 *
 * 用于绘制到 canvas 导出 PNG：`data:` URL 不会让含 `<foreignObject>` 的 SVG
 * 被判定为跨源，drawImage 才不会被 taint。
 */
export const toDataUrl = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
