/**
 * @component AnimatedSpinner
 * @import {AnimatedSpinner} from '../components/ui'
 * @description Smooth animated loading spinner with theme support and configurable options
 *
 * @props
 * size?: 'small'|'medium'|'large'|number (default: 'medium')
 * color?: string (overrides theme color)
 * speed?: number (animation duration in ms, default: 1000)
 * style?: ViewStyle (additional styling)
 */

import React, { useRef, useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

interface AnimatedSpinnerProps {
    size?: 'small' | 'medium' | 'large' | number;
    color?: string;
    speed?: number;
    style?: ViewStyle;
}

const SIZE_MAP = {
    small: 16,
    medium: 24,
    large: 32,
};

export const AnimatedSpinner: React.FC<AnimatedSpinnerProps> = ({
                                                                    size = 'medium',
                                                                    color,
                                                                    speed = 1000,
                                                                    style,
                                                                }) => {
    const { primary } = useTheme();
    const rotation = useSharedValue(0);

    const spinnerSize = typeof size === 'number' ? size : SIZE_MAP[size];
    const spinnerColor = color || primary;

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(360, {
                duration: speed,
                easing: Easing.linear,
            }),
            -1
        );
    }, [rotation, speed]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${rotation.value}deg` }],
        };
    });

    return (
        <View
            style={[
                {
                    width: spinnerSize,
                    height: spinnerSize,
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                style,
            ]}
            accessibilityRole="progressbar"
            accessibilityLabel="Loading"
        >
            <Animated.View
                style={[
                    {
                        width: spinnerSize,
                        height: spinnerSize,
                        borderRadius: spinnerSize / 2,
                        borderWidth: Math.max(2, spinnerSize / 8),
                        borderColor: 'transparent',
                        borderTopColor: spinnerColor,
                        borderRightColor: spinnerColor,
                    },
                    animatedStyle,
                ]}
            />
        </View>
    );
};