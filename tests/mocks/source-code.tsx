/**
 * 真实 `dumi/theme/builtins/SourceCode` 依赖 svgr / dumi 运行时上下文，单测环境里跑不起来，
 * 这里只保留渲染源码所需的最小结构。
 */
export default function SourceCode(props: {
  children?: string;
  lang?: string;
  [key: string]: unknown;
}) {
  const { children, lang, ...rest } = props;

  return (
    <div className="dumi-default-source-code" {...rest}>
      <pre>
        <code className={lang ? `language-${lang}` : undefined}>{children}</code>
      </pre>
    </div>
  );
}
