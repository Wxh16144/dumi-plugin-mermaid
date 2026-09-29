import type { IApi } from 'dumi';
import path from 'path';
import type { RehypePluginOptions } from './core';
import { MERMAID_COMPONENT_NAME, rehypePlugin, remarkPlugin } from './core';

const COMPONENT_PATH = path.join(__dirname, '../es/component/index.js');

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
