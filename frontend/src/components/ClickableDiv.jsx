import { forwardRef } from 'react';

/**
 * ClickableDiv - 可点击的div组件（替代button嵌套问题）
 * 
 * 使用场景：
 * - 需要可点击的容器，但内部可能包含其他交互元素（button/a/input）
 * - 避免HTML规范违反：<button>不能嵌套<button>
 * 
 * 特性：
 * - ✅ 完整的键盘支持（Enter/Space键）
 * - ✅ ARIA语义化（role="button" + tabIndex）
 * - ✅ 支持ref转发
 * - ✅ 无障碍访问友好
 * 
 * @example
 * ```jsx
 * <ClickableDiv onClick={handleClick} className="p-4">
 *   <span>内容</span>
 *   <button>操作</button>  // 现在合法！
 * </ClickableDiv>
 * ```
 */
const ClickableDiv = forwardRef(({
  onClick,
  onKeyDown,
  children,
  className = '',
  disabled = false,
  ...props
}, ref) => {
  const handleClick = (e) => {
    if (disabled) return;
    onClick?.(e);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    
    // 调用自定义onKeyDown
    onKeyDown?.(e);
    
    // 默认键盘支持：Enter和Space触发点击
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

ClickableDiv.displayName = 'ClickableDiv';

export default ClickableDiv;
