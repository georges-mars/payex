/**
 * Auto-generated entity for LinkedAccount
 * Generated from magically/schemas/LinkedAccount.json
 * Collection: linked_accounts
 * @entity LinkedAccount
 * @import { LinkedAccount, LinkedAccounts } from '../magically/entities/LinkedAccount'
 * @collection linked_accounts
 * @description LinkedAccount entity with full CRUD operations and TypeScript types
 * 
 * @type
 * interface LinkedAccount {
 *   accountType: "mpesa" | "bank" | "deriv" | "binance" | "etoro" | "interactive_brokers"
 *   accountName: string
 *   accountNumber: string
 *   balance: number
 *   currency: string
 *   status: "active" | "inactive" | "pending" | "needs_verification"
 *   isDefault?: boolean
 *   linkedDate: string
 *   metadata?: {
 *     platform?: string
 *     accountId?: string
 *     maskedApiKey?: string
 *     lastSynced?: string
 *     requiresManualVerification?: boolean
 *   }
 *   // Standard fields (always present after save)
 *   _id: string
 *   creator: string  
 *   createdAt: Date
 *   updatedAt: Date
 *   isPublic?: boolean
 * }
 * 
 * @query-options
 * QueryOptions {
 *   limit?: number (max: 100)
 *   skip?: number (offset for pagination)
 *   sort?: any (MongoDB sort, e.g., { createdAt: -1 })
 * }
 * 
 * @query-result
 * QueryResult<T> {
 *   data: T[]
 *   total: number
 * }
 * 
 * @important
 * - Uses magically.data SDK methods internally
 * - All data is scoped to current user unless isPublic: true
 * - LinkedAccountCreateInput omits: _id, creator, createdAt, updatedAt
 * - LinkedAccountUpdateInput is Partial<LinkedAccount> excluding: _id, creator, createdAt
 * - Protected collections: users, files (use dedicated userProfiles instead)
 */

import magically from "magically-sdk";

export type AccountType = "mpesa" | "bank" | "deriv" | "binance" | "etoro" | "interactive_brokers";
export type AccountStatus = "active" | "inactive" | "pending" | "needs_verification";

export interface LinkedAccountMetadata {
  /** Original platform name from frontend */
  platform?: string;
  /** Account ID from trading platform */
  accountId?: string;
  /** First 4 and last 4 characters of API key */
  maskedApiKey?: string;
  /** Last time balance was synced */
  lastSynced?: string;
  /** Whether manual verification is needed */
  requiresManualVerification?: boolean;
  /** Additional platform-specific data */
  [key: string]: any;
}

export interface LinkedAccount {
  /** Type of account */
  accountType: AccountType;
  /** Display name for the account (e.g., M-Pesa, Equity Bank, Binance) */
  accountName: string;
  /** Masked account number or identifier */
  accountNumber: string;
  /** Current balance in account */
  balance: number;
  /** Currency code (KES, USD, EUR, etc.) */
  currency: string;
  /** Account status */
  status: AccountStatus;
  /** Whether this is the default account for transactions */
  isDefault?: boolean;
  /** Date when account was linked */
  linkedDate: string;
  /** Additional metadata for the account */
  metadata?: LinkedAccountMetadata;
  /** MongoDB document ID - automatically generated */
  _id: string;
  /** User who created this document - automatically set from auth */
  creator: string;
  /** When document was created - automatically set */
  createdAt: Date;
  /** When document was last updated - automatically managed */
  updatedAt: Date;
  /** Whether document is publicly visible - defaults to false */
  isPublic?: boolean;
}

export interface LinkedAccountCreateInput extends Omit<LinkedAccount, '_id' | 'creator' | 'createdAt' | 'updatedAt'> {
  isPublic?: boolean; // Optional - defaults to false if not provided
}

export interface LinkedAccountUpdateInput extends Partial<Omit<LinkedAccount, '_id' | 'creator' | 'createdAt'>> {}

export interface QueryOptions {
  limit?: number;
  skip?: number;
  sort?: any;
  populate?: string[];
}

export interface QueryResult<T> {
  data: T[];
  total: number;
}

export interface UpdateResult {
  matchedCount: number;
  modifiedCount: number;
}

export interface DeleteResult {
  deletedCount: number;
}

export interface CountResult {
  count: number;
}

/**
 * Utility functions for LinkedAccount operations
 */
export class LinkedAccountUtils {
  /**
   * Format currency for display
   */
  static formatCurrency(amount: number, currency: string): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    });
    return formatter.format(amount);
  }

  /**
   * Get display name for account type
   */
  static getAccountTypeDisplay(type: AccountType): string {
    const displayNames: Record<AccountType, string> = {
      mpesa: 'M-Pesa',
      bank: 'Bank Account',
      deriv: 'Deriv Trading',
      binance: 'Binance Trading',
      etoro: 'eToro Trading',
      interactive_brokers: 'Interactive Brokers'
    };
    return displayNames[type] || type;
  }

  /**
   * Get icon name for account type
   */
  static getAccountTypeIcon(type: AccountType): string {
    const icons: Record<AccountType, string> = {
      mpesa: '📱',
      bank: '🏦',
      deriv: '📊',
      binance: '💰',
      etoro: '👥',
      interactive_brokers: '📈'
    };
    return icons[type] || '💳';
  }

  /**
   * Get color for account type
   */
  static getAccountTypeColor(type: AccountType): string {
    const colors: Record<AccountType, string> = {
      mpesa: '#00B300',
      bank: '#0066CC',
      deriv: '#FF6B35',
      binance: '#F0B90B',
      etoro: '#7C3AED',
      interactive_brokers: '#2563EB'
    };
    return colors[type] || '#666666';
  }

  /**
   * Check if account is a trading account
   */
  static isTradingAccount(type: AccountType): boolean {
    return ['deriv', 'binance', 'etoro', 'interactive_brokers'].includes(type);
  }

  /**
   * Check if account is a bank account
   */
  static isBankAccount(type: AccountType): boolean {
    return type === 'bank';
  }

  /**
   * Check if account is M-Pesa
   */
  static isMpesaAccount(type: AccountType): boolean {
    return type === 'mpesa';
  }

  /**
   * Get default currency for account type
   */
  static getDefaultCurrency(type: AccountType): string {
    if (type === 'mpesa') return 'KES';
    if (type === 'bank') return 'KES';
    return 'USD';
  }

  /**
   * Validate account data before creation
   */
  static validateCreateInput(input: LinkedAccountCreateInput): string[] {
    const errors: string[] = [];

    if (!input.accountType) {
      errors.push('Account type is required');
    }

    if (!input.accountName || input.accountName.trim().length < 2) {
      errors.push('Account name must be at least 2 characters');
    }

    if (!input.accountNumber || input.accountNumber.trim().length < 4) {
      errors.push('Account number is required');
    }

    if (typeof input.balance !== 'number') {
      errors.push('Balance must be a number');
    }

    if (input.balance < 0) {
      errors.push('Balance cannot be negative');
    }

    if (!input.currency || input.currency.trim().length !== 3) {
      errors.push('Currency must be a 3-letter code (e.g., KES, USD)');
    }

    if (!input.status) {
      errors.push('Account status is required');
    }

    if (!input.linkedDate) {
      errors.push('Linked date is required');
    }

    return errors;
  }

  /**
   * Create a mock account for testing
   */
  static createMockAccount(type: AccountType, overrides?: Partial<LinkedAccountCreateInput>): LinkedAccountCreateInput {
    const accountId = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const balance = Math.random() * 10000;
    
    const baseAccount: LinkedAccountCreateInput = {
      accountType: type,
      accountName: `${LinkedAccountUtils.getAccountTypeDisplay(type)} Account`,
      accountNumber: `****${accountId.slice(-4)}`,
      balance: parseFloat(balance.toFixed(2)),
      currency: LinkedAccountUtils.getDefaultCurrency(type),
      status: 'active',
      isDefault: false,
      linkedDate: new Date().toISOString(),
      metadata: {
        platform: type,
        lastSynced: new Date().toISOString(),
        requiresManualVerification: ['etoro', 'interactive_brokers'].includes(type)
      }
    };

    return { ...baseAccount, ...overrides };
  }
}

/**
 * Main LinkedAccount entity operations
 */
export const LinkedAccounts = {
  /**
   * Create a new LinkedAccount (insertOne)
   * @param data - Account data to create
   * @param options - Optional upsert options
   * @returns The created account
   */
  async save(data: LinkedAccountCreateInput, options: { upsert?: boolean } = {}): Promise<LinkedAccount> {
    return magically.data.insert<LinkedAccount>("linked_accounts", data, options);
  },

  /**
   * Create a new LinkedAccount (insertOne)
   * @param data - Account data to create
   * @returns The created account
   */
  async create(data: LinkedAccountCreateInput): Promise<LinkedAccount> {
    return magically.data.insert<LinkedAccount>("linked_accounts", data);
  },

  /**
   * Create multiple LinkedAccounts
   * @param data - Array of account data to create
   * @returns Array of created accounts
   */
  async createMany(data: LinkedAccountCreateInput[]): Promise<LinkedAccount[]> {
    const promises = data.map(account => this.create(account));
    return Promise.all(promises);
  },

  /**
   * Upsert LinkedAccount - update if exists, create if not
   * @param filter - Filter to find existing account
   * @param data - Account data to upsert
   * @returns Object containing the account and whether it was upserted
   */
  async upsert(filter: Partial<LinkedAccount>, data: LinkedAccountCreateInput): Promise<{ data: LinkedAccount; upserted: boolean }> {
    return magically.data.upsert<LinkedAccount>("linked_accounts", filter, data);
  },

  /**
   * Find LinkedAccount by ID (findOne by _id)
   * Automatically includes public items to support unauthenticated access
   * @param id - Account ID
   * @returns The account or null if not found
   */
  async findById(id: string): Promise<LinkedAccount | null> {
    const result = await magically.data.query<LinkedAccount>("linked_accounts", { 
      _id: id,
      isPublic: true 
    });
    return result.data[0] || null;
  },

  /**
   * Find LinkedAccount by account number
   * @param accountNumber - Account number to search for
   * @returns The account or null if not found
   */
  async findByAccountNumber(accountNumber: string): Promise<LinkedAccount | null> {
    const result = await magically.data.query<LinkedAccount>("linked_accounts", { 
      accountNumber 
    });
    return result.data[0] || null;
  },

  /**
   * Find trading accounts by platform
   * @param platform - Trading platform (deriv, binance, etc.)
   * @returns Array of trading accounts
   */
  async findByPlatform(platform: string): Promise<LinkedAccount[]> {
    const result = await magically.data.query<LinkedAccount>("linked_accounts", { 
      accountType: platform as AccountType 
    });
    return result.data;
  },

  /**
   * Find default account for user
   * @returns The default account or null if not found
   */
  async findDefault(): Promise<LinkedAccount | null> {
    const result = await magically.data.query<LinkedAccount>("linked_accounts", { 
      isDefault: true 
    });
    return result.data[0] || null;
  },

  /**
   * Find active accounts
   * @returns Array of active accounts
   */
  async findActive(): Promise<LinkedAccount[]> {
    const result = await magically.data.query<LinkedAccount>("linked_accounts", { 
      status: 'active' 
    });
    return result.data;
  },

  /**
   * Query LinkedAccounts with filters and options (find)
   * @param filter - Filter criteria
   * @param options - Query options (limit, skip, sort, populate)
   * @returns Query result with data and total count
   */
  async query(
    filter: Partial<LinkedAccount> = {},
    options: QueryOptions = {}
  ): Promise<QueryResult<LinkedAccount>> {
    return magically.data.query<LinkedAccount>("linked_accounts", filter, options);
  },

  /**
   * List all LinkedAccounts with pagination
   * @param options - Query options (limit, skip, sort, populate)
   * @returns Query result with data and total count
   */
  async list(options: QueryOptions = {}): Promise<QueryResult<LinkedAccount>> {
    return magically.data.query<LinkedAccount>("linked_accounts", {}, options);
  },

  /**
   * List accounts grouped by type
   * @returns Object with accounts grouped by type
   */
  async listByType(): Promise<Record<AccountType, LinkedAccount[]>> {
    const result = await this.list();
    const grouped: Record<AccountType, LinkedAccount[]> = {
      mpesa: [],
      bank: [],
      deriv: [],
      binance: [],
      etoro: [],
      interactive_brokers: []
    };

    result.data.forEach(account => {
      if (grouped[account.accountType]) {
        grouped[account.accountType].push(account);
      }
    });

    return grouped;
  },

  /**
   * Get account summary statistics
   * @returns Summary statistics
   */
  async getSummary(): Promise<{
    totalAccounts: number;
    totalBalance: number;
    byType: Record<AccountType, { count: number; balance: number }>;
    defaultAccount?: LinkedAccount;
  }> {
    const accounts = await this.list();
    const summary = {
      totalAccounts: accounts.total,
      totalBalance: 0,
      byType: {} as Record<AccountType, { count: number; balance: number }>,
      defaultAccount: undefined as LinkedAccount | undefined
    };

    // Initialize type counters
    const types: AccountType[] = ['mpesa', 'bank', 'deriv', 'binance', 'etoro', 'interactive_brokers'];
    types.forEach(type => {
      summary.byType[type] = { count: 0, balance: 0 };
    });

    // Calculate totals
    accounts.data.forEach(account => {
      summary.totalBalance += account.balance;
      summary.byType[account.accountType].count++;
      summary.byType[account.accountType].balance += account.balance;
      
      if (account.isDefault) {
        summary.defaultAccount = account;
      }
    });

    return summary;
  },

  /**
   * Update LinkedAccount by ID (updateOne)
   * @param id - Account ID to update
   * @param data - Data to update
   * @returns The updated account
   */
  async update(id: string, data: LinkedAccountUpdateInput): Promise<LinkedAccount> {
    return magically.data.update<LinkedAccount>("linked_accounts", { _id: id }, data);
  },

  /**
   * Update account balance
   * @param id - Account ID
   * @param newBalance - New balance value
   * @returns The updated account
   */
  async updateBalance(id: string, newBalance: number): Promise<LinkedAccount> {
    return this.update(id, { 
      balance: newBalance,
      metadata: { lastSynced: new Date().toISOString() }
    });
  },

  /**
   * Set an account as default (and unset others)
   * @param id - Account ID to set as default
   * @returns The updated account
   */
  async setAsDefault(id: string): Promise<LinkedAccount> {
    // First, unset all other accounts as default
    await magically.data.updateMany("linked_accounts", 
      { isDefault: true }, 
      { isDefault: false }
    );
    
    // Then set the specified account as default
    return this.update(id, { isDefault: true });
  },

  /**
   * Update account status
   * @param id - Account ID
   * @param status - New status
   * @returns The updated account
   */
  async updateStatus(id: string, status: AccountStatus): Promise<LinkedAccount> {
    return this.update(id, { status });
  },

  /**
   * Update multiple LinkedAccounts matching filter (updateMany)
   * @param filter - Filter criteria
   * @param data - Data to update
   * @returns Update result with matched and modified counts
   */
  async updateMany(filter: Partial<LinkedAccount>, data: LinkedAccountUpdateInput): Promise<UpdateResult> {
    return magically.data.updateMany<LinkedAccount>("linked_accounts", filter, data);
  },

  /**
   * Sync all trading account balances
   * @returns Array of updated accounts
   */
  async syncAllTradingBalances(): Promise<LinkedAccount[]> {
    const tradingAccounts = await this.query({
      accountType: { $in: ['deriv', 'binance'] },
      status: 'active'
    });

    const updatePromises = tradingAccounts.data.map(async (account) => {
      // In production, call actual API to get balance
      const mockBalance = Math.random() * 10000;
      return this.updateBalance(account._id, parseFloat(mockBalance.toFixed(2)));
    });

    return Promise.all(updatePromises);
  },

  /**
   * Delete LinkedAccount by ID (deleteOne by _id)
   * @param id - Account ID to delete
   * @returns True if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const result = await magically.data.deleteOne("linked_accounts", { _id: id });
    return result.deletedCount > 0;
  },

  /**
   * Delete one LinkedAccount matching filter (deleteOne)
   * @param filter - Filter criteria
   * @returns Delete result with deleted count
   */
  async deleteOne(filter: Partial<LinkedAccount>): Promise<DeleteResult> {
    return magically.data.deleteOne("linked_accounts", filter);
  },

  /**
   * Delete multiple LinkedAccounts matching filter (deleteMany)
   * @param filter - Filter criteria
   * @returns Delete result with deleted count
   */
  async deleteMany(filter: Partial<LinkedAccount>): Promise<DeleteResult> {
    return magically.data.deleteMany("linked_accounts", filter);
  },

  /**
   * Delete all accounts of a specific type
   * @param type - Account type to delete
   * @returns Delete result with deleted count
   */
  async deleteByType(type: AccountType): Promise<DeleteResult> {
    return this.deleteMany({ accountType: type });
  },

  /**
   * Count LinkedAccounts matching filter (countDocuments)
   * @param filter - Filter criteria
   * @returns Count of matching documents
   */
  async count(filter: Partial<LinkedAccount> = {}): Promise<number> {
    const result = await magically.data.count("linked_accounts", filter);
    return result.count;
  },

  /**
   * Count accounts by type
   * @returns Object with counts by type
   */
  async countByType(): Promise<Record<AccountType, number>> {
    const types: AccountType[] = ['mpesa', 'bank', 'deriv', 'binance', 'etoro', 'interactive_brokers'];
    const counts: Record<AccountType, number> = {} as any;
    
    const promises = types.map(async (type) => {
      const result = await this.count({ accountType: type });
      counts[type] = result;
    });
    
    await Promise.all(promises);
    return counts;
  },

  /**
   * Check if user has any linked accounts
   * @returns True if user has at least one account
   */
  async hasAccounts(): Promise<boolean> {
    const result = await this.count();
    return result > 0;
  },

  /**
   * Check if user has a specific type of account
   * @param type - Account type to check
   * @returns True if user has at least one account of this type
   */
  async hasAccountType(type: AccountType): Promise<boolean> {
    const result = await this.count({ accountType: type });
    return result > 0;
  },

  /**
   * Get the total balance across all accounts
   * @returns Total balance
   */
  async getTotalBalance(): Promise<number> {
    const accounts = await this.list();
    return accounts.data.reduce((total, account) => total + account.balance, 0);
  },

  /**
   * Get the total balance for a specific currency
   * @param currency - Currency code (e.g., 'KES', 'USD')
   * @returns Total balance in specified currency
   */
  async getTotalBalanceByCurrency(currency: string): Promise<number> {
    const accounts = await this.query({ currency });
    return accounts.data.reduce((total, account) => total + account.balance, 0);
  },

  /**
   * Search accounts by name or number
   * @param searchTerm - Search term
   * @returns Array of matching accounts
   */
  async search(searchTerm: string): Promise<LinkedAccount[]> {
    const result = await magically.data.query<LinkedAccount>("linked_accounts", {
      $or: [
        { accountName: { $regex: searchTerm, $options: 'i' } },
        { accountNumber: { $regex: searchTerm, $options: 'i' } }
      ]
    });
    return result.data;
  },

  /**
   * Get recently linked accounts
   * @param limit - Maximum number of accounts to return
   * @returns Array of recent accounts
   */
  async getRecent(limit: number = 5): Promise<LinkedAccount[]> {
    const result = await this.list({
      sort: { createdAt: -1 },
      limit
    });
    return result.data;
  },

  /**
   * Get accounts that need manual verification
   * @returns Array of accounts needing verification
   */
  async getNeedsVerification(): Promise<LinkedAccount[]> {
    const result = await this.query({ status: 'needs_verification' });
    return result.data;
  },

  /**
   * Get accounts that are pending
   * @returns Array of pending accounts
   */
  async getPending(): Promise<LinkedAccount[]> {
    const result = await this.query({ status: 'pending' });
    return result.data;
  },

  /**
   * Get all currencies used in accounts
   * @returns Array of unique currency codes
   */
  async getCurrencies(): Promise<string[]> {
    const accounts = await this.list();
    const currencies = new Set<string>();
    accounts.data.forEach(account => {
      currencies.add(account.currency);
    });
    return Array.from(currencies);
  },

  /**
   * Export accounts data as JSON
   * @returns JSON string of accounts data
   */
  async exportData(): Promise<string> {
    const accounts = await this.list();
    const exportData = {
      exportDate: new Date().toISOString(),
      totalAccounts: accounts.total,
      accounts: accounts.data.map(account => ({
        type: account.accountType,
        name: account.accountName,
        number: account.accountNumber,
        balance: account.balance,
        currency: account.currency,
        status: account.status,
        isDefault: account.isDefault,
        linkedDate: account.linkedDate
      }))
    };
    return JSON.stringify(exportData, null, 2);
  }
};

// Export both singular and plural for convenience
export const LinkedAccount = LinkedAccounts;

// Export types for convenience
export type { LinkedAccount as LinkedAccountType };
export type { LinkedAccountCreateInput as CreateLinkedAccountInput };
export type { LinkedAccountUpdateInput as UpdateLinkedAccountInput };