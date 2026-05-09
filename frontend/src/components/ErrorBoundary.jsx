import { Component } from 'react';

/**
 * 🔥 V2.2 新增：React Error Boundary
 * 防止组件崩溃导致整个应用白屏
 * 捕获子组件的 JavaScript 错误，显示友好的错误提示
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.setState({
      errorInfo,
    });

    // 如果有回调函数，调用它
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // 自定义错误 UI
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          resetError: this.resetError,
        });
      }

      // 默认错误 UI
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '1px solid #e74c3c',
          borderRadius: '8px',
          backgroundColor: '#fdf2f2',
          color: '#c0392b',
        }}>
          <h2 style={{ marginBottom: '10px' }}>
            ⚠️ 渲染出错了
          </h2>
          <p style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
            抱歉，页面在渲染过程中遇到了一个错误。这通常是由于 AI 回复内容包含无法处理的格式导致的。
          </p>
          {this.state.error && (
            <details style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#f8f8f8',
              borderRadius: '4px',
              fontSize: '12px',
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                查看错误详情
              </summary>
              <pre style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '11px',
                maxHeight: '200px',
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={this.resetError}
            style={{
              marginTop: '15px',
              padding: '8px 16px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            重新尝试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

/**
 * 🔥 HOC 版本：包装任何组件添加错误边界
 */
export function withErrorBoundary(Component, fallback, onError) {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
