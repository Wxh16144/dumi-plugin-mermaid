import * as React from 'react';
import MermaidBody from '../Mermaid/MermaidBody';
import {
  IDENTITY_TRANSFORM,
  panBy,
  toCssTransform,
  ZOOM_FACTOR,
  zoomAt,
  type MermaidTransform,
} from '../transform';
import type { MermaidTranslate } from '../useMermaidLocale';
import { PanZoomPanel } from './Controls';

/** 移动端交给页面滚动，鼠标拖拽超过这个距离才算平移，避免普通点击把图表带偏 */
const DRAG_THRESHOLD = 3;

type DragState = {
  pointerId: number;
  x: number;
  y: number;
  active: boolean;
};

export type StageProps = {
  code: string;
  svg?: string;
  error?: string;
  loading?: boolean;
  /** 是否显示右下角平移缩放面板 */
  panZoom?: boolean;
  /** 透传到图表容器，供 `onRender` 序列化 svg 使用 */
  bodyRef?: React.Ref<HTMLDivElement>;
  /** 平移缩放面板的文案翻译函数 */
  t: MermaidTranslate;
};

/**
 * 图表视口：负责承载 svg，并把平移/缩放状态映射成一层 transform。
 * 弹窗内复用同一个组件，因此每一份视口都持有各自独立的变换状态。
 */
function Stage({ code, svg, error, loading, panZoom = true, bodyRef, t }: StageProps) {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const dragRef = React.useRef<DragState | null>(null);
  const [transform, setTransform] = React.useState<MermaidTransform>(IDENTITY_TRANSFORM);
  const [dragging, setDragging] = React.useState(false);

  // 图表重新渲染后回到初始视图，避免旧位移套用到新图上
  React.useEffect(() => {
    setTransform(IDENTITY_TRANSFORM);
  }, [svg]);

  const zoom = React.useCallback((factor: number, originX = 0, originY = 0) => {
    setTransform((current) => zoomAt(current, factor, originX, originY));
  }, []);

  // 只接管 Ctrl/Cmd + 滚轮：普通滚轮留给文档滚动，避免劫持页面
  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !svg) return;

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
  }, [svg, zoom]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // 触屏不接管拖拽，否则会抢走移动端的纵向滚动
    if (event.pointerType === 'touch' || event.button !== 0) return;

    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      active: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;

    if (!drag.active) {
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      drag.active = true;
      setDragging(true);
    }

    drag.x = event.clientX;
    drag.y = event.clientY;
    setTransform((current) => panBy(current, dx, dy));
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    setDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <>
      <div
        ref={viewportRef}
        className="dumi-plugin-mermaid-viewer-viewport"
        data-draggable={svg ? true : undefined}
        data-dragging={dragging ? true : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className="dumi-plugin-mermaid-viewer-stage"
          style={{ transform: toCssTransform(transform) }}
        >
          <MermaidBody
            rootRef={bodyRef}
            className="dumi-plugin-mermaid"
            code={code}
            svg={svg}
            error={error}
            loading={loading}
          />
        </div>
      </div>

      {panZoom && svg ? (
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
