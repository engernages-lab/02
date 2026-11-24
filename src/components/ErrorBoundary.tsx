import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  scope?: 'page' | 'app';
  onReturnMenu?: () => void;
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  error: Error | null;
  retryKey: number;
}

export function CrashProbe(): never {
  throw new Error('NEXUS_DEV_CRASH_PROBE');
}

/** 最小页面级 / 全局错误边界：隔离渲染异常，保留真实恢复入口。 */
export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, retryKey: 0 };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    if (import.meta.env?.DEV) {
      console.error('[NEXUS][ErrorBoundary][' + (this.props.scope || 'page') + ']', error.message, error.stack, info.componentStack);
    }
  }

  private retry = (): void => {
    const message = this.state.error?.message || '';
    if (/dynamically imported module|Loading chunk|ChunkLoadError|Importing a module script failed/i.test(message)) {
      window.location.reload();
      return;
    }
    this.props.onRetry?.();
    this.setState(s => ({ error: null, retryKey: s.retryKey + 1 }));
  };

  private returnMenu = (): void => {
    this.setState({ error: null });
    this.props.onReturnMenu?.();
  };

  private restart = (): void => {
    window.location.assign(window.location.pathname);
  };

  render(): React.ReactNode {
    if (!this.state.error) return <React.Fragment key={this.state.retryKey}>{this.props.children}</React.Fragment>;
    const dev = import.meta.env?.DEV === true;
    return (
      <div className="eb-root" role="alert">
        <div className="eb-grid" />
        <div className="eb-panel">
          <div className="eb-brand">NEXUS · EXCEPTION ISOLATION</div>
          <div className="eb-code">SYSTEM FAILURE</div>
          <div className="eb-glitch" aria-hidden="true">DATA STREAM INTERRUPTED</div>
          <h1 className="eb-title">检测到异常数据流</h1>
          <p className="eb-text">当前模块暂时无法正常运行。<br />系统已尝试隔离异常，你的存档与真实进度未被重置。</p>
          <div className="eb-meta">
            <span>MODULE</span>
            <b>{this.props.scope === 'app' ? 'NEXUS CORE' : 'CURRENT PAGE'}</b>
            <span>STATE</span>
            <b className="red">ISOLATED</b>
          </div>
          {dev && <pre className="eb-dev">{this.state.error.message}</pre>}
          <div className="eb-actions">
            <button className="nxbtn primary" onClick={this.retry}>重新加载模块</button>
            {this.props.onReturnMenu && <button className="nxbtn ghost" onClick={this.returnMenu}>返回主菜单</button>}
            <button className="nxbtn ghost" onClick={this.restart}>重新启动系统</button>
          </div>
          <div className="eb-foot">IF THE STREAM REPEATS · RESTART NEXUS</div>
        </div>
      </div>
    );
  }
}
