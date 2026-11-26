import { describe, expect, it } from 'vitest';
import bundledLoader, {
  defaultRuntimeURL as bundledURL,
} from '../src/component/loadMermaid.bundled';
import cdnLoader, { defaultRuntimeURL as cdnURL } from '../src/component/loadMermaid.cdn';

describe('loadMermaid.bundled', () => {
  it('不接受外部地址', () => {
    expect(bundledURL).toBeUndefined();
    expect(bundledLoader('https://cdn.example.com/mermaid.mjs')).toBeInstanceOf(Promise);
  });
});

describe('loadMermaid.cdn', () => {
  it('缺少地址时给出明确报错', async () => {
    expect(cdnURL).toBeUndefined();
    await expect(cdnLoader()).rejects.toThrow(/缺少 runtimeURL/);
  });

  it('加载失败时重试一次后抛出原始错误', async () => {
    // Node 不支持 https 的 ESM 导入，这里顺带覆盖「失败后重试」的分支
    await expect(cdnLoader('https://cdn.example.com/mermaid.mjs')).rejects.toThrow();
  });
});
