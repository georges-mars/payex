import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, FlatList } from 'react-native';
import { ArrowLeft, Send, Wallet, TrendingUp, Search, ChevronDown, User, Smartphone, Building2, Globe, BarChart3 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { usePayvexStore } from '../stores/payvexStore';
import { Transactions } from '../magically/entities/Transaction';
import { AnimatedSpinner, Logo } from '../components/ui';
import { MagicallyAlert } from '../components/ui/MagicallyAlert';

export const SendMoneyScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const { accounts, setTransactions, transactions } = usePayvexStore();
  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [fromSearchQuery, setFromSearchQuery] = useState('');
  const [toSearchQuery, setToSearchQuery] = useState('');
  
  // Get the selected accounts
  const fromAccount = accounts.find(acc => acc._id === fromAccountId);
  const toAccount = accounts.find(acc => acc._id === toAccountId);
  
  // Filter accounts for dropdowns (exclude the other selected account)
  const fromAccounts = accounts.filter(acc => acc._id !== toAccountId);
  const toAccounts = accounts.filter(acc => acc._id !== fromAccountId);
  
  // Filter based on search queries
  const filteredFromAccounts = fromAccounts.filter(account =>
    account.accountName.toLowerCase().includes(fromSearchQuery.toLowerCase()) ||
    account.accountType.toLowerCase().includes(fromSearchQuery.toLowerCase()) ||
    account.currency.toLowerCase().includes(fromSearchQuery.toLowerCase())
  );
  
  const filteredToAccounts = toAccounts.filter(account =>
    account.accountName.toLowerCase().includes(toSearchQuery.toLowerCase()) ||
    account.accountType.toLowerCase().includes(toSearchQuery.toLowerCase()) ||
    account.currency.toLowerCase().includes(toSearchQuery.toLowerCase())
  );

  useEffect(() => {
    // Auto-select first available accounts if none selected
    if (accounts.length > 0) {
      if (!fromAccountId) {
        setFromAccountId(accounts[0]._id);
      }
      if (!toAccountId && accounts.length > 1) {
        // Don't select same as from account
        const availableToAccount = accounts.find(acc => acc._id !== fromAccountId);
        if (availableToAccount) {
          setToAccountId(availableToAccount._id);
        }
      }
    }
  }, [accounts, fromAccountId]);

  const handleSelectFromAccount = (accountId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFromAccountId(accountId);
    setShowFromDropdown(false);
    setFromSearchQuery('');
    
    // If the selected "From" account is currently selected as "To", clear "To" selection
    if (accountId === toAccountId) {
      setToAccountId('');
    }
  };

  const handleSelectToAccount = (accountId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setToAccountId(accountId);
    setShowToDropdown(false);
    setToSearchQuery('');
    
    // If the selected "To" account is currently selected as "From", clear "From" selection
    if (accountId === fromAccountId) {
      setFromAccountId('');
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'mpesa': return Smartphone;
      case 'bank': return Building2;
      case 'deriv': return TrendingUp;
      case 'binance': return Globe;
      case 'mt5': return BarChart3;
      default: return Wallet;
    }
  };

  const getAccountColor = (type: string) => {
    switch (type) {
      case 'mpesa': return '#00D4FF';
      case 'bank': return theme.primary;
      case 'deriv': return '#FF6B35';
      case 'binance': return '#F0B90B';
      case 'mt5': return '#00B894';
      default: return theme.primary;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'mpesa': return 'M-Pesa';
      case 'bank': return 'Bank Account';
      case 'deriv': return 'Deriv Trading';
      case 'binance': return 'Binance Exchange';
      case 'mt5': return 'MT5 Account';
      case 'etoro': return 'eToro';
      case 'interactive_brokers': return 'Interactive Brokers';
      default: return 'Account';
    }
  };

  const handleSendMoney = async () => {
    if (!fromAccountId || !toAccountId) {
      MagicallyAlert.alert('Missing Information', 'Please select both From and To accounts');
      return;
    }

    if (fromAccountId === toAccountId) {
      MagicallyAlert.alert('Invalid Transfer', 'Cannot send money to the same account');
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      MagicallyAlert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (!fromAccount) {
      MagicallyAlert.alert('No Account Selected', 'Please select an account to send from');
      return;
    }

    if (!toAccount) {
      MagicallyAlert.alert('No Recipient Selected', 'Please select an account to send to');
      return;
    }

    // Platform compatibility check
    const incompatiblePlatforms = [
      { from: 'mpesa', to: ['deriv', 'binance', 'mt5', 'etoro', 'interactive_brokers'] },
      { from: 'bank', to: ['deriv', 'binance', 'mt5', 'etoro', 'interactive_brokers'] },
      { from: 'deriv', to: ['mpesa', 'bank'] },
      { from: 'binance', to: ['mpesa', 'bank'] },
      { from: 'mt5', to: ['mpesa', 'bank'] },
    ];

    const incompatible = incompatiblePlatforms.find(
      rule => rule.from === fromAccount.accountType && 
      rule.to.includes(toAccount.accountType)
    );

    if (incompatible) {
      MagicallyAlert.alert(
        'Transfer Not Supported',
        `Direct transfers from ${getAccountTypeLabel(fromAccount.accountType)} to ${getAccountTypeLabel(toAccount.accountType)} are not supported. Please use an intermediate account.`
      );
      return;
    }

    if (amountNum > fromAccount.balance) {
      MagicallyAlert.alert('Insufficient Balance', `Your ${fromAccount.accountName} balance is ${fromAccount.currency} ${fromAccount.balance.toLocaleString()}`);
      return;
    }

    // Check if currency conversion is needed
    const needsCurrencyConversion = fromAccount.currency !== toAccount.currency;
    if (needsCurrencyConversion) {
      const confirm = await MagicallyAlert.confirm(
        'Currency Conversion Required',
        `You're sending ${fromAccount.currency} ${amountNum.toLocaleString()} to an account in ${toAccount.currency}. The amount will be converted at current exchange rates. Continue?`,
        ['Cancel', 'Continue']
      );
      
      if (!confirm) return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      setIsSending(true);

      // Calculate converted amount if needed
      let convertedAmount = amountNum;
      let conversionRate = 1;
      let notes = '';

      if (needsCurrencyConversion) {
        // In real app, fetch actual conversion rate from API
        // For demo, using fixed rates
        const rates: Record<string, number> = {
          'KES_USD': 0.0062,
          'USD_KES': 161.0,
          'KES_USDT': 0.0062,
          'USD_USDT': 1.0,
          'USDT_USD': 1.0,
        };
        
        const rateKey = `${fromAccount.currency}_${toAccount.currency}`;
        conversionRate = rates[rateKey] || 1;
        convertedAmount = amountNum * conversionRate;
        
        notes = `Converted at rate: 1 ${fromAccount.currency} = ${conversionRate.toFixed(6)} ${toAccount.currency}`;
      }

      // Create transaction record
      const newTransaction = await Transactions.create({
        transactionType: 'send',
        amount: amountNum,
        convertedAmount: needsCurrencyConversion ? convertedAmount : undefined,
        currency: fromAccount.currency,
        targetCurrency: toAccount.currency,
        conversionRate: needsCurrencyConversion ? conversionRate : undefined,
        status: 'completed',
        recipientName: toAccount.accountName,
        recipientAccountId: toAccount._id,
        recipientAccountType: toAccount.accountType,
        accountId: fromAccount._id,
        accountName: fromAccount.accountName,
        description: `${description.trim() || 'Transfer'}${notes ? ` | ${notes}` : ''}`,
        transactionDate: new Date().toISOString(),
        reference: `TXN-${fromAccount.accountType.toUpperCase()}-TO-${toAccount.accountType.toUpperCase()}-${Date.now()}`,
      });

      // Update transactions in store
      setTransactions([newTransaction, ...transactions]);

      MagicallyAlert.alert(
        'Transfer Successful!',
        `${fromAccount.currency} ${amountNum.toLocaleString()} sent to ${toAccount.accountName}${needsCurrencyConversion ? ` (≈ ${toAccount.currency} ${convertedAmount.toFixed(2)})` : ''}`,
        [
          {
            text: 'View Transaction',
            onPress: () => {
              navigation.navigate('TransactionDetails', { transactionId: newTransaction._id });
            },
          },
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error sending money:', error);
      MagicallyAlert.alert('Transfer Failed', 'An error occurred while processing your transfer. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const renderAccountDropdown = (type: 'from' | 'to') => {
    const isFrom = type === 'from';
    const isVisible = isFrom ? showFromDropdown : showToDropdown;
    const accountsList = isFrom ? filteredFromAccounts : filteredToAccounts;
    const searchQuery = isFrom ? fromSearchQuery : toSearchQuery;
    const setSearchQuery = isFrom ? setFromSearchQuery : setToSearchQuery;
    const onSelect = isFrom ? handleSelectFromAccount : handleSelectToAccount;
    const selectedId = isFrom ? fromAccountId : toAccountId;
    const onClose = () => isFrom ? setShowFromDropdown(false) : setShowToDropdown(false);

    return (
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={onClose}
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
                {isFrom ? 'Select Account to Send From' : 'Select Account to Send To'}
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
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search accounts..."
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
                {accountsList.length} account{accountsList.length !== 1 ? 's' : ''} available
              </Text>
              
              {/* Accounts List */}
              <FlatList
                data={accountsList}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 350 }}
                renderItem={({ item: account }) => {
                  const IconComponent = getAccountIcon(account.accountType);
                  const iconColor = getAccountColor(account.accountType);
                  const isSelected = account._id === selectedId;

                  return (
                    <Pressable
                      onPress={() => onSelect(account._id)}
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
                    <User size={48} color={theme.textMuted} />
                    <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 12, fontSize: 15 }}>
                      {searchQuery ? 'No accounts found' : 'No accounts available'}
                    </Text>
                    {!searchQuery && (
                      <Text style={{ color: theme.textLight, textAlign: 'center', marginTop: 6, fontSize: 13 }}>
                        Link more accounts to send money
                      </Text>
                    )}
                  </View>
                }
              />
            </View>
            
            {/* Close Button */}
            <Pressable
              onPress={onClose}
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
  };

  // Quick selection accounts (excluding the other selected account)
  const quickFromAccounts = fromAccounts.slice(0, 4);
  const quickToAccounts = toAccounts.slice(0, 4);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
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
              Send Money
            </Text>
          </View>
          <Logo size={32} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: 24 }}>
          {/* From Account Section */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textMuted, marginBottom: 12 }}>
              FROM ACCOUNT *
            </Text>
            
            {accounts.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ color: theme.textMuted, textAlign: 'center' }}>
                  No accounts available. Please link an account first.
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
                    Link Account
                  </Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowFromDropdown(true);
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
                  {fromAccount ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          backgroundColor: `${getAccountColor(fromAccount.accountType)}15`,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        {React.createElement(getAccountIcon(fromAccount.accountType), {
                          size: 24,
                          color: getAccountColor(fromAccount.accountType),
                          strokeWidth: 2
                        })}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 2 }}>
                          {fromAccount.accountName}
                        </Text>
                        <Text style={{ fontSize: 13, color: theme.textMuted }}>
                          {getAccountTypeLabel(fromAccount.accountType)} • {fromAccount.currency} {fromAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 16, color: theme.textLight, flex: 1 }}>
                      Select account to send from...
                    </Text>
                  )}
                  <ChevronDown size={20} color={theme.textMuted} />
                </Pressable>
                
                {/* Quick From selection */}
                {quickFromAccounts.length > 0 && (
                  <View>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, marginBottom: 8 }}>
                      QUICK SELECT
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {quickFromAccounts.map((account) => {
                          const IconComponent = getAccountIcon(account.accountType);
                          const iconColor = getAccountColor(account.accountType);
                          
                          return (
                            <Pressable
                              key={account._id}
                              onPress={() => handleSelectFromAccount(account._id)}
                              style={({ pressed }) => ({
                                backgroundColor: pressed ? theme.muted : theme.cardBackground,
                                padding: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: fromAccountId === account._id ? theme.primary : theme.border,
                                alignItems: 'center',
                                minWidth: 100,
                                transform: [{ scale: pressed ? 0.95 : 1 }],
                              })}
                            >
                              <View
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 9,
                                  backgroundColor: `${iconColor}15`,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginBottom: 8,
                                }}
                              >
                                <IconComponent size={18} color={iconColor} strokeWidth={2} />
                              </View>
                              <Text 
                                style={{ 
                                  fontSize: 11, 
                                  color: theme.text,
                                  textAlign: 'center',
                                  fontWeight: fromAccountId === account._id ? '600' : '400'
                                }}
                                numberOfLines={1}
                              >
                                {account.accountName}
                              </Text>
                              <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 4 }}>
                                {account.currency}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                )}
              </>
            )}
          </View>

          {/* To Account Section */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textMuted }}>
                TO ACCOUNT *
              </Text>
              <Text style={{ fontSize: 12, color: theme.textMuted }}>
                {toAccounts.length} available
              </Text>
            </View>
            
            {accounts.length < 2 ? (
              <View style={{
                backgroundColor: theme.cardBackground,
                borderRadius: 14,
                padding: 24,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: theme.border,
                borderStyle: 'dashed',
              }}>
                <User size={32} color={theme.textMuted} />
                <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 12, fontSize: 15 }}>
                  {accounts.length === 0 ? 'No accounts available' : 'Only one account available'}
                </Text>
                <Text style={{ color: theme.textLight, textAlign: 'center', marginTop: 6, fontSize: 13 }}>
                  Link more accounts to send money between them
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
                    Link Another Account
                  </Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowToDropdown(true);
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
                  {toAccount ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          backgroundColor: `${getAccountColor(toAccount.accountType)}15`,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        {React.createElement(getAccountIcon(toAccount.accountType), {
                          size: 24,
                          color: getAccountColor(toAccount.accountType),
                          strokeWidth: 2
                        })}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 2 }}>
                          {toAccount.accountName}
                        </Text>
                        <Text style={{ fontSize: 13, color: theme.textMuted }}>
                          {getAccountTypeLabel(toAccount.accountType)} • {toAccount.currency} {toAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 16, color: theme.textLight, flex: 1 }}>
                      Select account to send to...
                    </Text>
                  )}
                  <ChevronDown size={20} color={theme.textMuted} />
                </Pressable>
                
                {/* Quick To selection */}
                {quickToAccounts.length > 0 && (
                  <View>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, marginBottom: 8 }}>
                      QUICK SELECT
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {quickToAccounts.map((account) => {
                          const IconComponent = getAccountIcon(account.accountType);
                          const iconColor = getAccountColor(account.accountType);
                          
                          return (
                            <Pressable
                              key={account._id}
                              onPress={() => handleSelectToAccount(account._id)}
                              style={({ pressed }) => ({
                                backgroundColor: pressed ? theme.muted : theme.cardBackground,
                                padding: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: toAccountId === account._id ? theme.primary : theme.border,
                                alignItems: 'center',
                                minWidth: 100,
                                transform: [{ scale: pressed ? 0.95 : 1 }],
                              })}
                            >
                              <View
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 9,
                                  backgroundColor: `${iconColor}15`,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginBottom: 8,
                                }}
                              >
                                <IconComponent size={18} color={iconColor} strokeWidth={2} />
                              </View>
                              <Text 
                                style={{ 
                                  fontSize: 11, 
                                  color: theme.text,
                                  textAlign: 'center',
                                  fontWeight: toAccountId === account._id ? '600' : '400'
                                }}
                                numberOfLines={1}
                              >
                                {account.accountName}
                              </Text>
                              <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 4 }}>
                                {account.currency}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Amount Section */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textMuted, marginBottom: 8 }}>
              AMOUNT ({fromAccount?.currency || 'KES'}) *
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={theme.textLight}
              keyboardType="decimal-pad"
              style={{
                backgroundColor: theme.inputBackground,
                borderRadius: 14,
                padding: 16,
                fontSize: 24,
                fontWeight: '700',
                color: theme.text,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            />
            {fromAccount && toAccount && fromAccount.currency !== toAccount.currency && (
              <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: theme.warning, marginRight: 6 }}>⚠️</Text>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>
                  Currency conversion required ({fromAccount.currency} → {toAccount.currency})
                </Text>
              </View>
            )}
            {fromAccount && (
              <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 8 }}>
                Available: {fromAccount.currency} {fromAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            )}
          </View>

          {/* Description Section */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textMuted, marginBottom: 8 }}>
              DESCRIPTION (OPTIONAL)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add a note about this transfer..."
              placeholderTextColor={theme.textLight}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: theme.inputBackground,
                borderRadius: 14,
                padding: 16,
                fontSize: 15,
                color: theme.text,
                borderWidth: 1,
                borderColor: theme.border,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
            />
          </View>

          {/* Send Button */}
          <Pressable
            onPress={handleSendMoney}
            disabled={isSending || accounts.length < 2 || !fromAccountId || !toAccountId}
            style={({ pressed }) => ({
              backgroundColor: isSending || accounts.length < 2 || !fromAccountId || !toAccountId ? theme.muted : theme.primary,
              borderRadius: 16,
              padding: 18,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              transform: [{ scale: pressed && !isSending ? 0.98 : 1 }],
            })}
          >
            {isSending ? (
              <>
                <AnimatedSpinner size={20} color={theme.primaryForeground} />
                <Text style={{ color: theme.primaryForeground, fontSize: 17, fontWeight: '600' }}>
                  Processing Transfer...
                </Text>
              </>
            ) : (
              <>
                <Send size={20} color={theme.primaryForeground} strokeWidth={2.5} />
                <Text style={{ color: theme.primaryForeground, fontSize: 17, fontWeight: '600' }}>
                  {fromAccount && toAccount 
                    ? `Send from ${fromAccount.accountName} to ${toAccount.accountName}`
                    : 'Send Money'
                  }
                </Text>
              </>
            )}
          </Pressable>

          {/* Transfer Info Note */}
          {fromAccount && toAccount && (
            <View style={{
              marginTop: 20,
              backgroundColor: `${theme.secondary}10`,
              borderRadius: 12,
              padding: 16,
              borderLeftWidth: 3,
              borderLeftColor: theme.secondary,
            }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                Transfer Information
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>From:</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>{fromAccount.accountName}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>To:</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>{toAccount.accountName}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>Type:</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>
                  {getAccountTypeLabel(fromAccount.accountType)} → {getAccountTypeLabel(toAccount.accountType)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>Currencies:</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>
                  {fromAccount.currency} → {toAccount.currency}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Dropdown Modals */}
      {renderAccountDropdown('from')}
      {renderAccountDropdown('to')}
    </View>
  );
};