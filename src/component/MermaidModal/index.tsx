import * as React from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '../icons';
import './index.less';

export type MermaidModalProps = {
  /** 无障碍名称 */
  label: string;
  /** 关闭按钮的无障碍名称；文案由调用方给定，弹窗本身不关心 i18n */
  closeLabel: string;
  /** 跟随站点明暗主题给面板配色 */
  colorScheme?: 'light' | 'dark';
  onClose: () => void;
  children: React.ReactNode;
};

/** 可聚焦元素，用于 Tab 循环 */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 零依赖弹窗：Portal + 遮罩 + Esc 关闭 + 焦点陷阱，并按需锁滚动。
 *
 * 只在客户端挂载（由父组件在用户点击后才渲染），因此 `document` 访问是安全的。
 */
export default function MermaidModal({
  label,
  closeLabel,
  colorScheme = 'light',
  onClose,
  children,
}: MermaidModalProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    // 记录打开前的焦点，关闭后归还，键盘用户不会丢失位置
    const previousFocus = document.activeElement as HTMLElement | null;
    const { overflow, paddingRight } = document.body.style;
    // 锁滚动时补偿滚动条宽度，避免页面横向抖动
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // 焦点落在面板本身（tabIndex=-1）而不是第一个按钮：
    // 读屏会先播报 dialog 的名称，视觉上也不会突兀地高亮某个操作按钮
    panel.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      // 焦点在面板自身（Tab 起点）或意外跑到面板外时，都按「循环边界」处理
      const atStart = active === first || active === panel || !panel.contains(active);
      const atEnd = active === last || !panel.contains(active);

      if (event.shiftKey && atStart) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && atEnd) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      previousFocus?.focus?.();
    };
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="dumi-plugin-mermaid-modal"
      data-color-scheme={colorScheme}
      // 用 mousedown 判定，避免在面板内拖拽后在遮罩上松手被误判为关闭
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="dumi-plugin-mermaid-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        // 让面板本身可获得焦点，作为 Tab 循环的起点
        tabIndex={-1}
      >
        {children}
        <button
          type="button"
          className="dumi-plugin-mermaid-modal-close"
          aria-label={closeLabel}
          title={closeLabel}
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      </div>
    </div>,
    document.body,
  );
}
