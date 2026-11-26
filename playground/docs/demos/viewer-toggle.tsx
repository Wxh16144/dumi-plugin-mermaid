import MermaidViewerToggle from 'dumi-plugin-mermaid/viewer';

const code = `classDiagram
  class Plugin {
    +component?: string
    +runtimeURL?: string
  }
  class Viewer {
    +toolbar?: boolean
    +panZoom?: boolean
  }
  Plugin --> Viewer : component 指向`;

/** `dumi-plugin-mermaid/viewer` 的默认导出：保留「预览 / 源码」切换 */
export default () => <MermaidViewerToggle code={code} />;
