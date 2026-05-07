import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {Appearance, ColorSchemeName} from 'react-native';
import {getThemePreference, saveThemePreference} from '../../services/storage';
import type {AppTheme, ThemeColors} from '../../types';

// ─── Color palettes ───────────────────────────────────────────────────────────

const LIGHT_COLORS: ThemeColors = {
  background: '#F6F7F8',
  surface: '#FFFFFF',
  surfaceVariant: '#EFF1F3',
  text: '#1A1A1B',
  textSecondary: '#878A8C',
  primary: '#FF4500',
  primaryVariant: '#FF6534',
  border: '#EDEFF1',
  upvote: '#FF4500',
  downvote: '#7193FF',
  read: '#C6C9CC',
  error: '#FF585B',
  success: '#46D160',
  overlay: 'rgba(0,0,0,0.5)',
};

const DARK_COLORS: ThemeColors = {
  background: '#1A1A1B',
  surface: '#272729',
  surfaceVariant: '#313335',
  text: '#D7DADC',
  textSecondary: '#818384',
  primary: '#FF4500',
  primaryVariant: '#FF6534',
  border: '#343536',
  upvote: '#FF4500',
  downvote: '#7193FF',
  read: '#555657',
  error: '#FF585B',
  success: '#46D160',
  overlay: 'rgba(0,0,0,0.7)',
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  theme: AppTheme;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: AppTheme | 'system') => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const systemScheme = Appearance.getColorScheme();

  // 'system' means follow device setting; 'light'/'dark' is a manual override
  const [preference, setPreference] = useState<AppTheme | 'system'>('system');
  const [systemTheme, setSystemTheme] = useState<AppTheme>(
    systemScheme === 'dark' ? 'dark' : 'light',
  );

  // Load persisted preference
  useEffect(() => {
    getThemePreference().then(stored => setPreference(stored));
  }, []);

  // Listen for system appearance changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(
      ({colorScheme}: {colorScheme: ColorSchemeName}) => {
        setSystemTheme(colorScheme === 'dark' ? 'dark' : 'light');
      },
    );
    return () => subscription.remove();
  }, []);

  const theme: AppTheme = preference === 'system' ? systemTheme : preference;
  const colors: ThemeColors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  const toggleTheme = useCallback(() => {
    const next: AppTheme = theme === 'dark' ? 'light' : 'dark';
    setPreference(next);
    saveThemePreference(next);
  }, [theme]);

  const setTheme = useCallback((newTheme: AppTheme | 'system') => {
    setPreference(newTheme);
    saveThemePreference(newTheme);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({theme, colors, toggleTheme, setTheme}),
    [theme, colors, toggleTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return ctx;
}

export {LIGHT_COLORS, DARK_COLORS};
