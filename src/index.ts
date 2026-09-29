import type { IApi } from 'dumi';
import path from 'path';
import type { RehypePluginOptions } from './core';
import { MERMAID_COMPONENT_NAME, rehypePlugin, remarkPlugin } from './core';

const COMPONENT_PATH = path.join(__dirname, '../es/component/index.js');

/** dumi 的 `SourceCode` 从裸包名取 Prism，需要保证指向同一个实例 */
const resolveDumiPrism = (cwd: string) => {
  const dumiDir = path.dirname(require.resolve('dumi/package.json', { paths: [cwd] }));
  // 指向包目录而非 `main`，让打包器按 `module` 字段取 ESM
  return path.dirname(require.resolve('prism-react-renderer/package.json', { paths: [dumiDir] }));
};

const toArr = <T>(val?: T | T[]) => {
  if (Array.isArray(val)) return val;
  // eslint-disable-next-line eqeqeq
  return val != null ? [val] : [];
};

export type IPluginOptions = RehypePluginOptions;

export default (api: IApi, options: IPluginOptions = {}) => {
  api.describe({ key: 'dumi-plugin:mermaid' });

  api.register({
    key: 'modifyConfig',
    stage: Infinity,
    fn: (memo: IApi['config']) => {
      memo.alias ??= {};
      memo.alias['dumi-plugin-mermaid/component'] = COMPONENT_PATH;

      /**
       * FIXME: 这里最好的方式应该是 dumi 将 prism-react-renderer 的实例暴露出来
       * 但是考虑最大范围的兼容性，这里通过别名强制指向 dumi 使用的 Prism 实例
       */
      memo.alias['prism-react-renderer$'] = resolveDumiPrism(api.cwd);

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
