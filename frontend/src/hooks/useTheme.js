import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'prd-debate-theme';
const THEME_TRANSITION_CLASS = 'theme-transitioning';

// 主题配置
const THEMES = {
  xiaohongshu: {
    name: 'xiaohongshu',
    label: '小红书',
    icon: '🌸',
    description: '年轻、时尚、温暖、活力、社区感',
    color: '#FF2442',
  },
  'tech-blue': {
    name: 'tech-blue',
    label: '科技蓝',
    icon: '💎',
    description: 'AI工具感、轻科技感、SaaS后台风格',
    color: '#2F6BFF',
  },
};

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved && THEMES[saved] ? saved : 'tech-blue';
  });

  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    
    // 移除所有主题类
    root.classList.remove('theme-xiaohongshu', 'theme-tech-blue');
    
    // 添加当前主题类
    root.classList.add(`theme-${theme}`);
    
    // 保存到 localStorage
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const changeTheme = useCallback((newTheme) => {
    if (!THEMES[newTheme] || newTheme === theme) return;

    // 添加过渡类
    document.documentElement.classList.add(THEME_TRANSITION_CLASS);
    setIsTransitioning(true);

    // 延迟切换主题，让过渡动画生效
    setTimeout(() => {
      setThemeState(newTheme);
      
      // 动画结束后移除过渡类
      setTimeout(() => {
        document.documentElement.classList.remove(THEME_TRANSITION_CLASS);
        setIsTransitioning(false);
      }, 350);
    }, 50);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'xiaohongshu' ? 'tech-blue' : 'xiaohongshu';
    changeTheme(nextTheme);
  }, [theme, changeTheme]);

  return {
    theme,
    setTheme: changeTheme,
    toggleTheme,
    isTransitioning,
    themes: THEMES,
    currentTheme: THEMES[theme],
  };
}
