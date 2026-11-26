import * as React from 'react';
import MermaidToggle from '../component/MermaidToggle';
import type { MermaidProps } from '../component/types';
import MermaidViewer from './MermaidViewer';
import type { MermaidViewerToggleProps } from './types';

/**
 * 站点级替换用的入口：把 `MermaidToggle` 的预览面板换成 `MermaidViewer`。
 *
 * 在 `.dumirc.ts` 里配置 `component: 'dumi-plugin-mermaid/viewer'` 即可全站生效；
 * 只在个别位置需要控件时，直接用 `<MermaidViewer>` 更直观。
 */
function MermaidViewerToggle({
  toolbar,
  panZoom,
  renderPreview,
  ...rest
}: MermaidViewerToggleProps) {
  const preview = React.useCallback(
    (props: MermaidProps) => {
      if (renderPreview) return renderPreview(props);

      return <MermaidViewer {...props} toolbar={toolbar} panZoom={panZoom} />;
    },
    [renderPreview, toolbar, panZoom],
  );

  return <MermaidToggle {...rest} renderPreview={preview} />;
}

export default React.memo(MermaidViewerToggle);
