import { describe, expect, it } from 'vitest';
import {
  readSvgSize,
  readViewBox,
  stripMaxWidth,
  toDataUrl,
  toStandaloneSvg,
  withExplicitSize,
  withIdPrefix,
} from '../src/viewer/svg';

/** mermaid v11 在 `useMaxWidth: true` 下的典型输出 */
const MERMAID_SVG = [
  '<svg id="mermaid-1" width="100%" xmlns="http://www.w3.org/2000/svg" class="journey"',
  ' style="max-width: 1054px;" viewBox="0 0 1054 612" role="graphics-document document">',
  '<style>#mermaid-1{font-family:sans-serif}</style><g></g></svg>',
].join('');

describe('readViewBox', () => {
  it('should parse a four number viewBox', () => {
    expect(readViewBox('0 0 1054 612')).toEqual({ width: 1054, height: 612 });
  });

  it('should accept comma separators and extra spaces', () => {
    expect(readViewBox('  0,0 , 120, 40 ')).toEqual({ width: 120, height: 40 });
  });

  it('should reject malformed or non positive input', () => {
    expect(readViewBox(undefined)).toBeNull();
    expect(readViewBox('')).toBeNull();
    expect(readViewBox('0 0 100')).toBeNull();
    expect(readViewBox('0 0 100 px')).toBeNull();
    expect(readViewBox('0 0 0 100')).toBeNull();
    expect(readViewBox('0 0 -10 100')).toBeNull();
  });
});

describe('readSvgSize', () => {
  it('should fall back to viewBox when the size is a percentage', () => {
    expect(readSvgSize(MERMAID_SVG)).toEqual({ width: 1054, height: 612 });
  });

  it('should prefer explicit pixel attributes', () => {
    const svg = '<svg width="320" height="120" viewBox="0 0 1054 612"></svg>';

    expect(readSvgSize(svg)).toEqual({ width: 320, height: 120 });
  });

  it('should ignore percentage height as well', () => {
    const svg = '<svg width="100%" height="100%" viewBox="0 0 10 20"></svg>';

    expect(readSvgSize(svg)).toEqual({ width: 10, height: 20 });
  });

  it('should return null when nothing usable is available', () => {
    expect(readSvgSize('<svg></svg>')).toBeNull();
    expect(readSvgSize('<div>not an svg</div>')).toBeNull();
  });
});

describe('stripMaxWidth', () => {
  it('should drop the injected max-width', () => {
    const result = stripMaxWidth(MERMAID_SVG);

    expect(result).not.toContain('max-width');
    // 只摘 max-width 的声明，其余属性原样保留
    expect(result).toContain('viewBox="0 0 1054 612"');
    expect(result).toContain('width="100%"');
    expect(result).toContain('role="graphics-document document"');
  });

  it('should keep other declarations in the style attribute', () => {
    const svg = '<svg style="max-width: 100px; color: red" viewBox="0 0 1 1"></svg>';

    expect(stripMaxWidth(svg)).toContain('style="color: red"');
    expect(stripMaxWidth(svg)).not.toContain('max-width');
  });

  it('should keep other declarations even when max-width is not first', () => {
    const svg = '<svg style="color: red; max-width: 100px" viewBox="0 0 1 1"></svg>';

    expect(stripMaxWidth(svg)).toContain('style="color: red"');
  });

  it('should leave the svg untouched when there is no max-width', () => {
    const svg = '<svg width="10" height="10" style="color: red"></svg>';

    expect(stripMaxWidth(svg)).toBe(svg);
  });
});

describe('withExplicitSize', () => {
  it('should replace the percentage width with the viewBox size', () => {
    const result = withExplicitSize(MERMAID_SVG);

    expect(result).toContain('width="1054" height="612"');
    expect(result).not.toContain('width="100%"');
  });

  it('should replace existing pixel attributes instead of duplicating them', () => {
    const result = withExplicitSize('<svg width="10" height="10" viewBox="0 0 40 20"></svg>');

    // viewBox 需要保留（绘制时靠它做等比缩放），只替换 width/height 且不能重复
    expect(result).toContain('viewBox="0 0 40 20"');
    expect(result).toContain('width="40" height="20"');
    expect(result).not.toContain('width="10"');
    expect(result.match(/\swidth=/g)).toHaveLength(1);
  });

  it('should handle a self closing root tag', () => {
    expect(withExplicitSize('<svg viewBox="0 0 8 6"/>')).toBe(
      '<svg viewBox="0 0 8 6" width="8" height="6"/>',
    );
  });

  it('should keep the svg when there is no viewBox to derive a size from', () => {
    const svg = '<svg width="100%"></svg>';

    expect(withExplicitSize(svg)).toBe(svg);
  });
});

describe('toStandaloneSvg', () => {
  it('should produce a self contained svg with a pixel size', () => {
    const result = toStandaloneSvg(MERMAID_SVG);

    expect(result).toContain('width="1054" height="612"');
    expect(result).not.toContain('max-width');
    expect(result).not.toContain('width="100%"');
    // 图表内容本身不受影响
    expect(result).toContain('#mermaid-1{font-family:sans-serif}');
  });
});

describe('toDataUrl', () => {
  it('should encode the svg so it can be used as an image source', () => {
    const url = toDataUrl('<svg width="10" height="10"></svg>');

    expect(url.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
    expect(url).not.toContain('<');
    expect(decodeURIComponent(url.split(',')[1])).toBe('<svg width="10" height="10"></svg>');
  });
});

describe('withIdPrefix', () => {
  const NODES =
    '<svg id="mermaid-1" viewBox="0 0 10 10">' +
    '<defs><marker id="arrow"/><clipPath id="clip"><rect/></clipPath></defs>' +
    '<path id="edge" marker-end="url(#arrow)" clip-path="url(#clip)"/>' +
    '<a href="#edge"><text>node</text></a></svg>';

  it('should prefix every defined id', () => {
    const result = withIdPrefix(NODES, 'x-');

    expect(result).toContain('id="x-mermaid-1"');
    expect(result).toContain('id="x-arrow"');
    expect(result).toContain('id="x-clip"');
    expect(result).toContain('id="x-edge"');
  });

  it('should rewrite references to the prefixed ids', () => {
    const result = withIdPrefix(NODES, 'x-');

    expect(result).toContain('url(#x-arrow)');
    expect(result).toContain('url(#x-clip)');
    expect(result).toContain('href="#x-edge"');
    expect(result).not.toContain('url(#arrow)');
  });

  it('should rewrite selectors inside the embedded style tag', () => {
    // mermaid 把配色写在 svg 内的 <style> 里，选择器以根 id 为前缀；
    // 不改这些选择器会让样式全部失配，节点退回默认的黑色填充
    const svg =
      '<svg id="mermaid-1"><style>#mermaid-1{fill:#333}#mermaid-1 .node rect{fill:#ECECFF}</style>' +
      '<g class="node"><rect/></g></svg>';

    const result = withIdPrefix(svg, 'x-');

    expect(result).toContain('#x-mermaid-1{fill:#333}');
    expect(result).toContain('#x-mermaid-1 .node rect{fill:#ECECFF}');
    expect(result).not.toContain('#mermaid-1{');
  });

  it('should keep external links untouched', () => {
    const svg =
      '<svg id="s"><a href="https://example.com" target="_blank"><text>x</text></a></svg>';

    expect(withIdPrefix(svg, 'x-')).toContain('href="https://example.com"');
  });

  it('should not confuse ids that are prefixes of others', () => {
    const svg = '<svg id="a"><g id="ab"/><path marker-end="url(#ab)"/></svg>';
    const result = withIdPrefix(svg, 'x-');

    expect(result).toContain('id="x-ab"');
    expect(result).toContain('url(#x-ab)');
    expect(result).not.toContain('x-a-b');
  });

  it('should return the svg as is when it has no id', () => {
    const svg = '<svg viewBox="0 0 10 10"><text>x</text></svg>';

    expect(withIdPrefix(svg, 'x-')).toBe(svg);
  });
});
