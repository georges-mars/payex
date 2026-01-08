import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Animated, Pressable, Modal, FlatList, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowRight, Wallet, AlertCircle, CreditCard, Shield, Search, ArrowLeft, Phone, TrendingUp, BarChart3, CheckCircle, XCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { RootStackParamList, Broker } from '../types';
import { getBrokerToken, getMpesaPhone, withdraw } from '../services/broker';
import { useTheme } from '../contexts/ThemeContext';
import { usePayvexStore } from '../stores/payvexStore';
import { MagicallyAlert } from '../components/ui/MagicallyAlert';
import { Logo } from '../components/ui';

type WithdrawScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type LinkedAccount = {
  _id: string;
  accountName: string;
  accountType: string;
  balance: number;
  currency: string;
  broker?: Broker;
  isDefault?: boolean;
};

type WithdrawalStatus = 'idle' | 'processing' | 'success' | 'error';

export default function WithdrawScreen() {
  const navigation = useNavigation<WithdrawScreenNavigationProp>();
  const theme = useTheme();
  const { accounts } = usePayvexStore();
  
  const [selectedAccount, setSelectedAccount] = useState<LinkedAccount | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [withdrawalStatus, setWithdrawalStatus] = useState<WithdrawalStatus>('idle');
  const [transactionId, setTransactionId] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState('');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
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
    
    loadMpesaPhone();
    
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

  const loadMpesaPhone = async () => {
    try {
      const phone = await getMpesaPhone();
      setMpesaPhone(phone);
    } catch (error) {
      console.error('Error loading M-Pesa phone:', error);
    }
  };

  // Filter broker accounts (Deriv/MT5 only for withdrawals)
  const brokerAccounts = accounts.filter(acc => 
    acc.accountType === 'deriv' || acc.accountType === 'mt5'
  );

  const filteredAccounts = brokerAccounts.filter(account =>
    account.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.accountType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.currency.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'deriv': return TrendingUp;
      case 'mt5': return BarChart3;
      default: return CreditCard;
    }
  };

  const getAccountColor = (type: string) => {
    switch (type) {
      case 'deriv': return '#FF6B35';
      case 'mt5': return '#00B894';
      default: return theme.primary;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'deriv': return 'Deriv Trading';
      case 'mt5': return 'MetaTrader 5';
      default: return 'Broker Account';
    }
  };

  const handleSelectAccount = (account: LinkedAccount) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAccount(account);
    setShowAccountDropdown(false);
    setSearchQuery('');
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
    return phone;
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) < 100) return Alert.alert('Error', 'Min KES 100');
    try {
      const token = await getBrokerToken(broker);
      if (!token) return Alert.alert('Link First', 'Enter token on Link');
      const mpesa = await getMpesaPhone();
      if (!mpesa) return Alert.alert('Phone Missing', 'Set phone on Link');
      const res = await withdraw(broker, parseFloat(amount));
      setStatus(`Success! ID: ${res.id} | ${res.status}. Funds to M-Pesa direct.`);
    } catch (error) {
      setStatus(`Error: ${error.message}. Check link/phone.`);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: 'white' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Withdraw from {broker}</Text>
      <Picker selectedValue={broker} onValueChange={setBroker} style={{ marginBottom: 16 }}>
        <Picker.Item label="Deriv" value="DERIV" />
        <Picker.Item label="MT5" value="MT5" />
      </Picker>
      
      <TextInput 
        placeholder="Amount (KES)" 
        value={amount} 
        onChangeText={setAmount} 
        keyboardType="numeric"
        style={{ borderWidth: 1, padding: 8, borderRadius: 4, marginBottom: 16 }} 
      />
      <TouchableOpacity onPress={handleWithdraw} style={{ backgroundColor: 'red', padding: 8, borderRadius: 4, marginBottom: 8 }}>
        <Text style={{ color: 'white' }}>Withdraw to M-Pesa</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 12, fontStyle: 'italic', marginBottom: 16 }}>{status}</Text>
      <TouchableOpacity onPress={() => navigation.navigate('Link')} style={{ backgroundColor: 'gray', padding: 8, borderRadius: 4 }}>
        <Text style={{ color: 'white' }}>Link Broker First?</Text>
      </TouchableOpacity>
    </View>
  );
}