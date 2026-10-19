import * as React from 'react';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CopyIcon,
  ExpandIcon,
  ImageIcon,
  ResetIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from '../icons';
import { PAN_STEP, canZoomIn, canZoomOut } from '../transform';
import type { CopyFeedback, CopyKind } from '../useCopyDiagram';
import type { MermaidTranslate } from '../useMermaidLocale';

type IconButtonProps = {
  label: string;
  /** 在 3×3 网格里的位置 */
  slot?: string;
  /** `plain` 只显示图标，用于平移这类导航操作 */
  variant?: 'solid' | 'plain';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
};

function IconButton({
  label,
  slot,
  variant = 'solid',
  disabled,
  onClick,
  children,
}: IconButtonProps) {
  return (
    <button
      type="button"
      className="dumi-plugin-mermaid-viewer-icon-button"
      data-variant={variant}
      data-slot={slot}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

type DiagramToolbarProps = {
  onExpand: () => void;
  onCopy: (kind: CopyKind) => void;
  feedback: CopyFeedback | null;
  /** 翻译函数由 `MermaidViewer` 统一下发，避免每层重复解析词表 */
  t: MermaidTranslate;
};

/** 右上工具组：放大到弹窗 + 复制 mermaid 源码 / PNG */
export function DiagramToolbar({ onExpand, onCopy, feedback, t }: DiagramToolbarProps) {
  // 复制成功后把对应按钮切成对勾，给出即时的视觉确认
  const copiedKind = feedback?.tone === 'copied' ? feedback.kind : null;

  return (
    <div
      className="dumi-plugin-mermaid-viewer-toolbar"
      role="group"
      aria-label={t('mermaid.actions.label')}
    >
      <IconButton label={t('mermaid.actions.expand')} onClick={onExpand}>
        <ExpandIcon />
      </IconButton>
      <IconButton label={t('mermaid.actions.copy.source')} onClick={() => onCopy('source')}>
        {copiedKind === 'source' ? <CheckIcon /> : <CopyIcon />}
      </IconButton>
      <IconButton label={t('mermaid.actions.copy.image')} onClick={() => onCopy('image')}>
        {copiedKind === 'image' ? <CheckIcon /> : <ImageIcon />}
      </IconButton>

      {feedback ? (
        <span className="dumi-plugin-mermaid-viewer-feedback" role="status">
          {t(feedback.messageKey)}
        </span>
      ) : null}
    </div>
  );
}

type PanZoomPanelProps = {
  scale: number;
  onPan: (dx: number, dy: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  t: MermaidTranslate;
};

/**
 * 右下平移/缩放面板，按 mermaid.live 的 3×3 布局：
 *
 *     ·  ↑  ⊕
 *     ←  ↺  →
 *     ·  ↓  ⊖
 *
 * 箭头方向即内容移动方向（↑ 表示图表向上走），与 transform 里朝下的 y 轴正向相反。
 */
export function PanZoomPanel({ scale, onPan, onZoomIn, onZoomOut, onReset, t }: PanZoomPanelProps) {
  return (
    <div
      className="dumi-plugin-mermaid-viewer-panzoom"
      role="group"
      aria-label={t('mermaid.panzoom.label')}
    >
      <IconButton
        slot="up"
        variant="plain"
        label={t('mermaid.panzoom.up')}
        onClick={() => onPan(0, -PAN_STEP)}
      >
        <ChevronUpIcon />
      </IconButton>
      <IconButton
        slot="zoom-in"
        label={t('mermaid.panzoom.in')}
        disabled={!canZoomIn(scale)}
        onClick={onZoomIn}
      >
        <ZoomInIcon />
      </IconButton>
      <IconButton
        slot="left"
        variant="plain"
        label={t('mermaid.panzoom.left')}
        onClick={() => onPan(-PAN_STEP, 0)}
      >
        <ChevronLeftIcon />
      </IconButton>
      <IconButton slot="reset" label={t('mermaid.panzoom.reset')} onClick={onReset}>
        <ResetIcon />
      </IconButton>
      <IconButton
        slot="right"
        variant="plain"
        label={t('mermaid.panzoom.right')}
        onClick={() => onPan(PAN_STEP, 0)}
      >
        <ChevronRightIcon />
      </IconButton>
      <IconButton
        slot="down"
        variant="plain"
        label={t('mermaid.panzoom.down')}
        onClick={() => onPan(0, PAN_STEP)}
      >
        <ChevronDownIcon />
      </IconButton>
      <IconButton
        slot="zoom-out"
        label={t('mermaid.panzoom.out')}
        disabled={!canZoomOut(scale)}
        onClick={onZoomOut}
      >
        <ZoomOutIcon />
      </IconButton>
    </div>
  );
}
