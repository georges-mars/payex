import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { ArrowUpRight, ArrowDownLeft, Filter, CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { usePayvexStore } from '../stores/payvexStore';
import { Transactions, Transaction } from '../magically/entities/Transaction';
import { Skeleton, Logo } from '../components/ui';
import { MagicallyAlert } from '../components/ui/MagicallyAlert';

type FilterType = 'all' | 'send' | 'receive' | 'deposit' | 'withdrawal';
type StatusFilter = 'all' | 'completed' | 'pending' | 'failed';

export const TransactionsScreen = () => {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const {
    transactions,
    isLoadingTransactions,
    setTransactions,
    setIsLoadingTransactions,
  } = usePayvexStore();

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setIsLoadingTransactions(true);
      const result = await Transactions.query({}, { sort: { transactionDate: -1 }, limit: 50 });
      setTransactions(result.data);
    } catch (error) {
      console.error('Error loading transactions:', error);
      MagicallyAlert.alert('Error', 'Failed to load transactions. Please try again.');
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const handleFilterChange = (type: FilterType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFilter(type);
  };

  const handleStatusFilterChange = (status: StatusFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedStatus(status);
  };

  const handleTransactionPress = (transaction: Transaction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isReceive = transaction.transactionType === 'receive' || transaction.transactionType === 'deposit';
    
    MagicallyAlert.alert(
      'Transaction Details',
      `Type: ${transaction.transactionType.toUpperCase()}\n` +
      `Amount: ${transaction.currency} ${transaction.amount.toLocaleString()}\n` +
      `${isReceive ? 'From' : 'To'}: ${transaction.senderName || transaction.recipientName || 'N/A'}\n` +
      `Account: ${transaction.accountName}\n` +
      `Status: ${transaction.status.toUpperCase()}\n` +
      `Reference: ${transaction.reference || 'N/A'}\n` +
      `Date: ${new Date(transaction.transactionDate).toLocaleString()}\n` +
      `${transaction.description ? `Note: ${transaction.description}` : ''}`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      case 'cancelled': return theme.textMuted;
      default: return theme.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle2;
      case 'pending': return Clock;
      case 'failed': return AlertCircle;
      case 'cancelled': return XCircle;
      default: return Clock;
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const typeMatch = selectedFilter === 'all' || transaction.transactionType === selectedFilter;
    const statusMatch = selectedStatus === 'all' || transaction.status === selectedStatus;
    return typeMatch && statusMatch;
  });

  const filters: { type: FilterType; label: string }[] = [
    { type: 'all', label: 'All' },
    { type: 'send', label: 'Sent' },
    { type: 'receive', label: 'Received' },
    { type: 'deposit', label: 'Deposits' },
    { type: 'withdrawal', label: 'Withdrawals' },
  ];

  const statusFilters: { status: StatusFilter; label: string }[] = [
    { status: 'all', label: 'All Status' },
    { status: 'completed', label: 'Completed' },
    { status: 'pending', label: 'Pending' },
    { status: 'failed', label: 'Failed' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={{ padding: 24, paddingTop: 16 }}>
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Filter size={18} color={theme.textMuted} strokeWidth={2} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textMuted }}>
                TRANSACTION TYPE
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {filters.map((filter) => (
                  <Pressable
                    key={filter.type}
                    onPress={() => handleFilterChange(filter.type)}
                    style={({ pressed }) => ({
                      paddingVertical: 10,
                      paddingHorizontal: 18,
                      borderRadius: 12,
                      backgroundColor: selectedFilter === filter.type ? theme.primary : theme.cardBackground,
                      borderWidth: 1,
                      borderColor: selectedFilter === filter.type ? theme.primary : theme.border,
                      transform: [{ scale: pressed ? 0.96 : 1 }],
                    })}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: selectedFilter === filter.type ? theme.primaryForeground : theme.text,
                      }}
                    >
                      {filter.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={{ marginBottom: 24 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {statusFilters.map((filter) => (
                  <Pressable
                    key={filter.status}
                    onPress={() => handleStatusFilterChange(filter.status)}
                    style={({ pressed }) => ({
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 10,
                      backgroundColor: selectedStatus === filter.status ? `${theme.secondary}20` : theme.cardBackground,
                      borderWidth: 1,
                      borderColor: selectedStatus === filter.status ? theme.secondary : theme.borderLight,
                      transform: [{ scale: pressed ? 0.96 : 1 }],
                    })}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: selectedStatus === filter.status ? theme.secondary : theme.textMuted,
                      }}
                    >
                      {filter.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <Text style={{ fontSize: 22, fontWeight: '700', color: theme.text, marginBottom: 18 }}>
            Transaction History
          </Text>

          {isLoadingTransactions ? (
            <View style={{ gap: 12 }}>
              <Skeleton width="100%" height={90} borderRadius={18} />
              <Skeleton width="100%" height={90} borderRadius={18} />
              <Skeleton width="100%" height={90} borderRadius={18} />
              <Skeleton width="100%" height={90} borderRadius={18} />
            </View>
          ) : filteredTransactions.length === 0 ? (
            <View style={{ padding: 48, alignItems: 'center' }}>
              <Logo size={80} withShadow style={{ marginBottom: 20 }} />
              <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 8, textAlign: 'center' }}>
                No Transactions Found
              </Text>
              <Text style={{ fontSize: 14, color: theme.textMuted, textAlign: 'center', lineHeight: 20 }}>
                {selectedFilter !== 'all' || selectedStatus !== 'all'
                  ? 'Try adjusting your filters to see more results'
                  : 'Your transaction history will appear here'}
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {filteredTransactions.map((transaction) => {
                const StatusIcon = getStatusIcon(transaction.status);
                const statusColor = getStatusColor(transaction.status);
                const isReceive = transaction.transactionType === 'receive' || transaction.transactionType === 'deposit';
                const displayName = transaction.recipientName || transaction.senderName || transaction.description || 'Transaction';

                return (
                  <Pressable
                    key={transaction._id}
                    onPress={() => handleTransactionPress(transaction)}
                    style={({ pressed }) => ({
                      backgroundColor: theme.cardBackground,
                      borderRadius: 18,
                      padding: 18,
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
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 14,
                          backgroundColor: isReceive ? '#10B98115' : '#00D4FF15',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 14,
                        }}
                      >
                        {isReceive ? (
                          <ArrowDownLeft size={24} color="#10B981" strokeWidth={2.5} />
                        ) : (
                          <ArrowUpRight size={24} color="#00D4FF" strokeWidth={2.5} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 4 }}>
                          {displayName}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Text style={{ fontSize: 13, color: theme.textMuted }}>
                            {transaction.accountName}
                          </Text>
                          <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: theme.border }} />
                          <Text style={{ fontSize: 13, color: theme.textMuted, textTransform: 'capitalize' }}>
                            {transaction.transactionType}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 12, color: theme.textLight }}>
                          {new Date(transaction.transactionDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text
                          style={{
                            fontSize: 18,
                            fontWeight: '700',
                            color: isReceive ? '#10B981' : theme.text,
                            marginBottom: 6,
                          }}
                        >
                          {isReceive ? '+' : '-'}{transaction.currency} {transaction.amount.toLocaleString()}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <StatusIcon size={14} color={statusColor} strokeWidth={2.5} />
                          <Text style={{ fontSize: 12, color: statusColor, fontWeight: '600', textTransform: 'capitalize' }}>
                            {transaction.status}
                          </Text>
                        </View>
                      </View>
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
