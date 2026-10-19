import type { IApi } from 'dumi';
import path from 'path';
import type { RehypePluginOptions } from './core';
import { MERMAID_COMPONENT_NAME, rehypePlugin, remarkPlugin } from './core';

const COMPONENT_PATH = path.join(__dirname, '../es/component/index.js');

/**
 * 插件配置键。
 *
 * umi 4 不再支持 `plugins: [['name', options]]` 这种元组写法（`plugins` 的契约就是 `string[]`，
 * 加载时会断言插件必须是字符串），也不会把配置作为第二个参数传给插件
 * （`Plugin.apply()(api)` 只传了 api）。官方约定是：用 `api.describe({ key, config: { schema } })`
 * 声明配置键，用户在同名顶层配置里写选项，插件从解析后的 config 上读取。
 *
 * 键名与包名保持一致，用户看到 `plugins: ['dumi-plugin-mermaid']` 时能直接猜到配置写在哪个键下。
 */
const PLUGIN_KEY = 'dumi-plugin-mermaid';

const toArr = <T>(val?: T | T[]) => {
  if (Array.isArray(val)) return val;
  // eslint-disable-next-line eqeqeq
  return val != null ? [val] : [];
};

export type IPluginOptions = RehypePluginOptions;

export default (api: IApi, options: IPluginOptions = {}) => {
  api.describe({
    key: PLUGIN_KEY,
    config: {
      // 声明 schema 后该键才会被 umi 的配置校验接受；默认 {} 保证未配置时也有值
      default: {},
      schema: (Joi) =>
        Joi.object({
          mermaidConfig: Joi.object(),
          // { 'zh-CN': { 'mermaid.actions.expand': '全屏查看' } }
          locales: Joi.object().pattern(
            Joi.string(),
            Joi.object().pattern(Joi.string(), Joi.string()),
          ),
        }),
    },
  });

  api.register({
    key: 'modifyConfig',
    stage: Infinity,
    fn: (memo: IApi['config']) => {
      // 配置以 plugin key 存在解析后的 config 上；第二参数只是兜底（umi 4 下恒为 undefined）
      const pluginOptions: IPluginOptions = {
        ...options,
        ...(memo as unknown as Record<string, IPluginOptions | undefined>)[PLUGIN_KEY],
      };

      memo.alias ??= {};
      memo.alias['dumi-plugin-mermaid/component'] = COMPONENT_PATH;

      memo.extraRemarkPlugins = [remarkPlugin, ...toArr(memo.extraRemarkPlugins)];
      memo.extraRehypePlugins = [
        [rehypePlugin, pluginOptions] as [typeof rehypePlugin, IPluginOptions],
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
