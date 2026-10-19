import * as React from 'react';
import MermaidSource from '../MermaidSource';
import MermaidViewer from '../MermaidViewer';
import type { MermaidLocaleKey } from '../locales';
import type { MermaidToggleProps } from '../types';
import useMermaidLocale from '../useMermaidLocale';
import './index.less';

type MermaidView = 'preview' | 'code';

const VIEWS: { value: MermaidView; labelKey: MermaidLocaleKey }[] = [
  { value: 'preview', labelKey: 'mermaid.tabs.preview' },
  { value: 'code', labelKey: 'mermaid.tabs.code' },
];

function MermaidToggle(props: MermaidToggleProps) {
  const { code, locales } = props;
  const [view, setView] = React.useState<MermaidView>('preview');
  const t = useMermaidLocale(locales);

  return (
    <div className="dumi-plugin-mermaid-toggle">
      <div className="dumi-plugin-mermaid-toggle-toolbar">
        <div
          className="dumi-plugin-mermaid-toggle-tabs"
          role="group"
          aria-label={t('mermaid.tabs.label')}
        >
          {VIEWS.map(({ value, labelKey }) => (
            <button
              key={value}
              type="button"
              className="dumi-plugin-mermaid-toggle-tab"
              aria-pressed={view === value}
              onClick={() => setView(value)}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>
      {view === 'preview' ? <MermaidViewer {...props} /> : <MermaidSource code={code} />}
    </div>
  );
}

export default React.memo(MermaidToggle);
