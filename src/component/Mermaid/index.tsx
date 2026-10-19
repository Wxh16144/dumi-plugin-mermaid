import * as React from 'react';
import type { MermaidProps } from '../types';
import useMermaid from '../useMermaid';
import useOnRender from '../useOnRender';
import MermaidBody from './MermaidBody';

function Mermaid(props: MermaidProps) {
  const { code, mermaidConfig, onRender } = props;
  const { svg, error, loading } = useMermaid(code, mermaidConfig);
  const rootRef = React.useRef<HTMLDivElement>(null);

  useOnRender(rootRef, svg, onRender);

  return (
    <MermaidBody
      rootRef={rootRef}
      className="dumi-plugin-mermaid"
      code={code}
      svg={svg}
      error={error}
      loading={loading}
    />
  );
}

export default React.memo(Mermaid);
