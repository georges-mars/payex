import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Wallet, TrendingUp, Plus, ArrowUpRight, Eye, EyeOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { usePayvexStore } from '../stores/payvexStore';
import { LinkedAccounts, LinkedAccount } from '../magically/entities/LinkedAccount';
import { Skeleton, Logo } from '../components/ui';
import { MagicallyAlert } from '../components/ui/MagicallyAlert';

export const AccountsScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [balancesVisible, setBalancesVisible] = useState(true);
  const {
    accounts,
    isLoadingAccounts,
    setAccounts,
    setIsLoadingAccounts,
    getTotalBalance,
  } = usePayvexStore();

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      const result = await LinkedAccounts.query({}, { sort: { linkedDate: -1 } });
      setAccounts(result.data);
    } catch (error) {
      console.error('Error loading accounts:', error);
      MagicallyAlert.alert('Error', 'Failed to load your linked accounts. Please try again.');
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAccounts();
    setRefreshing(false);
  };

  const toggleBalanceVisibility = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBalancesVisible(!balancesVisible);
  };

  const handleAddAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('LinkAccount');
  };

  const handleAccountPress = (account: LinkedAccount) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    MagicallyAlert.alert(
      account.accountName,
      `Account Number: ${account.accountNumber}\nBalance: ${account.currency} ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}\nStatus: ${account.status}\nLinked: ${new Date(account.linkedDate).toLocaleDateString()}`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const getAccountIcon = (type: string) => {
    return type === 'deriv' || type === 'binance' ? TrendingUp : Wallet;
  };

  const getAccountColor = (type: string) => {
    switch (type) {
      case 'mpesa': return '#00D4FF';
      case 'bank': return theme.primary;
      case 'deriv': return '#00D4FF';
      case 'binance': return '#F0B90B';
      default: return theme.primary;
    }
  };

  const totalBalance = getTotalBalance();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={{ padding: 24, paddingTop: 16 }}>
          <View
            style={{
              backgroundColor: theme.cardBackground,
              borderRadius: 20,
              padding: 24,
              marginBottom: 24,
              shadowColor: theme.cardShadowColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: theme.cardShadowOpacity,
              shadowRadius: 12,
              elevation: 4,
              borderWidth: 1,
              borderColor: theme.borderLight,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: theme.textMuted, letterSpacing: 0.5, fontWeight: '500' }}>
                COMBINED BALANCE
              </Text>
              <Pressable onPress={toggleBalanceVisibility} hitSlop={8}>
                {balancesVisible ? (
                  <Eye size={20} color={theme.textMuted} strokeWidth={2} />
                ) : (
                  <EyeOff size={20} color={theme.textMuted} strokeWidth={2} />
                )}
              </Pressable>
            </View>
            {isLoadingAccounts ? (
              <Skeleton width={200} height={36} />
            ) : (
              <Text style={{ fontSize: 34, fontWeight: '700', color: theme.text, letterSpacing: -0.5 }}>
                {balancesVisible
                  ? `KES ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : '••••••'}
              </Text>
            )}
            <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 6 }}>
              Across {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: theme.text }}>
              Linked Accounts
            </Text>
            <Pressable
              onPress={handleAddAccount}
              style={({ pressed }) => ({
                backgroundColor: theme.primary,
                borderRadius: 12,
                paddingVertical: 8,
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}
            >
              <Plus size={18} color={theme.primaryForeground} strokeWidth={2.5} />
              <Text style={{ color: theme.primaryForeground, fontSize: 14, fontWeight: '600' }}>
                Add
              </Text>
            </Pressable>
          </View>

          {isLoadingAccounts ? (
            <View style={{ gap: 14 }}>
              <Skeleton width="100%" height={100} borderRadius={20} />
              <Skeleton width="100%" height={100} borderRadius={20} />
              <Skeleton width="100%" height={100} borderRadius={20} />
            </View>
          ) : accounts.length === 0 ? (
            <View style={{ padding: 48, alignItems: 'center' }}>
              <Logo size={80} withShadow style={{ marginBottom: 20 }} />
              <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 8, textAlign: 'center' }}>
                No Accounts Linked
              </Text>
              <Text style={{ fontSize: 14, color: theme.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
                Add your first account to start managing{'\n'}your finances in one place
              </Text>
              <Pressable
                onPress={handleAddAccount}
                style={({ pressed }) => ({
                  backgroundColor: theme.primary,
                  borderRadius: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 28,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                })}
              >
                <Plus size={20} color={theme.primaryForeground} strokeWidth={2.5} />
                <Text style={{ color: theme.primaryForeground, fontSize: 15, fontWeight: '600' }}>
                  Link Your First Account
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              {accounts.map((account) => {
                const IconComponent = getAccountIcon(account.accountType);
                const iconColor = getAccountColor(account.accountType);
                const statusColor = account.status === 'active' ? '#10B981' : account.status === 'pending' ? '#F59E0B' : theme.textMuted;

                return (
                  <Pressable
                    key={account._id}
                    onPress={() => handleAccountPress(account)}
                    style={({ pressed }) => ({
                      backgroundColor: theme.cardBackground,
                      borderRadius: 20,
                      padding: 20,
                      shadowColor: theme.cardShadowColor,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: theme.cardShadowOpacity,
                      shadowRadius: 8,
                      elevation: 3,
                      borderWidth: 1,
                      borderColor: account.isDefault ? theme.primary : theme.borderLight,
                      borderLeftWidth: account.isDefault ? 4 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    })}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                      <View
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 16,
                          backgroundColor: `${iconColor}15`,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 14,
                        }}
                      >
                        <IconComponent size={28} color={iconColor} strokeWidth={2} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Text style={{ fontSize: 17, fontWeight: '600', color: theme.text }}>
                            {account.accountName}
                          </Text>
                          {account.isDefault && (
                            <View style={{ backgroundColor: `${theme.primary}20`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                              <Text style={{ fontSize: 10, fontWeight: '700', color: theme.primary, letterSpacing: 0.5 }}>
                                DEFAULT
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 2 }}>
                          {account.accountNumber}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }} />
                          <Text style={{ fontSize: 12, color: statusColor, fontWeight: '600', textTransform: 'capitalize' }}>
                            {account.status}
                          </Text>
                        </View>
                      </View>
                      <ArrowUpRight size={20} color={theme.textLight} strokeWidth={2} />
                    </View>

                    <View
                      style={{
                        paddingTop: 14,
                        borderTopWidth: 1,
                        borderTopColor: theme.borderLight,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 12, color: theme.textMuted }}>
                        Balance
                      </Text>
                      <Text style={{ fontSize: 20, fontWeight: '700', color: theme.primary }}>
                        {balancesVisible
                          ? `${account.currency} ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                          : '••••••'}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};
