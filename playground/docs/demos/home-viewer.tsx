import { MermaidViewer } from 'dumi-plugin-mermaid/viewer';

/**
 * 首页展示：带交互控件的完整图表（不带「查看代码」面板）。
 * 内容取自作者同系列的 dumi 插件，本站对应的 mermaid 列在「渲染增强」里。
 *
 * 节点带链接，需要 `securityLevel: 'loose'`（mermaid 默认为 strict，会忽略 click 指令）。
 */
const code = `flowchart TB
  dumi(("dumi 2"))
  subgraph render["渲染增强"]
    mermaid["dumi-plugin-mermaid 图表（本站）"]
    color["dumi-plugin-color-chunk 行内色块"]
  end
  subgraph code["代码处理"]
    snippets["dumi-plugin-code-snippets 引用源码"]
    editor["dumi-plugin-code-editor 只读编辑器"]
  end
  subgraph demo["示例与文档"]
    sandpack["dumi-plugin-sandpack 在线运行"]
    api["dumi-plugin-auto-api API 表格"]
  end
  dumi --> render
  dumi --> code
  dumi --> demo
  click dumi "https://d.umijs.org" _blank
  click mermaid "https://github.com/Wxh16144/dumi-plugin-mermaid" _blank
  click color "https://github.com/Wxh16144/dumi-plugin-color-chunk" _blank
  click snippets "https://github.com/Wxh16144/dumi-plugin-code-snippets" _blank
  click editor "https://github.com/Wxh16144/dumi-plugin-code-editor" _blank
  click sandpack "https://github.com/Wxh16144/dumi-plugin-sandpack" _blank
  click api "https://github.com/Wxh16144/dumi-plugin-auto-api" _blank
  class mermaid current
  classDef current stroke-width:2px,font-weight:bold`;

export default () => <MermaidViewer code={code} mermaidConfig={{ securityLevel: 'loose' }} />;
