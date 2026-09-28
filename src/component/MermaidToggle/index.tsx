import * as React from 'react';
import Mermaid from '../Mermaid';
import MermaidSource from '../MermaidSource';
import type { MermaidProps } from '../types';
import './index.less';

type MermaidView = 'preview' | 'code';

const VIEWS: { value: MermaidView; label: string }[] = [
  { value: 'preview', label: 'Preview' },
  { value: 'code', label: 'Code' },
];

function MermaidToggle(props: MermaidProps) {
  const { code } = props;
  const [view, setView] = React.useState<MermaidView>('preview');

  return (
    <div className="dumi-plugin-mermaid-toggle">
      <div className="dumi-plugin-mermaid-toggle-toolbar">
        <div className="dumi-plugin-mermaid-toggle-tabs" role="group" aria-label="View">
          {VIEWS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className="dumi-plugin-mermaid-toggle-tab"
              aria-pressed={view === value}
              onClick={() => setView(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {view === 'preview' ? <Mermaid {...props} /> : <MermaidSource code={code} />}
    </div>
  );
}

export default React.memo(MermaidToggle);
