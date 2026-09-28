import { unistUtilVisit } from 'dumi';

/** marker attribute used to hand the diagram source over to the rehype phase */
export const MERMAID_MARKER_ATTR = 'data-dumi-plugin-mermaid';

/** code fence language which should be treated as a mermaid diagram */
export const MERMAID_LANG = 'mermaid';

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
