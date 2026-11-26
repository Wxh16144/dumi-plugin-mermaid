import * as React from 'react';
import type { MermaidTranslate } from '../component/useMermaidLocale';
import { PanZoomPanel } from './Controls';
import {
  IDENTITY_TRANSFORM,
  type MermaidTransform,
  panBy,
  toCssTransform,
  ZOOM_FACTOR,
  zoomAt,
} from './transform';

/**
 * 鼠标拖拽超过这个距离才算平移。
 * 取 5px 而非 1~3px：真实点击常带 1~3px 抖动，阈值太小会把点击误判成拖动，
 * 进而触发「拖动后吞掉 click」的逻辑，表现为链接点不动。
 */
const DRAG_THRESHOLD = 5;

type DragState = {
  pointerId: number;
  x: number;
  y: number;
  active: boolean;
};

export type StageProps = {
  /** 图表内容：内联视图传 `<Mermaid>`，弹窗传快照 `<img>` */
  children: React.ReactNode;
  /** 图表已就绪（可以拖拽/缩放） */
  active: boolean;
  /** 是否显示右下角平移缩放面板 */
  panZoom?: boolean;
  /** 变化时把视图复位（内联传 svg 快照，弹窗传自己的 SVG） */
  resetKey: unknown;
  t: MermaidTranslate;
  variant?: 'inline' | 'modal';
};

/**
 * 图表视口：承载内容，并把平移/缩放状态映射成一层 transform。
 * 内联视图与弹窗各自实例化一次，因此两份视口的变换状态互相独立。
 */
function Stage({ children, active, panZoom = true, resetKey, t, variant = 'inline' }: StageProps) {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const dragRef = React.useRef<DragState | null>(null);
  // 上一次手势是否真的平移过：用来吞掉拖动松手时产生的 click
  const draggedRef = React.useRef(false);
  const [transform, setTransform] = React.useState<MermaidTransform>(IDENTITY_TRANSFORM);
  const [dragging, setDragging] = React.useState(false);

  // 图表重新渲染后回到初始视图，避免旧位移套用到新图上
  React.useEffect(() => {
    setTransform(IDENTITY_TRANSFORM);
  }, [resetKey]);

  const zoom = React.useCallback((factor: number, originX = 0, originY = 0) => {
    setTransform((current) => zoomAt(current, factor, originX, originY));
  }, []);

  // 只接管 Ctrl/Cmd + 滚轮：普通滚轮留给文档滚动，避免劫持页面
  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !active) return;

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;

      event.preventDefault();

      // 换算成相对容器中心的坐标，好让光标下的内容保持不动
      const rect = viewport.getBoundingClientRect();
      zoom(
        event.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR,
        event.clientX - rect.left - rect.width / 2,
        event.clientY - rect.top - rect.height / 2,
      );
    };

    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', onWheel);
  }, [active, zoom]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // 触屏不接管拖拽，否则会抢走移动端的纵向滚动
    if (!active || event.pointerType === 'touch' || event.button !== 0) return;

    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      active: false,
    };
    draggedRef.current = false;
    // 按下即进入拖拽态：立刻关掉过渡、禁用文本选区、换成抓手光标，
    // 否则第一次移动的几十毫秒仍带 180ms 过渡，手感会「粘」
    setDragging(true);
    // 这里刻意不捕获指针：捕获会把随后的 click 重定向到视口，
    // 图表里的链接就永远点不到。确认是拖动后再捕获（见 onPointerMove）。
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;

    // 超过阈值才算平移，避免普通点击把图表带偏
    if (!drag.active) {
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      drag.active = true;

      // 确认是拖动后才捕获指针：拖到视口外也能继续跟随
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // ignore: 捕获失败仍可用常规 pointermove 继续拖动
      }
    }

    drag.x = event.clientX;
    drag.y = event.clientY;
    setTransform((current) => panBy(current, dx, dy));
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    // 拖动结束后的那次 click 不应该触发节点上的链接
    draggedRef.current = drag.active;
    dragRef.current = null;
    setDragging(false);

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // ignore: 指针已释放
    }
  };

  return (
    <>
      <div
        ref={viewportRef}
        className="dumi-plugin-mermaid-viewer-viewport"
        data-variant={variant}
        data-draggable={active ? true : undefined}
        data-dragging={dragging ? true : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        // 图表内部的 svg / img 不允许被浏览器原生拖拽，否则会中断平移
        onDragStart={(event) => event.preventDefault()}
        // 拖动（而不是单击）松手时不要触发节点上的链接
        onClickCapture={(event) => {
          if (!draggedRef.current) return;
          draggedRef.current = false;
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <div
          className="dumi-plugin-mermaid-viewer-stage"
          style={{ transform: toCssTransform(transform) }}
        >
          {children}
        </div>
      </div>

      {panZoom && active ? (
        <PanZoomPanel
          scale={transform.scale}
          onPan={(dx, dy) => setTransform((current) => panBy(current, dx, dy))}
          onZoomIn={() => zoom(ZOOM_FACTOR)}
          onZoomOut={() => zoom(1 / ZOOM_FACTOR)}
          onReset={() => setTransform(IDENTITY_TRANSFORM)}
          t={t}
        />
      ) : null}
    </>
  );
}

export default React.memo(Stage);
