import Loading from 'dumi/theme/slots/Loading';
import * as React from 'react';

export type MermaidSkeletonProps = {
  /** 上次渲染高度，先占住位置，避免图表出现时页面跳动 */
  minHeight?: number;
};

/** 服务端与加载中统一用这份骨架，SSR 与客户端首帧才能保持一致 */
const MermaidSkeleton = React.forwardRef<HTMLDivElement, MermaidSkeletonProps>(
  function MermaidSkeleton({ minHeight }, ref) {
    return (
      <div
        ref={ref}
        className="dumi-plugin-mermaid"
        aria-busy
        style={minHeight ? { minHeight } : undefined}
      >
        <Loading />
      </div>
    );
  },
);

export default MermaidSkeleton;
