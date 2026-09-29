import SourceCode from 'dumi/theme/builtins/SourceCode';
import { Prism } from 'prism-react-renderer';
import PrismJs from 'prismjs';
import 'prismjs/components/prism-mermaid';
import type { MermaidProps } from '../types';

// dumi 的 `SourceCode` 用的是 prism-react-renderer 自带的 Prism，只认同一实例上的语法
(Prism.languages as any).mermaid ??= PrismJs.languages.mermaid;

/** mermaid 源码视图，渲染跟随主题对 `SourceCode` 的覆盖 */
export default function MermaidSource(props: Pick<MermaidProps, 'code'>) {
  return <SourceCode lang="mermaid">{props.code}</SourceCode>;
}
