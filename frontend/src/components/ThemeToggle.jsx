import { Sun, Moon, Monitor } from 'lucide-react';
export function ThemeToggle({ theme, setTheme }) {
  const themes = [
    { value: 'light', icon: Sun, label: '浅色' },
    { value: 'dark', icon: Moon, label: '深色' },
    { value: 'system', icon: Monitor, label: '跟随' }
  ];
  return (
    <div className="flex items-center bg-bg-tertiary rounded-lg p-1 gap-0.5">
      {themes.map(({ value, icon: Icon, label }) => (
        <button key={value} onClick={() => setTheme(value)}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all ${
            theme === value 
              ? 'bg-brand-primary text-white shadow-sm' 
              : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'
          }`}>
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
