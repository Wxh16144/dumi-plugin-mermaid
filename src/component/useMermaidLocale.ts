import { useIntl } from 'dumi';
import * as React from 'react';
import { type MermaidLocaleKey, type MermaidLocaleOverrides, resolveMessages } from './locales';

export type MermaidTranslate = (key: MermaidLocaleKey) => string;

/**
 * 跟随 dumi 当前语言取词条，优先级见 `resolveMessages`：
 * 插件 `locales` 选项 → 宿主 i18n 词条 → 内置词表 → key 本身。
 *
 * 这里整表解析一次并 memo（组件的文案数量固定且很少），`t` 只做一次表查询。
 *
 * 这里读 `intl.messages` 而不是 `formatMessage({ id, defaultMessage })`：
 * 内置词表已保证每个 key 都有值，用 `formatMessage` 反而会在 id 缺失时触发
 * react-intl 的 missing-translation 告警，污染宿主控制台。
 *
 * 注意：弹窗是 Portal 到 `document.body` 的，但 React context 沿组件树传递，
 * 因此弹窗内部调用本 hook 同样能拿到正确的 locale。
 */
export default function useMermaidLocale(overrides?: MermaidLocaleOverrides): MermaidTranslate {
  const { locale, messages: hostMessages } = useIntl();

  const messages = React.useMemo(
    () => resolveMessages(locale, overrides, hostMessages as Record<string, unknown> | undefined),
    [locale, overrides, hostMessages],
  );

  return React.useCallback((key: MermaidLocaleKey) => messages[key] ?? key, [messages]);
}
