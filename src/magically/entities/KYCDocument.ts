/**
 * Auto-generated entity for KYCDocument
 * Generated from magically/schemas/KYCDocument.json
 * Collection: kyc_documents
 * @entity KYCDocument
 * @import { KYCDocument, KYCDocuments } from '../magically/entities/KYCDocument'
 * @collection kyc_documents
 * @description KYCDocument entity with full CRUD operations and TypeScript types
 * 
 * @type
 * interface KYCDocument {
 *   documentType: "national_id" | "passport" | "drivers_license" | "proof_of_address"
 *   documentUrl: string
 *   verificationStatus: "pending" | "verified" | "rejected"
 *   uploadedDate: string
 *   verifiedDate?: string
 *   rejectionReason?: string
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
 * - KYCDocumentCreateInput omits: _id, creator, createdAt, updatedAt
 * - KYCDocumentUpdateInput is Partial<KYCDocument> excluding: _id, creator, createdAt
 * - Protected collections: users, files (use dedicated userProfiles instead)
 */

import magically from "magically-sdk";

export interface KYCDocument {
  /** Type of KYC document */
  documentType: "national_id" | "passport" | "drivers_license" | "proof_of_address";
  /** URL to stored document file */
  documentUrl: string;
  /** Verification status of document */
  verificationStatus: "pending" | "verified" | "rejected";
  /** Date when document was uploaded */
  uploadedDate: string;
  /** Date when document was verified */
  verifiedDate?: string;
  /** Reason for rejection if applicable */
  rejectionReason?: string;
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

export interface KYCDocumentCreateInput extends Omit<KYCDocument, '_id' | 'creator' | 'createdAt' | 'updatedAt'> {
  isPublic?: boolean; // Optional - defaults to false if not provided
}
export interface KYCDocumentUpdateInput extends Partial<Omit<KYCDocument, '_id' | 'creator' | 'createdAt'>> {}

export const KYCDocuments = {
  /**
   * Create a new KYCDocument (insertOne)
   */
  async save(data: KYCDocumentCreateInput, options: { upsert?: boolean } = {}): Promise<KYCDocument> {
    return magically.data.insert<KYCDocument>("kyc_documents", data, options);
  },

  /**
   * Create a new KYCDocument (insertOne)
   */
  async create(data: KYCDocumentCreateInput, options: {  } = {}): Promise<KYCDocument> {
    return magically.data.insert<KYCDocument>("kyc_documents", data, options);
  },

  /**
   * Upsert KYCDocument - update if exists, create if not
   */
  async upsert(filter: Partial<KYCDocument>, data: KYCDocumentCreateInput): Promise<{ data: KYCDocument; upserted: boolean }> {
    return magically.data.upsert<KYCDocument>("kyc_documents", filter, data);
  },

  /**
   * Find KYCDocument by ID (findOne by _id)
   * Automatically includes public items to support unauthenticated access
   */
  async findById(id: string): Promise<KYCDocument | null> {
    const result = await magically.data.query<KYCDocument>("kyc_documents", { 
      _id: id,
      isPublic: true 
    });
    return result.data[0] || null;
  },

  /**
   * Query KYCDocuments with filters and options (find)
   */
  async query(
    filter: Partial<KYCDocument> = {},
    options: { limit?: number; skip?: number; sort?: any; populate?: string[] } = {}
  ): Promise<{ data: KYCDocument[]; total: number }> {
    return magically.data.query<KYCDocument>("kyc_documents", filter, options);
  },

  /**
   * List all KYCDocuments with pagination
   */
  async list(options: { limit?: number; skip?: number; sort?: any; populate?: string[] } = {}): Promise<{ data: KYCDocument[]; total: number }> {
    return magically.data.query<KYCDocument>("kyc_documents", {}, options);
  },

  /**
   * Update KYCDocument by ID (updateOne)
   */
  async update(id: string, data: KYCDocumentUpdateInput): Promise<KYCDocument> {
    return magically.data.update<KYCDocument>("kyc_documents", { _id: id }, data);
  },

  /**
   * Update multiple KYCDocuments matching filter (updateMany)
   */
  async updateMany(filter: Partial<KYCDocument>, data: KYCDocumentUpdateInput): Promise<{ matchedCount: number; modifiedCount: number }> {
    return magically.data.updateMany<KYCDocument>("kyc_documents", filter, data);
  },

  /**
   * Delete KYCDocument by ID (deleteOne by _id)
   */
  async delete(id: string): Promise<boolean> {
    const result = await magically.data.deleteOne("kyc_documents", { _id: id });
    return result.deletedCount > 0;
  },

  /**
   * Delete one KYCDocument matching filter (deleteOne)
   */
  async deleteOne(filter: Partial<KYCDocument>): Promise<{ deletedCount: number }> {
    return magically.data.deleteOne("kyc_documents", filter);
  },

  /**
   * Delete multiple KYCDocuments matching filter (deleteMany)
   */
  async deleteMany(filter: Partial<KYCDocument>): Promise<{ deletedCount: number }> {
    return magically.data.deleteMany("kyc_documents", filter);
  },

  /**
   * Count KYCDocuments matching filter (countDocuments)
   */
  async count(filter: Partial<KYCDocument> = {}): Promise<number> {
    const result = await magically.data.count("kyc_documents", filter);
    return result.count;
  }
};

// Export both singular and plural for convenience
export const KYCDocument = KYCDocuments;