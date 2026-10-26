import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  bg: string;
  surface: string;
  card: string;
  cardHover: string;
  border: string;
  borderSubtle: string;
  text: string;
  textDim: string;
  textMuted: string;
  headerBg: string;
  codeBg: string;
  accent: string;
}

export const DARK_THEME_COLORS: ThemeColors = {
  bg: '#080e1a',        // Deep midnight navy
  surface: '#0f172a',   // Navy surface
  card: '#162238',      // Oceanic slate card
  cardHover: '#1e2e4a', // Card hover
  border: '#233857',    // Navy border
  borderSubtle: '#182840',
  text: '#f0f9ff',      // Ice white text
  textDim: '#93c5fd',   // Soft blue text
  textMuted: '#64748b', // Slate muted
  headerBg: '#09101f',  // Midnight blue header
  codeBg: '#050912',    // Deep ocean code block
  accent: '#38bdf8',    // Electric Sky Blue accent
};

export const LIGHT_THEME_COLORS: ThemeColors = {
  bg: '#f0f7ff',        // Crisp ice blue
  surface: '#ffffff',   // Clean white
  card: '#e6f0fc',      // Soft sky-blue card
  cardHover: '#dbeafe',
  border: '#bfdbfe',    // Crisp light blue border
  borderSubtle: '#dbeafe',
  text: '#0c2340',      // Deep navy text
  textDim: '#1e40af',   // Royal blue text
  textMuted: '#64748b', // Slate muted
  headerBg: '#ffffff',  // Clean white header
  codeBg: '#eef6ff',    // Soft ice blue code background
  accent: '#0284c7',    // Rich Oceanic Cyan/Blue
};

interface ThemeContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
  colors: DARK_THEME_COLORS,
  isDark: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('unified_devtools_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const isDark = theme === 'dark';
  const colors = isDark ? DARK_THEME_COLORS : LIGHT_THEME_COLORS;

  useEffect(() => {
    localStorage.setItem('unified_devtools_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme, isDark]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
