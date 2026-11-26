import * as React from 'react';
import Mermaid from '../component/Mermaid';
import useMermaidLocale from '../component/useMermaidLocale';
import { DiagramToolbar } from './Controls';
import './index.less';
import Modal from './Modal';
import Stage from './Stage';
import { toStandaloneSvg, withIdPrefix } from './svg';
import type { MermaidViewerProps } from './types';
import useCopyDiagram from './useCopyDiagram';

/**
 * 带交互控件的图表视图：
 * - 右上：放大到弹窗、复制 mermaid 源码 / PNG
 * - 右下：平移、缩放、复位（另支持 Ctrl/Cmd + 滚轮缩放、鼠标拖拽平移）
 *
 * 渲染本身完全复用 `<Mermaid>`（懒加载、骨架、重试、主题联动都在里面），
 * 这里只通过它的 `onRender` 回调拿一份序列化后的 SVG 快照：
 * 弹窗与 PNG 导出都用这份快照，而不是在弹窗里再渲染一遍 ——
 * mermaid 的渲染是全局串行队列，再渲染一次会有可感知的等待与骨架闪烁。
 */
function MermaidViewer({
  code,
  mermaidConfig,
  runtimeURL,
  eager,
  onRender,
  toolbar = true,
  panZoom = true,
  className,
}: MermaidViewerProps) {
  const t = useMermaidLocale();
  const [snapshot, setSnapshot] = React.useState<string>();
  const [modalOpen, setModalOpen] = React.useState(false);
  const { copy, feedback } = useCopyDiagram(code, snapshot);

  // `Mermaid` 的 onRender 每次渲染都会回调，这里缓存快照并继续向上转发
  const handleRender = React.useCallback(
    (svg: string) => {
      setSnapshot(svg);
      onRender?.(svg);
    },
    [onRender],
  );

  // 弹窗与导出都需要「能跟随容器放大」的独立 SVG：摘掉 max-width、补上显式尺寸
  const modalSvg = React.useMemo(
    () => (snapshot ? toStandaloneSvg(snapshot) : undefined),
    [snapshot],
  );
  // 弹窗里的那份要加 id 前缀：同一份 SVG 会被插入 DOM 两次
  const modalMarkup = React.useMemo(
    () => (modalSvg ? withIdPrefix(modalSvg, 'dumi-plugin-mermaid-modal-') : ''),
    [modalSvg],
  );
  const ready = Boolean(snapshot);

  return (
    <div className={['dumi-plugin-mermaid-viewer', className].filter(Boolean).join(' ')}>
      {toolbar && ready ? (
        <DiagramToolbar
          feedback={feedback}
          onExpand={() => setModalOpen(true)}
          onCopy={copy}
          t={t}
        />
      ) : null}

      <Stage active={ready} panZoom={panZoom} resetKey={snapshot} t={t}>
        <Mermaid
          code={code}
          mermaidConfig={mermaidConfig}
          runtimeURL={runtimeURL}
          eager={eager}
          onRender={handleRender}
        />
      </Stage>

      {modalOpen && modalSvg ? (
        <Modal
          label={t('mermaid.dialog.label')}
          closeLabel={t('mermaid.dialog.close')}
          onClose={() => setModalOpen(false)}
        >
          <div className="dumi-plugin-mermaid-viewer dumi-plugin-mermaid-viewer-modal">
            <Stage variant="modal" active panZoom={panZoom} resetKey={modalSvg} t={t}>
              {/*
                直接复用快照，而不是转成 `<img>`：`<img>` 里的 SVG 是隔离文档，
                节点上的链接（`click A href ...`）点不了。id 已加前缀，不会与页面里的图表冲突。
              */}
              <div
                className="dumi-plugin-mermaid-viewer-svg"
                dangerouslySetInnerHTML={{ __html: modalMarkup }}
              />
            </Stage>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

export default React.memo(MermaidViewer);
