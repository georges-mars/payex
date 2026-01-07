import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Moon, Sun } from 'lucide-react-native';
import { useTheme, useThemeMode } from '../contexts/ThemeContext';

interface ThemeSwitcherProps {
    showLabel?: boolean;
    size?: 'small' | 'medium' | 'large';
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
                                                                showLabel = true,
                                                                size = 'medium'
                                                            }) => {
    const theme = useTheme();
    const { themeMode, toggleTheme } = useThemeMode();

    const iconSize = size === 'small' ? 18 : size === 'large' ? 28 : 24;
    const textSize = size === 'small' ? 14 : size === 'large' ? 18 : 16;

    return (
        <TouchableOpacity
            onPress={toggleTheme}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.cardBackground,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: theme.borderRadius,
                borderWidth: 1,
                borderColor: theme.border,
                shadowColor: theme.cardShadowColor,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: theme.cardShadowOpacity,
                shadowRadius: theme.cardShadowRadius,
                elevation: theme.cardElevation,
            }}
            activeOpacity={0.7}
        >
            <View
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: theme.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: showLabel ? 12 : 0,
                }}
            >
                {themeMode === 'light' ? (
                    <Sun size={iconSize} color={theme.primaryForeground} />
                ) : (
                    <Moon size={iconSize} color={theme.primaryForeground} />
                )}
            </View>

            {showLabel && (
                <View style={{ flex: 1 }}>
                    <Text
                        style={{
                            fontSize: textSize,
                            fontWeight: '600',
                            color: theme.text,
                            marginBottom: 2,
                        }}
                    >
                        {themeMode === 'light' ? 'Light Mode' : 'Dark Mode'}
                    </Text>
                    <Text
                        style={{
                            fontSize: textSize - 2,
                            color: theme.textMuted,
                        }}
                    >
                        Tap to switch to {themeMode === 'light' ? 'dark' : 'light'} mode
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

export default ThemeSwitcher;