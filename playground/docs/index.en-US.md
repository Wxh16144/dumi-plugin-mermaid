---
title: 渲染 Mermaid 图表
hero:
  title: dumi plugin mermaid
---

:::info{title=测试国际语言}
这个页面主要是用于测试组件的国际化内容展示
:::
<br>

## 渲染 Mermaid 图表

### 借鉴 [rehype-mermaid](https://github.com/remcohaszing/rehype-mermaid)，并为 dumi 做了适配

<br>

用 `mermaid` 代码块书写图表：

````md
```mermaid
graph TD;
  A[Start] --> B{Is it working?};
  B -->|Yes| C[Ship it];
  B -->|No| D[Fix it];
  D --> B;
```
````

会被渲染为图表：

```mermaid
graph TD;
  A[Start] --> B{Is it working?};
  B -->|Yes| C[Ship it];
  B -->|No| D[Fix it];
  D --> B;
```

---

## 更多

| 能力     | 说明                                                                |
| -------- | ------------------------------------------------------------------- |
| 代码块   | 使用 `mermaid` 语言标记                                             |
| 主题     | 跟随 dumi 明暗配色（`data-prefers-color` / `prefers-color-scheme`） |
| 初始化项 | 通过插件配置传入 `mermaidConfig`                                    |
| 控件     | 图区右上放大 / 复制，右下平移缩放（`Ctrl`/`Cmd` + 滚轮、拖拽）      |
| 多语言   | 控件文案跟随 dumi 当前语言，内置 `zh-CN` / `en-US` 并支持覆盖       |

更多的用法与限制参见 [Usage](/usage)。
