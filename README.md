# EN

> Render `mermaid` code blocks as diagrams.

- `mermaid` code blocks are rendered as diagrams
- Follows the site color scheme automatically
- Registers the builtin `DumiPluginMermaid` component, which can be overridden by theme

| Option          | Type     | Default     | Description                                               |
| --------------- | -------- | ----------- | --------------------------------------------------------- |
| `mermaidConfig` | `object` | `undefined` | Passed to `mermaid.initialize`, must be JSON serializable |

## Usage

### Install

> Prerequisites: dumi@2.0.0+

```bash
npm install dumi-plugin-mermaid --save-dev
```

### Apply

```ts
// .dumirc.ts
export default {
  plugins: ['dumi-plugin-mermaid'],
};
```

Then write diagrams with `mermaid` code blocks in Markdown:

<pre lang="markdown">
```mermaid
graph TD;
  A[Start] --> B{Is it working?};
  B -->|Yes| C[Ship it];
  B -->|No| D[Fix it];
  D --> B;
```
</pre>

### Options

```ts
// .dumirc.ts
export default {
  plugins: [
    [
      'dumi-plugin-mermaid',
      {
        mermaidConfig: { securityLevel: 'loose' },
      },
    ],
  ],
};
```

### Customization

Put your own implementation at `.dumi/theme/builtins/DumiPluginMermaid.tsx` to take over rendering:

```tsx
export default (props) => {
  return <div>{props.code}</div>;
};
```

`dumi-plugin-mermaid/component` exports two components, both taking `code` and `mermaidConfig`:

| Export          | Description                                                      |
| --------------- | ---------------------------------------------------------------- |
| `default`       | Diagram with a switch at the top right (same as `MermaidToggle`) |
| `Mermaid`       | Diagram only, source is shown before the diagram is ready        |
| `MermaidToggle` | Same as the default export                                       |

To render diagrams only, without the switch:

```tsx
// .dumi/theme/builtins/DumiPluginMermaid.tsx
export { Mermaid as default } from 'dumi-plugin-mermaid/component';
```

It takes the same props as the default export (`code` and `mermaidConfig`); anything else is up to your own
implementation.

## Caveats

Only runtime rendering is supported, so the following `rehype-mermaid` options are not available: `strategy`
(`img-png` / `img-svg` / `inline-svg`), `dark`, `colorScheme`, `errorFallback`, `screenshot`, `browser` and
`launchOptions`. Diagrams inside `::: code-group` are rendered in place, which may not match the tabbed layout.

### Full Document

Read more: https://wxh16144.github.io/dumi-plugin-mermaid/

---

# 中文

> 把 `mermaid` 代码块渲染成图表。

- `mermaid` 代码块会被渲染成图表
- 自动跟随站点明暗配色
- 注册内置 `DumiPluginMermaid` 组件，可通过主题覆盖

| 配置项          | 类型     | 默认值      | 说明                                             |
| --------------- | -------- | ----------- | ------------------------------------------------ |
| `mermaidConfig` | `object` | `undefined` | 传给 `mermaid.initialize`，必须是可序列化的 JSON |

## 使用

### 安装

> 前置条件：dumi@2.0.0+

```bash
npm install dumi-plugin-mermaid --save-dev
```

### 配置

```ts
// .dumirc.ts
export default {
  plugins: ['dumi-plugin-mermaid'],
};
```

然后在 Markdown 里用 `mermaid` 代码块书写图表：

<pre lang="markdown">
```mermaid
graph TD;
  A[Start] --> B{Is it working?};
  B -->|Yes| C[Ship it];
  B -->|No| D[Fix it];
  D --> B;
```
</pre>

### 选项

```ts
// .dumirc.ts
export default {
  plugins: [
    [
      'dumi-plugin-mermaid',
      {
        mermaidConfig: { securityLevel: 'loose' },
      },
    ],
  ],
};
```

### 自定义

在 `.dumi/theme/builtins/DumiPluginMermaid.tsx` 里给出一份自己的实现，即可接管渲染：

```tsx
export default (props) => {
  return <div>{props.code}</div>;
};
```

`dumi-plugin-mermaid/component` 导出了两个组件，都接受 `code` 与 `mermaidConfig`：

| 导出            | 说明                                             |
| --------------- | ------------------------------------------------ |
| `default`       | 右上角带切换按钮的图表（等同于 `MermaidToggle`） |
| `Mermaid`       | 只渲染图表，图表就绪前显示源码                   |
| `MermaidToggle` | 等同于默认导出                                   |

只想渲染图表、不要切换按钮时：

```tsx
// .dumi/theme/builtins/DumiPluginMermaid.tsx
export { Mermaid as default } from 'dumi-plugin-mermaid/component';
```

它的配置项与默认导出一致（`code`、`mermaidConfig`），其余需求可以自行覆盖实现。

## 限制

仅支持运行时渲染，因此 `rehype-mermaid` 的以下选项不可用：`strategy`（`img-png` / `img-svg` / `inline-svg`）、
`dark`、`colorScheme`、`errorFallback`、`screenshot`、`browser`、`launchOptions`。写在 `::: code-group` 里的图表
会就地渲染，可能与 tab 布局不符。

### 完整文档

详见：https://wxh16144.github.io/dumi-plugin-mermaid/
