import React from 'react';
import { View, Text, ScrollView, Animated, Easing, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUpRight, ArrowDownLeft, Plus, Wallet, TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const MOCK_ACCOUNTS = [
  { id: 1, name: 'M-Pesa', balance: 45230.50, currency: 'KES', icon: 'Wallet', color: '#00D4FF' },
  { id: 2, name: 'Equity Bank', balance: 128450.75, currency: 'KES', icon: 'Wallet', color: '#0A3B7F' },
  { id: 3, name: 'Deriv Trading', balance: 5840.20, currency: 'USD', icon: 'TrendingUp', color: '#00D4FF' }
];

const MOCK_TRANSACTIONS = [
  { id: 1, type: 'received', amount: 12500, currency: 'KES', from: 'John Mwangi', status: 'completed', time: '2 hours ago', account: 'M-Pesa' },
  { id: 2, type: 'sent', amount: 5000, currency: 'KES', to: 'Sarah Njeri', status: 'pending', time: '5 hours ago', account: 'Equity Bank' },
  { id: 3, type: 'received', amount: 850, currency: 'USD', from: 'Trading Profit', status: 'completed', time: '1 day ago', account: 'Deriv' }
];

export const Reference = () => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;
  const cardAnimations = React.useRef(MOCK_ACCOUNTS.map(() => new Animated.Value(0))).current;
  const transactionAnimations = React.useRef(MOCK_TRANSACTIONS.map(() => new Animated.Value(0))).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true
      })
    ]).start();

    cardAnimations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true
      }).start();
    });

    transactionAnimations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: 400 + index * 80,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true
      }).start();
    });
  }, []);

  const totalBalance = MOCK_ACCOUNTS.reduce((sum, acc) => {
    const converted = acc.currency === 'USD' ? acc.balance * 130 : acc.balance;
    return sum + converted;
  }, 0);

  const handleQuickAction = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      default: return '#9CA3AF';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return CheckCircle2;
      case 'pending': return Clock;
      case 'failed': return AlertCircle;
      default: return Clock;
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FAFBFC' }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          padding: 24,
          paddingTop: 60
        }}
      >
        <Text style={{ fontSize: 32, fontWeight: '700', color: '#1A1F36', marginBottom: 8, letterSpacing: -0.5 }}>
          Financial Hub
        </Text>
        <Text style={{ fontSize: 16, color: '#6B7280', marginBottom: 32, fontWeight: '400' }}>
          All your accounts in one place
        </Text>

        <LinearGradient
          colors={['#0A3B7F', '#0D4A9F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 24,
            padding: 28,
            marginBottom: 32,
            shadowColor: '#0A3B7F',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 24,
            elevation: 8
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', marginBottom: 8, letterSpacing: 0.5 }}>
                TOTAL BALANCE
              </Text>
              <Text style={{ fontSize: 42, fontWeight: '700', color: '#FFFFFF', letterSpacing: -1 }}>
                KES {totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <LinearGradient
              colors={['rgba(0, 212, 255, 0.2)', 'rgba(0, 212, 255, 0.05)']}
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Wallet size={32} color="#00D4FF" strokeWidth={2} />
            </LinearGradient>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            {[
              { icon: ArrowUpRight, label: 'Send', action: 'send' },
              { icon: ArrowDownLeft, label: 'Request', action: 'request' },
              { icon: Plus, label: 'Add', action: 'add' }
            ].map((item, index) => (
              <Pressable
                key={index}
                onPress={() => handleQuickAction(item.action)}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: pressed ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 255, 255, 0.15)',
                  borderRadius: 16,
                  padding: 16,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  transform: [{ scale: pressed ? 0.96 : 1 }]
                })}
              >
                <item.icon size={24} color="#FFFFFF" strokeWidth={2} />
                <Text style={{ color: '#FFFFFF', marginTop: 8, fontSize: 13, fontWeight: '600' }}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </LinearGradient>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#1A1F36', marginBottom: 20 }}>
            Connected Accounts
          </Text>
          <View style={{ gap: 16 }}>
            {MOCK_ACCOUNTS.map((account, index) => {
              const IconComponent = account.icon === 'TrendingUp' ? TrendingUp : Wallet;
              return (
                <Animated.View
                  key={account.id}
                  style={{
                    opacity: cardAnimations[index],
                    transform: [{
                      translateX: cardAnimations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0]
                      })
                    }]
                  }}
                >
                  <Pressable
                    onPress={() => handleQuickAction('account')}
                    style={({ pressed }) => ({
                      backgroundColor: '#FFFFFF',
                      borderRadius: 20,
                      padding: 20,
                      flexDirection: 'row',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.04,
                      shadowRadius: 8,
                      elevation: 2,
                      borderWidth: 1,
                      borderColor: '#F3F4F6',
                      transform: [{ scale: pressed ? 0.98 : 1 }]
                    })}
                  >
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 16,
                        backgroundColor: `${account.color}15`,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 16
                      }}
                    >
                      <IconComponent size={26} color={account.color} strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1F36', marginBottom: 4 }}>
                        {account.name}
                      </Text>
                      <Text style={{ fontSize: 20, fontWeight: '700', color: '#0A3B7F' }}>
                        {account.currency} {account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </Text>
                    </View>
                    <ArrowUpRight size={20} color="#9CA3AF" strokeWidth={2} />
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </View>

        <View style={{ marginBottom: 40 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#1A1F36', marginBottom: 20 }}>
            Recent Transactions
          </Text>
          <View style={{ gap: 12 }}>
            {MOCK_TRANSACTIONS.map((transaction, index) => {
              const StatusIcon = getStatusIcon(transaction.status);
              return (
                <Animated.View
                  key={transaction.id}
                  style={{
                    opacity: transactionAnimations[index],
                    transform: [{
                      translateY: transactionAnimations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0]
                      })
                    }]
                  }}
                >
                  <Pressable
                    onPress={() => handleQuickAction('transaction')}
                    style={({ pressed }) => ({
                      backgroundColor: '#FFFFFF',
                      borderRadius: 18,
                      padding: 18,
                      flexDirection: 'row',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.03,
                      shadowRadius: 6,
                      elevation: 1,
                      borderWidth: 1,
                      borderColor: '#F3F4F6',
                      transform: [{ scale: pressed ? 0.98 : 1 }]
                    })}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        backgroundColor: transaction.type === 'received' ? '#10B98115' : '#00D4FF15',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 14
                      }}
                    >
                      {transaction.type === 'received' ? (
                        <ArrowDownLeft size={22} color="#10B981" strokeWidth={2.5} />
                      ) : (
                        <ArrowUpRight size={22} color="#00D4FF" strokeWidth={2.5} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1F36', marginBottom: 3 }}>
                        {transaction.type === 'received' ? transaction.from : transaction.to}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{transaction.account}</Text>
                        <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#D1D5DB' }} />
                        <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{transaction.time}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text
                        style={{
                          fontSize: 17,
                          fontWeight: '700',
                          color: transaction.type === 'received' ? '#10B981' : '#1A1F36',
                          marginBottom: 4
                        }}
                      >
                        {transaction.type === 'received' ? '+' : '-'}{transaction.currency} {transaction.amount.toLocaleString()}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <StatusIcon size={14} color={getStatusColor(transaction.status)} strokeWidth={2.5} />
                        <Text style={{ fontSize: 12, color: getStatusColor(transaction.status), fontWeight: '600', textTransform: 'capitalize' }}>
                          {transaction.status}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  );
};