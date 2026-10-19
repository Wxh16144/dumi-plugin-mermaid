import * as React from 'react';
import {
  downloadBlob,
  downloadSvg,
  downloadText,
  svgToPngBlob,
  writeClipboardBlob,
  writeClipboardText,
} from './clipboard';
import type { MermaidLocaleKey } from './locales';
import { toStandaloneSvg } from './svg';

/** `source` 复制 mermaid 源码，`image` 复制位图 */
export type CopyKind = 'source' | 'image';

export type CopyFeedback = {
  /** 提示文案的**词条 key**，由 UI 层翻译，hook 本身不持有文案 */
  messageKey: MermaidLocaleKey;
  /** 触发这个提示的按钮 */
  kind: CopyKind;
  /** 复制成功还是退化成下载 */
  tone: 'copied' | 'downloaded';
};

/** 提示停留时长 */
const FEEDBACK_DURATION = 1800;

/**
 * 复制图表内容。
 *
 * - `source`：把 mermaid 源码写进剪贴板 —— 直接粘到 mermaid.live 或 Markdown 里就能用，
 *   比复制 SVG 更符合「把图表搬到别处」的诉求。
 * - `image`：把图表栅格化成图片写进剪贴板。
 *
 * 剪贴板在非安全上下文或缺权限时会失败，此时降级为下载文件，
 * 并把提示换成 `mermaid.feedback.downloaded`，避免给出「已复制」的错误反馈。
 */
export default function useCopyDiagram(code: string, svg?: string) {
  const [feedback, setFeedback] = React.useState<CopyFeedback | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = React.useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 组件卸载时清掉未触发的定时器
  React.useEffect(() => clearTimer, [clearTimer]);

  const notify = React.useCallback(
    (messageKey: MermaidLocaleKey, kind: CopyKind, tone: CopyFeedback['tone']) => {
      clearTimer();
      setFeedback({ messageKey, kind, tone });
      timerRef.current = setTimeout(() => setFeedback(null), FEEDBACK_DURATION);
    },
    [clearTimer],
  );

  const copy = React.useCallback(
    async (kind: CopyKind) => {
      if (kind === 'source') {
        try {
          await writeClipboardText(code);
          notify('mermaid.feedback.copied', kind, 'copied');
        } catch {
          downloadText(code, 'diagram.mmd');
          notify('mermaid.feedback.downloaded', kind, 'downloaded');
        }
        return;
      }

      if (!svg) return;

      // 栅格化前需要显式尺寸，并且不能被 mermaid 的 max-width 限制住
      const standalone = toStandaloneSvg(svg);

      let blob: Blob;
      try {
        blob = await svgToPngBlob(standalone);
      } catch {
        // 连位图都生成不了时退回 SVG，至少给用户一份能用的产物
        downloadSvg(standalone);
        notify('mermaid.feedback.downloaded', kind, 'downloaded');
        return;
      }

      try {
        await writeClipboardBlob(blob);
        notify('mermaid.feedback.copied', kind, 'copied');
      } catch {
        downloadBlob(blob, 'diagram.png');
        notify('mermaid.feedback.downloaded', kind, 'downloaded');
      }
    },
    [code, svg, notify],
  );

  return { copy, feedback };
}
