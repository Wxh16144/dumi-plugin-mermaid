import type { IApi } from 'dumi';
import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';
import type { RehypePluginOptions } from './core';
import { MERMAID_COMPONENT_NAME, rehypePlugin, remarkPlugin } from './core';

/**
 * 图表 builtin 的名字，也是 `.dumi/theme/builtins/<name>` 的目录名。
 *
 * 站点用本地主题覆盖图表组件时必须原样使用，因此作为公共常量导出，并由单测锁定。
 */
export { MERMAID_COMPONENT_NAME };

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

export type IPluginOptions = RehypePluginOptions & {
  /**
   * 渲染图表用的组件入口，默认用包内置的 `MermaidToggle`。
   *
   * 站点级启用交互控件（放大 / 复制 / 平移缩放）时设为 `'dumi-plugin-mermaid/viewer'`；
   * 也可以指向自己的组件（相对路径以项目根目录为基准）。
   */
  component?: string;
};

/**
 * dumi 会直接读 `source` 指向的文件来分析导出（`parseModule`），CJS 产物分析不出导出，
 * 会导致生成的 builtin 文件内容为空并抛 `opts.tpl or opts.tplPath must be supplied`。
 * 所以包名要按 `exports` 的 `import` 条件换算成 ESM 产物。
 */
const ESM_CONDITIONS = ['import', 'module', 'default'];

const pickConditionalTarget = (target: unknown): string | undefined => {
  if (typeof target === 'string') return target;
  if (!target || typeof target !== 'object' || Array.isArray(target)) return undefined;

  const record = target as Record<string, unknown>;
  for (const condition of ESM_CONDITIONS) {
    const picked = pickConditionalTarget(record[condition]);
    if (picked) return picked;
  }

  return undefined;
};

/** `@scope/pkg/sub` → `./sub`，`pkg` → `.` */
const toExportsSubpath = (specifier: string, pkgName?: string) => {
  if (!pkgName) return '.';
  const rest = specifier.slice(pkgName.length);
  return rest ? `.${rest}` : '.';
};

/** 从产物文件向上找包根目录，避免依赖 `exports` 是否暴露了 package.json */
const findPackageRoot = (from: string) => {
  let dir = path.dirname(from);

  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }

  return undefined;
};

const readPackageJson = (pkgRoot: string) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf-8')) as {
      name?: string;
      module?: string;
      exports?: unknown;
    };
  } catch {
    return undefined;
  }
};

/** 把包名解析成能被 dumi 分析的 ESM 产物；拿不到时退回 require 解析的结果 */
const resolvePackageEntry = (specifier: string, cwd: string) => {
  const cjsEntry = createRequire(path.join(cwd, 'noop.js')).resolve(specifier);
  const pkgRoot = findPackageRoot(cjsEntry);
  const pkg = pkgRoot ? readPackageJson(pkgRoot) : undefined;
  if (!pkgRoot || !pkg) return cjsEntry;

  const subpath = toExportsSubpath(specifier, pkg.name);
  const exportsField = pkg.exports;
  const isSubpathMap =
    !!exportsField &&
    typeof exportsField === 'object' &&
    !Array.isArray(exportsField) &&
    Object.keys(exportsField).some((key) => key === '.' || key.startsWith('./'));

  const target =
    pickConditionalTarget(
      isSubpathMap ? (exportsField as Record<string, unknown>)[subpath] : exportsField,
    ) ?? (subpath === '.' ? pkg.module : undefined);

  if (!target) return cjsEntry;

  // 目标可能指向目录，借用 require 解析一次扩展名
  const candidate = path.resolve(pkgRoot, target);
  if (fs.existsSync(candidate)) return candidate;

  try {
    return createRequire(path.join(pkgRoot, 'noop.js')).resolve(target);
  } catch {
    return cjsEntry;
  }
};

/**
 * 归一化 `component` 选项。
 *
 * - 未配置：用包内置的组件
 * - 绝对路径 / 相对路径：按项目根目录解析成绝对路径（webpack 才能稳定加载）
 * - 包名（如 `dumi-plugin-mermaid/viewer`）：从项目根目录解析成真实的 ESM 产物，
 *   这样产物路径与站点依赖的安装位置一致，也不会把包名硬编码进构建配置
 */
export const resolveComponentPath = (component: string | undefined, cwd: string): string => {
  if (component === undefined) return COMPONENT_PATH;

  if (typeof component !== 'string' || !component.trim()) {
    throw new Error(
      `[dumi-plugin-mermaid] component 不能是空字符串（当前值：${JSON.stringify(component)}）`,
    );
  }

  const specifier = component.trim();

  // 绝对路径直接放行：站点可能指向本地 TSX 源码，由打包器负责解析扩展名
  if (path.isAbsolute(specifier)) return toPosix(specifier);

  if (specifier.startsWith('.')) return toPosix(path.resolve(cwd, specifier));

  try {
    return toPosix(resolvePackageEntry(specifier, cwd));
  } catch {
    throw new Error(
      `[dumi-plugin-mermaid] 无法解析 component「${specifier}」（以项目根目录 ${cwd} 为基准）。` +
        '请确认该包已安装，或改用相对/绝对路径指向本地组件。',
    );
  }
};

const mermaidPlugin = (api: IApi, options: IPluginOptions = {}) => {
  const { component, ...rehypeOptions } = options;

  assertRuntimeURL(rehypeOptions.runtimeURL);
  assertDefaultView(rehypeOptions.defaultView);
  warnInsecureRuntimeURL(api, rehypeOptions.runtimeURL);

  const componentPath = resolveComponentPath(component, api.cwd);

  const tmpLoaderPath = path.join(api.paths.absTmpPath, TMP_DIR, TMP_LOADER);

  api.describe({ key: 'dumi-plugin:mermaid' });

  api.register({
    key: 'modifyConfig',
    stage: Infinity,
    fn: (memo: IApi['config']) => {
      memo.alias ??= {};
      memo.alias['dumi-plugin-mermaid/component'] = COMPONENT_PATH;
      // 构建期二选一：cdn 模式下 bundled 实现不进依赖图，mermaid 的 chunk 也随之消失
      memo.alias[LOADER_SPECIFIER] = rehypeOptions.runtimeURL ? tmpLoaderPath : BUNDLED_LOADER;

      memo.extraRemarkPlugins = [remarkPlugin, ...toArr(memo.extraRemarkPlugins)];
      memo.extraRehypePlugins = [
        [rehypePlugin, rehypeOptions] as [typeof rehypePlugin, RehypePluginOptions],
        ...toArr(memo.extraRehypePlugins),
      ];

      return memo;
    },
  });

  api.register({
    key: 'onGenerateFiles',
    fn: () => {
      if (!rehypeOptions.runtimeURL) return;

      writeRuntimeLoader(tmpLoaderPath, rehypeOptions.runtimeURL);
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
            // 站点可用 `component` 选项把整个图表换成别的实现（如带控件的 viewer）
            source: componentPath,
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
