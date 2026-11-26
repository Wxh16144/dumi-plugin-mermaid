import enUS, { type MermaidLocaleKey } from './en-US';
import zhCN from './zh-CN';

export type { MermaidLocaleKey };

/**
 * 内置词表。
 *
 * 为什么插件要自带词表？dumi 的 `messages` 只从**主题**的 `themeData.locales`
 * （主题包目录下的 `locales/*.json`）收集，普通插件没有官方注入点，
 * 所以这里只借用 dumi 的语言上下文（`useIntl().locale`）来选表。
 * 新增语言：加一份词表并在这里注册即可。
 */
export const BUILTIN_LOCALES: Record<string, Record<MermaidLocaleKey, string>> = {
  'en-US': enUS,
  'zh-CN': zhCN,
};

/** 兜底语言：任何 key 都能在这里找到值，保证不会渲染出空文案 */
export const DEFAULT_LOCALE = 'en-US';

/** 全部词条 key，用于遍历（同时保证任何语言都能拿到完整集合） */
export const MERMAID_LOCALE_KEYS = Object.keys(
  BUILTIN_LOCALES[DEFAULT_LOCALE],
) as MermaidLocaleKey[];

/** `zh-TW` / `zh_TW` → `zh`，用于同语言不同地区的模糊回退 */
const toLanguagePrefix = (locale: string) => locale.split(/[-_]/)[0].toLowerCase();

/**
 * 取内置词表：精确匹配 → 同语言前缀 → `en-US` 兜底。
 *
 * 例如 `zh-TW` 没有专属词表时退到 `zh-CN`；`ja-JP` 则整表退到英文，
 * 未翻译的 key 至少不会渲染成空。
 */
const pickBuiltin = (locale?: string): Record<string, string> => {
  const merged: Record<string, string> = { ...BUILTIN_LOCALES[DEFAULT_LOCALE] };

  if (!locale) return merged;

  const prefix = toLanguagePrefix(locale);
  const prefixed = Object.keys(BUILTIN_LOCALES).find(
    (id) => id !== locale && toLanguagePrefix(id) === prefix,
  );

  if (prefixed) Object.assign(merged, BUILTIN_LOCALES[prefixed]);
  Object.assign(merged, BUILTIN_LOCALES[locale]);

  return merged;
};

/**
 * 空字符串（含纯空白）视为「没翻译」，继续向下回退。
 * 否则词表里一个空的 `""` 就会渲染出没有名称的按钮，无障碍名称直接失效。
 */
const isUsable = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';

export type MermaidMessageSources = {
  /** dumi 当前语言，对应 `useIntl().locale` */
  locale?: string;
  /**
   * 宿主的 i18n 词条，对应 `useIntl().messages`（即 dumi `themeData.locales` 里当前语言那份）。
   * 站点用 `.dumi/theme/locales/*.json` 或自定义主题补充同名词条时会走这里。
   */
  hostMessages?: Record<string, unknown>;
};

/**
 * 取单个词条，优先级从高到低：
 *
 * 1. 宿主 i18n 词条 —— 站点/主题提供的同名 key
 * 2. 内置词表（当前语言 → 同语言前缀 → `en-US`）
 * 3. key 本身（兜底，正常不会走到）
 *
 * 纯函数，不依赖 React 与 DOM。
 */
export const resolveMessage = (key: MermaidLocaleKey, sources: MermaidMessageSources): string => {
  const fromHost = sources.hostMessages?.[key];
  if (isUsable(fromHost)) return fromHost;

  return pickBuiltin(sources.locale)[key] ?? key;
};

/**
 * 解析某语言下**完整**的词条表（每个 key 都有值），合并规则见 `resolveMessage`。
 * 纯函数，不依赖 React 与 DOM。
 */
export const resolveMessages = (
  locale?: string,
  hostMessages?: Record<string, unknown>,
): Record<string, string> => {
  const sources: MermaidMessageSources = { locale, hostMessages };

  return MERMAID_LOCALE_KEYS.reduce<Record<string, string>>((acc, key) => {
    acc[key] = resolveMessage(key, sources);
    return acc;
  }, {});
};
