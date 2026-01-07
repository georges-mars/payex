/**
 * @component Header (with nested components)
 * @import {Header, HeaderLeft, HeaderCenter, HeaderRight, HeaderTitle, HeaderBack} from '../components/ui'
 * @description Navigation header with absolute positioned sections for left/center/right content
 *
 * @components
 * Header: Main container (56px minHeight, row layout)
 * HeaderLeft: Left section (absolute positioned, left:16, zIndex:1)
 * HeaderCenter: Center section (absolute positioned, center-aligned, padding 80px sides, zIndex:0)
 * HeaderRight: Right section (absolute positioned, right:16, gap:8, zIndex:1)
 * HeaderTitle: Centered title text (18px, weight 600, numberOfLines:1)
 * HeaderBack: Back button with ArrowLeft icon (40x40 circle, auto-themed)
 *
 * @props
 * Header: variant:'default'|'transparent'|'filled', children
 * HeaderLeft/HeaderCenter/HeaderRight: children, style?
 * HeaderTitle: children (text), style?
 * HeaderBack: onPress:()=>void, color?:string
 *
 * @examples
 * // Shorthand with title and back button (NEW)
 * <Header title="Membership Upgrade" onBackPress={() => navigation.goBack()} />
 *
 * // Shorthand with title only
 * <Header title="Screen Title" />
 *
 * // Shorthand with back button only
 * <Header onBackPress={() => navigation.goBack()} />
 *
 * // Basic header with title (nested pattern)
 * <Header>
 *   <HeaderCenter>
 *     <HeaderTitle>Screen Title</HeaderTitle>
 *   </HeaderCenter>
 * </Header>
 *
 * // Header with back button (nested pattern)
 * <Header>
 *   <HeaderLeft>
 *     <HeaderBack onPress={() => navigation.goBack()} />
 *   </HeaderLeft>
 *   <HeaderCenter>
 *     <HeaderTitle>Details</HeaderTitle>
 *   </HeaderCenter>
 * </Header>
 *
 * // Full header with actions
 * <Header variant="filled">
 *   <HeaderLeft>
 *     <HeaderBack onPress={() => navigation.goBack()} />
 *   </HeaderLeft>
 *   <HeaderCenter>
 *     <HeaderTitle>Settings</HeaderTitle>
 *   </HeaderCenter>
 *   <HeaderRight>
 *     <Button size="icon" variant="ghost">
 *       <MoreIcon size={20} />
 *     </Button>
 *   </HeaderRight>
 * </Header>
 *
 * // Transparent header (overlays)
 * <Header variant="transparent">
 *   <HeaderLeft>
 *     <HeaderBack color="#ffffff" />
 *   </HeaderLeft>
 * </Header>
 *
 * // Custom content in sections
 * <Header>
 *   <HeaderLeft>
 *     <Button variant="ghost">Cancel</Button>
 *   </HeaderLeft>
 *   <HeaderCenter>
 *     <View style={{flexDirection:'row', alignItems:'center'}}>
 *       <Avatar size={24} />
 *       <HeaderTitle>Profile</HeaderTitle>
 *     </View>
 *   </HeaderCenter>
 *   <HeaderRight>
 *     <Button variant="ghost">Save</Button>
 *   </HeaderRight>
 * </Header>
 *
 * @theme-usage
 * headerBackground (default), cardBackground (filled), border (default border), text (title/back icon)
 *
 * @important
 * - Uses absolute positioning for left/center/right sections with proper z-index layering
 * - HeaderCenter has 80px horizontal padding to avoid overlap with left/right content
 * - HeaderBack uses lucide-react-native ArrowLeft icon (auto-imports)
 * - HeaderTitle truncates with numberOfLines={1}
 * - All sections are absolutely positioned within 56px height container
 * - HeaderRight has gap:8 for multiple action buttons
 * - Variants: default (bg+border), transparent (no bg), filled (card bg)
 */

import React from 'react';
import { View, ViewProps, Text, TextProps, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';


// Header Root Component
interface HeaderProps extends ViewProps {
    variant?: 'default' | 'transparent' | 'filled';
    className?: string;
    children?: React.ReactNode;
    style?: any;
    // Shorthand props
    title?: string;
    onBackPress?: () => void;
    backButtonColor?: string;
}

export const Header: React.FC<HeaderProps> = ({
                                                  variant = 'default',
                                                  className,
                                                  children,
                                                  style,
                                                  title,
                                                  onBackPress,
                                                  backButtonColor,
                                                  ...props
                                              }) => {
    const { headerBackground, border, cardBackground } = useTheme();

    // Header variants
    const headerVariants = {
        default: {
            backgroundColor: headerBackground,
            borderBottomWidth: 1,
            borderBottomColor: border,
        },
        transparent: {
            backgroundColor: 'transparent',
        },
        filled: {
            backgroundColor: cardBackground,
            borderBottomWidth: 1,
            borderBottomColor: border,
        },
    };

    const variantStyles = headerVariants[variant];

    const defaultStyles = {
        position: 'relative' as const,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 56,
        ...variantStyles,
    };

    // If title or onBackPress provided, use shorthand pattern
    const hasShorthandProps = title !== undefined || onBackPress !== undefined;

    return (
        <View style={[defaultStyles, style]} {...props}>
            {hasShorthandProps ? (
                <>
                    {onBackPress && (
                        <HeaderLeft>
                            <HeaderBack onPress={onBackPress} color={backButtonColor} />
                        </HeaderLeft>
                    )}
                    {title && (
                        <HeaderCenter>
                            <HeaderTitle>{title}</HeaderTitle>
                        </HeaderCenter>
                    )}
                </>
            ) : (
                children
            )}
        </View>
    );
};

// Header Left Component
interface HeaderLeftProps extends ViewProps {
    className?: string;
    children?: React.ReactNode;
    style?: any;
}

export const HeaderLeft: React.FC<HeaderLeftProps> = ({
                                                          className,
                                                          children,
                                                          style,
                                                          ...props
                                                      }) => {
    const defaultStyles = {
        position: 'absolute' as const,
        left: 16,
        top: 0,
        bottom: 0,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'flex-start' as const,
        zIndex: 1,
    };

    return (
        <View style={[defaultStyles, style]} {...props}>
            {children}
        </View>
    );
};

// Header Center Component
interface HeaderCenterProps extends ViewProps {
    className?: string;
    children?: React.ReactNode;
    style?: any;
}

export const HeaderCenter: React.FC<HeaderCenterProps> = ({
                                                              className,
                                                              children,
                                                              style,
                                                              ...props
                                                          }) => {
    const defaultStyles = {
        position: 'absolute' as const,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        paddingHorizontal: 80, // Space for left/right content
        zIndex: 0,
    };

    return (
        <View style={[defaultStyles, style]} {...props}>
            {children}
        </View>
    );
};

// Header Right Component
interface HeaderRightProps extends ViewProps {
    className?: string;
    children?: React.ReactNode;
    style?: any;
}

export const HeaderRight: React.FC<HeaderRightProps> = ({
                                                            className,
                                                            children,
                                                            style,
                                                            ...props
                                                        }) => {
    const defaultStyles = {
        position: 'absolute' as const,
        right: 16,
        top: 0,
        bottom: 0,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'flex-end' as const,
        gap: 8,
        zIndex: 1,
    };

    return (
        <View style={[defaultStyles, style]} {...props}>
            {children}
        </View>
    );
};

// Header Title Component
interface HeaderTitleProps extends TextProps {
    className?: string;
    children?: React.ReactNode;
    style?: any;
}

export const HeaderTitle: React.FC<HeaderTitleProps> = ({
                                                            className,
                                                            children,
                                                            style,
                                                            ...props
                                                        }) => {
    const { text } = useTheme();

    const defaultStyles = {
        fontSize: 18,
        fontWeight: '600' as const,
        color: text,
        textAlign: 'center' as const,
    };

    return (
        <Text style={[defaultStyles, style]} numberOfLines={1} {...props}>
            {children}
        </Text>
    );
};

// Header Back Component
interface HeaderBackProps {
    className?: string;
    onPress?: () => void;
    onClick?: () => void;
    color?: string;
}

export const HeaderBack: React.FC<HeaderBackProps> = ({
                                                          className,
                                                          onPress,
                                                          onClick,
                                                          color
                                                      }) => {
    const { text } = useTheme();
    const iconColor = color || text;
    const handlePress = onPress || onClick;

    return (
        <TouchableOpacity
            onPress={handlePress}
            style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
            }}
            activeOpacity={0.7}
        >
            <ArrowLeft size={20} color={iconColor} />
        </TouchableOpacity>
    );
};