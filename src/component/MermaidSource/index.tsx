import SourceCode from 'dumi/theme/builtins/SourceCode';
import type { MermaidProps } from '../types';

/** mermaid 源码视图，渲染方式跟随主题对 `dumi/theme/builtins/SourceCode` 的覆盖 */
export default function MermaidSource(props: Pick<MermaidProps, 'code'>) {
  return <SourceCode lang="mermaid">{props.code}</SourceCode>;
}
