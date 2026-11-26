import type { IApi } from 'dumi';
import path from 'path';
import type { RehypePluginOptions } from './core';
import { MERMAID_COMPONENT_NAME, rehypePlugin, remarkPlugin } from './core';

const COMPONENT_DIR = path.join(__dirname, '../es/component');
const COMPONENT_PATH = path.join(COMPONENT_DIR, 'index.js');
const LOADER_SPECIFIER = 'dumi-plugin-mermaid/mermaid-loader';
const BUNDLED_LOADER = path.join(COMPONENT_DIR, 'loadMermaid.bundled.js');
const CDN_LOADER = path.join(COMPONENT_DIR, 'loadMermaid.cdn.js');

const toArr = <T>(val?: T | T[]) => {
  if (Array.isArray(val)) return val;
  // eslint-disable-next-line eqeqeq
  return val != null ? [val] : [];
};

/** cdn 版 loader 在构建期已不依赖 mermaid 包，地址写错只能在运行时才发现，所以尽早报错 */
const assertRuntimeURL = (runtimeURL?: string) => {
  if (runtimeURL === undefined) return;

  if (typeof runtimeURL !== 'string' || !/^https?:\/\//i.test(runtimeURL)) {
    throw new Error(
      `[dumi-plugin-mermaid] runtimeURL 必须是 http(s) 地址，且指向 mermaid 的 ESM 入口，例如 https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs（当前值：${JSON.stringify(
        runtimeURL,
      )}）`,
    );
  }
};

const VIEWS = ['preview', 'code'];

/** `defaultView` 拼错时组件会静默回退到 preview，所以构建期就拦住 */
const assertDefaultView = (defaultView?: string) => {
  if (defaultView === undefined || VIEWS.includes(defaultView)) return;

  throw new Error(
    `[dumi-plugin-mermaid] defaultView 只能是 'preview' 或 'code'（当前值：${JSON.stringify(
      defaultView,
    )}）`,
  );
};

export type IPluginOptions = RehypePluginOptions;

const mermaidPlugin = (api: IApi, options: IPluginOptions = {}) => {
  assertRuntimeURL(options.runtimeURL);
  assertDefaultView(options.defaultView);

  api.describe({ key: 'dumi-plugin:mermaid' });

  api.register({
    key: 'modifyConfig',
    stage: Infinity,
    fn: (memo: IApi['config']) => {
      memo.alias ??= {};
      memo.alias['dumi-plugin-mermaid/component'] = COMPONENT_PATH;
      // 构建期二选一：cdn 模式下 bundled 实现不进依赖图，mermaid 的 chunk 也随之消失
      memo.alias[LOADER_SPECIFIER] = options.runtimeURL ? CDN_LOADER : BUNDLED_LOADER;

      memo.extraRemarkPlugins = [remarkPlugin, ...toArr(memo.extraRemarkPlugins)];
      memo.extraRehypePlugins = [
        [rehypePlugin, options] as [typeof rehypePlugin, IPluginOptions],
        ...toArr(memo.extraRehypePlugins),
      ];

      return memo;
    },
  });

  api.register({
    key: 'modifyTheme',
    stage: Infinity,
    fn: (memo: IApi['config']) => {
      memo.builtins = Object.assign(
        {
          [MERMAID_COMPONENT_NAME]: {
            specifier: MERMAID_COMPONENT_NAME,
            source: COMPONENT_PATH,
          },
        },
        memo.builtins,
      );

      return memo;
    },
  });
};

/**
 * dumi 的 `plugins` 只接受字符串，所以带选项时需要在本地插件文件里包一层。
 */
export const defineMermaidPlugin =
  (options: IPluginOptions = {}): ((api: IApi) => void) =>
  (api: IApi) => {
    mermaidPlugin(api, options);
  };

export default mermaidPlugin;
