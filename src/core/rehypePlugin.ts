import { unistUtilVisit } from 'dumi';
import { hasMermaidMarker } from './remarkPlugin';

/** component name registered into dumi builtins, prefixed to avoid clashing with user theme */
export const MERMAID_COMPONENT_NAME = 'DumiPluginMermaid';

export interface RehypePluginOptions {
  /** passed to `mermaid.initialize`, must be JSON serializable */
  mermaidConfig?: Record<string, unknown>;
  /**
   * 覆盖图表控件的内置文案，形如
   * `{ 'en-US': { 'mermaid.actions.expand': 'Fullscreen' } }`，需可序列化。
   *
   * dumi 的 i18n `messages` 只从主题收集，插件没有注入点，因此文案由组件侧自带词表，
   * 这里只负责把用户的覆盖表随组件属性一起下发（与 `mermaidConfig` 同一条路径）。
   */
  locales?: Record<string, Record<string, string>>;
}

/** collect the text of a hast node */
const toText = (node: any): string => {
  if (node.type === 'text') return node.value ?? '';
  return (node.children ?? []).map(toText).join('');
};

function rehypePlugin(options: RehypePluginOptions = {}) {
  const { mermaidConfig, locales } = options;

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

      if (locales) {
        JSXAttributes.push({
          type: 'JSXAttribute',
          name: 'locales',
          value: JSON.stringify(locales),
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
