/**
 * @component Logo
 * @import {Logo} from '../components/ui'
 * @description App logo component with theme-aware styling and automatic caching
 *
 * @props
 * size?: number (default: 40) - Logo dimensions (width and height)
 * style?: ViewStyle - Additional container styles
 * source?: string - Custom logo URL (defaults to app logo)
 * rounded?: boolean (default: false) - Apply circular border radius
 * withShadow?: boolean (default: false) - Apply theme shadow styles
 *
 * @examples
 * // Default logo with theme border radius
 * <Logo />
 *
 * // Large logo with shadow
 * <Logo size={80} withShadow />
 *
 * // Small rounded logo
 * <Logo size={24} rounded />
 *
 * // Custom logo with theme styling
 * <Logo
 *   size={60}
 *   source="https://example.com/custom-logo.png"
 *   withShadow
 * />
 *
 * // With additional styles
 * <Logo
 *   size={50}
 *   style={{ marginVertical: 20 }}
 * />
 *
 * @caching-behavior
 * - Images are automatically cached on disk and in memory
 * - First load: Downloads from network and caches
 * - Subsequent loads: Serves from cache instantly
 * - Cache persists across app sessions
 * - No network request made if image is already cached
 * - expo-image handles cache invalidation automatically
 *
 * @performance
 * - Zero network requests after initial load
 * - Instant display from memory cache when available
 * - Disk cache provides persistence between app launches
 * - 200ms smooth fade-in transition on first load
 * - Optimized with expo-image's native performance
 *
 * @theme-usage
 * - borderRadius: Applied at 75% scale when not rounded
 * - cardShadowColor, cardShadowOpacity, cardShadowRadius, cardElevation: Used when withShadow=true
 * - cardBackground: Background color when shadow is applied
 *
 * @important
 * - Uses theme borderRadius (scaled to 75%) for consistent styling
 * - Shadow styles match theme card shadows when withShadow=true
 * - Caching is AUTOMATIC - no configuration needed
 * - The logo will NOT reload from network every time
 * - Cache works across all Logo instances with same source
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../../contexts/ThemeContext';

interface LogoProps {
    size?: number;
    style?: ViewStyle;
    source?: string;
    rounded?: boolean;
    withShadow?: boolean;
}

// Default app logo URL - cached permanently
const DEFAULT_LOGO_URL =  "https://cdn.jsdelivr.net/gh/Salvatore-droid/payvexmagically/assets/images/payvex.png";

export const Logo = ({
    size = 40,
    style,
    source = DEFAULT_LOGO_URL,
    rounded = false,
    withShadow = false
}: LogoProps) => {
    const {
        borderRadius: themeBorderRadius,
        cardShadowColor,
        cardShadowOpacity,
        cardShadowRadius,
        cardElevation,
        cardBackground
    } = useTheme();

    const borderRadius = rounded ? size / 2 : themeBorderRadius * 0.75;

    const shadowStyle: ViewStyle = withShadow ? {
        shadowColor: cardShadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: cardShadowOpacity,
        shadowRadius: cardShadowRadius,
        elevation: cardElevation,
        backgroundColor: cardBackground,
    } : {};

    return (
        <View style={[
            {
                width: size,
                height: size,
                borderRadius,
                overflow: 'hidden'
            },
            shadowStyle,
            style
        ]}>
            <Image
                source={{ uri: source }}
                style={{
                    width: size,
                    height: size,
                }}
                contentFit="contain"
                transition={200}
                cachePolicy="memory-disk"
                priority="high"
            />
        </View>
    );
};