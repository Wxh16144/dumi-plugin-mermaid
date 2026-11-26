import { unistUtilVisit } from 'dumi';
import { hasMermaidMarker } from './remarkPlugin';

/** component name registered into dumi builtins, prefixed to avoid clashing with user theme */
export const MERMAID_COMPONENT_NAME = 'DumiPluginMermaid';

export interface RehypePluginOptions {
  /** passed to `mermaid.initialize`, must be JSON serializable */
  mermaidConfig?: Record<string, unknown>;
  /**
   * 从外部地址（如 CDN）加载 mermaid 的 ESM 入口，配置后 mermaid 不再打包进产物。
   * 地址在构建期注入一次，不会写进每个图表的 props。
   */
  runtimeURL?: string;
  /** 图表面板默认展示的视图；为 `code` 时点 Preview 才会加载并渲染 mermaid */
  defaultView?: 'preview' | 'code';
}

/** collect the text of a hast node */
const toText = (node: any): string => {
  if (node.type === 'text') return node.value ?? '';
  return (node.children ?? []).map(toText).join('');
};

function rehypePlugin(options: RehypePluginOptions = {}) {
  const { mermaidConfig, defaultView } = options;

  return (tree: any) => {
    unistUtilVisit.visit(tree, 'element', (node: any, index: number | null, parent: any) => {
      if (!hasMermaidMarker(node.properties)) return;

      const JSXAttributes = [
        {
          type: 'JSXAttribute',
          name: 'code',
          value: JSON.stringify(toText(node)),
        },
      ];

      if (mermaidConfig) {
        JSXAttributes.push({
          type: 'JSXAttribute',
          name: 'mermaidConfig',
          value: JSON.stringify(mermaidConfig),
        });
      }

      if (defaultView) {
        JSXAttributes.push({
          type: 'JSXAttribute',
          name: 'defaultView',
          value: JSON.stringify(defaultView),
        });
      }

      parent!.children.splice(index!, 1, {
        type: 'element',
        tagName: MERMAID_COMPONENT_NAME,
        JSXAttributes,
        children: [],
      });
    });
  };
}

export default rehypePlugin;
