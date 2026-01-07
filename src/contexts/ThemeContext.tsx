/**
 * @context ThemeContext
 * @import import { useTheme, useThemeMode, ThemeProvider } from '../contexts/ThemeContext'
 * @description Provides theme colors and theme switching to all UI components via React Context
 * 
 * @usage
 * // In App.tsx (wrap your app)
 * <ThemeProvider>
 *   <YourApp />
 * </ThemeProvider>
 * 
 * // In components - get theme colors
 * const { primary, text, cardBackground } = useTheme();
 * 
 * // For theme switching
 * const { themeMode, toggleTheme, setThemeMode } = useThemeMode();
 * 
 * @hook useTheme()
 * Returns all theme colors defined in constants/theme.ts
 * Available keys: background, cardBackground, text, textMuted, textLight, primary, primaryForeground, 
 * error, errorForeground, success, warning, border, inputBackground, headerBackground, tabBar*, skeleton*, etc.
 * See constants/theme.ts for complete list
 * Throws error if used outside ThemeProvider
 * 
 * @hook useThemeMode()
 * Returns:
 * - themeMode: 'light' | 'dark' - current theme mode
 * - toggleTheme: () => void - toggles between light and dark
 * - setThemeMode: (mode: 'light' | 'dark') => void - sets specific theme
 * 
 * @important
 * - Must wrap app with ThemeProvider
 * - All UI components use this hook for theming
 * - Default theme is light (does not use system settings)
 * - Theme preference is stored in AsyncStorage
 * - Hook ensures type safety for all theme colors
 */

import React, {createContext, ReactNode, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {DEFAULT_THEME_IN_CONTEXT, themes} from "../constants/theme";
import {MagicallyConfig} from "../magically/config";

type ThemeMode = 'light' | 'dark';
type ThemeType = typeof themes.light | typeof themes.dark;

interface ThemeContextType {
  theme: ThemeType;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = `@theme_mode_${MagicallyConfig.projectId}`;

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  // Support both destructuring patterns:
  // 1. const theme = useTheme() → theme.background
  // 2. const { background } = useTheme()
  // 3. const { theme } = useTheme() → theme.background (LLM pattern)
  return {
    ...context.theme,     // Spread all theme properties for direct destructuring
    theme: context.theme  // Also include 'theme' property for wrapped access
  };
};

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return {
    themeMode: context.themeMode,
    toggleTheme: context.toggleTheme,
    setThemeMode: context.setThemeMode,
  };
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(DEFAULT_THEME_IN_CONTEXT); // Default to light
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setThemeModeState(savedTheme);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  // Save theme preference
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
      setThemeModeState(mode); // Still update even if save fails
    }
  };

  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  const theme: any = themes[themeMode];

  const value: ThemeContextType = {
    theme,
    themeMode,
    toggleTheme,
    setThemeMode,
  };

  // Don't render until we've loaded the saved theme preference
  if (isLoading) {
    return null; // Or a loading indicator if preferred
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};