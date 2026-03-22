import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children, defaultTheme = 'system' }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('chat-theme') || defaultTheme
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    const applyTheme = () => {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

      root.classList.add(theme === 'system' ? systemTheme : theme);
    };

    applyTheme();

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', applyTheme);

    return () => media.removeEventListener('change', applyTheme);
  }, [theme]);

  const setThemeAndSave = (value) => {
    setTheme(value);
    localStorage.setItem('chat-theme', value);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setThemeAndSave(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeAndSave, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
/* eslint-disable react-refresh/only-export-components */
export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};