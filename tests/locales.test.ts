import { describe, expect, it } from 'vitest';
import {
  BUILTIN_LOCALES,
  DEFAULT_LOCALE,
  MERMAID_LOCALE_KEYS,
  resolveMessage,
  resolveMessages,
} from '../src/component/locales';

describe('locale dictionaries', () => {
  it('should cover every key in every builtin language', () => {
    for (const [locale, table] of Object.entries(BUILTIN_LOCALES)) {
      expect(Object.keys(table).sort(), locale).toEqual([...MERMAID_LOCALE_KEYS].sort());
    }
  });
});

describe('resolveMessage', () => {
  it('should pick the dictionary of the current locale', () => {
    expect(resolveMessage('mermaid.tabs.preview', { locale: 'zh-CN' })).toBe('预览');
    expect(resolveMessage('mermaid.tabs.preview', { locale: 'en-US' })).toBe('Preview');
  });

  it('should fall back to the same language before english', () => {
    expect(resolveMessage('mermaid.tabs.code', { locale: 'zh-TW' })).toBe('源码');
  });

  it('should fall back to the default locale for unknown languages', () => {
    expect(resolveMessage('mermaid.tabs.code', { locale: 'ja-JP' })).toBe(
      BUILTIN_LOCALES[DEFAULT_LOCALE]['mermaid.tabs.code'],
    );
    expect(resolveMessage('mermaid.tabs.code', {})).toBe(
      BUILTIN_LOCALES[DEFAULT_LOCALE]['mermaid.tabs.code'],
    );
  });

  it('should prefer host messages over builtins', () => {
    expect(
      resolveMessage('mermaid.tabs.code', {
        locale: 'zh-CN',
        hostMessages: { 'mermaid.tabs.code': 'Code!' },
      }),
    ).toBe('Code!');
  });

  it('should ignore unusable host messages so the label never goes blank', () => {
    expect(
      resolveMessage('mermaid.tabs.code', {
        locale: 'zh-CN',
        hostMessages: { 'mermaid.tabs.code': '  ' },
      }),
    ).toBe('源码');
  });
});

describe('resolveMessages', () => {
  it('should always resolve the full key set', () => {
    const messages = resolveMessages('en-US');

    expect(Object.keys(messages).sort()).toEqual([...MERMAID_LOCALE_KEYS].sort());
    for (const value of Object.values(messages)) expect(value).not.toBe('');
  });
});
