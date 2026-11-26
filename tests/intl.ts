/**
 * 单测里可控的 dumi 语言环境。
 *
 * 生产代码通过 `import { useIntl } from 'dumi'` 读取当前语言与词条，
 * dumi 构建期会把 `dumi` alias 到客户端运行时；node 侧入口没有这些导出，
 * 所以单测用 `tests/setup.ts` 里的 mock 提供，并从这里读写。
 */
export const testIntl = {
  locale: 'en-US',
  messages: {} as Record<string, string>,
};

export const setTestIntl = (locale: string, messages: Record<string, string> = {}) => {
  testIntl.locale = locale;
  testIntl.messages = messages;
};

export const resetTestIntl = () => setTestIntl('en-US');
