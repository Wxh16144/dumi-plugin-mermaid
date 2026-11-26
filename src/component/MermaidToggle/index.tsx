import * as React from 'react';
import Mermaid from '../Mermaid';
import MermaidSource from '../MermaidSource';
import type { MermaidToggleProps, MermaidView } from '../types';
import './index.less';

const VIEWS: { value: MermaidView; label: string }[] = [
  { value: 'preview', label: 'Preview' },
  { value: 'code', label: 'Code' },
];

function MermaidToggle(props: MermaidToggleProps) {
  const { code, defaultView = 'preview', ...rest } = props;
  const [view, setView] = React.useState<MermaidView>(defaultView);

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
      {view === 'preview' ? <Mermaid code={code} {...rest} /> : <MermaidSource code={code} />}
    </div>
  );
}

export default React.memo(MermaidToggle);
