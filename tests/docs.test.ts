import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const DOCS_DIR = path.join(__dirname, '../playground/docs');

/** 收集文档，跳过 demos 里的组件源码 */
const collectDocs = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) return entry.name === 'demos' ? [] : collectDocs(full);
    return entry.name.endsWith('.md') ? [full] : [];
  });

type Fence = { line: number; info: string; ticks: number };

/**
 * 按 CommonMark 的规则拆出代码围栏：
 * 收盘围栏的反引号数量必须不少于开盘的，因此 ```` 里可以嵌套 ```。
 */
const readFences = (content: string) => {
  const lines = content.split('\n');
  const opens: Fence[] = [];
  const problems: string[] = [];
  let open: Fence | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const matched = /^(`{3,})\s*(.*)$/.exec(line);
    if (!matched) continue;

    const [, ticks, rest] = matched;

    if (!open) {
      open = { line: index + 1, info: rest.trim(), ticks: ticks.length };
      continue;
    }

    // 收盘围栏不能带 info string，且反引号数量要够
    if (rest.trim() === '' && ticks.length >= open.ticks) {
      if (!open.info) {
        problems.push(`第 ${open.line} 行的代码围栏没有语言标记`);
      }
      opens.push(open);
      open = null;
    }
  }

  if (open) problems.push(`第 ${open.line} 行的代码围栏没有闭合`);

  return { fences: opens, problems };
};

describe('文档代码围栏', () => {
  const docs = collectDocs(DOCS_DIR);

  it('能找到文档', () => {
    expect(docs.length).toBeGreaterThan(0);
  });

  it('每个代码块都带语言标记', () => {
    // 无语言围栏会让 dumi 在解析 code block 时读 lang 抛
    // `Cannot read properties of undefined (reading 'replace')`
    const failures = docs.flatMap((file) =>
      readFences(fs.readFileSync(file, 'utf-8')).problems.map(
        (problem) => `${path.relative(DOCS_DIR, file)}: ${problem}`,
      ),
    );

    expect(failures).toEqual([]);
  });
});

/** `/usage` → `usage.md`；`/` → `index.md` */
const pageOf = (file: string) => {
  const name = path.basename(file, '.md');
  return name === 'index' ? '/' : `/${name}`;
};

/** 页内显式声明的锚点：`## 标题 {#anchor}` */
const readAnchors = (content: string) =>
  new Set(
    Array.from(content.matchAll(/^#{1,6} .*\{#([^}]+)\}\s*$/gm), (matched) => matched[1].trim()),
  );

describe('文档内链', () => {
  const docs = collectDocs(DOCS_DIR);
  const pages = new Map(
    docs.map((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      return [pageOf(file), { file, anchors: readAnchors(content), content }] as const;
    }),
  );

  it('带 hash 的跨页链接都要落在目标页的显式锚点上', () => {
    // 标题文字（尤其中文）生成的 slug 会随措辞变化而失效，
    // 所以跨页深链一律指向 `{#anchor}` 声明过的稳定 id
    const failures: string[] = [];

    for (const { file, content } of Array.from(pages.values())) {
      for (const [, page, hash] of Array.from(content.matchAll(/\]\(([\w/-]+)?#([\w-]+)\)/g))) {
        if (/^https?:/.test(page ?? '')) continue;

        const target = pages.get(page || pageOf(file));
        if (!target) {
          failures.push(`${path.relative(DOCS_DIR, file)}: 找不到页面 ${page}`);
          continue;
        }

        if (!target.anchors.has(hash)) {
          failures.push(
            `${path.relative(DOCS_DIR, file)}: #${hash} 未在 ${path.relative(
              DOCS_DIR,
              target.file,
            )} 中声明`,
          );
        }
      }
    }

    expect(failures).toEqual([]);
  });
});
