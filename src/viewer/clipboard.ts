import { readSvgSize } from './svg';

/**
 * 浏览器侧的剪贴板 / 下载能力。
 * 剪贴板 API 要求安全上下文（https 或 localhost）且由用户手势触发，
 * 失败时由调用方（`useCopyDiagram`）降级为下载文件。
 */

export const writeClipboardText = (text: string) => navigator.clipboard.writeText(text);

export const writeClipboardBlob = (blob: Blob) => {
  if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
    return Promise.reject(new Error('当前浏览器不支持写入图片剪贴板'));
  }

  return navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();

  // 立刻 revoke 会让部分浏览器来不及开始下载，延后一拍
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const downloadSvg = (svg: string, filename = 'diagram.svg') =>
  downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), filename);

/** 剪贴板不可用时把文本存成文件，`.mmd` 是 mermaid 源码的常见扩展名 */
export const downloadText = (text: string, filename: string) =>
  downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), filename);

/** PNG 输出倍率，跟随高分屏避免糊图 */
const PNG_SCALE = 2;

/**
 * 把 SVG 画到 canvas 再导出 PNG。
 *
 * 传入的 svg 必须已带显式像素尺寸（见 `toStandaloneSvg`），
 * 否则 `width="100%"` 会让图片在部分浏览器里以 0 尺寸加载。
 */
export const svgToPngBlob = (svg: string, scale = PNG_SCALE): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const size = readSvgSize(svg);
    if (!size) {
      reject(new Error('无法从 SVG 中解析出尺寸'));
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(size.width * scale);
    canvas.height = Math.ceil(size.height * scale);

    const context = canvas.getContext('2d');
    if (!context) {
      reject(new Error('当前环境不支持 canvas'));
      return;
    }

    /**
     * 必须用 `data:` URL，不能用 Blob URL。
     *
     * mermaid 的 flowchart / journey / mindmap / class / state / ER / block 等图会把标签
     * 放进 `<foreignObject>`，而 Chrome 认为「经 Blob URL 或同源 URL 载入、且含
     * foreignObject 的 SVG 图片」不是同源的，会把 canvas 标记为 tainted，
     * `toBlob` 直接抛 SecurityError（实测 17 种图里 7 种中招）。
     * 换成 data: URL 后实测 17/17 都能正常导出；万一某些浏览器仍会 taint，
     * 下面的 try/catch 会让调用方降级为下载 SVG。
     */
    const image = new Image();

    image.onload = () => {
      try {
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('PNG 导出失败'));
        }, 'image/png');
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    };

    image.onerror = () => reject(new Error('SVG 无法加载为图片'));

    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
