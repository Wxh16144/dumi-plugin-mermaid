import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import plugin, { defineMermaidPlugin } from '../src';

type Registration = { key: string; fn: (memo: any) => any };

const createApi = (absTmpPath: string) => {
  const registrations: Registration[] = [];
  const api = {
    paths: { absTmpPath },
    logger: { warn: vi.fn() },
    describe: vi.fn(),
    register: vi.fn((registration: Registration) => {
      registrations.push(registration);
    }),
  };

  return { api, registrations };
};

const tmpDirs: string[] = [];

const createTmpDir = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dumi-plugin-mermaid-'));
  tmpDirs.push(dir);

  return dir;
};

const runPlugin = (setup: (api: any) => void, absTmpPath = createTmpDir()) => {
  const { api, registrations } = createApi(absTmpPath);
  setup(api);

  const run = (key: string, memo: any = { alias: {} }) =>
    registrations.find((item) => item.key === key)!.fn(memo);

  return { api, run };
};

const runModifyConfig = (options: any) =>
  runPlugin((api) => plugin(api, options)).run('modifyConfig');

afterEach(() => {
  tmpDirs.splice(0).forEach((dir) => fs.rmSync(dir, { recursive: true, force: true }));
});

describe('plugin', () => {
  it('默认使用本地打包的 mermaid', () => {
    const { run } = runPlugin((api) => plugin(api, {}), createTmpDir());
    const config = run('modifyConfig');

    expect(path.basename(config.alias['dumi-plugin-mermaid/mermaid-loader'])).toBe(
      'loadMermaid.bundled.js',
    );
    expect(config.extraRehypePlugins[0][1]).toEqual({});
  });

  it('CDN 模式下 alias 到构建期生成的模块，且不会把地址写进每个图表', () => {
    const absTmpPath = createTmpDir();
    const runtimeURL = 'https://cdn.example.com/mermaid.esm.min.mjs';
    const { run } = runPlugin((api) => plugin(api, { runtimeURL }), absTmpPath);

    const config = run('modifyConfig');
    const loaderPath = config.alias['dumi-plugin-mermaid/mermaid-loader'];

    expect(loaderPath).toBe(path.join(absTmpPath, 'plugin-mermaid', 'loadMermaid.js'));
    expect(config.extraRehypePlugins[0][1]).toEqual({ runtimeURL });
  });

  it('生成的 loader 模块把地址注入一次并复用 cdn 实现', () => {
    const absTmpPath = createTmpDir();
    const runtimeURL = 'https://cdn.example.com/mermaid.esm.min.mjs';
    const { run } = runPlugin((api) => plugin(api, { runtimeURL }), absTmpPath);

    run('onGenerateFiles');

    const content = fs.readFileSync(path.join(absTmpPath, 'plugin-mermaid', 'loadMermaid.js'), {
      encoding: 'utf-8',
    });

    expect(content).toContain(`export const defaultRuntimeURL = ${JSON.stringify(runtimeURL)};`);
    expect(content).toContain('loadMermaid.cdn.js');
    expect(content).toContain('loadMermaid(runtimeURL || defaultRuntimeURL)');
  });

  it('未配置 runtimeURL 时不生成 loader 模块', () => {
    const absTmpPath = createTmpDir();
    const { run } = runPlugin((api) => plugin(api, {}), absTmpPath);

    run('onGenerateFiles');

    expect(fs.existsSync(path.join(absTmpPath, 'plugin-mermaid'))).toBe(false);
  });

  it('runtimeURL 非法时构建期直接报错', () => {
    const setup = (options: any) => () => plugin({ describe: vi.fn() } as any, options);

    expect(setup({ runtimeURL: '' })).toThrow(/runtimeURL 必须是/);
    expect(setup({ runtimeURL: 'cdn.example.com/mermaid.mjs' })).toThrow(/runtimeURL 必须是/);
    expect(setup({ runtimeURL: 'ftp://cdn.example.com/mermaid.mjs' })).toThrow(/runtimeURL 必须是/);
  });

  it('支持自托管的站内路径与协议相对地址', () => {
    for (const runtimeURL of ['/mermaid.esm.min.mjs', '//cdn.example.com/mermaid.esm.min.mjs']) {
      const config = runModifyConfig({ runtimeURL });

      expect(path.basename(config.alias['dumi-plugin-mermaid/mermaid-loader'])).not.toBe(
        'loadMermaid.bundled.js',
      );
    }
  });

  it('http 地址给出混合内容警告', () => {
    const { api } = runPlugin((api) =>
      plugin(api, { runtimeURL: 'http://cdn.example.com/mermaid.mjs' }),
    );

    expect(api.logger.warn).toHaveBeenCalledWith(expect.stringContaining('混合内容'));
  });

  it('defineMermaidPlugin 等价于直接传 options', () => {
    const runtimeURL = 'https://unpkg.com/mermaid@11/dist/mermaid.esm.min.mjs';
    const absTmpPath = createTmpDir();

    const wrapped = runPlugin((api) => defineMermaidPlugin({ runtimeURL })(api), absTmpPath).run(
      'modifyConfig',
    );
    const direct = runPlugin((api) => plugin(api, { runtimeURL }), absTmpPath).run('modifyConfig');

    expect(wrapped).toEqual(direct);
  });

  it('defaultView 非法时构建期直接报错', () => {
    expect(() => plugin({ describe: vi.fn() } as any, { defaultView: 'svg' as any })).toThrow(
      /defaultView 只能是 'preview' 或 'code'/,
    );
  });
});
