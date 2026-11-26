import { MermaidViewer } from 'dumi-plugin-mermaid/viewer';

const code = `flowchart LR
  A[Start] --> B{Is it working?}
  B -- Yes --> C[Ship it]
  B -- No --> D[Fix it]
  D --> B`;

export default () => <MermaidViewer code={code} />;
