/**
 * Entity for Feedback
 * Collection: feedbacks
 * @entity Feedback
 * @import { Feedback, Feedbacks } from '../magically/entities/Feedback'
 * @collection feedbacks
 * @description Feedback entity with full CRUD operations and TypeScript types
 */

import magically from "magically-sdk";

export interface Feedback {
  /** User who created this feedback */
  userId: string;
  /** Email of the user for reference */
  userEmail?: string;
  /** Title of the feedback or feature request */
  title: string;
  /** Detailed description of the feedback */
  description: string;
  /** Category of feedback */
  category: "bug" | "feature" | "improvement" | "other";
  /** Current status of the feedback */
  status?: "open" | "in_review" | "planned" | "in_progress" | "completed" | "declined";
  /** Array of user votes */
  votes?: Array<{
    userId: string;
    votedAt: string;
  }>;
  /** Total number of votes */
  voteCount?: number;
  /** Array of comments on the feedback */
  comments?: Array<{
    id: string;
    userId: string;
    userEmail?: string;
    text: string;
    createdAt: string;
  }>;
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

export interface FeedbackCreateInput extends Omit<Feedback, '_id' | 'creator' | 'createdAt' | 'updatedAt'> {
  isPublic?: boolean; // Optional - defaults to false if not provided
}

export interface FeedbackUpdateInput extends Partial<Omit<Feedback, '_id' | 'creator' | 'createdAt'>> {}

export const Feedbacks = {
  /**
   * Create a new Feedback
   */
  async save(data: FeedbackCreateInput, options: { upsert?: boolean } = {}): Promise<Feedback> {
    return magically.data.insert<Feedback>("feedbacks", data, options);
  },

  /**
   * Find Feedback by ID
   * Automatically includes public items to support unauthenticated access
   */
  async findById(id: string): Promise<Feedback | null> {
    const result = await magically.data.query<Feedback>("feedbacks", { 
      _id: id,
      isPublic: true 
    });
    return result.data[0] || null;
  },

  /**
   * Query Feedbacks with filters and options
   */
  async query(
    filter: Partial<Feedback> = {},
    options: { limit?: number; skip?: number; sort?: any } = {}
  ): Promise<{ data: Feedback[]; total: number }> {
    return magically.data.query<Feedback>("feedbacks", filter, options);
  },

  /**
   * Update Feedback by ID
   */
  async update(id: string, data: FeedbackUpdateInput): Promise<Feedback> {
    return magically.data.update<Feedback>("feedbacks", { _id: id }, data);
  },

  /**
   * Delete Feedback by ID
   */
  async delete(id: string): Promise<boolean> {
    const result = await magically.data.delete("feedbacks", { _id: id });
    return result.deletedCount > 0;
  },

  /**
   * List Feedbacks with pagination (alias for query with empty filter)
   */
  async list(options: { limit?: number; skip?: number; sort?: any } = {}): Promise<{ data: Feedback[]; total: number }> {
    return magically.data.query<Feedback>("feedbacks", { isPublic: true }, options);
  },

  /**
   * Vote on feedback - toggles vote for the user
   */
  async vote(feedbackId: string, userId: string): Promise<Feedback> {
    const feedback = await this.findById(feedbackId);
    if (!feedback) throw new Error('Feedback not found');

    const votes = feedback.votes || [];
    const hasVoted = votes.some(v => v.userId === userId);

    if (hasVoted) {
      // Remove vote
      const newVotes = votes.filter(v => v.userId !== userId);
      return this.update(feedbackId, {
        votes: newVotes,
        voteCount: newVotes.length
      });
    } else {
      // Add vote
      const newVotes = [...votes, { userId, votedAt: new Date().toISOString() }];
      return this.update(feedbackId, {
        votes: newVotes,
        voteCount: newVotes.length
      });
    }
  },

  /**
   * Add comment to feedback
   */
  async addComment(feedbackId: string, userId: string, userEmail: string, text: string): Promise<Feedback> {
    const feedback = await this.findById(feedbackId);
    if (!feedback) throw new Error('Feedback not found');

    const comments = feedback.comments || [];
    const newComment = {
      id: Date.now().toString(),
      userId,
      userEmail,
      text,
      createdAt: new Date().toISOString()
    };

    return this.update(feedbackId, {
      comments: [...comments, newComment]
    });
  }
};

// Export both singular and plural for convenience
export const Feedback = Feedbacks;