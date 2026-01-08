import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUpRight, ArrowDownLeft, Plus, Wallet, TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { usePayvexStore } from '../stores/payvexStore';
import { LinkedAccounts } from '../magically/entities/LinkedAccount';
import { Transactions } from '../magically/entities/Transaction';
import magically from 'magically-sdk';
import { Skeleton, Logo } from '../components/ui';
import { MagicallyAlert } from '../components/ui/MagicallyAlert';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const navigationHook = useNavigation();  // Renamed to avoid conflict with prop
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const {
    accounts,
    transactions,
    isLoadingAccounts,
    isLoadingTransactions,
    setAccounts,
    setTransactions,
    setIsLoadingAccounts,
    setIsLoadingTransactions,
    getTotalBalance,
    getRecentTransactions,
  } = usePayvexStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoadingAccounts(true);
      setIsLoadingTransactions(true);

      const [accountsResult, transactionsResult] = await Promise.all([
        LinkedAccounts.query({}, { sort: { linkedDate: -1 } }),
        Transactions.query({}, { sort: { transactionDate: -1 }, limit: 20 }),
      ]);

      setAccounts(accountsResult.data);
      setTransactions(transactionsResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
      MagicallyAlert.alert('Error', 'Failed to load your financial data. Please try again.');
    } finally {
      setIsLoadingAccounts(false);
      setIsLoadingTransactions(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleQuickAction = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (action === 'send') {
      navigation.navigate('SendMoney');
    } else if (action === 'request') {
      MagicallyAlert.alert('Coming Soon', 'Request money feature will be available soon!');
    } else if (action === 'add') {
      navigation.navigate('LinkAccount');
    }
  };

  const handlePayVexAction = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (action === 'link') {
      navigation.navigate('Link');
    } else if (action === 'deposit') {
      navigation.navigate('Deposit');
    } else if (action === 'withdraw') {
      navigation.navigate('Withdraw');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      default: return theme.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle2;
      case 'pending': return Clock;
      case 'failed': return AlertCircle;
      default: return Clock;
    }
  };

  const userName = magically.auth.currentUser?.email?.split('@')[0] || 'Guest';
  const totalBalance = getTotalBalance();
  const recentTransactions = getRecentTransactions(5);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          padding: 24,
          paddingTop: 60,
        }}
      >
        <Text style={{ fontSize: 28, fontWeight: '700', color: theme.text, marginBottom: 4 }}>
          Welcome back, {userName}
        </Text>
        <Text style={{ fontSize: 16, color: theme.textMuted, marginBottom: 28 }}>
          Here's your financial overview
        </Text>

        <LinearGradient
          colors={['#0A3B7F', '#0D4A9F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 24,
            padding: 26,
            marginBottom: 28,
            shadowColor: '#0A3B7F',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.7)', marginBottom: 6, letterSpacing: 0.8 }}>
                TOTAL BALANCE
              </Text>
              {isLoadingAccounts ? (
                <Skeleton width={180} height={40} />
              ) : (
                <Text style={{ fontSize: 38, fontWeight: '700', color: '#FFFFFF', letterSpacing: -1 }}>
                  KES {totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              )}
            </View>
            <LinearGradient
              colors={['rgba(0, 212, 255, 0.25)', 'rgba(0, 212, 255, 0.08)']}
              style={{
                width: 60,
                height: 60,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wallet size={30} color="#00D4FF" strokeWidth={2} />
            </LinearGradient>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
            {[
              { icon: ArrowUpRight, label: 'Send', action: 'send' },
              { icon: ArrowDownLeft, label: 'Request', action: 'request' },
              { icon: Plus, label: 'Add', action: 'add' },
            ].map((item, index) => (
              <Pressable
                key={index}
                onPress={() => handleQuickAction(item.action)}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: pressed ? 'rgba(0, 212, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)',
                  borderRadius: 14,
                  padding: 14,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                })}
              >
                <item.icon size={22} color="#FFFFFF" strokeWidth={2} />
                <Text style={{ color: '#FFFFFF', marginTop: 6, fontSize: 12, fontWeight: '600' }}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </LinearGradient>

        {/* New PayVex Quick Actions Section */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text, marginBottom: 16 }}>
            PayVex Actions
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={styles.button} onPress={() => handlePayVexAction('link')}>
              <Text style={styles.buttonText}>Link Accounts & Phone</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.greenButton]} onPress={() => handlePayVexAction('deposit')}>
              <Text style={styles.buttonText}>Deposit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.redButton]} onPress={() => handlePayVexAction('withdraw')}>
              <Text style={styles.buttonText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>
              Connected Accounts
            </Text>
            <Pressable onPress={() => navigation.navigate('Accounts')}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.primary }}>
                View All
              </Text>
            </Pressable>
          </View>

          {isLoadingAccounts ? (
            <View style={{ gap: 12 }}>
              <Skeleton width="100%" height={80} borderRadius={18} />
              <Skeleton width="100%" height={80} borderRadius={18} />
            </View>
          ) : accounts.length === 0 ? (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Logo size={64} withShadow style={{ marginBottom: 12 }} />
              <Text style={{ color: theme.textMuted, marginTop: 12, textAlign: 'center' }}>
                No accounts linked yet. Add your first account to get started.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {accounts.slice(0, 3).map((account) => {
                const IconComponent = account.accountType === 'deriv' ? TrendingUp : Wallet;
                const iconColor = account.accountType === 'deriv' ? '#00D4FF' : theme.primary;
                
                return (
                  <Pressable
                    key={account._id}
                    onPress={() => navigation.navigate('Accounts')}
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
                        backgroundColor: `${iconColor}15`,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 14,
                      }}
                    >
                      <IconComponent size={24} color={iconColor} strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 3 }}>
                        {account.accountName}
                      </Text>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: theme.primary }}>
                        {account.currency} {account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </Text>
                    </View>
                    <ArrowUpRight size={18} color={theme.textLight} strokeWidth={2} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>
              Recent Transactions
            </Text>
            <Pressable onPress={() => navigation.navigate('Transactions')}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.primary }}>
                View All
              </Text>
            </Pressable>
          </View>

          {isLoadingTransactions ? (
            <View style={{ gap: 10 }}>
              <Skeleton width="100%" height={70} borderRadius={16} />
              <Skeleton width="100%" height={70} borderRadius={16} />
            </View>
          ) : recentTransactions.length === 0 ? (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Logo size={64} withShadow style={{ marginBottom: 12 }} />
              <Text style={{ color: theme.textMuted, marginTop: 12, textAlign: 'center' }}>
                No transactions yet. Start sending or receiving money.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {recentTransactions.map((transaction) => {
                const StatusIcon = getStatusIcon(transaction.status);
                const statusColor = getStatusColor(transaction.status);
                const isReceive = transaction.transactionType === 'receive' || transaction.transactionType === 'deposit';

                return (
                  <Pressable
                    key={transaction._id}
                    onPress={() => navigation.navigate('Transactions')}
                    style={({ pressed }) => ({
                      backgroundColor: theme.cardBackground,
                      borderRadius: 16,
                      padding: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      shadowColor: theme.cardShadowColor,
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.03,
                      shadowRadius: 4,
                      elevation: 1,
                      borderWidth: 1,
                      borderColor: theme.borderLight,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    })}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: isReceive ? '#10B98115' : '#00D4FF15',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      {isReceive ? (
                        <ArrowDownLeft size={20} color="#10B981" strokeWidth={2.5} />
                      ) : (
                        <ArrowUpRight size={20} color="#00D4FF" strokeWidth={2.5} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 2 }}>
                        {transaction.recipientName || transaction.senderName || 'Transaction'}
                      </Text>
                      <Text style={{ fontSize: 12, color: theme.textMuted }}>
                        {transaction.accountName}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '700',
                          color: isReceive ? '#10B981' : theme.text,
                          marginBottom: 3,
                        }}
                      >
                        {isReceive ? '+' : '-'}{transaction.currency} {transaction.amount.toLocaleString()}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <StatusIcon size={12} color={statusColor} strokeWidth={2.5} />
                        <Text style={{ fontSize: 11, color: statusColor, fontWeight: '600', textTransform: 'capitalize' }}>
                          {transaction.status}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </Animated.View>
    </ScrollView>
  );
};

// New Styles for PayVex Buttons (Added)
const styles = StyleSheet.create({
  button: { 
    flex: 1,
    backgroundColor: 'blue', 
    padding: 16, 
    borderRadius: 8, 
    marginBottom: 16,
    alignItems: 'center' 
  },
  greenButton: { backgroundColor: 'green' },
  redButton: { backgroundColor: 'red' },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
});
