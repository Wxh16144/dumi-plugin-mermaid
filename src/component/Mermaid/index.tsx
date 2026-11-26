import Loading from 'dumi/theme/slots/Loading';
import * as React from 'react';
import type { MermaidProps } from '../types';
import useInView from '../useInView';
import useMermaid from '../useMermaid';
import './index.less';

function MermaidRenderer(props: MermaidProps) {
  const { code, mermaidConfig, runtimeURL, onRender } = props;
  const { svg, error, loading } = useMermaid(code, mermaidConfig, runtimeURL);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const onRenderRef = React.useRef(onRender);
  onRenderRef.current = onRender;

  React.useEffect(() => {
    const svgElement = rootRef.current?.querySelector('svg');
    if (svgElement) {
      onRenderRef.current?.(new XMLSerializer().serializeToString(svgElement));
    }
  }, [svg]);

  if (svg) {
    return (
      <div
        ref={rootRef}
        className="dumi-plugin-mermaid"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  // 服务端与首屏保持一致，渲染完成前用 dumi 的骨架占位
  if (loading) {
    return (
      <div className="dumi-plugin-mermaid" aria-busy>
        <Loading />
      </div>
    );
  }

  // 渲染失败时退回源码，方便排查
  return (
    <div className="dumi-plugin-mermaid" data-error={error || undefined}>
      <pre>
        <code className="language-mermaid">{code}</code>
      </pre>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}

function Mermaid(props: MermaidProps) {
  const { eager } = props;
  const [rootRef, inView] = useInView<HTMLDivElement>();

  // 服务端与未进入视口时都只渲染骨架，避免 hydration 不一致，也让 mermaid 不被提前加载
  if (!eager && !inView) {
    return (
      <div ref={rootRef} className="dumi-plugin-mermaid" aria-busy>
        <Loading />
      </div>
    );
  }

  return <MermaidRenderer {...props} />;
}

export default React.memo(Mermaid);
