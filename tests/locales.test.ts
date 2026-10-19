import { describe, expect, it } from 'vitest';
import {
  BUILTIN_LOCALES,
  DEFAULT_LOCALE,
  MERMAID_LOCALE_KEYS,
  type MermaidLocaleKey,
  resolveMessage,
  resolveMessages,
  toLanguagePrefix,
} from '../src/component/locales';
import enUS from '../src/component/locales/en-US';
import zhCN from '../src/component/locales/zh-CN';

const EN = 'en-US';
const ZH = 'zh-CN';

describe('toLanguagePrefix', () => {
  it('should strip the region part', () => {
    expect(toLanguagePrefix('zh-CN')).toBe('zh');
    expect(toLanguagePrefix('en-US')).toBe('en');
  });

  it('should tolerate underscore and letter case', () => {
    expect(toLanguagePrefix('zh_TW')).toBe('zh');
    expect(toLanguagePrefix('ZH-Hant')).toBe('zh');
  });

  it('should keep a bare language untouched', () => {
    expect(toLanguagePrefix('ja')).toBe('ja');
  });
});

describe('builtin dictionaries', () => {
  it('should cover exactly the same keys in every locale', () => {
    const expected = Object.keys(enUS).sort();

    for (const [locale, messages] of Object.entries(BUILTIN_LOCALES)) {
      expect(`${locale}:${Object.keys(messages).sort().join(',')}`).toBe(
        `${locale}:${expected.join(',')}`,
      );
    }
  });

  it('should not leave empty values behind', () => {
    for (const messages of Object.values(BUILTIN_LOCALES)) {
      for (const [key, value] of Object.entries(messages)) {
        expect(`${key}=${value}`).not.toMatch(/=$/);
      }
    }
  });

  it('should ship a dictionary for the default locale', () => {
    expect(BUILTIN_LOCALES[DEFAULT_LOCALE]).toBeTruthy();
  });
});

describe('resolveMessages', () => {
  it('should pick the exact locale', () => {
    expect(resolveMessages(ZH)['mermaid.tabs.preview']).toBe(zhCN['mermaid.tabs.preview']);
    expect(resolveMessages(EN)['mermaid.tabs.preview']).toBe(enUS['mermaid.tabs.preview']);
  });

  it('should fall back to the same language when the region is missing', () => {
    // zh-TW / zh-HK 没有专属词表，应退到同语言的 zh-CN
    expect(resolveMessages('zh-TW')['mermaid.tabs.preview']).toBe(zhCN['mermaid.tabs.preview']);
    expect(resolveMessages('zh')['mermaid.tabs.preview']).toBe(zhCN['mermaid.tabs.preview']);
  });

  it('should fall back to the default locale for unknown languages', () => {
    expect(resolveMessages('ja-JP')['mermaid.tabs.preview']).toBe(enUS['mermaid.tabs.preview']);
    expect(resolveMessages('')['mermaid.tabs.preview']).toBe(enUS['mermaid.tabs.preview']);
    expect(resolveMessages(undefined)['mermaid.tabs.preview']).toBe(enUS['mermaid.tabs.preview']);
  });

  it('should always return every key so nothing renders empty', () => {
    const keys = Object.keys(enUS) as MermaidLocaleKey[];

    for (const locale of ['zh-CN', 'zh-TW', 'ja-JP', 'not-a-locale']) {
      const messages = resolveMessages(locale);
      for (const key of keys) {
        expect(`${locale} ${key}=${messages[key]}`).not.toMatch(/=$/);
      }
    }
  });

  it('should let user overrides win over the builtin dictionary', () => {
    const messages = resolveMessages(EN, { [EN]: { 'mermaid.actions.expand': 'Fullscreen' } });

    expect(messages['mermaid.actions.expand']).toBe('Fullscreen');
    // 未覆盖的 key 仍然来自内置词表
    expect(messages['mermaid.tabs.preview']).toBe(enUS['mermaid.tabs.preview']);
  });

  it('should scope overrides to their own locale', () => {
    const overrides = { [EN]: { 'mermaid.actions.expand': 'Fullscreen' } };

    expect(resolveMessages(EN, overrides)['mermaid.actions.expand']).toBe('Fullscreen');
    expect(resolveMessages(ZH, overrides)['mermaid.actions.expand']).toBe(
      zhCN['mermaid.actions.expand'],
    );
  });

  it('should support a locale that only exists as an override', () => {
    const messages = resolveMessages('ja-JP', {
      'ja-JP': { 'mermaid.tabs.preview': 'プレビュー' },
    });

    expect(messages['mermaid.tabs.preview']).toBe('プレビュー');
    expect(messages['mermaid.tabs.code']).toBe(enUS['mermaid.tabs.code']);
  });

  it('should not mutate the builtin dictionaries', () => {
    resolveMessages(EN, { [EN]: { 'mermaid.actions.expand': 'Fullscreen' } });

    expect(enUS['mermaid.actions.expand']).toBe('Expand');
  });
});

describe('message priority', () => {
  const key = 'mermaid.actions.expand';

  it('should prefer host messages over the builtin dictionary', () => {
    // 站点用 .dumi/theme/locales/*.json 或自定义主题补了同名词条
    const messages = resolveMessages(ZH, undefined, { [key]: '楼盘操作' });

    expect(messages[key]).toBe('楼盘操作');
    // 宿主没提供的 key 仍然走内置词表
    expect(messages['mermaid.panzoom.reset']).toBe(zhCN['mermaid.panzoom.reset']);
  });

  it('should ignore host entries that are not strings', () => {
    const messages = resolveMessages(EN, undefined, { [key]: 42, 'mermaid.tabs.code': null });

    expect(messages[key]).toBe(enUS[key]);
    expect(messages['mermaid.tabs.code']).toBe(enUS['mermaid.tabs.code']);
  });

  it('should let the plugin option win over host messages', () => {
    // 宿主词条可能来自第三方主题包，站点在 .dumirc.ts 里显式写的选项必须更优先
    const messages = resolveMessages(
      ZH,
      { [ZH]: { [key]: '全屏查看' } },
      { [key]: '主题提供的文案' },
    );

    expect(messages[key]).toBe('全屏查看');
  });

  it('should resolve a single key with the same rules', () => {
    expect(resolveMessage(key, { locale: EN })).toBe(enUS[key]);
    expect(resolveMessage(key, { locale: EN, hostMessages: { [key]: 'H' } })).toBe('H');
    expect(
      resolveMessage(key, {
        locale: EN,
        hostMessages: { [key]: 'H' },
        overrides: { [EN]: { [key]: 'O' } },
      }),
    ).toBe('O');
  });

  it('should never return an empty string', () => {
    for (const locale of ['zh-CN', 'ja-JP', undefined]) {
      for (const k of MERMAID_LOCALE_KEYS) {
        const value = resolveMessage(k, { locale, hostMessages: { [k]: '' } });
        expect(`${locale} ${k}=${value}`).not.toMatch(/=$/);
      }
    }
  });
});
