import { defineMermaidPlugin } from 'dumi-plugin-mermaid';

/**
 * dumi 的 `plugins` 只接受字符串，带选项时要包一层本地插件文件。
 * 这里用 unpkg 上的 ESM 入口，让示例站演示「mermaid 不进产物」的模式。
 */
export default defineMermaidPlugin({
  runtimeURL: 'https://unpkg.com/mermaid@11/dist/mermaid.esm.min.mjs',
  // 中国大陆网络环境下可改用淘宝镜像
  // runtimeURL: 'https://registry.npmmirror.com/mermaid/11/files/dist/mermaid.esm.min.mjs',
});
