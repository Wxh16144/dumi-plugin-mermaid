declare module '*.less';
declare module 'prismjs/components/*';

/** @see https://link.wxhboy.cn/40b9d96 */
declare module 'prism-react-renderer/prism' {
  const Prism: typeof import('prism-react-renderer').Prism;
  export default Prism;
}
