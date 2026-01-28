/**
 * Supabase Database Types
 *
 * These types represent the database schema for type-safe queries.
 * Update this file when the database schema changes.
 */

// ============================================
// Database Schema Types
// ============================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// ============================================
// Profile Table Types
// ============================================

/**
 * Profile row type - represents a complete profile record from the database
 */
export interface Profile {
  /** UUID - Foreign key to auth.users */
  id: string;
  /** Unique username for public profiles */
  username: string | null;
  /** User's display name (from Google OAuth or manually set) */
  name: string | null;
  /** URL to user's avatar image */
  avatar_url: string | null;
  /** Short user biography */
  bio: string | null;
  /** Array of interest tags */
  interests: string[];
  /** Whether onboarding has been completed */
  onboarding_completed: boolean;
  /** Timestamp when the profile was created */
  created_at: string;
  /** Timestamp when the profile was last updated */
  updated_at: string;
}

/**
 * Profile insert type - for creating new profiles
 * Note: Profiles are auto-created by trigger, but this type is useful for edge cases
 */
export interface ProfileInsert {
  id: string;
  username?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  interests?: string[];
  onboarding_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Profile update type - for updating existing profiles
 */
export interface ProfileUpdate {
  username?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  interests?: string[];
  onboarding_completed?: boolean;
  updated_at?: string;
}

// ============================================
// Re-exports for convenience
// ============================================

export type { User, Session } from '@supabase/supabase-js';
