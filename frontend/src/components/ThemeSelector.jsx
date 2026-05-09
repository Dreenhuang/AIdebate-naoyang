import { useState } from 'react';
import { X, Palette, Check } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export function ThemeSelector({ isOpen, onClose }) {
  const { theme, setTheme, themes, isTransitioning } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  if (!isOpen) return null;

  const handleSelect = (themeKey) => {
    if (isTransitioning || isAnimating) return;
    
    setIsAnimating(true);
    setTheme(themeKey);
    
    setTimeout(() => {
      setIsAnimating(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-gray-9/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* 选择面板 */}
      <div className="relative bg-bg-container rounded-extra shadow-5 max-w-2xl w-full mx-4 animate-scale-in overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-1">
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-brand-5" />
            <h2 className="text-lg font-semibold text-text-primary">选择风格</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-medium hover:bg-bg-component transition-colors duration-fast"
          >
            <X className="w-5 h-5 text-text-tertiary" />
          </button>
        </div>
        
        {/* 主题列表 */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(themes).map(([key, config]) => {
            const isActive = theme === key;
            
            return (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                disabled={isTransitioning || isAnimating}
                className={`
                  relative p-5 rounded-large border-2 transition-all duration-normal text-left
                  ${isActive 
                    ? 'border-brand-5 bg-brand-1 shadow-2' 
                    : 'border-border-1 hover:border-border-2 hover:shadow-1'
                  }
                  ${(isTransitioning || isAnimating) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {/* 选中标记 */}
                {isActive && (
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 rounded-full bg-brand-5 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
                
                {/* 主题预览 */}
                <div className="mb-4">
                  <div className="text-3xl mb-2">{config.icon}</div>
                  <h3 className="text-base font-semibold text-text-primary mb-1">
                    {config.label}
                  </h3>
                  <p className="text-sm text-text-tertiary">
                    {config.description}
                  </p>
                </div>
                
                {/* 色彩预览 */}
                <div className="flex gap-2 mb-3">
                  <div 
                    className="w-8 h-8 rounded-medium shadow-1"
                    style={{ backgroundColor: config.color }}
                  />
                  <div className="flex-1 grid grid-cols-4 gap-1">
                    <div className="h-8 rounded-small bg-bg-page border border-border-1" />
                    <div className="h-8 rounded-small bg-bg-component border border-border-1" />
                    <div className="h-8 rounded-small bg-bg-elevated border border-border-1" />
                    <div className="h-8 rounded-small bg-bg-sidebar border border-border-1" />
                  </div>
                </div>
                
                {/* 当前主题标签 */}
                {isActive && (
                  <div className="text-xs font-medium text-brand-5">
                    当前使用
                  </div>
                )}
              </button>
            );
          })}
        </div>
        
        {/* 底部提示 */}
        <div className="px-6 py-4 bg-bg-component border-t border-border-1">
          <p className="text-sm text-text-tertiary text-center">
            切换风格后，您的选择将自动保存，下次访问时继续生效
          </p>
        </div>
      </div>
    </div>
  );
}
