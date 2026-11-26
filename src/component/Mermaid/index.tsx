import * as React from 'react';
import type { MermaidProps } from '../types';
import useInView from '../useInView';
import useMermaid from '../useMermaid';
import { getRenderedHeight, setRenderedHeight } from './heightCache';
import './index.less';
import MermaidSkeleton from './MermaidSkeleton';

type MermaidRendererProps = MermaidProps & {
  minHeight?: number;
};

function MermaidRenderer(props: MermaidRendererProps) {
  const { code, mermaidConfig, runtimeURL, onRender, minHeight } = props;
  const { svg, error, loading, retry } = useMermaid(code, mermaidConfig, runtimeURL);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const onRenderRef = React.useRef(onRender);
  onRenderRef.current = onRender;

  React.useEffect(() => {
    const element = rootRef.current;
    const svgElement = element?.querySelector('svg');
    if (!element || !svgElement) return;

    onRenderRef.current?.(new XMLSerializer().serializeToString(svgElement));
    // 记住高度，同一份源码下次渲染前先用骨架占住同样的位置
    setRenderedHeight(code, element.getBoundingClientRect().height);
  }, [svg, code]);

  if (svg) {
    return (
      <div
        ref={rootRef}
        className="dumi-plugin-mermaid"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  if (loading) {
    return <MermaidSkeleton minHeight={minHeight} />;
  }

  // 渲染失败时退回源码，方便排查
  return (
    <div className="dumi-plugin-mermaid" data-error={error || undefined}>
      <pre>
        <code className="language-mermaid">{code}</code>
      </pre>
      {error ? (
        <div className="dumi-plugin-mermaid-error" role="alert">
          <span>{error}</span>
          {retry ? (
            <button className="dumi-plugin-mermaid-retry" type="button" onClick={retry}>
              重试
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Mermaid(props: MermaidProps) {
  const { code, eager } = props;
  const [rootRef, inView] = useInView<HTMLDivElement>();
  // effect 里取值，保证 SSR 与首次客户端渲染都用空高度
  const [minHeight, setMinHeight] = React.useState<number>();

  React.useEffect(() => {
    setMinHeight(getRenderedHeight(code));
  }, [code]);

  // 未进入视口时只渲染骨架，mermaid 不会被提前加载
  if (!eager && !inView) {
    return <MermaidSkeleton ref={rootRef} minHeight={minHeight} />;
  }

  return <MermaidRenderer {...props} minHeight={minHeight} />;
}

export default React.memo(Mermaid);
