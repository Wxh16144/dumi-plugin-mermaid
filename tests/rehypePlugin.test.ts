import { beforeAll, describe, expect, it } from 'vitest';
import type * as RehypeModule from '../src/core/rehypePlugin';
import type * as RemarkModule from '../src/core/remarkPlugin';
import waitForDumiVisitor from './dumi-ready';

// 必须在 dumi 的访问器就绪后再导入，模块内部的具名导入才能拿到函数
let rehypePlugin: typeof RehypeModule.default;
let MERMAID_COMPONENT_NAME: typeof RehypeModule.MERMAID_COMPONENT_NAME;
let MERMAID_MARKER_ATTR: typeof RemarkModule.MERMAID_MARKER_ATTR;
let MERMAID_MARKER_PROP: typeof RemarkModule.MERMAID_MARKER_PROP;

beforeAll(async () => {
  await waitForDumiVisitor();
  ({ default: rehypePlugin, MERMAID_COMPONENT_NAME } = await import('../src/core/rehypePlugin'));
  ({ MERMAID_MARKER_ATTR, MERMAID_MARKER_PROP } = await import('../src/core/remarkPlugin'));
});

const markerPre = (code: string, prop = MERMAID_MARKER_PROP) => ({
  type: 'element',
  tagName: 'pre',
  properties: { [prop]: '' },
  children: [{ type: 'text', value: code }],
});

const run = (children: any[], options?: any) => {
  const tree = { type: 'root', children };
  rehypePlugin(options)(tree);
  return tree;
};

describe('rehypePlugin', () => {
  it('should export plugin', () => {
    expect(rehypePlugin).toBeTruthy();
  });

  it('should replace marker <pre> with the builtin component', () => {
    const code = 'graph TD;\n  A-->B;';
    const tree = run([markerPre(code)]);

    expect(tree.children[0]).toEqual({
      type: 'element',
      tagName: MERMAID_COMPONENT_NAME,
      children: [],
      JSXAttributes: [
        {
          type: 'JSXAttribute',
          name: 'code',
          value: JSON.stringify(code),
        },
      ],
    });
  });

  it('should also match the raw attribute name', () => {
    const tree = run([markerPre('graph TD;', MERMAID_MARKER_ATTR)]);

    expect(tree.children[0].tagName).toBe(MERMAID_COMPONENT_NAME);
  });

  it('should forward mermaidConfig as a JSX attribute', () => {
    const mermaidConfig = { securityLevel: 'loose' };
    const tree = run([markerPre('graph TD;')], { mermaidConfig });

    expect(tree.children[0].JSXAttributes).toHaveLength(2);
    expect(tree.children[0].JSXAttributes[1]).toEqual({
      type: 'JSXAttribute',
      name: 'mermaidConfig',
      value: JSON.stringify(mermaidConfig),
    });
  });

  it('should not repeat runtimeURL on every diagram', () => {
    const tree = run([markerPre('graph TD;')], {
      runtimeURL: 'https://cdn.example.com/mermaid.esm.min.mjs',
    });

    expect(tree.children[0].JSXAttributes).toHaveLength(1);
  });

  it('should forward defaultView as a JSX attribute', () => {
    const tree = run([markerPre('graph TD;')], { defaultView: 'code' });

    expect(tree.children[0].JSXAttributes).toHaveLength(2);
    expect(tree.children[0].JSXAttributes[1]).toEqual({
      type: 'JSXAttribute',
      name: 'defaultView',
      value: JSON.stringify('code'),
    });
  });

  it('should keep other elements untouched', () => {
    const pre = { type: 'element', tagName: 'pre', properties: {}, children: [] };
    const tree = run([pre]);

    expect(tree.children[0]).toBe(pre);
  });
});
