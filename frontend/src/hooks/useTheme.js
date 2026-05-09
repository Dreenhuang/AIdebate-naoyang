import { useState, useEffect } from 'react';

const THEME_KEY = 'prd-debate-theme';

export function useTheme() {
  // 从 localStorage 读取主题，默认 'dark'
  const [theme, setThemeState] = useState(() => localStorage.getItem(THEME_KEY) || 'dark');
  const [resolvedTheme, setResolvedTheme] = useState('dark');

  useEffect(() => {
    // 更新主题到 DOM
    const updateTheme = () => {
      let resolved = theme;
      if (theme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      setResolvedTheme(resolved);
      
      // 根据 resolvedTheme 切换 HTML 的 class
      if (resolved === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    updateTheme();

    // 监听系统主题变化
    const handler = () => {
      if (theme === 'system') {
        updateTheme();
      }
    };

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handler);
    return () => window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', handler);
  }, [theme]);

  // 包装 setTheme 方法，同时保存到 localStorage
  const changeTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
  };

  return { theme, setTheme: changeTheme, resolvedTheme };
}
