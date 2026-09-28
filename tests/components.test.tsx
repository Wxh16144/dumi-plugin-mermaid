import { describe, expect, it } from 'vitest';

describe('export', () => {
  it('should work', async () => {
    // @ts-ignore
    const all: any = await import('dumi-plugin-mermaid/component');

    expect(Object.keys(all)).toMatchSnapshot();
  });

  it('defaults to the switchable component', async () => {
    // @ts-ignore
    const all: any = await import('dumi-plugin-mermaid/component');

    expect(all.default).toBe(all.MermaidToggle);
  });
});
