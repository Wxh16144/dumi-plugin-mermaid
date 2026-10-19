import Loading from 'dumi/theme/slots/Loading';
import * as React from 'react';
// 图表本体样式与渲染它的组件同址，避免因为「被 tree-shaking 掉的模块引用」而丢失
import './MermaidBody.less';

export type MermaidBodyProps = {
  /** mermaid 图表源码，渲染失败时作为兜底展示 */
  code: string;
  /** 渲染结果，存在时优先渲染图表 */
  svg?: string;
  error?: string;
  loading?: boolean;
  className?: string;
  /** 图表容器节点，供 `onRender` 序列化 svg 使用 */
  rootRef?: React.Ref<HTMLDivElement>;
};

/**
 * 图表本体的三态渲染（svg / loading / error）。
 * 抽出来给 `Mermaid` 与 `MermaidViewer` 共用，保证两者的加载与失败表现一致。
 */
function MermaidBody({ code, svg, error, loading, className, rootRef }: MermaidBodyProps) {
  if (svg) {
    return (
      <div
        ref={rootRef}
        className={className}
        data-json={JSON.stringify({ data: code })}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  // 服务端与首屏保持一致，渲染完成前用 dumi 的骨架占位
  if (loading) {
    return (
      <div ref={rootRef} className={className} aria-busy>
        <Loading />
      </div>
    );
  }

  // 渲染失败时退回源码，方便排查
  return (
    <div ref={rootRef} className={className} data-error={error || undefined}>
      <pre>
        <code className="language-mermaid">{code}</code>
      </pre>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}

export default MermaidBody;
