import { create } from 'zustand';
import { LinkedAccount } from '../magically/entities/LinkedAccount';
import { Transaction } from '../magically/entities/Transaction';

interface PayvexState {
  accounts: LinkedAccount[];
  transactions: Transaction[];
  isLoadingAccounts: boolean;
  isLoadingTransactions: boolean;
  selectedAccount: LinkedAccount | null;
  
  setAccounts: (accounts: LinkedAccount[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setIsLoadingAccounts: (loading: boolean) => void;
  setIsLoadingTransactions: (loading: boolean) => void;
  setSelectedAccount: (account: LinkedAccount | null) => void;
  
  getTotalBalance: () => number;
  getRecentTransactions: (limit?: number) => Transaction[];
}

export const usePayvexStore = create<PayvexState>((set, get) => ({
  accounts: [],
  transactions: [],
  isLoadingAccounts: false,
  isLoadingTransactions: false,
  selectedAccount: null,
  
  setAccounts: (accounts) => set({ accounts }),
  setTransactions: (transactions) => set({ transactions }),
  setIsLoadingAccounts: (loading) => set({ isLoadingAccounts: loading }),
  setIsLoadingTransactions: (loading) => set({ isLoadingTransactions: loading }),
  setSelectedAccount: (account) => set({ selectedAccount: account }),
  
  getTotalBalance: () => {
    const { accounts } = get();
    return accounts.reduce((sum, acc) => {
      // Convert USD to KES (approximate rate: 1 USD = 130 KES)
      const converted = acc.currency === 'USD' ? acc.balance * 130 : acc.balance;
      return sum + converted;
    }, 0);
  },
  
  getRecentTransactions: (limit = 5) => {
    const { transactions } = get();
    return transactions
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
      .slice(0, limit);
  },
}));
