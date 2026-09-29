import SourceCode from 'dumi/theme/builtins/SourceCode';
import Prism from 'prism-react-renderer/prism';
import type { MermaidProps } from '../types';

// prismjs 的语法文件读全局 Prism，赋值必须早于加载（`import` 会被提升，故用 require）
Object.assign(globalThis, { Prism });
require('prismjs/components/prism-mermaid');

/** mermaid 源码视图，渲染跟随主题对 `SourceCode` 的覆盖 */
export default function MermaidSource(props: Pick<MermaidProps, 'code'>) {
  return <SourceCode lang="mermaid">{props.code}</SourceCode>;
}
