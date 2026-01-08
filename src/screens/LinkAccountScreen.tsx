// src/screens/LinkScreen.tsx - SIMPLIFIED VERSION
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, Platform, Switch } from 'react-native';
import { ArrowLeft, Smartphone, Building2, TrendingUp, AlertCircle, Shield, Globe, Key, Eye, EyeOff, HelpCircle, BarChart3 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { usePayvexStore } from '../stores/payvexStore';
import { LinkedAccounts, LinkedAccountUtils } from '../magically/entities/LinkedAccount';
import { AnimatedSpinner, Logo } from '../components/ui';
import { MagicallyAlert } from '../components/ui/MagicallyAlert';
import magically from 'magically-sdk';
import { setMpesaPhone, getMpesaPhone, type Broker, linkBroker } from '../services/broker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type AccountType = 'mpesa' | 'bank' | 'deriv' | 'binance' | 'mt5' | 'etoro' | 'interactive_brokers';

const BANKS = [
  'Equity Bank', 'KCB Bank', 'Cooperative Bank', 'Standard Chartered',
  'Barclays Bank', 'NCBA Bank', 'Stanbic Bank', 'DTB Bank'
];

const MT5_BROKERS = [
  'IC Markets', 'Exness', 'XM', 'Pepperstone', 'FxPro',
  'HF Markets', 'Admiral Markets', 'ThinkMarkets', 'Axi'
];

const TRADING_PLATFORMS_INFO = {
  deriv: {
    name: 'Deriv',
    icon: '📊',
    description: 'Deriv Trading Platform',
    color: '#FF6B35',
    requiresApiSecret: false,
    setupGuide: 'https://app.deriv.com/account/api-token'
  },
  binance: {
    name: 'Binance',
    icon: '💰',
    description: 'Binance Crypto Exchange',
    color: '#F0B90B',
    requiresApiSecret: true,
    setupGuide: 'https://www.binance.com/en/support/faq/how-to-create-api-360002502072'
  },
  mt5: {
    name: 'MetaTrader 5',
    icon: '📈',
    description: 'MetaTrader 5 Forex/CFD Trading',
    color: '#00B894',
    requiresApiSecret: false,
    requiresServer: true,
    requiresLogin: true,
    setupGuide: 'https://www.metatrader5.com/en/terminal/help/start_advanced/account_open'
  },
  etoro: {
    name: 'eToro',
    icon: '👥',
    description: 'eToro Social Trading',
    color: '#7C3AED',
    requiresApiSecret: false,
    setupGuide: 'https://www.etoro.com/api/'
  },
  interactive_brokers: {
    name: 'Interactive Brokers',
    icon: '🏦',
    description: 'IBKR Professional Trading',
    color: '#2563EB',
    requiresApiSecret: false,
    setupGuide: 'https://www.interactivebrokers.com/en/software/api/apiguide/tables/general_api_workflow.htm'
  }
};

type LinkScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Link'>;

export const LinkAccountScreen = () => {
  const theme = useTheme();
  const { setAccounts, accounts } = usePayvexStore();
  const navigation = useNavigation<LinkScreenNavigationProp>();
  
  const [selectedType, setSelectedType] = useState<AccountType>('mpesa');
  const [isLinking, setIsLinking] = useState(false);
  
  // ✅ SIMPLE STATE LIKE OLD SCREEN
  const [phone, setPhone] = useState('');
  
  // Broker linking states (from old screen)
  const [broker, setBroker] = useState<Broker>('DERIV');
  const [token, setToken] = useState('');
  const [accountId, setAccountId] = useState('');

  const handleTabChange = (type: AccountType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedType(type);
  };

  // ✅ EXACT SAME LOGIC AS OLD WORKING SCREEN
  const handlePhoneSave = async () => {
    console.log('Saving phone:', phone);
    
    try {
      // Direct call to setMpesaPhone - same as old screen
      const valid = await setMpesaPhone(phone);
      console.log('setMpesaPhone returned:', valid);
      
      if (valid) {
        // Same success alert as old screen
        Alert.alert('Saved!', 'M-Pesa phone set for withdrawals');
        
        // Same navigation as old screen
        navigation.navigate('MainTabs');
      } else {
        // Same error alert as old screen
        Alert.alert('Error', 'Invalid phone: Use 2547XXXXXXXX format');
      }
    } catch (error) {
      console.error('Phone save error:', error);
      Alert.alert('Error', 'Failed to save phone number');
    }
  };

  // ✅ EXACT SAME LOGIC AS OLD WORKING SCREEN
  const handleTestLink = async () => {
    let data = token;
    if (broker === 'MT5') data = JSON.stringify({ token, accountId });
    const success = await linkBroker(broker, data);
    Alert.alert('Test Result', success ? 'Token valid!' : 'Invalid token – check & retry');
  };

  // ✅ EXACT SAME LOGIC AS OLD WORKING SCREEN
  const handleLink = async () => {
    let data = token;
    if (broker === 'MT5') data = JSON.stringify({ token, accountId });
    const success = await linkBroker(broker, data);
    if (success) {
      Alert.alert('Linked!', `Ready for ${broker} deposits/withdraws`);
    }
  };

  const tabs = [
    { type: 'mpesa' as AccountType, label: 'M-Pesa', icon: Smartphone, color: '#00B300' },
    { type: 'bank' as AccountType, label: 'Bank', icon: Building2, color: '#0066CC' },
    { type: 'deriv' as AccountType, label: 'Deriv', icon: TrendingUp, color: '#FF6B35' },
    { type: 'binance' as AccountType, label: 'Binance', icon: Globe, color: '#F0B90B' },
    { type: 'mt5' as AccountType, label: 'MT5', icon: BarChart3, color: '#00B894' },
  ];

  const renderTradingForm = () => (
    <View style={{ gap: 20 }}>
      <View style={{ marginBottom: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>
          {selectedType === 'deriv' ? 'Deriv' : selectedType === 'binance' ? 'Binance' : 'MT5'} Account
        </Text>
        <Text style={{ fontSize: 14, color: theme.textMuted, marginTop: 4 }}>
          Link your trading account for deposits and withdrawals
        </Text>
      </View>

      {/* ✅ SIMPLE BROKER SWITCHER LIKE OLD SCREEN */}
      <Pressable 
        onPress={() => setBroker(broker === 'DERIV' ? 'MT5' : 'DERIV')} 
        style={({ pressed }) => ({
          backgroundColor: theme.primary,
          padding: 16,
          borderRadius: 12,
          alignItems: 'center',
          transform: [{ scale: pressed ? 0.98 : 1 }]
        })}
      >
        <Text style={{ color: theme.primaryForeground, fontSize: 16, fontWeight: '600' }}>
          Switch to {broker === 'DERIV' ? 'MT5' : 'Deriv'}
        </Text>
      </Pressable>
      
      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textMuted, marginBottom: 8 }}>
        {broker} API Token *
      </Text>
      <TextInput
        value={token}
        onChangeText={setToken}
        placeholder={broker === 'DERIV' ? "Deriv API Token (e.g., abc123...)" : "MetaApi Token (for MT5)"}
        placeholderTextColor={theme.textLight}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        style={{
          backgroundColor: theme.inputBackground,
          borderRadius: 14,
          padding: 16,
          fontSize: 16,
          color: theme.text,
          borderWidth: 1,
          borderColor: theme.border,
        }}
      />
      
      {broker === 'MT5' && (
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textMuted, marginBottom: 8 }}>
            MT5 Account ID *
          </Text>
          <TextInput
            value={accountId}
            onChangeText={setAccountId}
            placeholder="Your MT5 Account ID"
            placeholderTextColor={theme.textLight}
            style={{
              backgroundColor: theme.inputBackground,
              borderRadius: 14,
              padding: 16,
              fontSize: 16,
              color: theme.text,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          />
        </View>
      )}
      
      {/* ✅ SAME BUTTONS AS OLD SCREEN */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Pressable
          onPress={handleTestLink}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: theme.warning,
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            transform: [{ scale: pressed ? 0.98 : 1 }]
          })}
        >
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600' }}>
            Test Token
          </Text>
        </Pressable>
        
        <Pressable
          onPress={handleLink}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: theme.success,
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            transform: [{ scale: pressed ? 0.98 : 1 }]
          })}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
            Save & Link
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderMpesaForm = () => (
    <View style={{ gap: 20 }}>
      <View style={{
        backgroundColor: `${theme.info}15`,
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: theme.info,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Shield size={16} color={theme.info} style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
            M-Pesa Phone Setup
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: theme.textMuted, lineHeight: 18 }}>
          • Enter your M-Pesa phone number for withdrawals{'\n'}
          • Phone number is securely stored locally{'\n'}
          • Used only for direct broker transfers{'\n'}
          • Format: 2547XXXXXXXX or 0712345678
        </Text>
      </View>

      <View>
        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textMuted, marginBottom: 8 }}>
          M-PESA PHONE NUMBER *
        </Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="254712345678 or 0712345678"
          placeholderTextColor={theme.textLight}
          keyboardType="phone-pad"
          style={{
            backgroundColor: theme.inputBackground,
            borderRadius: 14,
            padding: 16,
            fontSize: 16,
            color: theme.text,
            borderWidth: 1,
            borderColor: theme.border,
          }}
        />
        <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>
          Used for withdrawals only. Never shared with third parties.
        </Text>
      </View>
    </View>
  );

  const renderBankForm = () => (
    <View style={{ gap: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text, marginBottom: 8 }}>
        Bank Account
      </Text>
      <Text style={{ fontSize: 14, color: theme.textMuted, marginBottom: 16 }}>
        Coming soon! Bank account linking will be available in the next update.
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
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
              Link Account
            </Text>
          </View>
          <Logo size={32} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ padding: 24 }}>
          {/* Security Notice */}
          <View
            style={{
              backgroundColor: `${theme.secondary}15`,
              borderRadius: 14,
              padding: 16,
              flexDirection: 'row',
              marginBottom: 24,
              borderWidth: 1,
              borderColor: `${theme.secondary}30`,
            }}
          >
            <Shield size={20} color={theme.secondary} strokeWidth={2} style={{ marginRight: 12, marginTop: 2 }} />
            <Text style={{ flex: 1, fontSize: 13, color: theme.text, lineHeight: 20 }}>
              All credentials are encrypted and never stored in plain text.
            </Text>
          </View>

          {/* Account Type Tabs */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={{ marginBottom: 24 }}
            contentContainerStyle={{ paddingRight: 10 }}
          >
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {tabs.map((tab) => (
                <Pressable
                  key={tab.type}
                  onPress={() => handleTabChange(tab.type)}
                  style={({ pressed }) => ({
                    minWidth: 90,
                    backgroundColor: selectedType === tab.type ? tab.color : theme.cardBackground,
                    borderRadius: 14,
                    padding: 14,
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: selectedType === tab.type ? tab.color : theme.border,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                    shadowColor: selectedType === tab.type ? tab.color : 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: selectedType === tab.type ? 0.2 : 0,
                    shadowRadius: 4,
                    elevation: selectedType === tab.type ? 3 : 0,
                  })}
                >
                  <tab.icon
                    size={22}
                    color={selectedType === tab.type ? '#FFFFFF' : theme.text}
                    strokeWidth={2.5}
                  />
                  <Text
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      fontWeight: '700',
                      color: selectedType === tab.type ? '#FFFFFF' : theme.text,
                    }}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Form Rendering */}
          {selectedType === 'mpesa' && renderMpesaForm()}
          {selectedType === 'bank' && renderBankForm()}
          {['deriv', 'binance', 'mt5'].includes(selectedType) && renderTradingForm()}

          {/* Save/Link Button */}
          <Pressable
            onPress={selectedType === 'mpesa' ? handlePhoneSave : handleLink}
            disabled={isLinking}
            style={({ pressed }) => ({
              backgroundColor: isLinking ? theme.muted : theme.primary,
              borderRadius: 16,
              padding: 18,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 32,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: pressed ? 0.2 : 0.3,
              shadowRadius: 6,
              elevation: pressed ? 2 : 4,
              transform: [{ scale: pressed && !isLinking ? 0.98 : 1 }],
            })}
          >
            <Text style={{ color: theme.primaryForeground, fontSize: 17, fontWeight: '700' }}>
              {selectedType === 'mpesa' ? 'Save Phone Number' : 'Link Account'}
            </Text>
          </Pressable>

          {/* Test Button for Trading Accounts */}
          {['deriv', 'binance', 'mt5'].includes(selectedType) && (
            <Pressable
              onPress={handleTestLink}
              style={({ pressed }) => ({
                backgroundColor: theme.cardBackground,
                borderRadius: 16,
                padding: 16,
                alignItems: 'center',
                marginTop: 16,
                borderWidth: 2,
                borderColor: theme.border,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600' }}>
                Test Connection First
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default LinkAccountScreen;