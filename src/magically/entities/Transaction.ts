/**
 * Auto-generated entity for Transaction
 * Generated from magically/schemas/Transaction.json
 * Collection: transactions
 * @entity Transaction
 * @import { Transaction, Transactions } from '../magically/entities/Transaction'
 * @collection transactions
 * @description Transaction entity with full CRUD operations and TypeScript types
 * 
 * @type
 * interface Transaction {
 *   transactionType: "send" | "receive" | "deposit" | "withdrawal" | "request"
 *   amount: number
 *   currency: string
 *   status: "completed" | "pending" | "failed" | "cancelled"
 *   recipientName?: string
 *   senderName?: string
 *   accountId: string
 *   accountName: string
 *   description?: string
 *   transactionDate: string
 *   reference?: string
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
 * - TransactionCreateInput omits: _id, creator, createdAt, updatedAt
 * - TransactionUpdateInput is Partial<Transaction> excluding: _id, creator, createdAt
 * - Protected collections: users, files (use dedicated userProfiles instead)
 */

import magically from "magically-sdk";

export interface Transaction {
  /** Type of transaction */
  transactionType: "send" | "receive" | "deposit" | "withdrawal" | "request";
  /** Transaction amount */
  amount: number;
  /** Transaction currency */
  currency: string;
  /** Transaction status */
  status: "completed" | "pending" | "failed" | "cancelled";
  /** Name of recipient (for send/request) */
  recipientName?: string;
  /** Name of sender (for receive) */
  senderName?: string;
  /** Reference to linked account used */
  accountId: string;
  /** Name of account used (cached for display) */
  accountName: string;
  /** Optional transaction description or note */
  description?: string;
  /** Date and time of transaction */
  transactionDate: string;
  /** Transaction reference or ID from payment provider */
  reference?: string;
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

export interface TransactionCreateInput extends Omit<Transaction, '_id' | 'creator' | 'createdAt' | 'updatedAt'> {
  isPublic?: boolean; // Optional - defaults to false if not provided
}
export interface TransactionUpdateInput extends Partial<Omit<Transaction, '_id' | 'creator' | 'createdAt'>> {}

export const Transactions = {
  /**
   * Create a new Transaction (insertOne)
   */
  async save(data: TransactionCreateInput, options: { upsert?: boolean } = {}): Promise<Transaction> {
    return magically.data.insert<Transaction>("transactions", data, options);
  },

  /**
   * Create a new Transaction (insertOne)
   */
  async create(data: TransactionCreateInput, options: {  } = {}): Promise<Transaction> {
    return magically.data.insert<Transaction>("transactions", data, options);
  },

  /**
   * Upsert Transaction - update if exists, create if not
   */
  async upsert(filter: Partial<Transaction>, data: TransactionCreateInput): Promise<{ data: Transaction; upserted: boolean }> {
    return magically.data.upsert<Transaction>("transactions", filter, data);
  },

  /**
   * Find Transaction by ID (findOne by _id)
   * Automatically includes public items to support unauthenticated access
   */
  async findById(id: string): Promise<Transaction | null> {
    const result = await magically.data.query<Transaction>("transactions", { 
      _id: id,
      isPublic: true 
    });
    return result.data[0] || null;
  },

  /**
   * Query Transactions with filters and options (find)
   */
  async query(
    filter: Partial<Transaction> = {},
    options: { limit?: number; skip?: number; sort?: any; populate?: string[] } = {}
  ): Promise<{ data: Transaction[]; total: number }> {
    return magically.data.query<Transaction>("transactions", filter, options);
  },

  /**
   * List all Transactions with pagination
   */
  async list(options: { limit?: number; skip?: number; sort?: any; populate?: string[] } = {}): Promise<{ data: Transaction[]; total: number }> {
    return magically.data.query<Transaction>("transactions", {}, options);
  },

  /**
   * Update Transaction by ID (updateOne)
   */
  async update(id: string, data: TransactionUpdateInput): Promise<Transaction> {
    return magically.data.update<Transaction>("transactions", { _id: id }, data);
  },

  /**
   * Update multiple Transactions matching filter (updateMany)
   */
  async updateMany(filter: Partial<Transaction>, data: TransactionUpdateInput): Promise<{ matchedCount: number; modifiedCount: number }> {
    return magically.data.updateMany<Transaction>("transactions", filter, data);
  },

  /**
   * Delete Transaction by ID (deleteOne by _id)
   */
  async delete(id: string): Promise<boolean> {
    const result = await magically.data.deleteOne("transactions", { _id: id });
    return result.deletedCount > 0;
  },

  /**
   * Delete one Transaction matching filter (deleteOne)
   */
  async deleteOne(filter: Partial<Transaction>): Promise<{ deletedCount: number }> {
    return magically.data.deleteOne("transactions", filter);
  },

  /**
   * Delete multiple Transactions matching filter (deleteMany)
   */
  async deleteMany(filter: Partial<Transaction>): Promise<{ deletedCount: number }> {
    return magically.data.deleteMany("transactions", filter);
  },

  /**
   * Count Transactions matching filter (countDocuments)
   */
  async count(filter: Partial<Transaction> = {}): Promise<number> {
    const result = await magically.data.count("transactions", filter);
    return result.count;
  }
};

// Export both singular and plural for convenience
export const Transaction = Transactions;