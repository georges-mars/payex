import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { User, Crown, MessageSquare, LogOut, Trash2, Shield, Bell, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import magically from 'magically-sdk';
import { MagicallyAlert } from '../components/ui';
import { AnimatedSpinner } from '../components/ui';

export default function ProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const user = magically.auth.getCurrentUser();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await magically.auth.signOut();
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    } catch (error) {
      console.error('Sign out failed:', error);
      MagicallyAlert.alert('Error', 'Failed to sign out');
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    MagicallyAlert.alert(
      'Delete Account?',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const result = await magically.auth.deleteAccount();
              await magically.auth.signOut();

              if (result.action === 'scheduled') {
                MagicallyAlert.alert(
                  'Scheduled',
                  `Account deletion scheduled. Your account will be deleted in ${result.daysRemaining} days. Log back in to cancel.`
                );
              } else {
                MagicallyAlert.alert('Deleted', 'Your account has been permanently deleted.');
              }

              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                })
              );
            } catch (error: any) {
              console.error('Delete failed:', error);

              const errorMessage = error.message || '';
              const errorCode = error.responseData?.code || error.responseData?.error || errorMessage;

              if (errorCode === 'OWNER_CANNOT_DELETE' || errorMessage === 'OWNER_CANNOT_DELETE') {
                MagicallyAlert.alert(
                  'Protected Account',
                  'As the app creator, your account keeps this app running. To close your account, you can delete the entire project from your dashboard.\n\nTo test account deletion, try logging in with a different account.'
                );
              } else if (errorCode === 'LAST_ADMIN_CANNOT_DELETE' || errorMessage === 'LAST_ADMIN_CANNOT_DELETE') {
                MagicallyAlert.alert(
                  'Admin Required',
                  'Your app needs at least one admin. Please make someone else an admin before deleting your account.\n\nTo test account deletion, try logging in with a non-admin account.'
                );
              } else {
                MagicallyAlert.alert('Error', error.message || 'Failed to delete account. Please try again.');
              }
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleUpgradeToPremium = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    MagicallyAlert.alert(
      'Premium Features',
      'Upgrade to Premium to unlock:\n\n• Unlimited linked accounts\n• Trading platform integrations\n• Advanced analytics & insights\n• Priority customer support\n• Higher transaction limits\n• Premium badge\n\nPrice: $9.99/month',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade Now', style: 'default', onPress: () => {
          MagicallyAlert.alert('Coming Soon', 'Premium subscription will be available soon!');
        }},
      ]
    );
  };

  const menuItems = [
    {
      icon: Crown,
      label: 'Upgrade to Premium',
      description: 'Unlock all features',
      color: '#F59E0B',
      action: handleUpgradeToPremium,
    },
    {
      icon: MessageSquare,
      label: 'Send Feedback',
      description: 'Help us improve',
      color: theme.primary,
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate('Feedback' as never);
      },
    },
    {
      icon: Bell,
      label: 'Notifications',
      description: 'Manage alerts',
      color: theme.secondary,
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        MagicallyAlert.alert('Coming Soon', 'Notification settings will be available soon!');
      },
    },
    {
      icon: Shield,
      label: 'Security',
      description: 'Password & 2FA',
      color: '#10B981',
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        MagicallyAlert.alert('Coming Soon', 'Security settings will be available soon!');
      },
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: 24, paddingTop: 16 }}>
          <View
            style={{
              backgroundColor: theme.cardBackground,
              borderRadius: 24,
              padding: 24,
              marginBottom: 24,
              alignItems: 'center',
              shadowColor: theme.cardShadowColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: theme.cardShadowOpacity,
              shadowRadius: 12,
              elevation: 4,
              borderWidth: 1,
              borderColor: theme.borderLight,
            }}
          >
            <View
              style={{
                width: 90,
                height: 90,
                borderRadius: 45,
                backgroundColor: `${theme.primary}20`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                borderWidth: 3,
                borderColor: theme.primary,
              }}
            >
              <User size={42} color={theme.primary} strokeWidth={2} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '700', color: theme.text, marginBottom: 4 }}>
              {user?.name || user?.email?.split('@')[0] || 'Guest'}
            </Text>
            <Text style={{ fontSize: 15, color: theme.textMuted, marginBottom: 16 }}>
              {user?.email || 'Not logged in'}
            </Text>
            <View
              style={{
                backgroundColor: `${theme.muted}`,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 12,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textMuted }}>
                Free Plan
              </Text>
            </View>
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 16 }}>
              Account Settings
            </Text>
            <View style={{ gap: 12 }}>
              {menuItems.map((item, index) => (
                <Pressable
                  key={index}
                  onPress={item.action}
                  style={({ pressed }) => ({
                    backgroundColor: theme.cardBackground,
                    borderRadius: 18,
                    padding: 18,
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: theme.cardShadowColor,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: theme.cardShadowOpacity,
                    shadowRadius: 6,
                    elevation: 2,
                    borderWidth: 1,
                    borderColor: theme.borderLight,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  })}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      backgroundColor: `${item.color}15`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 14,
                    }}
                  >
                    <item.icon size={24} color={item.color} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 2 }}>
                      {item.label}
                    </Text>
                    <Text style={{ fontSize: 13, color: theme.textMuted }}>
                      {item.description}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={theme.textLight} strokeWidth={2} />
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ gap: 12 }}>
            <Pressable
              onPress={handleSignOut}
              disabled={isSigningOut}
              style={({ pressed }) => ({
                backgroundColor: theme.cardBackground,
                borderRadius: 16,
                padding: 18,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                borderWidth: 1,
                borderColor: theme.border,
                transform: [{ scale: pressed && !isSigningOut ? 0.98 : 1 }],
              })}
            >
              {isSigningOut ? (
                <>
                  <AnimatedSpinner size={20} color={theme.text} />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
                    Signing Out...
                  </Text>
                </>
              ) : (
                <>
                  <LogOut size={20} color={theme.text} strokeWidth={2} />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
                    Sign Out
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={handleDeleteAccount}
              disabled={isDeleting}
              style={({ pressed }) => ({
                backgroundColor: isDeleting ? `${theme.destructive}10` : theme.cardBackground,
                borderRadius: 16,
                padding: 18,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                borderWidth: 1,
                borderColor: theme.destructive,
                transform: [{ scale: pressed && !isDeleting ? 0.98 : 1 }],
              })}
            >
              {isDeleting ? (
                <>
                  <AnimatedSpinner size={20} color={theme.destructive} />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: theme.destructive }}>
                    Deleting...
                  </Text>
                </>
              ) : (
                <>
                  <Trash2 size={20} color={theme.destructive} strokeWidth={2} />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: theme.destructive }}>
                    Delete Account
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          <View style={{ marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderTopColor: theme.borderLight }}>
            <Text style={{ fontSize: 13, color: theme.textLight, textAlign: 'center', lineHeight: 20 }}>
              Payvex v1.0.0{'\n'}
              Your unified financial platform
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
