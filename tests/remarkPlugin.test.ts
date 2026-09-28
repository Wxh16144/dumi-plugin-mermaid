import { describe, expect, it } from 'vitest';
import remarkPlugin, { MERMAID_LANG, MERMAID_MARKER_ATTR } from '../src/core/remarkPlugin';

const run = (children: any[]) => {
  const tree = { type: 'root', children };
  remarkPlugin()(tree);
  return tree;
};

describe('remarkPlugin', () => {
  it('should export plugin', () => {
    expect(remarkPlugin).toBeTruthy();
  });

  it('should replace mermaid code node with a marker <pre>', () => {
    const tree = run([{ type: 'code', lang: MERMAID_LANG, value: 'graph TD;\n  A-->B;' }]);

    expect(tree.children).toHaveLength(1);
    expect(tree.children[0]).toEqual({
      type: 'html',
      value: `<pre ${MERMAID_MARKER_ATTR}>graph TD;\n  A--&gt;B;</pre>`,
    });
  });

  it('should escape html characters in diagram source', () => {
    const tree = run([{ type: 'code', lang: MERMAID_LANG, value: 'A<|--B & C' }]);

    expect(tree.children[0].value).toBe(`<pre ${MERMAID_MARKER_ATTR}>A&lt;|--B &amp; C</pre>`);
  });

  it('should keep other languages untouched', () => {
    const code = { type: 'code', lang: 'js', value: 'console.log(1)' };
    const tree = run([code]);

    expect(tree.children[0]).toBe(code);
  });
});
