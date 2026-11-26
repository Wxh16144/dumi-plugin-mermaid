import * as React from 'react';
import { type MermaidLocaleKey } from '../locales';
import Mermaid from '../Mermaid';
import MermaidSource from '../MermaidSource';
import { preloadMermaid } from '../renderMermaid';
import type { MermaidProps, MermaidToggleProps, MermaidView } from '../types';
import useMermaidLocale from '../useMermaidLocale';
import './index.less';

const VIEWS: { value: MermaidView; labelKey: MermaidLocaleKey }[] = [
  { value: 'preview', labelKey: 'mermaid.tabs.preview' },
  { value: 'code', labelKey: 'mermaid.tabs.code' },
];

function MermaidToggle(props: MermaidToggleProps) {
  const { code, defaultView = 'preview', renderPreview, ...rest } = props;
  const { runtimeURL } = rest;
  const t = useMermaidLocale();
  const baseId = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const [view, setView] = React.useState<MermaidView>(defaultView);
  // 预览展示过就保持挂载：切走时只是隐藏，切回来直接复用已渲染的 SVG，不再出现骨架闪烁
  const [previewMounted, setPreviewMounted] = React.useState(defaultView === 'preview');
  // 用户主动点开预览说明图表已在视口内，不必再等 IntersectionObserver
  const [activated, setActivated] = React.useState(false);

  // 悬停 / 聚焦到工具栏就说明大概率要看图，先把 mermaid 下好，点开即出图
  const preload = React.useCallback(() => {
    preloadMermaid(runtimeURL);
  }, [runtimeURL]);

  const showView = (next: MermaidView) => {
    setView(next);

    if (next === 'preview') {
      setPreviewMounted(true);
      setActivated(true);
    }
  };

  // 标准 tab 交互：左右方向键切换，并把焦点带到新选中的 tab
  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    event.preventDefault();
    const index = VIEWS.findIndex((item) => item.value === view);
    const offset = event.key === 'ArrowRight' ? 1 : VIEWS.length - 1;
    const next = VIEWS[(index + offset) % VIEWS.length];

    showView(next.value);
    document.getElementById(`${baseId}-tab-${next.value}`)?.focus();
  };

  const previewVisible = view === 'preview';
  // 预览面板交给 `renderPreview` 时，额外 props（如 viewer 的 toolbar/panZoom）同样透传
  const previewProps = { ...rest, code, eager: rest.eager || activated } as MermaidProps;

  return (
    <div className="dumi-plugin-mermaid-toggle">
      <div className="dumi-plugin-mermaid-toggle-toolbar">
        <div
          className="dumi-plugin-mermaid-toggle-tabs"
          role="tablist"
          aria-label={t('mermaid.tabs.label')}
          onPointerEnter={preload}
          onFocus={preload}
        >
          {VIEWS.map(({ value, labelKey }) => (
            <button
              key={value}
              id={`${baseId}-tab-${value}`}
              type="button"
              role="tab"
              className="dumi-plugin-mermaid-toggle-tab"
              aria-selected={view === value}
              aria-controls={`${baseId}-panel-${value}`}
              tabIndex={view === value ? 0 : -1}
              onClick={() => showView(value)}
              onKeyDown={onTabKeyDown}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>
      {previewMounted ? (
        <div
          id={`${baseId}-panel-preview`}
          className="dumi-plugin-mermaid-toggle-pane"
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-preview`}
          hidden={!previewVisible}
        >
          {renderPreview ? renderPreview(previewProps) : <Mermaid {...previewProps} />}
        </div>
      ) : null}
      {previewVisible ? null : (
        <div
          id={`${baseId}-panel-code`}
          className="dumi-plugin-mermaid-toggle-pane"
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-code`}
        >
          <MermaidSource code={code} />
        </div>
      )}
    </div>
  );
}

export default React.memo(MermaidToggle);
