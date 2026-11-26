declare module '*.less';
declare module 'prismjs/components/*';

/** @see https://link.wxhboy.cn/40b9d96 */
declare module 'prism-react-renderer/prism' {
  const Prism: typeof import('prism-react-renderer').Prism;
  export default Prism;
}

/** 由插件在构建期 alias 到具体实现，源码里只需要一个稳定说明符 */
declare module 'dumi-plugin-mermaid/mermaid-loader' {
  const loadMermaid: (runtimeURL?: string) => Promise<import('mermaid').Mermaid>;

  export default loadMermaid;
}
