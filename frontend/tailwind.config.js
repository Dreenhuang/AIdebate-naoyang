/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* === 品牌色系 (通过CSS变量支持多主题) === */
        'brand-1': 'var(--brand-1)',
        'brand-2': 'var(--brand-2)',
        'brand-3': 'var(--brand-3)',
        'brand-4': 'var(--brand-4)',
        'brand-5': 'var(--brand-5)',
        'brand-6': 'var(--brand-6)',
        'brand-7': 'var(--brand-7)',
        'brand-8': 'var(--brand-8)',
        'brand-9': 'var(--brand-9)',

        /* === 中性色阶 === */
        'gray-1': 'var(--gray-1)',
        'gray-2': 'var(--gray-2)',
        'gray-3': 'var(--gray-3)',
        'gray-4': 'var(--gray-4)',
        'gray-5': 'var(--gray-5)',
        'gray-6': 'var(--gray-6)',
        'gray-7': 'var(--gray-7)',
        'gray-8': 'var(--gray-8)',
        'gray-9': 'var(--gray-9)',
        'gray-10': 'var(--gray-10)',
        'gray-11': 'var(--gray-11)',

        /* === 语义色 === */
        'success-1': 'var(--success-1)',
        'success-5': 'var(--success-5)',
        'warning-1': 'var(--warning-1)',
        'warning-5': 'var(--warning-5)',
        'error-1': 'var(--error-1)',
        'error-5': 'var(--error-5)',
        'info-1': 'var(--info-1)',
        'info-5': 'var(--info-5)',

        /* === 背景系统 === */
        'bg-page': 'var(--bg-page)',
        'bg-container': 'var(--bg-container)',
        'bg-elevated': 'var(--bg-elevated)',
        'bg-component': 'var(--bg-component)',
        'bg-component-hover': 'var(--bg-component-hover)',
        'bg-sidebar': 'var(--bg-sidebar)',

        /* === 文本系统 === */
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-placeholder': 'var(--text-placeholder)',
        'text-disabled': 'var(--text-disabled)',
        'text-link': 'var(--text-link)',
        'text-link-hover': 'var(--text-link-hover)',

        /* === 边框系统 === */
        'border-1': 'var(--border-1)',
        'border-2': 'var(--border-2)',
        'border-3': 'var(--border-3)',
        'border-focus': 'var(--border-focus)',

        /* === 角色色彩 === */
        'role-host': 'var(--role-host)',
        'role-proposer': 'var(--role-proposer)',
        'role-reviewer': 'var(--role-reviewer)',
        'role-system': 'var(--role-system)',
      },
      fontFamily: {
        sans: [
          'Inter',
          'PingFang SC',
          'HarmonyOS Sans SC',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Microsoft YaHei',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'small': 'var(--radius-small)',
        'medium': 'var(--radius-medium)',
        'large': 'var(--radius-large)',
        'extra': 'var(--radius-extra)',
        'round': 'var(--radius-round)',
      },
      boxShadow: {
        '1': 'var(--shadow-1)',
        '2': 'var(--shadow-2)',
        '3': 'var(--shadow-3)',
        '4': 'var(--shadow-4)',
        '5': 'var(--shadow-5)',
      },
      spacing: {
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
        '10': 'var(--space-10)',
        '12': 'var(--space-12)',
      },
      fontSize: {
        'h1': ['var(--font-size-h1)', { lineHeight: 'var(--line-height-1)', fontWeight: 'var(--font-weight-bold)' }],
        'h2': ['var(--font-size-h2)', { lineHeight: 'var(--line-height-1)', fontWeight: 'var(--font-weight-bold)' }],
        'h3': ['var(--font-size-h3)', { lineHeight: 'var(--line-height-2)', fontWeight: 'var(--font-weight-semibold)' }],
        'h4': ['var(--font-size-h4)', { lineHeight: 'var(--line-height-2)', fontWeight: 'var(--font-weight-semibold)' }],
        'body': ['var(--font-size-body)', { lineHeight: 'var(--line-height-3)', fontWeight: 'var(--font-weight-regular)' }],
        'small': ['var(--font-size-small)', { lineHeight: 'var(--line-height-3)', fontWeight: 'var(--font-weight-regular)' }],
        'extra': ['var(--font-size-extra)', { lineHeight: 'var(--line-height-3)', fontWeight: 'var(--font-weight-regular)' }],
      },
      transitionDuration: {
        'fast': 'var(--duration-fast)',
        'normal': 'var(--duration-normal)',
        'slow': 'var(--duration-slow)',
      },
      transitionTimingFunction: {
        'ease': 'var(--easing-ease)',
        'bounce': 'var(--easing-bounce)',
      },
      backdropBlur: {
        'glass': 'var(--glass-blur)',
      },
      animation: {
        'fade-in': 'fadeIn var(--duration-normal) var(--easing-ease)',
        'slide-up': 'slideUp var(--duration-normal) var(--easing-ease)',
        'slide-down': 'slideDown var(--duration-normal) var(--easing-ease)',
        'scale-in': 'scaleIn var(--duration-fast) var(--easing-ease)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
