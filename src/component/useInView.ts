import * as React from 'react';

/** 提前一屏开始加载，滚动到图表时通常已经渲染完成 */
const DEFAULT_ROOT_MARGIN = '200px';

/**
 * 元素进入视口后返回 true。
 * 初始恒为 false，保证 SSR 与首次客户端渲染一致；
 * 不支持 IntersectionObserver 时在 effect 里直接置为 true，退化为立即渲染。
 */
export default function useInView<T extends Element>(rootMargin = DEFAULT_ROOT_MARGIN) {
  const ref = React.useRef<T>(null);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [rootMargin]);

  return [ref, inView] as const;
}
