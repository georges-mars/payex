import React, { useState, useRef } from 'react';
import { TouchableOpacity, TouchableOpacityProps, Text, TextStyle, ViewStyle, ActivityIndicator } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

// Static button sizes (no theme dependency)
const buttonSizes = {
  default: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    minHeight: 36,
  },
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    minHeight: 32,
  },
  lg: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 44,
  },
  icon: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    minHeight: 36,
    minWidth: 36,
  },
};

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  debounceMs?: number;
  style?: any
}

export const Button: React.FC<ButtonProps> = ({
                                                variant = 'default',
                                                size = 'default',
                                                className,
                                                children,
                                                style,
                                                onPress,
                                                onClick,
                                                disabled = false,
                                                loading = false,
                                                debounceMs = 300,
                                                ...props
                                              }) => {
  const { 
    primary, 
    primaryForeground,
    destructive,
    destructiveForeground,
    secondary,
    secondaryForeground,
    text, 
    textMuted, 
    cardBackground,
    borderRadius 
  } = useTheme();
  
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Button variant styles (theme-dependent)
  const buttonVariants = {
    default: {
      backgroundColor: primary,
      borderColor: 'transparent',
    },
    destructive: {
      backgroundColor: destructive,
      borderColor: 'transparent',
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: text,
      borderWidth: 1,
    },
    secondary: {
      backgroundColor: secondary,
      borderColor: 'transparent',
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    link: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
  };

  const textVariants = {
    default: { color: primaryForeground },
    destructive: { color: destructiveForeground },
    outline: { color: text },
    secondary: { color: text },
    ghost: { color: text },
    link: { color: primary, textDecorationLine: 'underline' as const },
  };
  
  const variantStyles = buttonVariants[variant];
  const sizeStyles = buttonSizes[size];
  const textColor = textVariants[variant];
  const isDisabled = disabled || loading || isDebouncing;

  // Get pressed state styles for better visual feedback
  const getPressedStyles = (): ViewStyle => {
    if (!isPressed || isDisabled) return {};

    switch (variant) {
      case 'outline':
        return {
          backgroundColor: cardBackground,
          borderColor: textMuted,
        };
      case 'secondary':
        return {
          backgroundColor: cardBackground,
        };
      case 'ghost':
        return {
          backgroundColor: cardBackground,
        };
      case 'link':
        return {
          backgroundColor: cardBackground,
        };
      default:
        return {};
    }
  };

  const defaultStyles: ViewStyle = {
    borderRadius: borderRadius * 0.75,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...variantStyles,
    ...getPressedStyles(),
    paddingHorizontal: sizeStyles.paddingHorizontal,
    paddingVertical: sizeStyles.paddingVertical,
    minHeight: sizeStyles.minHeight,
    ...(size === 'icon' && { minWidth: (sizeStyles as any).minWidth }),
  };

  const textStyles: TextStyle = {
    fontSize: sizeStyles.fontSize,
    fontWeight: '500',
    ...textColor,
  };

  const disabledStyles: ViewStyle = isDisabled ? {
    opacity: 0.5,
  } : {};

  const disabledTextStyles: TextStyle = isDisabled ? {
    opacity: 0.5,
  } : {};

  const handlePress = () => {
    const pressHandler = onPress || onClick;
    if (!pressHandler || isDisabled) return;

    // Set debouncing state
    setIsDebouncing(true);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Call the handler
    pressHandler();

    // Reset debouncing after delay
    debounceTimer.current = setTimeout(() => {
      setIsDebouncing(false);
    }, debounceMs);
  };

  const getSpinnerColor = () => {
    if (variant === 'default') return primaryForeground;
    if (variant === 'destructive') return destructiveForeground;
    if (variant === 'secondary') return secondaryForeground;
    if (variant === 'outline' || variant === 'ghost') return text;
    if (variant === 'link') return primary;
    return primaryForeground;
  };

  return (
      <TouchableOpacity
          style={[defaultStyles, disabledStyles, style]}
          onPress={handlePress}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
          disabled={isDisabled}
          activeOpacity={isDisabled ? 1 : 0.85}
          {...props}
      >
        {loading && (
            <ActivityIndicator
                size="small"
                color={getSpinnerColor()}
                style={{ marginRight: children ? 8 : 0 }}
            />
        )}

        {React.isValidElement(children) ? (
            children
        ) : (
            <Text style={[textStyles, disabledTextStyles, loading && { marginLeft: 8 }]}>
              {children}
            </Text>
        )}
      </TouchableOpacity>
  );
};
