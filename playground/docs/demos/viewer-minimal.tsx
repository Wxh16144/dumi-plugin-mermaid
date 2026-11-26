import { MermaidViewer } from 'dumi-plugin-mermaid/viewer';

const code = `sequenceDiagram
  participant U as User
  participant S as Server
  U->>S: GET /docs
  S-->>U: 200 OK`;

/** 只保留放大的场景：关掉平移缩放后，观感与默认图表几乎一致 */
export default () => <MermaidViewer code={code} panZoom={false} />;
