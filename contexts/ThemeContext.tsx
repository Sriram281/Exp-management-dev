import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSettings, saveSettings } from '@/utils/storage';

export interface Theme {
  colors: {
    background: string;
    surface: string;
    card: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    border: string;
    shadow: string;
    primary: string;
    success: string;
    danger: string;
    warning: string;
    income: string;
    expense: string;
  };
  isDark: boolean;
}

const lightTheme: Theme = {
  colors: {
    background: '#f8fafc',
    surface: '#ffffff',
    card: '#ffffff',
    text: {
      primary: '#1f2937',
      secondary: '#374151',
      muted: '#6b7280',
    },
    border: '#e5e7eb',
    shadow: '#000000',
    primary: '#3B82F6',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    income: '#10B981',
    expense: '#EF4444',
  },
  isDark: false,
};

const darkTheme: Theme = {
  colors: {
    background: '#0f172a',
    surface: '#1e293b',
    card: '#334155',
    text: {
      primary: '#f1f5f9',
      secondary: '#cbd5e1',
      muted: '#94a3b8',
    },
    border: '#475569',
    shadow: '#000000',
    primary: '#60a5fa',
    success: '#34d399',
    danger: '#f87171',
    warning: '#fbbf24',
    income: '#34d399',
    expense: '#f87171',
  },
  isDark: true,
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const settings = await getSettings();
      setIsDark(settings.darkMode || false);
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newDarkMode = !isDark;
      setIsDark(newDarkMode);
      
      const settings = await getSettings();
      await saveSettings({ ...settings, darkMode: newDarkMode });
    } catch (error) {
      console.error('Error toggling theme:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};