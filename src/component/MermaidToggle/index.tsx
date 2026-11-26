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
  // 预览展示过就保持挂载：切走时只是隐藏，切回来直接复用已渲染的 SVG，不再出现骨架闪烁
  const [previewMounted, setPreviewMounted] = React.useState(defaultView === 'preview');
  // 用户主动点开预览说明图表已在视口内，不必再等 IntersectionObserver
  const [activated, setActivated] = React.useState(false);

  const showView = (next: MermaidView) => {
    setView(next);

    if (next === 'preview') {
      setPreviewMounted(true);
      setActivated(true);
    }
  };

  const previewVisible = view === 'preview';

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
              onClick={() => showView(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {previewMounted ? (
        <div className="dumi-plugin-mermaid-toggle-pane" hidden={!previewVisible}>
          <Mermaid {...rest} code={code} eager={rest.eager || activated} />
        </div>
      ) : null}
      {previewVisible ? null : <MermaidSource code={code} />}
    </div>
  );
}

export default React.memo(MermaidToggle);
