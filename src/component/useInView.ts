import * as React from 'react';

/** 提前一屏开始加载，滚动到图表时通常已经渲染完成 */
const DEFAULT_ROOT_MARGIN = '200px';

/**
 * 元素进入视口后返回 true。
 * 不支持 IntersectionObserver 时直接返回 true，退化为立即渲染。
 */
export default function useInView<T extends Element>(rootMargin = DEFAULT_ROOT_MARGIN) {
  const ref = React.useRef<T>(null);
  const [inView, setInView] = React.useState(() => typeof IntersectionObserver === 'undefined');

  React.useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

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
