import { defineConfig } from 'dumi';
import { resolve } from 'path';
import { homepage, name } from '../package.json';

const isProd = process.env.NODE_ENV === 'production';
// 不是预览模式 同时是生产环境
const isProdSite = process.env.PREVIEW !== '1' && isProd;

export default defineConfig({
  plugins: [resolve(__dirname, './mermaid-plugin.ts'), 'dumi-plugin-code-snippets'],
  themeConfig: {
    name: 'Mermaid',
    // 显式声明顺序，避免按文件名字母序排站点导航
    nav: [
      { title: 'Usage', link: '/usage' },
      { title: 'Examples', link: '/example' },
      { title: 'Advanced', link: '/advanced' },
    ],
    socialLinks: {
      github: homepage,
    },
  },
  outputPath: resolve(__dirname, '../.doc'),
  base: isProdSite ? `/${name}/` : '/',
  publicPath: isProdSite ? `/${name}/` : '/',
});
