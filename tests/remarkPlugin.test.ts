import { describe, expect, it } from 'vitest';
import remarkPlugin, {
  MERMAID_LANG,
  MERMAID_MARKER_ATTR,
  MERMAID_MARKER_PROP,
  hasMermaidMarker,
} from '../src/core/remarkPlugin';

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

describe('hasMermaidMarker', () => {
  it('should match both the raw and the normalized attribute name', () => {
    expect(MERMAID_MARKER_PROP).toBe('dataDumiMermaid');
    expect(hasMermaidMarker({ [MERMAID_MARKER_ATTR]: '' })).toBe(true);
    expect(hasMermaidMarker({ [MERMAID_MARKER_PROP]: '' })).toBe(true);
  });

  it('should not match other nodes', () => {
    expect(hasMermaidMarker({ className: ['language-mermaid'] })).toBe(false);
    expect(hasMermaidMarker({})).toBe(false);
    expect(hasMermaidMarker(null)).toBe(false);
    expect(hasMermaidMarker(undefined)).toBe(false);
  });
});
