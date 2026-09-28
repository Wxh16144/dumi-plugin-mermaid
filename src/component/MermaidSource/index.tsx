import SourceCode from 'dumi/theme/builtins/SourceCode';
import type { MermaidProps } from '../types';

/** mermaid 源码视图，渲染跟随主题对 `SourceCode` 的覆盖 */
export default function MermaidSource(props: Pick<MermaidProps, 'code'>) {
  return <SourceCode lang="mermaid">{props.code}</SourceCode>;
}
