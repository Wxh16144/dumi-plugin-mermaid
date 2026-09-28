/** 单测桩：真实组件依赖 svgr / dumi 运行时上下文，跑不起来，这里只保留最小结构 */
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
