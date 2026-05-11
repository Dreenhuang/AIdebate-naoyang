/**
 * 简化版错误边界
 * 核心功能：捕获错误但不阻塞内容显示
 */
import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    // 更新状态，使下一次渲染可以显示降级 UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误到控制台
    console.error('[ErrorBoundary] 捕获到错误:', error);
    console.error('[ErrorBoundary] 错误详情:', errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // 简化的错误 UI - 提供重试按钮
      return (
        <div className="p-4 m-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <h3 className="text-yellow-800 font-bold mb-2">⚠️ 显示出现小问题</h3>
          <p className="text-yellow-700 text-sm mb-3">AI 回复内容可能包含特殊格式，但不影响核心功能。</p>
          <div className="flex gap-2">
            <button
              onClick={this.resetError}
              className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600"
            >
              重试显示
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600"
            >
              刷新页面
            </button>
          </div>
          {this.state.error && (
            <details className="mt-3">
              <summary className="text-xs text-yellow-600 cursor-pointer">查看错误详情（供调试）</summary>
              <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-40">
                {this.state.error?.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
