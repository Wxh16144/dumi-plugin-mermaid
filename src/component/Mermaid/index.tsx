import * as React from 'react';
import type { MermaidProps } from '../types';
import useMermaid from '../useMermaid';
import './index.less';

function Mermaid(props: MermaidProps) {
  const { code, mermaidConfig } = props;
  const { svg, error } = useMermaid(code, mermaidConfig);

  if (svg) {
    return <div className="dumi-plugin-mermaid" dangerouslySetInnerHTML={{ __html: svg }} />;
  }

  // 首屏渲染源码，避免 hydration 不一致
  return (
    <div className="dumi-plugin-mermaid" data-error={error || undefined}>
      <pre>
        <code className="language-mermaid">{code}</code>
      </pre>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}

export default React.memo(Mermaid);
