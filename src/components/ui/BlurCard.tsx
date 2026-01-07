/**
 * @component BlurCard
 * @import {BlurCard} from '../components/ui'
 * @description Glassmorphic card with blur effect background using expo-blur
 *
 * @props
 * children: React.ReactNode - Content to display inside the card
 * style?: StyleProp<ViewStyle> - Additional styles to apply
 * padding?: number (default: 16) - Inner padding for content
 * margin?: number - Overall margin
 * marginBottom?: number - Bottom margin
 * marginTop?: number - Top margin
 * marginHorizontal?: number - Horizontal margin
 * marginVertical?: number - Vertical margin
 * borderRadius?: number - Custom border radius (defaults to theme)
 * intensity?: number - Blur intensity override
 * variant?: 'default'|'premium'|'subtle' (default: 'default') - Visual style variant
 * disabled?: boolean (default: false) - Disable blur effect, fallback to regular card
 *
 * @variants
 * default: Standard blur (30), normal shadow, glassmorphic border
 * premium: Strong blur (60), enhanced shadow, premium glassmorphic border
 * subtle: Light blur (10), reduced shadow, standard border
 *
 * @examples
 * // Basic blur card
 * <BlurCard>
 *   <Text>Card content</Text>
 * </BlurCard>
 *
 * // Premium variant with custom padding
 * <BlurCard variant="premium" padding={24}>
 *   <View>
 *     <Text>Premium content</Text>
 *   </View>
 * </BlurCard>
 *
 * // Subtle card with margins
 * <BlurCard variant="subtle" marginHorizontal={16} marginVertical={8}>
 *   <Text>Subtle glassmorphic effect</Text>
 * </BlurCard>
 *
 * // Custom blur intensity
 * <BlurCard intensity={45} borderRadius={20}>
 *   <Text>Custom blur settings</Text>
 * </BlurCard>
 *
 * // Disabled blur (fallback to regular card)
 * <BlurCard disabled>
 *   <Text>Regular card without blur</Text>
 * </BlurCard>
 *
 * @theme-usage
 * glassmorphic.background, glassmorphic.border, glassmorphic.isDark (blur tint)
 * cardBackground (disabled fallback), border (standard border)
 * borderRadius, cardShadowColor, cardShadowOpacity, cardShadowRadius, cardElevation
 *
 * @important
 * - Uses expo-blur BlurView for glassmorphic effect
 * - Automatically selects tint based on theme (systemMaterialDark/Light)
 * - Falls back to regular card when disabled or blur not supported
 * - Variant affects blur intensity, shadow, and border styling
 * - Shadow properties scale with variant (premium: 1.5x, subtle: 0.5x)
 * - Container has overflow:'hidden' for proper border radius clipping
 */

import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';

interface BlurCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  margin?: number;
  marginBottom?: number;
  marginTop?: number;
  marginHorizontal?: number;
  marginVertical?: number;
  borderRadius?: number;
  intensity?: number;
  variant?: 'default' | 'premium' | 'subtle';
  disabled?: boolean;
}

export const BlurCard: React.FC<BlurCardProps> = ({
  children,
  style,
  padding = 16,
  margin,
  marginBottom,
  marginTop,
  marginHorizontal,
  marginVertical,
  borderRadius,
  intensity,
  variant = 'default',
  disabled = false,
}) => {
  const { 
    glassmorphic, 
    cardBackground,
    border,
    borderRadius: themeBorderRadius,
    cardShadowColor,
    cardShadowOpacity,
    cardShadowRadius,
    cardElevation
  } = useTheme();

  // Different intensities for variants
  const getIntensity = () => {
    if (intensity !== undefined) return intensity;
    switch (variant) {
      case 'premium': return 60;
      case 'subtle': return 10;
      default: return 30;
    }
  };

  // Different shadow styles for variants
  const getShadowStyle = (): ViewStyle => {
    switch (variant) {
      case 'premium':
        return {
          shadowColor: cardShadowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: cardShadowOpacity * 1.5,
          shadowRadius: cardShadowRadius * 1.5,
          elevation: cardElevation * 1.5,
        };
      case 'subtle':
        return {
          shadowColor: cardShadowColor,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: cardShadowOpacity * 0.5,
          shadowRadius: cardShadowRadius * 0.5,
          elevation: cardElevation * 0.5,
        };
      default:
        return {
          shadowColor: cardShadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: cardShadowOpacity,
          shadowRadius: cardShadowRadius,
          elevation: cardElevation,
        };
    }
  };

  const containerStyle: ViewStyle = {
    borderRadius: borderRadius ?? themeBorderRadius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: variant === 'premium' ? glassmorphic.border : border,
    backgroundColor: glassmorphic.background,
    margin,
    marginBottom,
    marginTop,
    marginHorizontal,
    marginVertical,
    ...getShadowStyle(),
  };

  // If blur is disabled or not supported, fall back to regular card
  if (disabled) {
    return (
      <View style={[containerStyle, { backgroundColor: cardBackground }, style]}>
        <View style={{ padding }}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <BlurView
      intensity={getIntensity()}
      tint={glassmorphic.isDark ? 'systemMaterialDark' : 'systemMaterialLight'}
      style={[containerStyle, style]}
    >
      <View style={{ padding }}>
        {children}
      </View>
    </BlurView>
  );
};

export default BlurCard;