import * as React from 'react';

type ColorScheme = 'light' | 'dark';

// dumi 把配色写在 <html> 上；`auto` 模式不写该属性，回退到系统偏好
const PREFERS_COLOR_ATTR = 'data-prefers-color';

const readColorScheme = (): ColorScheme => {
  if (typeof document === 'undefined') return 'light';

  const attr = document.documentElement.getAttribute(PREFERS_COLOR_ATTR);
  if (attr === 'dark' || attr === 'light') return attr;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/** 跟随站点配色 */
export default function useColorScheme() {
  const [scheme, setScheme] = React.useState<ColorScheme>('light');

  React.useEffect(() => {
    const sync = () => setScheme(readColorScheme());
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [PREFERS_COLOR_ATTR],
    });

    return () => observer.disconnect();
  }, []);

  return scheme;
}
