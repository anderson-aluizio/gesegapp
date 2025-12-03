import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

export const lightColors = {
    // Primary colors
    primary: '#2980ef',
    primaryDark: '#667eea',

    // Background colors
    background: '#f8f9fa',
    backgroundAlt: '#2980ef',
    surface: '#ffffff',
    surfaceVariant: '#f5f7fa',

    // Text colors
    text: '#333333',
    textSecondary: '#555555',
    textTertiary: '#666666',
    textOnPrimary: '#ffffff',

    // Border colors
    border: '#e1e8ed',
    divider: '#e1e8ed',

    // Button colors
    buttonPrimary: '#2980ef',
    buttonText: '#ffffff',

    // Input colors
    inputBackground: '#ffffff',
    inputBorder: '#e1e8ed',

    // Status colors
    error: '#e74c3c',
    success: '#27ae60',
    warning: '#f39c12',
    info: '#2196f3',

    // Link colors
    link: '#2980ef',

    // Shadow
    shadow: '#000000',
};

export const darkColors = {
    // Primary colors
    primary: '#4a9af5',
    primaryDark: '#7b93ed',

    // Background colors
    background: '#121212',
    backgroundAlt: '#1a1a2e',
    surface: '#1e1e1e',
    surfaceVariant: '#2a2a2a',

    // Text colors
    text: '#e1e1e1',
    textSecondary: '#b0b0b0',
    textTertiary: '#888888',
    textOnPrimary: '#ffffff',

    // Border colors
    border: '#3a3a3a',
    divider: '#3a3a3a',

    // Button colors
    buttonPrimary: '#4a9af5',
    buttonText: '#ffffff',

    // Input colors
    inputBackground: '#2a2a2a',
    inputBorder: '#3a3a3a',

    // Status colors
    error: '#ef5350',
    success: '#4caf50',
    warning: '#ffb74d',
    info: '#42a5f5',

    // Link colors
    link: '#4a9af5',

    // Shadow
    shadow: '#000000',
};

export type ThemeColors = typeof lightColors;

interface ThemeContextType {
    colors: ThemeColors;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const value = useMemo(() => ({
        colors: isDark ? darkColors : lightColors,
        isDark,
    }), [isDark]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextType {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
