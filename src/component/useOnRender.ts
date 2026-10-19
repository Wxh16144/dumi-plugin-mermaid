import * as React from 'react';

/**
 * 图表渲染完成后把容器内的 svg 序列化为可独立使用的 XML 字符串并回调。
 * 依赖 `svg` 变化触发，保证每次重新渲染都会重新回调一次。
 */
export default function useOnRender(
  rootRef: React.RefObject<HTMLElement>,
  svg: string | undefined,
  onRender?: (svg: string) => void,
) {
  const onRenderRef = React.useRef(onRender);
  onRenderRef.current = onRender;

  React.useEffect(() => {
    if (!svg) return;

    const svgElement = rootRef.current?.querySelector('svg');
    if (svgElement) {
      onRenderRef.current?.(new XMLSerializer().serializeToString(svgElement));
    }
  }, [svg, rootRef]);
}
