import * as React from 'react';
import renderMermaid from './renderMermaid';
import type { MermaidProps, MermaidResult } from './types';
import useColorScheme from './useColorScheme';

/** 渲染 mermaid 图表，返回 svg、错误信息或加载状态 */
export default function useMermaid(
  code: string,
  mermaidConfig?: MermaidProps['mermaidConfig'],
  runtimeURL?: MermaidProps['runtimeURL'],
): MermaidResult {
  const scheme = useColorScheme();
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const [result, setResult] = React.useState<MermaidResult>({ loading: true });
  // 手动重试靠递增计数触发 effect
  const [attempt, setAttempt] = React.useState(0);

  // mermaidConfig 可能是内联对象，按值比较避免 effect 反复执行
  const configKey = JSON.stringify(mermaidConfig ?? null);

  React.useEffect(() => {
    let cancelled = false;

    renderMermaid(
      code,
      {
        ...((JSON.parse(configKey) ?? {}) as Record<string, unknown>),
        theme: scheme === 'dark' ? 'dark' : 'default',
      },
      uid,
      runtimeURL,
    ).then(
      ({ svg }) => {
        if (!cancelled) setResult({ svg, loading: false });
      },
      (error) => {
        if (!cancelled) {
          setResult({
            error: error instanceof Error ? error.message : String(error),
            loading: false,
          });
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [code, scheme, uid, configKey, runtimeURL, attempt]);

  // 主题切换等重渲染保留上一份 SVG，避免闪骨架；只有手动重试才回到加载态
  const retry = React.useCallback(() => {
    setResult({ loading: true });
    setAttempt((count) => count + 1);
  }, []);

  return { ...result, retry };
}
