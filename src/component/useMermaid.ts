import * as React from 'react';
import type { MermaidProps } from './types';
import useColorScheme from './useColorScheme';

/** 渲染 mermaid 图表，返回 svg 或错误信息 */
export default function useMermaid(code: string, mermaidConfig?: MermaidProps['mermaidConfig']) {
  const scheme = useColorScheme();
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const [result, setResult] = React.useState<{ svg?: string; error?: string }>({});

  // mermaidConfig 可能是内联对象，按值比较避免 effect 反复执行
  const configKey = JSON.stringify(mermaidConfig ?? null);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;

        mermaid.initialize({
          startOnLoad: false,
          ...((JSON.parse(configKey) ?? {}) as Record<string, unknown>),
          theme: scheme === 'dark' ? 'dark' : 'default',
        } as any);

        const { svg } = await mermaid.render(`mermaid-${uid}`, code);
        if (!cancelled) setResult({ svg });
      } catch (error) {
        if (!cancelled) {
          setResult({ error: error instanceof Error ? error.message : String(error) });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, scheme, uid, configKey]);

  return result;
}
