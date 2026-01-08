import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Animated, Pressable, Modal, FlatList, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowRight, Wallet, AlertCircle, CreditCard, Shield, Search, ArrowLeft, Phone, TrendingUp, BarChart3, ChevronDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { RootStackParamList, Broker } from '../types';
import { getBrokerToken, depositDerivMpesa, initiateDeposit } from '../services/broker';
import { useTheme } from '../contexts/ThemeContext';
import { usePayvexStore } from '../stores/payvexStore';
import { MagicallyAlert } from '../components/ui/MagicallyAlert';
import { Logo } from '../components/ui';
import { LinkedAccounts } from '../magically/entities/LinkedAccount';

type DepositScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type LinkedAccount = {
  _id: string;
  accountName: string;
  accountType: string;
  balance: number;
  currency: string;
  broker?: Broker;
  isDefault?: boolean;
};

type MpesaAccount = {
  _id: string;
  accountName: string;
  accountType: string;
  accountNumber: string; // This will be the phone number
  balance: number;
  currency: string;
  isDefault?: boolean;
  status: string;
};

export default function DepositScreen() {
  const navigation = useNavigation<DepositScreenNavigationProp>();
  const theme = useTheme();
  const { accounts } = usePayvexStore();
  
  const [selectedAccount, setSelectedAccount] = useState<LinkedAccount | null>(null);
  const [selectedMpesaAccount, setSelectedMpesaAccount] = useState<MpesaAccount | null>(null);
  const [mpesaAccounts, setMpesaAccounts] = useState<MpesaAccount[]>([]);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showMpesaDropdown, setShowMpesaDropdown] = useState(false);
  const [accountSearchQuery, setAccountSearchQuery] = useState('');
  const [mpesaSearchQuery, setMpesaSearchQuery] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isLoadingMpesaAccounts, setIsLoadingMpesaAccounts] = useState(false);
  
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

  const loadMpesaAccounts = async () => {
    try {
      setIsLoadingMpesaAccounts(true);
      // Fetch all M-Pesa accounts from the database
      const result = await LinkedAccounts.query(
        { accountType: 'mpesa' }, 
        { sort: { linkedDate: -1 } }
      );
      
      const mpesaAccountsData = result.data.map(acc => ({
        _id: acc._id,
        accountName: acc.accountName,
        accountType: acc.accountType,
        accountNumber: acc.accountNumber, // Phone number
        balance: acc.balance,
        currency: acc.currency,
        isDefault: acc.isDefault,
        status: acc.status,
      }));
      
      setMpesaAccounts(mpesaAccountsData);
      
      // Auto-select default M-Pesa account
      if (mpesaAccountsData.length > 0) {
        const defaultMpesa = mpesaAccountsData.find(acc => acc.isDefault) || mpesaAccountsData[0];
        setSelectedMpesaAccount(defaultMpesa);
      }
    } catch (error) {
      console.error('Error loading M-Pesa accounts:', error);
      MagicallyAlert.alert('Error', 'Failed to load your M-Pesa accounts');
    } finally {
      setIsLoadingMpesaAccounts(false);
    }
  };

  // Filter broker accounts (Deriv/MT5 only for deposits)
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
    account.accountNumber.toLowerCase().includes(mpesaSearchQuery.toLowerCase())
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

  const handleSelectMpesaAccount = (account: MpesaAccount) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMpesaAccount(account);
    setShowMpesaDropdown(false);
    setMpesaSearchQuery('');
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('254')) {
      return `+254 ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)} ${cleaned.substring(9)}`;
    }
    return phone;
  };

  const handleDeposit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (!selectedAccount) {
      MagicallyAlert.alert('No Account Selected', 'Please select a broker account to deposit to');
      return;
    }
    
    if (!selectedMpesaAccount) {
      MagicallyAlert.alert('No M-Pesa Account Selected', 'Please select an M-Pesa account to use for payment');
      return;
    }
    
    const amountNum = parseFloat(amount);
    
    if (!amount || amountNum < 100) {
      MagicallyAlert.alert('Minimum Amount', 'Minimum deposit amount is KES 100');
      return;
    }
    
    if (amountNum > 150000) {
      MagicallyAlert.alert('Maximum Amount', 'Maximum deposit amount is KES 150,000');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Determine broker type from account
      const broker: Broker = selectedAccount.accountType === 'deriv' ? 'DERIV' : 'MT5';
      
      const credentials = await getBrokerToken(broker);
      if (!credentials) {
        setIsProcessing(false);
        MagicallyAlert.alert(
          'Account Not Linked',
          'Please link your broker account first before making a deposit',
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

      if (broker === 'DERIV') {
        // AUTOMATED FLOW - Direct API call for Deriv
        console.log('🚀 Starting automated deposit...');
        
        const result = await depositDerivMpesa(
          credentials.token,
          amountNum,
          selectedMpesaAccount.accountNumber // Use selected M-Pesa phone number
        );

        setIsProcessing(false);

        if (result.success) {
          setModalMessage(result.message);
          setShowSuccessModal(true);
        } else {
          setModalMessage(result.message);
          setShowErrorModal(true);
        }
      } else {
        // MT5 - Open browser (old method)
        await initiateDeposit(broker, amountNum);
        setIsProcessing(false);
        MagicallyAlert.alert(
          'Browser Opened',
          'Complete the payment via M-Pesa in your browser. Funds will be deposited directly to your broker account.'
        );
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Deposit error:', error);
      setIsProcessing(false);
      setModalMessage(error.message || 'Deposit failed');
      setShowErrorModal(true);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
  };

  const formatAmount = (text: string) => {
    const numericText = text.replace(/[^0-9.]/g, '');
    const parts = numericText.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return numericText;
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
              Select Broker Account
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
                        Link a Deriv or MT5 account to deposit funds
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
                const IconComponent = Phone;
                const iconColor = '#00D4FF';
                const isSelected = selectedMpesaAccount?._id === account._id;

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
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                          <Text style={{ fontSize: 12, color: theme.textMuted, marginRight: 8 }}>
                            {formatPhoneNumber(account.accountNumber)}
                          </Text>
                          {account.isDefault && (
                            <View style={{
                              backgroundColor: '#10B98120',
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                              marginRight: 6,
                            }}>
                              <Text style={{ fontSize: 10, color: '#10B981', fontWeight: '600' }}>
                                Default
                              </Text>
                            </View>
                          )}
                          <View style={{
                            backgroundColor: account.status === 'active' ? '#10B98120' : '#F59E0B20',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                          }}>
                            <Text style={{ 
                              fontSize: 10, 
                              color: account.status === 'active' ? '#10B981' : '#F59E0B', 
                              fontWeight: '600' 
                            }}>
                              {account.status}
                            </Text>
                          </View>
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
                        Add your M-Pesa accounts to make payments
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
                          Add M-Pesa Account
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
              Deposit Funds
            </Text>
          </View>
          <Logo size={32} />
        </View>
        <Text style={{ fontSize: 16, color: theme.textMuted, marginLeft: 44 }}>
          Add funds to your trading account via M-Pesa
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
          {/* Broker Account Selection Card */}
          <LinearGradient
            colors={['#0A3B7F15', '#0D4A9F08']}
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
                backgroundColor: theme.primary + '15',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                <CreditCard size={22} color={theme.primary} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 2 }}>
                  Deposit To Account *
                </Text>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>
                  Choose which broker account to deposit to
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
                  Link a Deriv or MT5 account to deposit funds
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
            colors={['#00D4FF15', '#00B4CC08']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20,
              padding: 20,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: '#00D4FF25',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: '#00D4FF20',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                <Phone size={22} color="#00D4FF" strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 2 }}>
                  Pay With M-Pesa Account *
                </Text>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>
                  Choose which M-Pesa account to use for payment
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
                <ActivityIndicator size={24} color="#00D4FF" />
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
                  No M-Pesa accounts available
                </Text>
                <Text style={{ color: theme.textLight, textAlign: 'center', marginTop: 6, fontSize: 13 }}>
                  Add your M-Pesa accounts to make payments
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
                    Add M-Pesa Account
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
                        {formatPhoneNumber(selectedMpesaAccount.accountNumber)} • Balance: {selectedMpesaAccount.currency} {selectedMpesaAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                  Deposit Amount
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
                editable={!isProcessing}
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
                    if (!isProcessing) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setAmount(quickAmount.toString());
                    }
                  }}
                  disabled={isProcessing}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? '#10B98120' : theme.cardBackground,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.borderLight,
                    opacity: isProcessing ? 0.5 : 1,
                    transform: [{ scale: pressed && !isProcessing ? 0.95 : 1 }],
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
                Current balance: {selectedAccount.currency} {selectedAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            )}
          </LinearGradient>

          {/* Security Info */}
          <View style={{
            backgroundColor: '#0A3B7F08',
            borderRadius: 16,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: 32,
            borderWidth: 1,
            borderColor: '#0A3B7F15',
          }}>
            <Shield size={20} color="#0A3B7F" strokeWidth={2} style={{ marginRight: 12, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 4 }}>
                Secure Payment
              </Text>
              <Text style={{ fontSize: 13, color: theme.textMuted, lineHeight: 18 }}>
                {selectedAccount?.accountType === 'deriv' 
                  ? `STK push will be sent to ${selectedMpesaAccount ? formatPhoneNumber(selectedMpesaAccount.accountNumber) : 'your M-Pesa number'}. Enter your M-Pesa PIN to complete payment.`
                  : 'Your payment is processed securely via M-Pesa. Funds are deposited directly to your selected broker account within minutes.'}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ gap: 12 }}>
            <Pressable
              onPress={handleDeposit}
              disabled={isProcessing || !amount || parseFloat(amount) < 100 || !selectedAccount || !selectedMpesaAccount}
              style={({ pressed }) => {
                const isDisabled = isProcessing || !amount || parseFloat(amount) < 100 || !selectedAccount || !selectedMpesaAccount;
                return {
                  backgroundColor: isDisabled ? theme.textMuted + '30' : theme.primary,
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
                colors={isProcessing || !amount || parseFloat(amount) < 100 || !selectedAccount || !selectedMpesaAccount ? 
                  ['#6B7280', '#4B5563'] : 
                  ['#0A3B7F', '#0D4A9F']}
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
              {isProcessing ? (
                <>
                  <ActivityIndicator size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                    Sending STK Push...
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginRight: 8 }}>
                    {selectedAccount?.accountType === 'deriv' ? 'Send STK Push' : 'Continue to M-Pesa Payment'}
                  </Text>
                  <ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />
                </>
              )}
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('LinkAccount')}
              disabled={isProcessing}
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
              Deposit Limits
            </Text>
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>Minimum Deposit</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>KES 100</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>Maximum Deposit</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>KES 150,000</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>Processing Time</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#10B981' }}>Instant - 2 minutes</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>Payment Method</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#10B981' }}>M-Pesa Only</Text>
              </View>
            </View>
          </View>

          {/* Note about broker accounts */}
          <View style={{ marginTop: 24, padding: 16, backgroundColor: '#F0F9FF', borderRadius: 16, borderWidth: 1, borderColor: '#E0F2FE' }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
              <AlertCircle size={18} color="#0A3B7F" strokeWidth={2} style={{ marginRight: 8, marginTop: 1 }} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#075985', flex: 1 }}>
                Note about Broker Accounts
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: '#0C4A6E', lineHeight: 18 }}>
              • Deriv: Direct STK push to your phone (instant){'\n'}
              • MT5: Browser-based M-Pesa payment{'\n'}
              • Funds are available for trading immediately after deposit{'\n'}
              • Contact support if you encounter any issues
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Dropdown Modals */}
      <AccountDropdown />
      <MpesaDropdown />

      {/* SUCCESS MODAL */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: theme.cardBackground,
            borderRadius: 24,
            padding: 32,
            width: '100%',
            maxWidth: 400,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#10B98115',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}>
              <Text style={{ fontSize: 48 }}>✅</Text>
            </View>
            
            <Text style={{ 
              fontSize: 24, 
              fontWeight: '700', 
              color: theme.text,
              marginBottom: 12,
              textAlign: 'center'
            }}>
              STK Push Sent!
            </Text>
            
            <Text style={{ 
              fontSize: 16, 
              color: theme.textMuted,
              textAlign: 'center',
              marginBottom: 8,
              lineHeight: 22
            }}>
              {modalMessage}
            </Text>
            
            <Text style={{ 
              fontSize: 14, 
              color: theme.textLight,
              textAlign: 'center',
              marginBottom: 24,
              lineHeight: 20
            }}>
              Check your phone and enter your M-Pesa PIN to complete the payment.
            </Text>
            
            <Pressable
              onPress={handleSuccessClose}
              style={({ pressed }) => ({
                backgroundColor: '#10B981',
                paddingVertical: 16,
                paddingHorizontal: 48,
                borderRadius: 16,
                width: '100%',
                alignItems: 'center',
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <Text style={{ 
                color: 'white', 
                fontWeight: '700', 
                fontSize: 16 
              }}>
                Got It
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ERROR MODAL */}
      <Modal
        visible={showErrorModal}
        transparent
        animationType="fade"
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: theme.cardBackground,
            borderRadius: 24,
            padding: 32,
            width: '100%',
            maxWidth: 400,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#EF444415',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}>
              <Text style={{ fontSize: 48 }}>❌</Text>
            </View>
            
            <Text style={{ 
              fontSize: 24, 
              fontWeight: '700', 
              color: theme.text,
              marginBottom: 12,
              textAlign: 'center'
            }}>
              Deposit Failed
            </Text>
            
            <Text style={{ 
              fontSize: 16, 
              color: theme.textMuted,
              textAlign: 'center',
              marginBottom: 24,
              lineHeight: 22
            }}>
              {modalMessage}
            </Text>
            
            <Pressable
              onPress={handleErrorClose}
              style={({ pressed }) => ({
                backgroundColor: '#EF4444',
                paddingVertical: 16,
                paddingHorizontal: 48,
                borderRadius: 16,
                width: '100%',
                alignItems: 'center',
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <Text style={{ 
                color: 'white', 
                fontWeight: '700', 
                fontSize: 16 
              }}>
                Try Again
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}