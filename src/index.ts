import type { IApi } from 'dumi';
import fs from 'fs';
import path from 'path';
import type { RehypePluginOptions } from './core';
import { MERMAID_COMPONENT_NAME, rehypePlugin, remarkPlugin } from './core';

const COMPONENT_DIR = path.join(__dirname, '../es/component');
const COMPONENT_PATH = path.join(COMPONENT_DIR, 'index.js');
const LOADER_SPECIFIER = 'dumi-plugin-mermaid/mermaid-loader';
const BUNDLED_LOADER = path.join(COMPONENT_DIR, 'loadMermaid.bundled.js');
const CDN_LOADER = path.join(COMPONENT_DIR, 'loadMermaid.cdn.js');

/** 生成物只放在 .dumi/tmp 下，随每次构建重新生成，不进版本库 */
const TMP_DIR = 'plugin-mermaid';
const TMP_LOADER = 'loadMermaid.js';

const toArr = <T>(val?: T | T[]) => {
  if (Array.isArray(val)) return val;
  // eslint-disable-next-line eqeqeq
  return val != null ? [val] : [];
};

const toPosix = (filePath: string) => filePath.replace(/\\/g, '/');

/**
 * 只接受能被浏览器 `import()` 的地址：
 * 绝对地址、协议相对地址，或站内绝对路径（自托管 mermaid）。
 */
const assertRuntimeURL = (runtimeURL?: string) => {
  if (runtimeURL === undefined) return;

  if (typeof runtimeURL !== 'string' || !/^(https?:\/\/|\/\/|\/)/i.test(runtimeURL)) {
    throw new Error(
      `[dumi-plugin-mermaid] runtimeURL 必须是 http(s) 地址、// 开头的协议相对地址，或以 / 开头的站内路径，且指向 mermaid 的 ESM 入口，例如 https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs（当前值：${JSON.stringify(
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

/** https 站点加载 http 资源会被浏览器拦掉，这种配置要尽早提示 */
const warnInsecureRuntimeURL = (api: IApi, runtimeURL?: string) => {
  if (runtimeURL && /^http:\/\//i.test(runtimeURL)) {
    api.logger.warn(
      `[dumi-plugin-mermaid] runtimeURL 使用了 http，https 站点会因混合内容被浏览器拦截：${runtimeURL}`,
    );
  }
};

/**
 * 生成一个带默认地址的 loader 模块。
 * 地址只出现在这里一次，组件不再逐个图表接收 `runtimeURL`；
 * CDN 模式下手工引入 `dumi-plugin-mermaid/component` 也照样能加载。
 */
const writeRuntimeLoader = (filePath: string, runtimeURL: string) => {
  const content = `import loadMermaid from '${toPosix(CDN_LOADER)}';

export const defaultRuntimeURL = ${JSON.stringify(runtimeURL)};

export default (runtimeURL) => loadMermaid(runtimeURL || defaultRuntimeURL);
`;

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
};

export type IPluginOptions = RehypePluginOptions;

const mermaidPlugin = (api: IApi, options: IPluginOptions = {}) => {
  assertRuntimeURL(options.runtimeURL);
  assertDefaultView(options.defaultView);
  warnInsecureRuntimeURL(api, options.runtimeURL);

  const tmpLoaderPath = path.join(api.paths.absTmpPath, TMP_DIR, TMP_LOADER);

  api.describe({ key: 'dumi-plugin:mermaid' });

  api.register({
    key: 'modifyConfig',
    stage: Infinity,
    fn: (memo: IApi['config']) => {
      memo.alias ??= {};
      memo.alias['dumi-plugin-mermaid/component'] = COMPONENT_PATH;
      // 构建期二选一：cdn 模式下 bundled 实现不进依赖图，mermaid 的 chunk 也随之消失
      memo.alias[LOADER_SPECIFIER] = options.runtimeURL ? tmpLoaderPath : BUNDLED_LOADER;

      memo.extraRemarkPlugins = [remarkPlugin, ...toArr(memo.extraRemarkPlugins)];
      memo.extraRehypePlugins = [
        [rehypePlugin, options] as [typeof rehypePlugin, IPluginOptions],
        ...toArr(memo.extraRehypePlugins),
      ];

      return memo;
    },
  });

  api.register({
    key: 'onGenerateFiles',
    fn: () => {
      if (!options.runtimeURL) return;

      writeRuntimeLoader(tmpLoaderPath, options.runtimeURL);
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
