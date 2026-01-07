/**
 * @component Skeleton
 * @import {Skeleton, SkeletonCard, SkeletonListItem, SkeletonAvatar} from '../components/ui'
 * @description Animated loading placeholder components with multiple variants
 *
 * @props
 * variant: 'default'|'text'|'avatar'|'button'|'card'|'list'|'circle'|'rectangle' (default: 'default')
 * width?: number | string (overrides variant width)
 * height?: number (overrides variant height)
 * animated?: boolean (default: true)
 * className?: string
 * style?: ViewStyle
 * ...ViewProps (all React Native View props)
 *
 * @examples
 * <Skeleton variant="text" width="80%" />
 * <Skeleton variant="avatar" animated={false} />
 * <Skeleton variant="button" width={120} height={40} />
 * <SkeletonCard animated={true} />
 * <SkeletonListItem showAvatar={false} />
 * <SkeletonAvatar size="lg" />
 *
 * @theme-usage
 * Uses skeletonBackground (static), skeletonAnimationStart/End (animation colors)
 * Card components use cardBackground with shadow
 *
 * @important
 * - Animation loops every 2 seconds (1s fade in, 1s fade out)
 * - Animated uses Animated.View, static uses regular View
 * - Variants have predefined sizes: avatar=40x40, button=36h, card=200h
 * - SkeletonCard includes image, title, and description placeholders
 * - SkeletonListItem shows avatar + content rows
 * - SkeletonAvatar has size variants: sm=32px, md=40px, lg=56px
 * - Width/height props override variant dimensions
 */

import React, { useEffect, useRef } from 'react';
import { View, ViewProps, Animated, ViewStyle, DimensionValue } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

// Skeleton variants
const skeletonVariants = {
  default: {
    height: 16,
    borderRadius: 4,
  },
  text: {
    height: 16,
    borderRadius: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  button: {
    height: 36,
    borderRadius: 6,
  },
  card: {
    height: 200,
    borderRadius: 8,
  },
  list: {
    height: 60,
    borderRadius: 8,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  rectangle: {
    height: 100,
    borderRadius: 4,
  },
};

// Skeleton component interface
interface SkeletonProps extends ViewProps {
  variant?: keyof typeof skeletonVariants;
  width?: DimensionValue;
  height?: number;
  className?: string;
  animated?: boolean;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
                                                    variant = 'default',
                                                    width,
                                                    height,
                                                    className,
                                                    style,
                                                    animated = true,
                                                    ...props
                                                  }) => {
  const { skeletonBackground, skeletonAnimationStart, skeletonAnimationEnd } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;
  const variantStyles = skeletonVariants[variant];

  useEffect(() => {
    if (animated) {
      const animation = Animated.loop(
          Animated.sequence([
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: false,
            }),
            Animated.timing(animatedValue, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: false,
            }),
          ])
      );
      animation.start();

      return () => animation.stop();
    }
  }, [animated, animatedValue]);

  const backgroundColor = animated
      ? animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [skeletonAnimationStart, skeletonAnimationEnd],
      })
      : skeletonBackground;

  const defaultStyles: ViewStyle = {
    backgroundColor: animated ? undefined : skeletonBackground,
    ...variantStyles,
    ...(width && { width }),
    ...(height && { height }),
  };

  if (animated) {
    return (
        <Animated.View
            style={[
              defaultStyles,
              { backgroundColor },
              style,
            ] as any}
            {...props}
        />
    );
  }

  return (
      <View
          style={[defaultStyles, style]}
          {...props}
      />
  );
};

// Skeleton Card - Common pattern
interface SkeletonCardProps extends ViewProps {
  className?: string;
  animated?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
                                                            className,
                                                            style,
                                                            animated = true,
                                                            ...props
                                                          }) => {
  const { cardBackground } = useTheme();

  return (
      <View
          style={[
            {
              padding: 16,
              backgroundColor: cardBackground,
              borderRadius: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            },
            style,
          ]}
          {...props}
      >
        {/* Image skeleton */}
        <Skeleton variant="card" animated={animated} style={{ marginBottom: 12 }} />

        {/* Title skeleton */}
        <Skeleton variant="text" width="80%" animated={animated} style={{ marginBottom: 8 }} />

        {/* Description skeleton */}
        <Skeleton variant="text" width="60%" animated={animated} style={{ marginBottom: 4 }} />
        <Skeleton variant="text" width="40%" animated={animated} />
      </View>
  );
};

// Skeleton List Item - Common pattern
interface SkeletonListItemProps extends ViewProps {
  className?: string;
  animated?: boolean;
  showAvatar?: boolean;
}

export const SkeletonListItem: React.FC<SkeletonListItemProps> = ({
                                                                    className,
                                                                    style,
                                                                    animated = true,
                                                                    showAvatar = true,
                                                                    ...props
                                                                  }) => {
  const { cardBackground } = useTheme();

  return (
      <View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              backgroundColor: cardBackground,
              borderRadius: 8,
            },
            style,
          ]}
          {...props}
      >
        {/* Avatar skeleton */}
        {showAvatar && (
            <Skeleton
                variant="avatar"
                animated={animated}
                style={{ marginRight: 12 }}
            />
        )}

        {/* Content skeleton */}
        <View style={{ flex: 1 }}>
          <Skeleton
              variant="text"
              width="70%"
              animated={animated}
              style={{ marginBottom: 8 }}
          />
          <Skeleton
              variant="text"
              width="50%"
              animated={animated}
              style={{ height: 12 }}
          />
        </View>

        {/* Action skeleton */}
        <Skeleton
            variant="button"
            width={60}
            animated={animated}
            style={{ height: 24 }}
        />
      </View>
  );
};

// Skeleton Avatar with Text - Common pattern
interface SkeletonAvatarProps extends ViewProps {
  className?: string;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
                                                                className,
                                                                style,
                                                                animated = true,
                                                                size = 'md',
                                                                ...props
                                                              }) => {
  const sizes = {
    sm: { width: 32, height: 32, borderRadius: 16 },
    md: { width: 40, height: 40, borderRadius: 20 },
    lg: { width: 56, height: 56, borderRadius: 28 },
  };

  const avatarSize = sizes[size];

  return (
      <View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
            },
            style,
          ]}
          {...props}
      >
        {/* Avatar skeleton */}
        <Skeleton
            animated={animated}
            style={[avatarSize, { marginRight: 12 }]}
        />

        {/* Text skeleton */}
        <View style={{ flex: 1 }}>
          <Skeleton
              variant="text"
              width="60%"
              animated={animated}
              style={{ marginBottom: 4 }}
          />
          <Skeleton
              variant="text"
              width="40%"
              animated={animated}
              style={{ height: 12 }}
          />
        </View>
      </View>
  );
};
