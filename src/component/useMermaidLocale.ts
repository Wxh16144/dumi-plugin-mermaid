import { useIntl } from 'dumi';
import * as React from 'react';
import { type MermaidLocaleKey, resolveMessages } from './locales';

export type MermaidTranslate = (key: MermaidLocaleKey) => string;

/**
 * 跟随 dumi 当前语言取词条，优先级见 `resolveMessages`：
 * 宿主 i18n 词条 → 内置词表 → key 本身。
 *
 * 语言在运行时读取（`useIntl`），因此站点切换语言无需重新构建；
 * 这里整表解析一次并 memo（词条数量固定且很少），`t` 只做一次表查询。
 *
 * 不用 `formatMessage({ id, defaultMessage })`：内置词表已保证每个 key 都有值，
 * 用 `formatMessage` 反而会在 id 缺失时触发 react-intl 的 missing-translation 告警。
 *
 * 注意：弹窗通过 Portal 挂到 `document.body`，但 React context 沿组件树传递，
 * 因此弹窗内部调用本 hook 同样能拿到正确的语言。
 */
export default function useMermaidLocale(): MermaidTranslate {
  const { locale, messages } = useIntl();

  const table = React.useMemo(
    () => resolveMessages(locale, messages as unknown as Record<string, unknown> | undefined),
    [locale, messages],
  );

  return React.useCallback((key: MermaidLocaleKey) => table[key] ?? key, [table]);
}
