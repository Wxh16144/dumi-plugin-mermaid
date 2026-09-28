import SourceCode from 'dumi/theme/builtins/SourceCode';
import * as React from 'react';
import './index.less';

export type MermaidProps = {
  /** mermaid 图表源码 */
  code: string;
  /** 透传给 `mermaid.initialize`，需可序列化 */
  mermaidConfig?: Record<string, unknown>;
};

type MermaidView = 'preview' | 'code';

type ColorScheme = 'light' | 'dark';

// dumi 会把当前配色写到 <html> 上，`auto` 模式不写，此时回退到系统偏好
const PREFERS_COLOR_ATTR = 'data-prefers-color';

const VIEWS: { value: MermaidView; label: string }[] = [
  { value: 'preview', label: 'Preview' },
  { value: 'code', label: 'Code' },
];

const readColorScheme = (): ColorScheme => {
  // 目前只从 effect 调用，但这样在 render 期调用也安全
  if (typeof document === 'undefined') return 'light';

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

/** 渲染 mermaid 图表，返回 svg 或错误信息 */
function useMermaid(code: string, mermaidConfig?: MermaidProps['mermaidConfig']) {
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

/** mermaid 源码视图，渲染方式跟随主题对 `dumi/theme/builtins/SourceCode` 的覆盖 */
function MermaidSource(props: Pick<MermaidProps, 'code'>) {
  return <SourceCode lang="mermaid">{props.code}</SourceCode>;
}

function Mermaid(props: MermaidProps) {
  const { code, mermaidConfig } = props;
  const { svg, error } = useMermaid(code, mermaidConfig);

  if (svg) {
    return <div className="dumi-plugin-mermaid" dangerouslySetInnerHTML={{ __html: svg }} />;
  }

  // 服务端与首屏渲染源码，避免 hydration 不一致
  return (
    <div className="dumi-plugin-mermaid" data-error={error || undefined}>
      <pre>
        <code className="language-mermaid">{code}</code>
      </pre>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}

function MermaidToggleImpl(props: MermaidProps) {
  const { code, mermaidConfig } = props;
  const [view, setView] = React.useState<MermaidView>('preview');

  return (
    <div className="dumi-plugin-mermaid-toggle">
      <div className="dumi-plugin-mermaid-toggle-toolbar">
        <div className="dumi-plugin-mermaid-toggle-tabs" role="group" aria-label="View">
          {VIEWS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className="dumi-plugin-mermaid-toggle-tab"
              aria-pressed={view === value}
              onClick={() => setView(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {view === 'preview' ? (
        <Mermaid code={code} mermaidConfig={mermaidConfig} />
      ) : (
        <MermaidSource code={code} />
      )}
    </div>
  );
}

// ====== Export ======
export const MermaidToggle = React.memo(MermaidToggleImpl);
export default React.memo(Mermaid);
