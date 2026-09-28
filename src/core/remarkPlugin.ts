import { unistUtilVisit } from 'dumi';

/** marker attribute written into the generated HTML */
export const MERMAID_MARKER_ATTR = 'data-dumi-mermaid';

/** hast stores `data-*` attributes in camelCase */
export const MERMAID_MARKER_PROP = MERMAID_MARKER_ATTR.replace(/-([a-z])/g, (_, char) =>
  char.toUpperCase(),
);

/** code fence language which should be treated as a mermaid diagram */
export const MERMAID_LANG = 'mermaid';

/** check whether a hast node is the mermaid placeholder */
export const hasMermaidMarker = (properties?: Record<string, unknown> | null): boolean => {
  if (!properties) return false;

  return MERMAID_MARKER_ATTR in properties || MERMAID_MARKER_PROP in properties;
};

// only escape the characters that would break the surrounding HTML text node
const escapeHtml = (raw: string) =>
  raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function remarkPlugin() {
  return (tree: any) => {
    unistUtilVisit.visit(tree, 'code', (node: any, index: number | null, parent: any) => {
      if (node.lang !== MERMAID_LANG) return;

      // dumi converts `<pre><code class="language-*">` into its own `<SourceCode>` component before
      // extra rehype plugins run, so the mermaid source is passed through a plain `<pre>` node
      // instead: its only child is a text node, which `rehypeEnhancedTag` ignores.
      parent!.children.splice(index!, 1, {
        type: 'html',
        value: `<pre ${MERMAID_MARKER_ATTR}>${escapeHtml(node.value)}</pre>`,
      });
    });
  };
}

export default remarkPlugin;
