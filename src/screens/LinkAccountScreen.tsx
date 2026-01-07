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

export const LinkAccountScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const { setAccounts, accounts } = usePayvexStore();
  const [selectedType, setSelectedType] = useState<AccountType>('mpesa');
  const [isLinking, setIsLinking] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // M-Pesa settings
  const [enableBalanceAccess, setEnableBalanceAccess] = useState(false);
  const placeholderPin = '0000'; // Placeholder PIN for API compatibility

  // M-Pesa fields
  const [mpesaPhone, setMpesaPhone] = useState('');

  // Bank fields
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');

  // Trading fields - Common
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [accountId, setAccountId] = useState('');
  const [passphrase, setPassphrase] = useState('');

  // MT5 specific fields
  const [selectedBroker, setSelectedBroker] = useState('');
  const [mt5Login, setMt5Login] = useState('');
  const [mt5Password, setMt5Password] = useState('');
  const [mt5Server, setMt5Server] = useState('');
  const [mt5InvestorPassword, setMt5InvestorPassword] = useState('');

  const handleTabChange = (type: AccountType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedType(type);
    // Reset form when changing tabs
    if (type !== 'deriv' && type !== 'binance' && type !== 'mt5' && type !== 'etoro' && type !== 'interactive_brokers') {
      setApiKey('');
      setApiSecret('');
      setAccountId('');
      setPassphrase('');
      setSelectedBroker('');
      setMt5Login('');
      setMt5Password('');
      setMt5Server('');
      setMt5InvestorPassword('');
    }
    // Reset balance access toggle for M-Pesa
    if (type === 'mpesa') {
      setEnableBalanceAccess(false);
    }
  };

  const validateMPesa = () => {
    const cleanPhone = mpesaPhone.replace(/\s+/g, '').replace(/[^\d]/g, '');
    
    if (!cleanPhone || cleanPhone.length < 9) {
      MagicallyAlert.alert('Invalid Phone', 'Please enter a valid M-Pesa phone number (e.g., 0712345678 or 254712345678)');
      return false;
    }
    
    let formattedPhone = cleanPhone;
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      formattedPhone = '254' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('+')) {
      formattedPhone = cleanPhone.substring(1);
    }
    
    // Final validation
    if (!formattedPhone.startsWith('254') || formattedPhone.length !== 12) {
      MagicallyAlert.alert('Invalid Phone', 'Please enter a valid Kenyan phone number (e.g., 254712345678)');
      return false;
    }
    
    setMpesaPhone(formattedPhone);
    return true;
  };

  const validateBank = () => {
    if (!selectedBank) {
      MagicallyAlert.alert('Missing Bank', 'Please select your bank');
      return false;
    }
    
    const cleanAccountNumber = accountNumber.replace(/\s+/g, '');
    
    if (!cleanAccountNumber || cleanAccountNumber.length < 8) {
      MagicallyAlert.alert('Invalid Account', 'Please enter a valid account number (minimum 8 digits)');
      return false;
    }
    
    if (!/^\d+$/.test(cleanAccountNumber)) {
      MagicallyAlert.alert('Invalid Account', 'Account number must contain only numbers');
      return false;
    }
    
    setAccountNumber(cleanAccountNumber);
    
    if (!accountName.trim()) {
      MagicallyAlert.alert('Missing Name', 'Please enter account holder name');
      return false;
    }
    
    if (accountName.trim().length < 3) {
      MagicallyAlert.alert('Invalid Name', 'Account holder name must be at least 3 characters');
      return false;
    }
    
    return true;
  };

  const validateTrading = () => {
    const platformInfo = TRADING_PLATFORMS_INFO[selectedType];
    
    if (!platformInfo) {
      MagicallyAlert.alert('Invalid Platform', 'Please select a valid trading platform');
      return false;
    }
    
    // Platform-specific validation
    switch(selectedType) {
      case 'deriv':
        if (!apiKey.trim()) {
          MagicallyAlert.alert('Missing API Token', 'Please enter your Deriv API token');
          return false;
        }
        break;
        
      case 'binance':
        if (!apiKey.trim()) {
          MagicallyAlert.alert('Missing API Key', 'Please enter your Binance API key');
          return false;
        }
        if (!apiSecret.trim()) {
          MagicallyAlert.alert('Missing API Secret', 'Please enter your Binance API secret');
          return false;
        }
        if (apiKey.trim().length < 20 || apiSecret.trim().length < 20) {
          MagicallyAlert.alert('Invalid Credentials', 'Binance API credentials appear too short. Please check your key and secret.');
          return false;
        }
        break;
        
      case 'mt5':
        if (!selectedBroker) {
          MagicallyAlert.alert('Missing Broker', 'Please select your MT5 broker');
          return false;
        }
        if (!mt5Login.trim()) {
          MagicallyAlert.alert('Missing Login', 'Please enter your MT5 account login number');
          return false;
        }
        if (!/^\d+$/.test(mt5Login.trim())) {
          MagicallyAlert.alert('Invalid Login', 'MT5 login must be a number');
          return false;
        }
        if (!mt5Password.trim()) {
          MagicallyAlert.alert('Missing Password', 'Please enter your MT5 account password');
          return false;
        }
        if (!mt5Server.trim()) {
          MagicallyAlert.alert('Missing Server', 'Please enter your MT5 server name');
          return false;
        }
        break;
        
      case 'etoro':
      case 'interactive_brokers':
        if (!apiKey.trim()) {
          MagicallyAlert.alert('Missing API Key', 'Please enter your API key');
          return false;
        }
        break;
        
      default:
        return false;
    }
    
    return true;
  };

  const handleLinkAccount = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  
    // Validate based on account type
    let isValid = false;
    if (selectedType === 'mpesa') {
      isValid = validateMPesa();
    } else if (selectedType === 'bank') {
      isValid = validateBank();
    } else if (['deriv', 'binance', 'mt5', 'etoro', 'interactive_brokers'].includes(selectedType)) {
      isValid = validateTrading();
    }
  
    if (!isValid) {
      console.log('❌ Validation failed');
      return;
    }
  
    setIsLinking(true);
  
    try {
      console.log('🔵 [REAL] Calling edge function...');
      
      let payload: any = {};
      let functionName = 'link-trading-account';
  
      if (selectedType === 'mpesa') {
        functionName = 'link-mpesa-account';
        
        // ✅ SEND BOTH: placeholder PIN for old function, balance access for new
        payload = {
          phoneNumber: mpesaPhone,
          pin: placeholderPin, // ✅ Placeholder PIN for API compatibility
          authorizeBalanceAccess: enableBalanceAccess, // ✅ Keep balance access flag
        };
        
        console.log('🔵 [MPESA] Payload:', {
          phoneNumber: mpesaPhone,
          pinProvided: true,
          pinLength: placeholderPin.length,
          authorizeBalanceAccess: enableBalanceAccess
        });
        
      } else if (selectedType === 'bank') {
        functionName = 'link-bank-account';
        payload = {
          bankName: selectedBank,
          accountNumber,
          accountName: accountName.trim(),
          routingNumber: routingNumber || undefined,
        };
      } else if (['deriv', 'binance', 'mt5', 'etoro', 'interactive_brokers'].includes(selectedType)) {
        const platformInfo = TRADING_PLATFORMS_INFO[selectedType];
        
        payload = {
          platform: selectedType,
        };
  
        switch(selectedType) {
          case 'deriv':
            payload.apiKey = apiKey.trim();
            payload.accountId = accountId.trim() || undefined;
            payload.apiSecret = 'deriv-does-not-require-api-secret';
            break;
            
          case 'binance':
            payload.apiKey = apiKey.trim();
            payload.apiSecret = apiSecret.trim();
            payload.passphrase = passphrase.trim() || undefined;
            payload.accountId = accountId.trim() || undefined;
            break;
            
          case 'mt5':
            payload.broker = selectedBroker;
            payload.login = parseInt(mt5Login.trim());
            payload.password = mt5Password.trim();
            payload.server = mt5Server.trim();
            payload.investorPassword = mt5InvestorPassword.trim() || undefined;
            break;
            
          default:
            payload.apiKey = apiKey.trim();
            payload.accountId = accountId.trim() || undefined;
            if (apiSecret.trim()) {
              payload.apiSecret = apiSecret.trim();
            }
        }
      }
  
      console.log('🔵 [REAL] Payload (masked):', {
        ...payload,
        apiSecret: payload.apiSecret ? '***REDACTED***' : undefined,
        password: payload.password ? '***REDACTED***' : undefined,
        investorPassword: payload.investorPassword ? '***REDACTED***' : undefined,
        pin: payload.pin ? '***REDACTED***' : undefined
      });
  
      // REAL API CALL to edge function
      const response = await magically.functions.invoke(functionName, {
        body: payload,
        timeout: 30000
      });
  
      console.log('🟡 [REAL] Response received:', {
        status: response.status,
        hasData: !!response.data
      });
  
      const responseData = response.data as any;
      
      if (!responseData) {
        throw new Error('No response from server');
      }
  
      if (responseData.success && responseData.data) {
        console.log('✅ [REAL] Edge function succeeded, creating account...');
        
        let defaultCurrency = 'KES';
        if (selectedType === 'deriv' || selectedType === 'mt5' || selectedType === 'etoro' || selectedType === 'interactive_brokers') {
          defaultCurrency = responseData.data.currency || 'USD';
        } else if (selectedType === 'binance') {
          defaultCurrency = 'USDT';
        }
  
        // Create linked account with REAL data
        const newAccount = await LinkedAccounts.create({
          accountType: selectedType,
          accountName: responseData.data.accountName,
          accountNumber: responseData.data.maskedAccountNumber,
          balance: responseData.data.balance || 0,
          currency: responseData.data.currency || defaultCurrency,
          status: responseData.data.status || 'active',
          isDefault: accounts.length === 0,
          linkedDate: new Date().toISOString(),
          metadata: {
            platform: selectedType,
            phoneNumber: selectedType === 'mpesa' ? mpesaPhone : undefined,
            hasBalanceAccess: responseData.data.metadata?.hasBalanceAccess || false,
            placeholderPinUsed: selectedType === 'mpesa', // Track that we used placeholder
            accountId: selectedType === 'mt5' ? mt5Login.trim() : (accountId.trim() || undefined),
            brokerName: selectedType === 'mt5' ? selectedBroker : undefined,
            server: selectedType === 'mt5' ? mt5Server.trim() : undefined,
            login: selectedType === 'mt5' ? parseInt(mt5Login.trim()) : undefined,
            maskedApiKey: apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : undefined,
            lastSynced: new Date().toISOString(),
            requiresManualVerification: responseData.data.status === 'needs_verification',
            validatedWithRealApi: responseData.data.metadata?.validatedWithRealApi || false,
            leverage: responseData.data.metadata?.leverage,
            marginLevel: responseData.data.metadata?.marginLevel,
            ...responseData.data.metadata
          }
        });
  
        console.log('✅ [REAL] Account created:', {
          id: newAccount._id,
          name: newAccount.accountName,
          balance: newAccount.balance,
          currency: newAccount.currency,
          type: newAccount.accountType,
          hasBalanceAccess: newAccount.metadata?.hasBalanceAccess
        });
  
        // Update store
        setAccounts([newAccount, ...accounts]);
  
        // Show success with REAL data
        const formattedBalance = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: newAccount.currency,
        }).format(newAccount.balance);
  
        let successMessage = `${newAccount.accountName} has been verified and linked.\n\nBalance: ${formattedBalance}`;
        
        if (newAccount.metadata?.leverage) {
          successMessage += `\nLeverage: 1:${newAccount.metadata.leverage}`;
        }
        if (newAccount.metadata?.marginLevel) {
          successMessage += `\nMargin Level: ${newAccount.metadata.marginLevel}%`;
        }
        
        // Add note for M-Pesa
        if (selectedType === 'mpesa') {
          if (newAccount.metadata?.hasBalanceAccess) {
            successMessage += `\n\n✅ Balance access feature enabled`;
            successMessage += `\nWill activate when API credentials are configured`;
          } else {
            successMessage += `\n\n⚠️ Basic verification completed`;
            successMessage += `\nUsing placeholder PIN for API compatibility`;
            successMessage += `\nContact support to enable real balance access`;
          }
        }
  
        // Add note for Deriv demo accounts
        if (selectedType === 'deriv' && newAccount.metadata?.isDemo) {
          successMessage += `\n\n📝 Note: This is a Deriv demo account. Real accounts will show actual balances.`;
        }
  
        MagicallyAlert.alert(
          'Account Linked Successfully! ✅',
          successMessage,
          [
            {
              text: 'View Account',
              onPress: () => {
                navigation.navigate('AccountDetails', { accountId: newAccount._id });
              }
            },
            {
              text: 'Done',
              onPress: () => navigation.goBack(),
              style: 'default'
            }
          ]
        );
  
      } else {
        console.log('❌ [REAL] Edge function returned failure:', responseData);
        throw new Error(responseData.message || 'Failed to link account');
      }
  
    } catch (error: any) {
      console.error('🔴 [REAL] Error details:');
      console.error('Message:', error.message);
      console.error('Name:', error.name);
      
      let errorTitle = 'Linking Failed';
      let errorMessage = error.message || 'Failed to link account';
      
      if (error.message.includes('Invalid Deriv API token')) {
        errorTitle = 'Invalid Deriv Token';
        errorMessage = 'Your Deriv API token is invalid or expired. Please generate a new one from Deriv.com';
      } else if (error.message.includes('Invalid Binance API credentials')) {
        errorTitle = 'Invalid Binance Credentials';
        errorMessage = 'Your Binance API key or secret is incorrect. Please check them in Binance settings.';
      } else if (error.message.includes('MT5') && error.message.includes('invalid')) {
        errorTitle = 'Invalid MT5 Credentials';
        errorMessage = 'Your MT5 login credentials are incorrect. Please check your account number, password, and server.';
      } else if (error.message.includes('MT5') && error.message.includes('connection')) {
        errorTitle = 'MT5 Connection Failed';
        errorMessage = 'Cannot connect to MT5 server. Check your internet connection or try a different server.';
      } else if (error.message.includes('Cannot connect')) {
        errorTitle = 'Connection Error';
        errorMessage = 'Cannot connect to the trading platform. Please check your internet connection.';
      } else if (error.message.includes('rate limit')) {
        errorTitle = 'Rate Limited';
        errorMessage = 'Too many requests. Please wait a minute and try again.';
      } else if (error.message.includes('timeout')) {
        errorTitle = 'Timeout';
        errorMessage = 'The request took too long. The trading platform might be slow. Try again.';
      } else if (error.message.includes('CORS')) {
        errorTitle = 'CORS Error';
        errorMessage = 'Cross-origin request blocked. Please check edge function CORS configuration.';
      } else if (error.message.includes('Phone number and PIN')) {
        errorTitle = 'Server Configuration Error';
        errorMessage = 'Server expecting PIN but using placeholder. Please check server configuration.';
      }
  
      MagicallyAlert.alert(
        errorTitle,
        errorMessage,
        [
          { text: 'OK', style: 'default' },
          {
            text: 'Get Help',
            onPress: () => navigation.navigate('Support'),
            style: 'cancel'
          }
        ]
      );
    } finally {
      setIsLinking(false);
    }
  };

  const tabs = [
    { type: 'mpesa' as AccountType, label: 'M-Pesa', icon: Smartphone, color: '#00B300' },
    { type: 'bank' as AccountType, label: 'Bank', icon: Building2, color: '#0066CC' },
    { type: 'deriv' as AccountType, label: 'Deriv', icon: TrendingUp, color: '#FF6B35' },
    { type: 'binance' as AccountType, label: 'Binance', icon: Globe, color: '#F0B90B' },
    { type: 'mt5' as AccountType, label: 'MT5', icon: BarChart3, color: '#00B894' },
  ];

  const renderTradingForm = () => {
    const platformInfo = TRADING_PLATFORMS_INFO[selectedType];
    
    return (
      <View style={{ gap: 20 }}>
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>
            {platformInfo?.name} Account
          </Text>
          <Text style={{ fontSize: 14, color: theme.textMuted, marginTop: 4 }}>
            {platformInfo?.description}
          </Text>
        </View>

        {selectedType === 'deriv' && (
          <View style={{
            backgroundColor: `${theme.info}15`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 8,
            borderLeftWidth: 4,
            borderLeftColor: theme.info,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <HelpCircle size={16} color={theme.info} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
                Deriv Only Needs API Token
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: theme.textMuted, lineHeight: 18 }}>
              • Deriv uses OAuth tokens, not API key/secret pairs{'\n'}
              • Get token from: Settings → API Token in Deriv{'\n'}
              • Enable "Read" permissions only{'\n'}
              • <Text style={{ fontWeight: '700', color: theme.warning }}>Leave API secret field empty for Deriv</Text>
            </Text>
          </View>
        )}

        {selectedType === 'binance' && (
          <View style={{
            backgroundColor: `${theme.warning}15`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 8,
            borderLeftWidth: 4,
            borderLeftColor: theme.warning,
          }}>
            <Text style={{ fontSize: 13, color: theme.text, fontWeight: '600', marginBottom: 4 }}>
              🔒 Security Best Practices
            </Text>
            <Text style={{ fontSize: 12, color: theme.textMuted, lineHeight: 18 }}>
              • Enable "Read Only" permissions only{'\n'}
              • Restrict API key to trusted IP addresses{'\n'}
              • Do not enable withdrawal permissions{'\n'}
              • Use a strong, unique API secret
            </Text>
          </View>
        )}

        {selectedType === 'mt5' && (
          <View style={{
            backgroundColor: `${theme.success}15`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 8,
            borderLeftWidth: 4,
            borderLeftColor: theme.success,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <BarChart3 size={16} color={theme.success} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
                MT5 Account Setup
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: theme.textMuted, lineHeight: 18 }}>
              • Use your main trading account login/password{'\n'}
              • Find server name in MT5 terminal (right-click account){'\n'}
              • Investor password is optional (read-only access){'\n'}
              • Ensure MT5 terminal is running during linking
            </Text>
          </View>
        )}

        {/* MT5 Specific Fields */}
        {selectedType === 'mt5' && (
          <>
            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textMuted, marginBottom: 8 }}>
                SELECT BROKER *
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8, paddingRight: 10 }}>
                  {MT5_BROKERS.map((broker) => (
                    <Pressable
                      key={broker}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedBroker(broker);
                      }}
                      style={({ pressed }) => ({
                        paddingVertical: 12,
                        paddingHorizontal: 18,
                        borderRadius: 12,
                        backgroundColor: selectedBroker === broker ? theme.primary : theme.cardBackground,
                        borderWidth: 2,
                        borderColor: selectedBroker === broker ? theme.primary : theme.border,
                        transform: [{ scale: pressed ? 0.96 : 1 }],
                      })}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: selectedBroker === broker ? theme.primaryForeground : theme.text,
                        }}
                      >
                        {broker}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textMuted, marginBottom: 8 }}>
                ACCOUNT LOGIN NUMBER *
              </Text>
              <TextInput
                value={mt5Login}
                onChangeText={setMt5Login}
                placeholder="Enter MT5 account number (e.g., 1234567)"
                placeholderTextColor={theme.textLight}
                keyboardType="number-pad"
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

            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textMuted, marginBottom: 8 }}>
                PASSWORD *
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  value={mt5Password}
                  onChangeText={setMt5Password}
                  placeholder="Enter MT5 trading password"
                  placeholderTextColor={theme.textLight}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={!showPassword}
                  style={{
                    backgroundColor: theme.inputBackground,
                    borderRadius: 14,
                    padding: 16,
                    fontSize: 16,
                    color: theme.text,
                    borderWidth: 1,
                    borderColor: theme.border,
                    paddingRight: 50,
                  }}
                />
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowPassword(!showPassword);
                  }}
                  style={{
                    position: 'absolute',
                    right: 16,
                    top: 16,
                    padding: 4,
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={theme.textMuted} />
                  ) : (
                    <Eye size={20} color={theme.textMuted} />
                  )}
                </Pressable>
              </View>
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textMuted, marginBottom: 8 }}>
                SERVER NAME *
              </Text>
              <TextInput
                value={mt5Server}
                onChangeText={setMt5Server}
                placeholder="Enter MT5 server (e.g., ICMarkets-Demo, Exness-MT5Trial)"
                placeholderTextColor={theme.textLight}
                autoCapitalize="none"
                autoCorrect={false}
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
                Find this in MT5 terminal: Right-click account → Properties → Details
              </Text>
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textMuted, marginBottom: 8 }}>
                INVESTOR PASSWORD (OPTIONAL)
              </Text>
              <TextInput
                value={mt5InvestorPassword}
                onChangeText={setMt5InvestorPassword}
                placeholder="Enter investor password for read-only access"
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
              <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>
                Allows read-only access without trading permissions
              </Text>
            </View>
          </>
        )}

        {/* API Key Field (for non-MT5 platforms) */}
        {selectedType !== 'mt5' && (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textMuted }}>
                API {selectedType === 'deriv' ? 'TOKEN' : 'KEY'} *
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate('WebView', { 
                    url: platformInfo?.setupGuide,
                    title: `${platformInfo?.name} API Setup`
                  });
                }}
              >
                <Text style={{ fontSize: 12, color: theme.primary, fontWeight: '500' }}>
                  Need help?
                </Text>
              </Pressable>
            </View>
            <TextInput
              value={apiKey}
              onChangeText={setApiKey}
              placeholder={selectedType === 'deriv' ? 'Enter your Deriv API token' : `Enter your ${platformInfo?.name} API key`}
              placeholderTextColor={theme.textLight}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
              style={{
                backgroundColor: theme.inputBackground,
                borderRadius: 14,
                padding: 16,
                fontSize: 16,
                color: theme.text,
                borderWidth: 1,
                borderColor: theme.border,
                fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
              }}
            />
          </View>
        )}

        {/* API Secret Field (only for Binance) */}
        {selectedType === 'binance' && (
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textMuted, marginBottom: 8 }}>
              API SECRET *
            </Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                value={apiSecret}
                onChangeText={setApiSecret}
                placeholder={`Enter your ${platformInfo?.name} API secret`}
                placeholderTextColor={theme.textLight}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                spellCheck={false}
                secureTextEntry={!showApiSecret}
                style={{
                  backgroundColor: theme.inputBackground,
                  borderRadius: 14,
                  padding: 16,
                  fontSize: 16,
                  color: theme.text,
                  borderWidth: 1,
                  borderColor: theme.border,
                  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                  paddingRight: 50,
                }}
              />
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowApiSecret(!showApiSecret);
                }}
                style={{
                  position: 'absolute',
                  right: 16,
                  top: 16,
                  padding: 4,
                }}
              >
                {showApiSecret ? (
                  <EyeOff size={20} color={theme.textMuted} />
                ) : (
                  <Eye size={20} color={theme.textMuted} />
                )}
              </Pressable>
            </View>
            <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>
              Your API secret is encrypted and securely stored
            </Text>
          </View>
        )}

        {/* Passphrase Field (for Binance) */}
        {selectedType === 'binance' && (
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textMuted, marginBottom: 8 }}>
              PASSPHRASE (OPTIONAL)
            </Text>
            <TextInput
              value={passphrase}
              onChangeText={setPassphrase}
              placeholder="Enter API passphrase if required"
              placeholderTextColor={theme.textLight}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
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
            <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>
              Only required if you set a passphrase when creating API key
            </Text>
          </View>
        )}

        {/* Account ID Field (for non-MT5 platforms) */}
        {selectedType !== 'mt5' && selectedType !== 'mpesa' && selectedType !== 'bank' && (
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textMuted, marginBottom: 8 }}>
              ACCOUNT ID (OPTIONAL)
            </Text>
            <TextInput
              value={accountId}
              onChangeText={setAccountId}
              placeholder={`Enter your ${platformInfo?.name} account ID`}
              placeholderTextColor={theme.textLight}
              autoCapitalize="none"
              autoCorrect={false}
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
              Required for platforms with multiple accounts
            </Text>
          </View>
        )}

        {/* Manual Verification Notice */}
        {(selectedType === 'etoro' || selectedType === 'interactive_brokers') && (
          <View style={{
            backgroundColor: `${theme.secondary}15`,
            borderRadius: 12,
            padding: 16,
            marginTop: 8,
            borderWidth: 1,
            borderColor: `${theme.secondary}30`,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <AlertCircle size={16} color={theme.secondary} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
                Manual Verification Required
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: theme.textMuted, lineHeight: 18 }}>
              Due to platform restrictions, {platformInfo?.name} accounts require manual verification. 
              Our support team will contact you within 24 hours to complete the setup.
            </Text>
          </View>
        )}
      </View>
    );
  };

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
            Secure M-Pesa Linking
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: theme.textMuted, lineHeight: 18 }}>
          • <Text style={{ fontWeight: '700', color: theme.success }}>No real PIN required</Text> for basic verification{'\n'}
          • Enable balance access for future real-time updates{'\n'}
          • All data is encrypted and secure{'\n'}
          • Placeholder PIN used for API compatibility
        </Text>
      </View>

      <View>
        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textMuted, marginBottom: 8 }}>
          M-PESA PHONE NUMBER *
        </Text>
        <TextInput
          value={mpesaPhone}
          onChangeText={setMpesaPhone}
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
      </View>

      {/* Placeholder PIN Notice */}
      <View style={{
        backgroundColor: `${theme.warning}10`,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: `${theme.warning}20`,
      }}>
        <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: 'center', lineHeight: 16 }}>
          ⚠️ Using placeholder PIN (0000) for API compatibility.{'\n'}
          No real PIN is stored or transmitted for basic verification.
        </Text>
      </View>

      {/* Balance Access Toggle */}
      <View style={{
        backgroundColor: theme.cardBackground,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.border,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 4 }}>
              Enable Balance Access Feature
            </Text>
            <Text style={{ fontSize: 12, color: theme.textMuted }}>
              Prepare for future real-time balance updates
            </Text>
          </View>
          <Switch
            value={enableBalanceAccess}
            onValueChange={setEnableBalanceAccess}
            trackColor={{ false: theme.muted, true: theme.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
        
        {enableBalanceAccess && (
          <View style={{ marginTop: 12, padding: 12, backgroundColor: `${theme.success}10`, borderRadius: 8 }}>
            <Text style={{ fontSize: 12, color: theme.textMuted, lineHeight: 18 }}>
              ✓ Ready for real-time balance updates (future){'\n'}
              ✓ Will activate when API is configured{'\n'}
              ✓ Contact support to enable live features{'\n'}
              ⚠️ Requires Safaricom Daraja API access
            </Text>
          </View>
        )}
      </View>

      {/* Feature Notice */}
      {enableBalanceAccess && (
        <View style={{
          backgroundColor: `${theme.warning}15`,
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: `${theme.warning}30`,
        }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 }}>
            Future Feature - Not Active Yet
          </Text>
          <Text style={{ fontSize: 11, color: theme.textMuted, lineHeight: 16 }}>
            Balance access requires Safaricom Daraja API business access. 
            For now, account will be linked with basic verification. 
            Contact support to enable real balance access when available.
          </Text>
        </View>
      )}
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
              All credentials are encrypted and never stored in plain text. Trading platforms require valid credentials with appropriate permissions.
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

          {selectedType === 'bank' && (
            <View style={{ gap: 20 }}>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textMuted, marginBottom: 8 }}>
                  SELECT BANK *
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8, paddingRight: 10 }}>
                    {BANKS.map((bank) => (
                      <Pressable
                        key={bank}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedBank(bank);
                        }}
                        style={({ pressed }) => ({
                          paddingVertical: 12,
                          paddingHorizontal: 18,
                          borderRadius: 12,
                          backgroundColor: selectedBank === bank ? theme.primary : theme.cardBackground,
                          borderWidth: 2,
                          borderColor: selectedBank === bank ? theme.primary : theme.border,
                          transform: [{ scale: pressed ? 0.96 : 1 }],
                        })}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: selectedBank === bank ? theme.primaryForeground : theme.text,
                          }}
                        >
                          {bank}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textMuted, marginBottom: 8 }}>
                  ACCOUNT NUMBER *
                </Text>
                <TextInput
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  placeholder="Enter account number"
                  placeholderTextColor={theme.textLight}
                  keyboardType="number-pad"
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

              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textMuted, marginBottom: 8 }}>
                  ACCOUNT HOLDER NAME *
                </Text>
                <TextInput
                  value={accountName}
                  onChangeText={setAccountName}
                  placeholder="Enter account holder name"
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

              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textMuted, marginBottom: 8 }}>
                  ROUTING NUMBER (OPTIONAL)
                </Text>
                <TextInput
                  value={routingNumber}
                  onChangeText={setRoutingNumber}
                  placeholder="Enter routing/swift code"
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
            </View>
          )}

          {/* Trading Form for all trading platforms */}
          {['deriv', 'binance', 'mt5', 'etoro', 'interactive_brokers'].includes(selectedType) && renderTradingForm()}

          {/* Link Account Button */}
          <Pressable
            onPress={handleLinkAccount}
            disabled={isLinking}
            style={({ pressed }) => ({
              backgroundColor: isLinking ? theme.muted : theme.primary,
              borderRadius: 16,
              padding: 18,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              marginTop: 32,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: pressed ? 0.2 : 0.3,
              shadowRadius: 6,
              elevation: pressed ? 2 : 4,
              transform: [{ scale: pressed && !isLinking ? 0.98 : 1 }],
            })}
          >
            {isLinking ? (
              <>
                <AnimatedSpinner size={20} color={theme.primaryForeground} />
                <Text style={{ color: theme.primaryForeground, fontSize: 17, fontWeight: '700' }}>
                  Linking Account...
                </Text>
              </>
            ) : (
              <Text style={{ color: theme.primaryForeground, fontSize: 17, fontWeight: '700' }}>
                Link Account
              </Text>
            )}
          </Pressable>

          {/* Help Link for Trading Platforms */}
          {['deriv', 'binance', 'mt5', 'etoro', 'interactive_brokers'].includes(selectedType) && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const platformInfo = TRADING_PLATFORMS_INFO[selectedType];
                navigation.navigate('WebView', { 
                  url: platformInfo.setupGuide,
                  title: `${platformInfo.name} Setup Guide`
                });
              }}
              style={({ pressed }) => ({
                padding: 16,
                alignItems: 'center',
                marginTop: 20,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Key size={16} color={theme.primary} />
                <Text style={{ color: theme.primary, fontSize: 14, fontWeight: '600' }}>
                  View Setup Guide
                </Text>
              </View>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
};