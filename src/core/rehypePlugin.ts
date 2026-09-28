import { unistUtilVisit } from 'dumi';
import { hasMermaidMarker } from './remarkPlugin';

/** component name registered into dumi builtins, prefixed to avoid clashing with user theme */
export const MERMAID_COMPONENT_NAME = 'DumiPluginMermaid';

export interface RehypePluginOptions {
  /** passed to `mermaid.initialize`, must be JSON serializable */
  mermaidConfig?: Record<string, unknown>;
}

/** collect the text of a hast node */
const toText = (node: any): string => {
  if (node.type === 'text') return node.value ?? '';
  return (node.children ?? []).map(toText).join('');
};

function rehypePlugin(options: RehypePluginOptions = {}) {
  const { mermaidConfig } = options;

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
