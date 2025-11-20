// mobile/constants/theme.ts
export type ThemeMode = 'light' | 'dark' | 'auto';

export const lightTheme = {
  colors: {
    primary: '#0ea5e9',
    'primary-dark': '#0284c7',
    'primary-light': '#38bdf8',
    
    accent: '#d946ef',
    'accent-dark': '#c026d3',
    'accent-light': '#e879f9',
    
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    
    background: '#f9fafb',
    surface: '#ffffff',
    'surface-light': '#f3f4f6',
    
    border: '#e5e7eb',
    'border-light': '#f3f4f6',
    
    'text-primary': '#111827',
    'text-secondary': '#6b7280',
    'text-muted': '#9ca3af',
  },
};

export const darkTheme = {
  colors: {
    primary: '#0ea5e9',
    'primary-dark': '#0284c7',
    'primary-light': '#38bdf8',
    
    accent: '#d946ef',
    'accent-dark': '#c026d3',
    'accent-light': '#e879f9',
    
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    
    background: '#111827',
    surface: '#1f2937',
    'surface-light': '#374151',
    
    border: '#374151',
    'border-light': '#4b5563',
    
    'text-primary': '#f9fafb',
    'text-secondary': '#d1d5db',
    'text-muted': '#9ca3af',
  },
};

export const getTheme = (isDark: boolean) => (isDark ? darkTheme : lightTheme);