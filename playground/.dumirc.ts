import { defineConfig } from 'dumi';
import { resolve } from 'path';
import { homepage, name } from '../package.json';

const isProd = process.env.NODE_ENV === 'production';
// 不是预览模式 同时是生产环境
const isProdSite = process.env.PREVIEW !== '1' && isProd;

export default defineConfig({
  plugins: [name, 'dumi-plugin-code-snippets'],
  themeConfig: {
    name: 'Mermaid',
    socialLinks: {
      github: homepage,
    },
  },
  locales: [
    { id: 'zh-CN', name: '🇨🇳 简体中文' },
    { id: 'en-US', name: '🇺🇸 English' },
  ],
  outputPath: resolve(__dirname, '../.doc'),
  base: isProdSite ? `/${name}/` : '/',
  publicPath: isProdSite ? `/${name}/` : '/',
});
