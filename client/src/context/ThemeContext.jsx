import { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import { apiCall } from '../services/api';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || 'system');

  const setTheme = (nextTheme) => {
    setThemeState(nextTheme);
    localStorage.setItem('theme', nextTheme);

    // Persist for signed-in users; local storage remains an immediate fallback.
    if (user) {
      apiCall('/settings', { method: 'PUT', body: JSON.stringify({ theme: nextTheme }) }).catch(() => {});
    }
  };

  useEffect(() => {
    if (user?.settings?.theme) {
      setThemeState(user.settings.theme);
    } else {
      const savedTheme = localStorage.getItem('theme') || 'system';
      setThemeState(savedTheme);
    }
  }, [user]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.removeAttribute('data-theme');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.setAttribute('data-theme', systemTheme);
    } else {
      root.setAttribute('data-theme', theme);
    }

    localStorage.setItem('theme', theme);
  }, [theme, user]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
