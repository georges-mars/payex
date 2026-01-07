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
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [recipientAccountId, setRecipientAccountId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter out the currently selected sender account from recipient list
  const recipientAccounts = accounts.filter(account => account._id !== selectedAccountId);

  useEffect(() => {
    const defaultAccount = accounts.find(acc => acc.isDefault) || accounts[0];
    if (defaultAccount) {
      setSelectedAccountId(defaultAccount._id);
    }
    
    // Auto-select first available recipient if exists
    if (recipientAccounts.length > 0 && !recipientAccountId) {
      setRecipientAccountId(recipientAccounts[0]._id);
    }
  }, [accounts, selectedAccountId]);

  const selectedAccount = accounts.find(acc => acc._id === selectedAccountId);
  const selectedRecipient = accounts.find(acc => acc._id === recipientAccountId);

  // Filter recipient accounts based on search
  const filteredRecipients = recipientAccounts.filter(account =>
    account.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.accountType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.currency.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectRecipient = (accountId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRecipientAccountId(accountId);
    setShowRecipientDropdown(false);
    setSearchQuery('');
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
    if (!recipientAccountId) {
      MagicallyAlert.alert('Missing Information', 'Please select a recipient account');
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      MagicallyAlert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (!selectedAccount) {
      MagicallyAlert.alert('No Account Selected', 'Please select an account to send from');
      return;
    }

    if (!selectedRecipient) {
      MagicallyAlert.alert('Invalid Recipient', 'Selected recipient account not found');
      return;
    }

    // Check if recipient is same as sender
    if (selectedAccount._id === selectedRecipient._id) {
      MagicallyAlert.alert('Invalid Transfer', 'Cannot send money to the same account');
      return;
    }

    // Platform compatibility check (you might want to restrict some transfers)
    const incompatiblePlatforms = [
      { from: 'mpesa', to: ['deriv', 'binance', 'mt5', 'etoro', 'interactive_brokers'] },
      { from: 'bank', to: ['deriv', 'binance', 'mt5', 'etoro', 'interactive_brokers'] },
      { from: 'deriv', to: ['mpesa', 'bank'] },
      { from: 'binance', to: ['mpesa', 'bank'] },
      { from: 'mt5', to: ['mpesa', 'bank'] },
    ];

    const incompatible = incompatiblePlatforms.find(
      rule => rule.from === selectedAccount.accountType && 
      rule.to.includes(selectedRecipient.accountType)
    );

    if (incompatible) {
      MagicallyAlert.alert(
        'Transfer Not Supported',
        `Direct transfers from ${getAccountTypeLabel(selectedAccount.accountType)} to ${getAccountTypeLabel(selectedRecipient.accountType)} are not supported. Please use an intermediate account.`
      );
      return;
    }

    if (amountNum > selectedAccount.balance) {
      MagicallyAlert.alert('Insufficient Balance', `Your ${selectedAccount.accountName} balance is ${selectedAccount.currency} ${selectedAccount.balance.toLocaleString()}`);
      return;
    }

    // Check if currency conversion is needed
    const needsCurrencyConversion = selectedAccount.currency !== selectedRecipient.currency;
    if (needsCurrencyConversion) {
      const confirm = await MagicallyAlert.confirm(
        'Currency Conversion Required',
        `You're sending ${selectedAccount.currency} ${amountNum.toLocaleString()} to an account in ${selectedRecipient.currency}. The amount will be converted at current exchange rates. Continue?`,
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
        
        const rateKey = `${selectedAccount.currency}_${selectedRecipient.currency}`;
        conversionRate = rates[rateKey] || 1;
        convertedAmount = amountNum * conversionRate;
        
        notes = `Converted at rate: 1 ${selectedAccount.currency} = ${conversionRate.toFixed(6)} ${selectedRecipient.currency}`;
      }

      // Create transaction record
      const newTransaction = await Transactions.create({
        transactionType: 'send',
        amount: amountNum,
        convertedAmount: needsCurrencyConversion ? convertedAmount : undefined,
        currency: selectedAccount.currency,
        targetCurrency: selectedRecipient.currency,
        conversionRate: needsCurrencyConversion ? conversionRate : undefined,
        status: 'completed',
        recipientName: selectedRecipient.accountName,
        recipientAccountId: selectedRecipient._id,
        recipientAccountType: selectedRecipient.accountType,
        accountId: selectedAccount._id,
        accountName: selectedAccount.accountName,
        description: `${description.trim() || 'Transfer'}${notes ? ` | ${notes}` : ''}`,
        transactionDate: new Date().toISOString(),
        reference: `TXN-${selectedAccount.accountType.toUpperCase()}-TO-${selectedRecipient.accountType.toUpperCase()}-${Date.now()}`,
      });

      // Update both accounts in store (simplified - in real app this would be handled by backend)
      // This is just for UI updates
      setTransactions([newTransaction, ...transactions]);

      MagicallyAlert.alert(
        'Transfer Successful!',
        `${selectedAccount.currency} ${amountNum.toLocaleString()} sent to ${selectedRecipient.accountName}${needsCurrencyConversion ? ` (≈ ${selectedRecipient.currency} ${convertedAmount.toFixed(2)})` : ''}`,
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

  const RecipientDropdown = () => (
    <Modal
      visible={showRecipientDropdown}
      transparent
      animationType="fade"
      onRequestClose={() => setShowRecipientDropdown(false)}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={() => setShowRecipientDropdown(false)}
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
              Select Account to Send To
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
            
            {/* Recipients Count */}
            <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 12 }}>
              {filteredRecipients.length} connected account{filteredRecipients.length !== 1 ? 's' : ''} available
            </Text>
            
            {/* Accounts List */}
            <FlatList
              data={filteredRecipients}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 350 }}
              renderItem={({ item: account }) => {
                const IconComponent = getAccountIcon(account.accountType);
                const iconColor = getAccountColor(account.accountType);
                const isSelected = account._id === recipientAccountId;

                return (
                  <Pressable
                    onPress={() => handleSelectRecipient(account._id)}
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
                    {searchQuery ? 'No accounts found' : 'No other accounts available'}
                  </Text>
                  {!searchQuery && (
                    <Text style={{ color: theme.textLight, textAlign: 'center', marginTop: 6, fontSize: 13 }}>
                      Link more accounts to send money between them
                    </Text>
                  )}
                </View>
              }
            />
          </View>
          
          {/* Close Button */}
          <Pressable
            onPress={() => setShowRecipientDropdown(false)}
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
              FROM ACCOUNT
            </Text>
            <View style={{ gap: 10 }}>
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
                accounts.map((account) => {
                  const IconComponent = getAccountIcon(account.accountType);
                  const iconColor = getAccountColor(account.accountType);
                  const isSelected = account._id === selectedAccountId;

                  return (
                    <Pressable
                      key={account._id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedAccountId(account._id);
                      }}
                      style={({ pressed }) => ({
                        backgroundColor: theme.cardBackground,
                        borderRadius: 16,
                        padding: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 2,
                        borderColor: isSelected ? theme.primary : theme.borderLight,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                      })}
                    >
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
                        <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 2 }}>
                          {account.accountName}
                        </Text>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: theme.primary }}>
                          {account.currency} {account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Text>
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
                    </Pressable>
                  );
                })
              )}
            </View>
          </View>

          {/* Recipient Account Section */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textMuted }}>
                TO ACCOUNT *
              </Text>
              <Text style={{ fontSize: 12, color: theme.textMuted }}>
                {recipientAccounts.length} available
              </Text>
            </View>
            
            {recipientAccounts.length === 0 ? (
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
                  No other accounts available
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
                    setShowRecipientDropdown(true);
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
                  {selectedRecipient ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          backgroundColor: `${getAccountColor(selectedRecipient.accountType)}15`,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        {React.createElement(getAccountIcon(selectedRecipient.accountType), {
                          size: 24,
                          color: getAccountColor(selectedRecipient.accountType),
                          strokeWidth: 2
                        })}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 2 }}>
                          {selectedRecipient.accountName}
                        </Text>
                        <Text style={{ fontSize: 13, color: theme.textMuted }}>
                          {getAccountTypeLabel(selectedRecipient.accountType)} • {selectedRecipient.currency}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 16, color: theme.textLight, flex: 1 }}>
                      Select recipient account...
                    </Text>
                  )}
                  <ChevronDown size={20} color={theme.textMuted} />
                </Pressable>
                
                {/* Quick recipient selection */}
                {recipientAccounts.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, marginBottom: 8 }}>
                      QUICK SELECT
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {recipientAccounts.slice(0, 4).map((account) => {
                          const IconComponent = getAccountIcon(account.accountType);
                          const iconColor = getAccountColor(account.accountType);
                          
                          return (
                            <Pressable
                              key={account._id}
                              onPress={() => handleSelectRecipient(account._id)}
                              style={({ pressed }) => ({
                                backgroundColor: pressed ? theme.muted : theme.cardBackground,
                                padding: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: recipientAccountId === account._id ? theme.primary : theme.border,
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
                                  fontWeight: recipientAccountId === account._id ? '600' : '400'
                                }}
                                numberOfLines={1}
                              >
                                {account.accountName}
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
              AMOUNT ({selectedAccount?.currency || 'KES'}) *
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
            {selectedAccount && selectedRecipient && selectedAccount.currency !== selectedRecipient.currency && (
              <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: theme.warning, marginRight: 6 }}>⚠️</Text>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>
                  Currency conversion required ({selectedAccount.currency} → {selectedRecipient.currency})
                </Text>
              </View>
            )}
            {selectedAccount && (
              <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 8 }}>
                Available: {selectedAccount.currency} {selectedAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
            disabled={isSending || accounts.length === 0 || !recipientAccountId || recipientAccounts.length === 0}
            style={({ pressed }) => ({
              backgroundColor: isSending || accounts.length === 0 || !recipientAccountId || recipientAccounts.length === 0 ? theme.muted : theme.primary,
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
                  {selectedAccount && selectedRecipient 
                    ? `Send from ${selectedAccount.accountName} to ${selectedRecipient.accountName}`
                    : 'Send Money'
                  }
                </Text>
              </>
            )}
          </Pressable>

          {/* Transfer Info Note */}
          {selectedAccount && selectedRecipient && (
            <View style={{
              marginTop: 20,
              backgroundColor: `${theme.secondary}10`,
              borderRadius: 12,
              padding: 16,
              borderLeftWidth: 3,
              borderLeftColor: theme.secondary,
            }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 4 }}>
                Transfer Information
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>From:</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>{selectedAccount.accountName}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>To:</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>{selectedRecipient.accountName}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>Type:</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>
                  {getAccountTypeLabel(selectedAccount.accountType)} → {getAccountTypeLabel(selectedRecipient.accountType)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Recipient Dropdown Modal */}
      <RecipientDropdown />
    </View>
  );
};