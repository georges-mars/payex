import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Animated, Pressable, Modal, FlatList, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowRight, Wallet, AlertCircle, CreditCard, Shield, Search, ArrowLeft, Phone, TrendingUp, BarChart3, CheckCircle, XCircle, ChevronDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { RootStackParamList, Broker } from '../types';
import { getBrokerToken, withdraw } from '../services/broker';
import { useTheme } from '../contexts/ThemeContext';
import { usePayvexStore } from '../stores/payvexStore';
import { MagicallyAlert } from '../components/ui/MagicallyAlert';
import { Logo } from '../components/ui';
import { LinkedAccounts } from '../magically/entities/LinkedAccount';

type WithdrawScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type LinkedAccount = {
  _id: string;
  accountName: string;
  accountType: string;
  balance: number;
  currency: string;
  broker?: Broker;
  isDefault?: boolean;
  accountNumber?: string;
  status?: string;
  linkedDate?: string;
};

type WithdrawalStatus = 'idle' | 'processing' | 'success' | 'error';

export default function WithdrawScreen() {
  const navigation = useNavigation<WithdrawScreenNavigationProp>();
  const theme = useTheme();
  const { accounts } = usePayvexStore();
  
  const [selectedAccount, setSelectedAccount] = useState<LinkedAccount | null>(null);
  const [selectedMpesaAccount, setSelectedMpesaAccount] = useState<LinkedAccount | null>(null);
  const [mpesaAccounts, setMpesaAccounts] = useState<LinkedAccount[]>([]);
  const [amount, setAmount] = useState('');
  const [withdrawalStatus, setWithdrawalStatus] = useState<WithdrawalStatus>('idle');
  const [transactionId, setTransactionId] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState('');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showMpesaDropdown, setShowMpesaDropdown] = useState(false);
  const [accountSearchQuery, setAccountSearchQuery] = useState('');
  const [mpesaSearchQuery, setMpesaSearchQuery] = useState('');
  const [isLoadingMpesaAccounts, setIsLoadingMpesaAccounts] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const statusAnim = useRef(new Animated.Value(0)).current;

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
    
    loadMpesaAccounts();
    
    // Auto-select first broker account (Deriv or MT5)
    const brokerAccounts = accounts.filter(acc => 
      acc.accountType === 'deriv' || acc.accountType === 'mt5'
    );
    
    if (brokerAccounts.length > 0) {
      const defaultAccount = brokerAccounts.find(acc => acc.isDefault) || brokerAccounts[0];
      setSelectedAccount(defaultAccount);
    }
  }, [accounts]);

  useEffect(() => {
    if (withdrawalStatus === 'success' || withdrawalStatus === 'error') {
      Animated.timing(statusAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [withdrawalStatus]);

  const loadMpesaAccounts = async () => {
    try {
      setIsLoadingMpesaAccounts(true);
      const result = await LinkedAccounts.query({ 
        accountType: 'mpesa' 
      }, { 
        sort: { linkedDate: -1 } 
      });
      
      setMpesaAccounts(result.data);
      
      // Auto-select default M-Pesa account
      if (result.data.length > 0) {
        const defaultMpesa = result.data.find(acc => acc.isDefault) || result.data[0];
        setSelectedMpesaAccount(defaultMpesa);
      }
    } catch (error) {
      console.error('Error loading M-Pesa accounts:', error);
    } finally {
      setIsLoadingMpesaAccounts(false);
    }
  };

  // Filter broker accounts (Deriv/MT5 only for withdrawals)
  const brokerAccounts = accounts.filter(acc => 
    acc.accountType === 'deriv' || acc.accountType === 'mt5'
  );

  const filteredAccounts = brokerAccounts.filter(account =>
    account.accountName.toLowerCase().includes(accountSearchQuery.toLowerCase()) ||
    account.accountType.toLowerCase().includes(accountSearchQuery.toLowerCase()) ||
    account.currency.toLowerCase().includes(accountSearchQuery.toLowerCase())
  );

  const filteredMpesaAccounts = mpesaAccounts.filter(account =>
    account.accountName.toLowerCase().includes(mpesaSearchQuery.toLowerCase()) ||
    account.accountNumber?.toLowerCase().includes(mpesaSearchQuery.toLowerCase())
  );

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'deriv': return TrendingUp;
      case 'mt5': return BarChart3;
      case 'mpesa': return Phone;
      default: return CreditCard;
    }
  };

  const getAccountColor = (type: string) => {
    switch (type) {
      case 'deriv': return '#FF6B35';
      case 'mt5': return '#00B894';
      case 'mpesa': return '#00D4FF';
      default: return theme.primary;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'deriv': return 'Deriv Trading';
      case 'mt5': return 'MetaTrader 5';
      case 'mpesa': return 'M-Pesa';
      default: return 'Account';
    }
  };

  const handleSelectAccount = (account: LinkedAccount) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAccount(account);
    setShowAccountDropdown(false);
    setAccountSearchQuery('');
  };

  const handleSelectMpesaAccount = (account: LinkedAccount) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMpesaAccount(account);
    setShowMpesaDropdown(false);
    setMpesaSearchQuery('');
  };

  const formatAmount = (text: string) => {
    const numericText = text.replace(/[^0-9.]/g, '');
    const parts = numericText.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return numericText;
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('254')) {
      return `+254 ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)} ${cleaned.substring(9)}`;
    }
    return cleaned;
  };

  const handleWithdraw = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!selectedAccount) {
      MagicallyAlert.alert('No Account Selected', 'Please select a broker account to withdraw from');
      return;
    }
    
    if (!selectedMpesaAccount || !selectedMpesaAccount.accountNumber) {
      MagicallyAlert.alert('No M-Pesa Number Selected', 'Please select an M-Pesa account to withdraw to');
      return;
    }
    
    if (!amount || parseFloat(amount) < 100) {
      MagicallyAlert.alert('Minimum Amount', 'Minimum withdrawal amount is KES 100');
      return;
    }
    
    if (parseFloat(amount) > 150000) {
      MagicallyAlert.alert('Maximum Amount', 'Maximum withdrawal amount is KES 150,000');
      return;
    }
    
    // Check if withdrawal amount exceeds account balance
    const withdrawalAmount = parseFloat(amount);
    if (withdrawalAmount > selectedAccount.balance) {
      MagicallyAlert.alert(
        'Insufficient Balance',
        `Your ${selectedAccount.accountName} balance is ${selectedAccount.currency} ${selectedAccount.balance.toLocaleString()}. Please enter a smaller amount.`
      );
      return;
    }
    
    setWithdrawalStatus('processing');
    
    try {
      // Determine broker type from account
      const broker: Broker = selectedAccount.accountType === 'deriv' ? 'DERIV' : 'MT5';
      
      const token = await getBrokerToken(broker);
      if (!token) {
        setWithdrawalStatus('error');
        setStatusMessage('Broker account not linked. Please link your account first.');
        MagicallyAlert.alert(
          'Account Not Linked',
          'Please link your broker account first before making a withdrawal',
          [
            {
              text: 'Link Account',
              onPress: () => navigation.navigate('Link'),
              style: 'default'
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
        return;
      }
      
      const result = await withdraw(broker, withdrawalAmount, selectedMpesaAccount.accountNumber);
      
      setTransactionId(result.id);
      setStatusMessage(`Withdrawal initiated successfully! Funds will be sent to ${formatPhoneNumber(selectedMpesaAccount.accountNumber)}`);
      setWithdrawalStatus('success');
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      MagicallyAlert.alert(
        'Withdrawal Initiated',
        `KES ${withdrawalAmount.toLocaleString()} withdrawal initiated successfully. Transaction ID: ${result.id}. Funds will be sent to your M-Pesa shortly.`,
        [
          {
            text: 'View Status',
            onPress: () => {},
            style: 'default'
          },
          {
            text: 'Done',
            onPress: () => {
              setWithdrawalStatus('idle');
              setAmount('');
            },
            style: 'cancel'
          }
        ]
      );
      
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      setWithdrawalStatus('error');
      setStatusMessage(error.message || 'Withdrawal failed. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      MagicallyAlert.alert(
        'Withdrawal Failed',
        error.message || 'Unable to process withdrawal. Please check your account balance and try again.',
        [
          {
            text: 'Try Again',
            onPress: () => setWithdrawalStatus('idle'),
            style: 'default'
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    }
  };

  const renderStatusCard = () => {
    if (withdrawalStatus === 'idle') return null;

    const statusConfig = {
      processing: {
        color: '#F59E0B',
        icon: ActivityIndicator,
        title: 'Processing Withdrawal',
        message: 'Please wait while we process your withdrawal request...',
      },
      success: {
        color: '#10B981',
        icon: CheckCircle,
        title: 'Withdrawal Initiated',
        message: statusMessage,
      },
      error: {
        color: '#EF4444',
        icon: XCircle,
        title: 'Withdrawal Failed',
        message: statusMessage,
      },
    };

    const config = statusConfig[withdrawalStatus];
    const IconComponent = config.icon;

    return (
      <Animated.View
        style={{
          opacity: statusAnim,
          transform: [{ translateY: statusAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })}],
          marginBottom: 24,
        }}
      >
        <LinearGradient
          colors={[`${config.color}15`, `${config.color}08`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: `${config.color}30`,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: `${config.color}20`,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
              {withdrawalStatus === 'processing' ? (
                <ActivityIndicator size={24} color={config.color} />
              ) : (
                <IconComponent size={24} color={config.color} strokeWidth={2} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 4 }}>
                {config.title}
              </Text>
              <Text style={{ fontSize: 13, color: theme.textMuted, lineHeight: 18 }}>
                {config.message}
              </Text>
            </View>
          </View>
          
          {transactionId && (
            <View style={{
              backgroundColor: theme.cardBackground,
              borderRadius: 12,
              padding: 12,
              marginTop: 12,
            }}>
              <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 4 }}>
                Transaction ID
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text, fontFamily: 'monospace' }}>
                {transactionId}
              </Text>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    );
  };

  const AccountDropdown = () => (
    <Modal
      visible={showAccountDropdown}
      transparent
      animationType="fade"
      onRequestClose={() => setShowAccountDropdown(false)}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={() => setShowAccountDropdown(false)}
      >
        <Pressable
          style={{
            width: '90%',
            backgroundColor: theme.cardBackground,
            borderRadius: 20,
            maxHeight: '70%',
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: theme.border,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 16 }}>
              Select Account to Withdraw From
            </Text>
            
            {/* Search Bar */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.inputBackground,
              borderRadius: 12,
              paddingHorizontal: 16,
              marginBottom: 16,
            }}>
              <Search size={20} color={theme.textMuted} />
              <TextInput
                value={accountSearchQuery}
                onChangeText={setAccountSearchQuery}
                placeholder="Search broker accounts..."
                placeholderTextColor={theme.textLight}
                style={{
                  flex: 1,
                  padding: 14,
                  fontSize: 16,
                  color: theme.text,
                  marginLeft: 8,
                }}
                autoFocus
              />
            </View>
            
            {/* Accounts Count */}
            <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 12 }}>
              {filteredAccounts.length} broker account{filteredAccounts.length !== 1 ? 's' : ''} available
            </Text>
            
            {/* Accounts List */}
            <FlatList
              data={filteredAccounts}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 350 }}
              renderItem={({ item: account }) => {
                const IconComponent = getAccountIcon(account.accountType);
                const iconColor = getAccountColor(account.accountType);
                const isSelected = selectedAccount?._id === account._id;

                return (
                  <Pressable
                    onPress={() => handleSelectAccount(account)}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? theme.muted : 'transparent',
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 8,
                      borderWidth: 2,
                      borderColor: isSelected ? theme.primary : theme.borderLight,
                    })}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          backgroundColor: `${iconColor}15`,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        <IconComponent size={24} color={iconColor} strokeWidth={2} />
                      </View>
                      
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 4 }}>
                          {account.accountName}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ fontSize: 12, color: theme.textMuted, marginRight: 8 }}>
                            {getAccountTypeLabel(account.accountType)}
                          </Text>
                          <Text style={{ fontSize: 12, color: theme.primary, fontWeight: '600' }}>
                            {account.currency} {account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </Text>
                        </View>
                      </View>
                      
                      {isSelected && (
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: theme.primary,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ color: theme.primaryForeground, fontSize: 16, fontWeight: '700' }}>✓</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View style={{ padding: 30, alignItems: 'center' }}>
                  <CreditCard size={48} color={theme.textMuted} />
                  <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 12, fontSize: 15 }}>
                    {accountSearchQuery ? 'No broker accounts found' : 'No broker accounts available'}
                  </Text>
                  {!accountSearchQuery && (
                    <>
                      <Text style={{ color: theme.textLight, textAlign: 'center', marginTop: 6, fontSize: 13 }}>
                        Link a Deriv or MT5 account to withdraw funds
                      </Text>
                      <Pressable
                        onPress={() => {
                          setShowAccountDropdown(false);
                          navigation.navigate('Link');
                        }}
                        style={({ pressed }) => ({
                          marginTop: 16,
                          paddingHorizontal: 20,
                          paddingVertical: 12,
                          backgroundColor: theme.primary,
                          borderRadius: 12,
                          transform: [{ scale: pressed ? 0.98 : 1 }],
                        })}
                      >
                        <Text style={{ color: theme.primaryForeground, fontWeight: '600' }}>
                          Link Broker Account
                        </Text>
                      </Pressable>
                    </>
                  )}
                </View>
              }
            />
          </View>
          
          {/* Close Button */}
          <Pressable
            onPress={() => setShowAccountDropdown(false)}
            style={({ pressed }) => ({
              padding: 16,
              borderTopWidth: 1,
              borderTopColor: theme.border,
              backgroundColor: pressed ? theme.muted : theme.cardBackground,
            })}
          >
            <Text style={{ color: theme.textMuted, fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
              Cancel
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );

  const MpesaDropdown = () => (
    <Modal
      visible={showMpesaDropdown}
      transparent
      animationType="fade"
      onRequestClose={() => setShowMpesaDropdown(false)}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={() => setShowMpesaDropdown(false)}
      >
        <Pressable
          style={{
            width: '90%',
            backgroundColor: theme.cardBackground,
            borderRadius: 20,
            maxHeight: '70%',
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: theme.border,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 16 }}>
              Select M-Pesa Account
            </Text>
            
            {/* Search Bar */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.inputBackground,
              borderRadius: 12,
              paddingHorizontal: 16,
              marginBottom: 16,
            }}>
              <Search size={20} color={theme.textMuted} />
              <TextInput
                value={mpesaSearchQuery}
                onChangeText={setMpesaSearchQuery}
                placeholder="Search M-Pesa accounts..."
                placeholderTextColor={theme.textLight}
                style={{
                  flex: 1,
                  padding: 14,
                  fontSize: 16,
                  color: theme.text,
                  marginLeft: 8,
                }}
                autoFocus
              />
            </View>
            
            {/* M-Pesa Accounts Count */}
            <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 12 }}>
              {filteredMpesaAccounts.length} M-Pesa account{filteredMpesaAccounts.length !== 1 ? 's' : ''} available
            </Text>
            
            {/* M-Pesa Accounts List */}
            <FlatList
              data={filteredMpesaAccounts}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 350 }}
              renderItem={({ item: account }) => {
                const isSelected = selectedMpesaAccount?._id === account._id;
                const statusColor = account.status === 'active' ? '#10B981' : account.status === 'pending' ? '#F59E0B' : theme.textMuted;

                return (
                  <Pressable
                    onPress={() => handleSelectMpesaAccount(account)}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? theme.muted : 'transparent',
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 8,
                      borderWidth: 2,
                      borderColor: isSelected ? theme.primary : theme.borderLight,
                    })}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          backgroundColor: '#00D4FF15',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        <Phone size={24} color="#00D4FF" strokeWidth={2} />
                      </View>
                      
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 4 }}>
                          {account.accountName}
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 4 }}>
                          {account.accountNumber ? formatPhoneNumber(account.accountNumber) : 'No phone number'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }} />
                            <Text style={{ fontSize: 11, color: statusColor, fontWeight: '600', textTransform: 'capitalize' }}>
                              {account.status || 'active'}
                            </Text>
                          </View>
                          {account.isDefault && (
                            <View style={{
                              backgroundColor: `${theme.primary}20`,
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                            }}>
                              <Text style={{ fontSize: 10, color: theme.primary, fontWeight: '600' }}>
                                Default
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      
                      {isSelected && (
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: theme.primary,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ color: theme.primaryForeground, fontSize: 16, fontWeight: '700' }}>✓</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View style={{ padding: 30, alignItems: 'center' }}>
                  <Phone size={48} color={theme.textMuted} />
                  <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 12, fontSize: 15 }}>
                    {mpesaSearchQuery ? 'No M-Pesa accounts found' : 'No M-Pesa accounts available'}
                  </Text>
                  {!mpesaSearchQuery && (
                    <>
                      <Text style={{ color: theme.textLight, textAlign: 'center', marginTop: 6, fontSize: 13 }}>
                        Link your M-Pesa account to receive withdrawals
                      </Text>
                      <Pressable
                        onPress={() => {
                          setShowMpesaDropdown(false);
                          navigation.navigate('LinkAccount');
                        }}
                        style={({ pressed }) => ({
                          marginTop: 16,
                          paddingHorizontal: 20,
                          paddingVertical: 12,
                          backgroundColor: theme.primary,
                          borderRadius: 12,
                          transform: [{ scale: pressed ? 0.98 : 1 }],
                        })}
                      >
                        <Text style={{ color: theme.primaryForeground, fontWeight: '600' }}>
                          Link M-Pesa Account
                        </Text>
                      </Pressable>
                    </>
                  )}
                </View>
              }
            />
          </View>
          
          {/* Close Button */}
          <Pressable
            onPress={() => setShowMpesaDropdown(false)}
            style={({ pressed }) => ({
              padding: 16,
              borderTopWidth: 1,
              borderTopColor: theme.border,
              backgroundColor: pressed ? theme.muted : theme.cardBackground,
            })}
          >
            <Text style={{ color: theme.textMuted, fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
              Cancel
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header with Back Button */}
      <View
        style={{
          paddingTop: 60,
          paddingHorizontal: 24,
          paddingBottom: 16,
          backgroundColor: theme.headerBackground,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => ({
                marginRight: 12,
                padding: 8,
                borderRadius: 12,
                backgroundColor: pressed ? theme.muted : 'transparent',
              })}
            >
              <ArrowLeft size={24} color={theme.text} strokeWidth={2} />
            </Pressable>
            <Text style={{ fontSize: 24, fontWeight: '700', color: theme.text }}>
              Withdraw Funds
            </Text>
          </View>
          <Logo size={32} />
        </View>
        <Text style={{ fontSize: 16, color: theme.textMuted, marginLeft: 44 }}>
          Withdraw from your trading account to M-Pesa
        </Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            padding: 24,
          }}
        >
          {/* Status Card */}
          {renderStatusCard()}

          {/* Account Selection Card */}
          <LinearGradient
            colors={['#EF444415', '#DC262608']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20,
              padding: 20,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: theme.borderLight,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: '#EF444420',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                <CreditCard size={22} color="#EF4444" strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 2 }}>
                  Withdraw From Account *
                </Text>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>
                  Choose which broker account to withdraw from
                </Text>
              </View>
            </View>

            {brokerAccounts.length === 0 ? (
              <View style={{
                backgroundColor: theme.cardBackground,
                borderRadius: 14,
                padding: 24,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: theme.border,
                borderStyle: 'dashed',
                marginTop: 8,
              }}>
                <CreditCard size={48} color={theme.textMuted} />
                <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 12, fontSize: 15 }}>
                  No broker accounts available
                </Text>
                <Text style={{ color: theme.textLight, textAlign: 'center', marginTop: 6, fontSize: 13 }}>
                  Link a Deriv or MT5 account to withdraw funds
                </Text>
                <Pressable
                  onPress={() => navigation.navigate('Link')}
                  style={({ pressed }) => ({
                    marginTop: 16,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    backgroundColor: theme.primary,
                    borderRadius: 12,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  })}
                >
                  <Text style={{ color: theme.primaryForeground, fontWeight: '600' }}>
                    Link Broker Account
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAccountDropdown(true);
                }}
                style={({ pressed }) => ({
                  backgroundColor: theme.inputBackground,
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: theme.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  marginBottom: 12,
                })}
              >
                {selectedAccount ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        backgroundColor: `${getAccountColor(selectedAccount.accountType)}15`,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      {React.createElement(getAccountIcon(selectedAccount.accountType), {
                        size: 24,
                        color: getAccountColor(selectedAccount.accountType),
                        strokeWidth: 2
                      })}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 2 }}>
                        {selectedAccount.accountName}
                      </Text>
                      <Text style={{ fontSize: 13, color: theme.textMuted }}>
                        {getAccountTypeLabel(selectedAccount.accountType)} • {selectedAccount.currency} {selectedAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={{ fontSize: 16, color: theme.textLight, flex: 1 }}>
                    Select broker account...
                  </Text>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {selectedAccount && (
                    <Text style={{ fontSize: 13, color: theme.textMuted, marginRight: 12 }}>
                      {brokerAccounts.length} available
                    </Text>
                  )}
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: theme.muted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <ChevronDown size={16} color={theme.textMuted} />
                  </View>
                </View>
              </Pressable>
            )}
          </LinearGradient>

          {/* M-Pesa Account Selection Card */}
          <LinearGradient
            colors={['#0A3B7F15', '#0D4A9F08']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20,
              padding: 20,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: '#0A3B7F25',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: '#0A3B7F20',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                <Phone size={22} color="#0A3B7F" strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 2 }}>
                  Withdraw To M-Pesa Account *
                </Text>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>
                  Choose which M-Pesa account to receive funds
                </Text>
              </View>
            </View>

            {isLoadingMpesaAccounts ? (
              <View style={{
                backgroundColor: theme.inputBackground,
                borderRadius: 14,
                padding: 20,
                alignItems: 'center',
              }}>
                <ActivityIndicator size={24} color={theme.primary} />
                <Text style={{ fontSize: 14, color: theme.textMuted, marginTop: 12 }}>
                  Loading M-Pesa accounts...
                </Text>
              </View>
            ) : mpesaAccounts.length === 0 ? (
              <View style={{
                backgroundColor: theme.cardBackground,
                borderRadius: 14,
                padding: 24,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: theme.border,
                borderStyle: 'dashed',
                marginTop: 8,
              }}>
                <Phone size={48} color={theme.textMuted} />
                <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 12, fontSize: 15 }}>
                  No M-Pesa accounts linked
                </Text>
                <Text style={{ color: theme.textLight, textAlign: 'center', marginTop: 6, fontSize: 13 }}>
                  Link your M-Pesa account to receive withdrawals
                </Text>
                <Pressable
                  onPress={() => navigation.navigate('LinkAccount')}
                  style={({ pressed }) => ({
                    marginTop: 16,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    backgroundColor: theme.primary,
                    borderRadius: 12,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  })}
                >
                  <Text style={{ color: theme.primaryForeground, fontWeight: '600' }}>
                    Link M-Pesa Account
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowMpesaDropdown(true);
                }}
                style={({ pressed }) => ({
                  backgroundColor: theme.inputBackground,
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: theme.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                {selectedMpesaAccount ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        backgroundColor: '#00D4FF15',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Phone size={24} color="#00D4FF" strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 2 }}>
                        {selectedMpesaAccount.accountName}
                      </Text>
                      <Text style={{ fontSize: 13, color: theme.textMuted }}>
                        {selectedMpesaAccount.accountNumber ? formatPhoneNumber(selectedMpesaAccount.accountNumber) : 'No phone number'}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={{ fontSize: 16, color: theme.textLight, flex: 1 }}>
                    Select M-Pesa account...
                  </Text>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {selectedMpesaAccount && (
                    <Text style={{ fontSize: 13, color: theme.textMuted, marginRight: 12 }}>
                      {mpesaAccounts.length} available
                    </Text>
                  )}
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: theme.muted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <ChevronDown size={16} color={theme.textMuted} />
                  </View>
                </View>
              </Pressable>
            )}
          </LinearGradient>

          {/* Amount Input Card */}
          <LinearGradient
            colors={['#10B98115', '#05966908']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20,
              padding: 20,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: '#10B98125',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: '#10B98120',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                <Wallet size={22} color="#10B981" strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 2 }}>
                  Withdrawal Amount
                </Text>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>
                  Enter amount in Kenyan Shillings (KES)
                </Text>
              </View>
            </View>

            <View style={{ position: 'relative' }}>
              <TextInput
                placeholder="0.00"
                value={amount}
                onChangeText={(text) => setAmount(formatAmount(text))}
                keyboardType="decimal-pad"
                style={{
                  backgroundColor: theme.cardBackground,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: amount ? '#10B98140' : theme.borderLight,
                  padding: 20,
                  fontSize: 32,
                  fontWeight: '600',
                  color: theme.text,
                  textAlign: 'center',
                }}
                placeholderTextColor={theme.textMuted + '80'}
                editable={withdrawalStatus !== 'processing'}
              />
              <Text style={{
                position: 'absolute',
                right: 20,
                top: '50%',
                transform: [{ translateY: -10 }],
                fontSize: 18,
                fontWeight: '600',
                color: theme.textMuted,
              }}>
                KES
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              {[100, 500, 1000, 5000].map((quickAmount) => (
                <Pressable
                  key={quickAmount}
                  onPress={() => {
                    if (withdrawalStatus !== 'processing') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setAmount(quickAmount.toString());
                    }
                  }}
                  disabled={withdrawalStatus === 'processing'}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? '#10B98120' : theme.cardBackground,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.borderLight,
                    opacity: withdrawalStatus === 'processing' ? 0.5 : 1,
                    transform: [{ scale: pressed && withdrawalStatus !== 'processing' ? 0.95 : 1 }],
                  })}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#10B981' }}>
                    KES {quickAmount.toLocaleString()}
                  </Text>
                </Pressable>
              ))}
            </View>
            
            {selectedAccount && (
              <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 12 }}>
                Available balance: {selectedAccount.currency} {selectedAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            )}
          </LinearGradient>

          {/* Security Info */}
          <View style={{
            backgroundColor: '#10B98108',
            borderRadius: 16,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: 32,
            borderWidth: 1,
            borderColor: '#10B98115',
          }}>
            <Shield size={20} color="#10B981" strokeWidth={2} style={{ marginRight: 12, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 4 }}>
                Secure Withdrawal
              </Text>
              <Text style={{ fontSize: 13, color: theme.textMuted, lineHeight: 18 }}>
                Your withdrawal is processed securely. Funds will be sent directly to your selected M-Pesa account within 2-5 minutes.
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ gap: 12 }}>
            <Pressable
              onPress={handleWithdraw}
              disabled={withdrawalStatus === 'processing' || !amount || parseFloat(amount) < 100 || !selectedAccount || !selectedMpesaAccount}
              style={({ pressed }) => {
                const isDisabled = withdrawalStatus === 'processing' || !amount || parseFloat(amount) < 100 || !selectedAccount || !selectedMpesaAccount;
                return {
                  backgroundColor: isDisabled ? theme.textMuted + '30' : '#EF4444',
                  borderRadius: 16,
                  padding: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
                };
              }}
            >
              <LinearGradient
                colors={withdrawalStatus === 'processing' || !amount || parseFloat(amount) < 100 || !selectedAccount || !selectedMpesaAccount ? 
                  ['#6B7280', '#4B5563'] : 
                  ['#EF4444', '#DC2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  borderRadius: 16,
                }}
              />
              {withdrawalStatus === 'processing' ? (
                <>
                  <ActivityIndicator size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                    Processing...
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginRight: 8 }}>
                    Withdraw to M-Pesa
                  </Text>
                  <ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />
                </>
              )}
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('Link')}
              disabled={withdrawalStatus === 'processing'}
              style={({ pressed }) => ({
                backgroundColor: theme.cardBackground,
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: theme.borderLight,
                alignItems: 'center',
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: theme.primary }}>
                Need to Link Broker Account?
              </Text>
            </Pressable>
          </View>

          {/* Limits Info */}
          <View style={{ marginTop: 32, padding: 16, backgroundColor: theme.cardBackground, borderRadius: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 12 }}>
              Withdrawal Information
            </Text>
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>Minimum Withdrawal</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>KES 100</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>Maximum Withdrawal</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>KES 150,000</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>Processing Time</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#10B981' }}>2 - 5 minutes</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>Fees</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#10B981' }}>No fees</Text>
              </View>
            </View>
          </View>

          {/* Important Notice */}
          <View style={{ marginTop: 24, padding: 16, backgroundColor: '#FEF3F2', borderRadius: 16, borderWidth: 1, borderColor: '#FEE2E2' }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
              <AlertCircle size={18} color="#EF4444" strokeWidth={2} style={{ marginRight: 8, marginTop: 1 }} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#7F1D1D', flex: 1 }}>
                Important Notice
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: '#92400E', lineHeight: 18 }}>
              • Withdrawals are processed during business hours (8 AM - 6 PM EAT){'\n'}
              • Ensure you have sufficient balance in your trading account{'\n'}
              • Double-check your M-Pesa number before withdrawing{'\n'}
              • Contact support if you don't receive funds within 30 minutes
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Dropdown Modals */}
      <AccountDropdown />
      <MpesaDropdown />
    </View>
  );
}