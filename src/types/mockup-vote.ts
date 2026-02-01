/**
 * Mockup Vote Types
 *
 * Types for storing user votes on design mockups in labs
 */

export type VoteType = 'like' | 'dislike';

export interface MockupVote {
  id: string;
  user_id: string;
  mockup_id: string;
  vote_type: VoteType;
  feedback: string | null;
  created_at: string;
  updated_at: string;
}

export interface MockupVoteInsert {
  user_id: string;
  mockup_id: string;
  vote_type: VoteType;
  feedback?: string | null;
}

export interface MockupVoteUpdate {
  vote_type?: VoteType;
  feedback?: string | null;
}
