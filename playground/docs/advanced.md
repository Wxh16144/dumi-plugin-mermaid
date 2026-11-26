---
title: Advanced
---

## Advanced <sub>交互控件，可选</sub> {#advanced}

图表默认只渲染。放大、复制、平移缩放放在 `dumi-plugin-mermaid/viewer`，不引入就不进产物。

| 位置 | 控件               | 行为                                           |
| ---- | ------------------ | ---------------------------------------------- |
| 右上 | 放大               | 弹窗查看，Esc / 点击遮罩关闭                   |
| 右上 | 复制 Mermaid 源码  | 可直接粘到 mermaid.live 或 Markdown            |
| 右上 | 复制 PNG           | 2 倍分辨率                                     |
| 右下 | 平移 / 缩放 / 复位 | `0.25x` ~ `4x`，另支持 `Ctrl`/`Cmd` 滚轮、拖拽 |

普通滚轮与触屏拖拽不拦截，长文档照常滚动。

## 全站开启 {#site-wide}

```ts | pure
// .dumi/mermaid-plugin.ts
import { defineMermaidPlugin } from 'dumi-plugin-mermaid';

export default defineMermaidPlugin({
  component: 'dumi-plugin-mermaid/viewer',
});
```

```ts | pure
// .dumirc.ts
export default {
  plugins: ['./.dumi/mermaid-plugin.ts'],
};
```

Markdown 里仍然只写 `mermaid` 代码块。`component` 也支持相对 / 绝对路径：

```ts | pure
defineMermaidPlugin({ component: './src/theme/Mermaid' });
```

## 局部使用 {#inline}

```jsx | pure
import { MermaidViewer } from 'dumi-plugin-mermaid/viewer';

<MermaidViewer code={'graph TD; A[Start] --> B[End];'} />;
```

`toolbar` / `panZoom` 可单独关闭。

图表里的 `click` 指令需要 `securityLevel: 'loose'`（mermaid 默认 `strict` 会忽略），拖动松手不会误触链接。

## 另一种接法：本地主题 {#local-theme}

```ts | pure
// .dumi/theme/builtins/DumiPluginMermaid/index.ts
export { default } from 'dumi-plugin-mermaid/viewer';
```

优先级：本地主题 > `component` 选项 > 内置组件。

本地主题的优势是能给所有图表预设 props：

```tsx | pure
import { MermaidViewer } from 'dumi-plugin-mermaid/viewer';

export default (props) => <MermaidViewer {...props} panZoom={false} />;
```

目录名必须与 `MERMAID_COMPONENT_NAME` 一致，拼错会静默退回默认组件。

## 示例 {#examples}

### 全功能

<code src="./demos/viewer-default.tsx"></code>

### 只要放大

<code src="./demos/viewer-minimal.tsx"></code>

### 带「预览 / 源码」切换

`dumi-plugin-mermaid/viewer` 的默认导出，也是 `component` 全站替换时生效的组件：

<code src="./demos/viewer-toggle.tsx"></code>

## 多语言 {#i18n}

文案跟随 dumi 当前语言，内置 `zh-CN` / `en-US`，其余语言回退英文。改词时在主题 `locales` 里补同名 key：

```json
// .dumi/theme/locales/zh-CN.json
{
  "mermaid.actions.expand": "全屏查看"
}
```

## 已知限制 {#limitations}

- PNG 依赖 canvas：图表含**跨域**字体或图片时无法导出，自动降级为下载 SVG。
- 剪贴板不可用（非 https / localhost）时降级为下载文件，提示改为「已下载」。
- 弹窗复用同一份 SVG 快照（id 已加前缀），文字不可选中；要复制内容请用「复制 Mermaid 源码」。
