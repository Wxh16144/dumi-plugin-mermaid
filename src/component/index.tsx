import * as React from 'react';

type MermaidProps = {
  /** mermaid 图表源码 */
  code: string;
  /** 透传给 `mermaid.initialize`，需可序列化 */
  mermaidConfig?: Record<string, unknown>;
};

type ColorScheme = 'light' | 'dark';

// dumi 会把当前配色写到 <html> 上，`auto` 模式不写，此时回退到系统偏好
const PREFERS_COLOR_ATTR = 'data-prefers-color';

const readColorScheme = (): ColorScheme => {
  const attr = document.documentElement.getAttribute(PREFERS_COLOR_ATTR);
  if (attr === 'dark' || attr === 'light') return attr;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

function useColorScheme() {
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

function Mermaid(props: MermaidProps) {
  const { code, mermaidConfig } = props;
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

  if (result.svg) {
    return (
      <div
        className="dumi-plugin-mermaid"
        dangerouslySetInnerHTML={{ __html: result.svg }}
      />
    );
  }

  // 服务端与首屏渲染源码，避免 hydration 不一致
  return (
    <div className="dumi-plugin-mermaid" data-error={result.error || undefined}>
      <pre>
        <code className="language-mermaid">{code}</code>
      </pre>
      {result.error ? <p role="alert">{result.error}</p> : null}
    </div>
  );
}

// ====== Export ======
export type { MermaidProps };
export default React.memo(Mermaid);
