import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Animated, Dimensions, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { Logo } from '../components/ui/Logo';
import { Mail, Shield, Lock } from 'lucide-react-native';
import magically from 'magically-sdk';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const { 
    background, 
    text, 
    textMuted, 
    textLight, 
    primary, 
    primaryForeground,
    cardBackground,
    border,
    glassmorphic
  } = useTheme();
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handleAuth = async (provider: 'google' | 'apple' | 'email') => {
    setIsLoading(true);
    setLoadingProvider(provider);
    try {
      await magically.auth.triggerAuthenticationFlow(provider);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: background }}>
      <StatusBar style={glassmorphic.isDark ? 'light' : 'dark'} />
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, minHeight: height }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 }}>
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
                { translateY: floatAnim }
              ],
              alignItems: 'center',
              marginBottom: 60,
            }}
          >
            <View style={{
              width: 120,
              height: 120,
              borderRadius: 30,
              backgroundColor: cardBackground,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 10,
              borderWidth: 1,
              borderColor: border,
            }}>
              <Logo size={70} />
            </View>
          </Animated.View>

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              marginBottom: 48,
            }}
          >
            <Text style={{
              fontSize: 32,
              fontWeight: '700',
              color: text,
              textAlign: 'center',
              marginBottom: 12,
              letterSpacing: -0.5,
            }}>
              Welcome to Payvex
            </Text>
            <Text style={{
              fontSize: 16,
              color: textMuted,
              textAlign: 'center',
              lineHeight: 24,
              paddingHorizontal: 20,
            }}>
              Your unified financial hub. Secure, simple, powerful.
            </Text>
          </Animated.View>

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              marginBottom: 32,
            }}
          >
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              paddingHorizontal: 20,
              marginBottom: 48,
            }}>
              {[
                { icon: Shield, label: 'Secure' },
                { icon: Lock, label: 'Private' },
                { icon: Mail, label: 'Verified' },
              ].map((item, index) => (
                <Animated.View
                  key={index}
                  style={{
                    alignItems: 'center',
                    opacity: fadeAnim,
                    transform: [{
                      translateY: Animated.add(slideAnim, new Animated.Value(index * 10))
                    }],
                  }}
                >
                  <View style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    backgroundColor: cardBackground,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: border,
                  }}>
                    <item.icon size={24} color={primary} strokeWidth={2} />
                  </View>
                  <Text style={{
                    fontSize: 12,
                    color: textMuted,
                    fontWeight: '600',
                  }}>
                    {item.label}
                  </Text>
                </Animated.View>
              ))}
            </View>

            <View style={{ gap: 16 }}>
              <TouchableOpacity
                onPress={() => handleAuth('google')}
                disabled={isLoading}
                activeOpacity={0.8}
                style={{
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: cardBackground,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  borderWidth: 1,
                  borderColor: border,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                  overflow: 'hidden',
                  opacity: isLoading && loadingProvider !== 'google' ? 0.5 : 1,
                }}
              >
                {loadingProvider === 'google' && (
                  <Animated.View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: glassmorphic.background,
                      transform: [{ translateX: shimmerTranslate }],
                    }}
                  />
                )}
                <Image
                  source={{ uri: 'https://yrsdqwemtqgdwoixrrge.supabase.co/storage/v1/object/public/assets/icons/google.png' }}
                  style={{ width: 24, height: 24 }}
                />
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: text,
                }}>
                  {loadingProvider === 'google' ? 'Connecting...' : 'Continue with Google'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleAuth('apple')}
                disabled={isLoading}
                activeOpacity={0.8}
                style={{
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: cardBackground,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  borderWidth: 1,
                  borderColor: border,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                  overflow: 'hidden',
                  opacity: isLoading && loadingProvider !== 'apple' ? 0.5 : 1,
                }}
              >
                {loadingProvider === 'apple' && (
                  <Animated.View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: glassmorphic.background,
                      transform: [{ translateX: shimmerTranslate }],
                    }}
                  />
                )}
                <Image
                  source={{ uri: 'https://yrsdqwemtqgdwoixrrge.supabase.co/storage/v1/object/public/assets/icons/apple.png' }}
                  style={{ 
                    width: 24, 
                    height: 24,
                    tintColor: glassmorphic.isDark ? '#ffffff' : '#000000',
                  }}
                />
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: text,
                }}>
                  {loadingProvider === 'apple' ? 'Connecting...' : 'Continue with Apple'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleAuth('email')}
                disabled={isLoading}
                activeOpacity={0.8}
                style={{
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: primary,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  shadowColor: primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 4,
                  overflow: 'hidden',
                  opacity: isLoading && loadingProvider !== 'email' ? 0.5 : 1,
                }}
              >
                {loadingProvider === 'email' && (
                  <Animated.View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: glassmorphic.background,
                      transform: [{ translateX: shimmerTranslate }],
                    }}
                  />
                )}
                <Mail size={22} color={primaryForeground} strokeWidth={2} />
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: primaryForeground,
                }}>
                  {loadingProvider === 'email' ? 'Connecting...' : 'Continue with Email'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View
            style={{
              opacity: fadeAnim,
              marginTop: 'auto',
              paddingTop: 32,
            }}
          >
            <Text style={{
              fontSize: 13,
              color: textLight,
              textAlign: 'center',
              lineHeight: 20,
              paddingHorizontal: 40,
            }}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}