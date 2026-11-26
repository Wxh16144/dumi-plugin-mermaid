import path from 'path';
import { describe, expect, it, vi } from 'vitest';
import plugin, { defineMermaidPlugin } from '../src';

const createApi = () => {
  const registrations: { key: string; fn: (memo: any) => any }[] = [];
  const api = {
    describe: vi.fn(),
    register: vi.fn((registration: { key: string; fn: (memo: any) => any }) => {
      registrations.push(registration);
    }),
  };

  return { api, registrations };
};

const runPlugin = (setup: (api: any) => void) => {
  const { api, registrations } = createApi();
  setup(api);

  const modifyConfig = registrations.find((item) => item.key === 'modifyConfig')!;

  return modifyConfig.fn({ alias: {} });
};

const runModifyConfig = (options: any) => runPlugin((api) => plugin(api, options));

describe('plugin', () => {
  it('默认使用本地打包的 mermaid', () => {
    const config = runModifyConfig({});

    expect(path.basename(config.alias['dumi-plugin-mermaid/mermaid-loader'])).toBe(
      'loadMermaid.bundled.js',
    );
    expect(config.extraRehypePlugins[0][1]).toEqual({});
  });

  it('配置 runtimeURL 后切到 cdn 实现并透传地址', () => {
    const runtimeURL = 'https://cdn.example.com/mermaid.esm.min.mjs';
    const config = runModifyConfig({ runtimeURL });

    expect(path.basename(config.alias['dumi-plugin-mermaid/mermaid-loader'])).toBe(
      'loadMermaid.cdn.js',
    );
    expect(config.extraRehypePlugins[0][1]).toEqual({ runtimeURL });
  });

  it('runtimeURL 非法时构建期直接报错', () => {
    expect(() => plugin({ describe: vi.fn() } as any, { runtimeURL: '' })).toThrow(
      /runtimeURL 必须是 http\(s\) 地址/,
    );
    expect(() =>
      plugin({ describe: vi.fn() } as any, { runtimeURL: 'cdn.example.com/mermaid.mjs' }),
    ).toThrow(/runtimeURL 必须是 http\(s\) 地址/);
  });

  it('defineMermaidPlugin 等价于直接传 options', () => {
    const runtimeURL = 'https://unpkg.com/mermaid@11/dist/mermaid.esm.min.mjs';
    const wrapped = runPlugin((api) => defineMermaidPlugin({ runtimeURL })(api));

    expect(wrapped).toEqual(runModifyConfig({ runtimeURL }));
  });

  it('defaultView 非法时构建期直接报错', () => {
    expect(() => plugin({ describe: vi.fn() } as any, { defaultView: 'svg' as any })).toThrow(
      /defaultView 只能是 'preview' 或 'code'/,
    );
  });
});
