/**
 * Supabase Database Types
 *
 * These types represent the database schema for type-safe queries.
 * Update this file when the database schema changes.
 */

// ============================================
// Database Schema Types
// ============================================

/** User role enum matching database user_role type */
export type UserRole = 'user' | 'admin';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      dock_preferences: {
        Row: DockPreferences;
        Insert: DockPreferencesInsert;
        Update: DockPreferencesUpdate;
      };
      dock_items: {
        Row: DockItem;
        Insert: DockItemInsert;
        Update: DockItemUpdate;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      dock_type: DockType;
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
  /** User role for access control */
  role: UserRole;
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
  role?: UserRole;
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
  role?: UserRole;
  updated_at?: string;
}

// ============================================
// Admin Dashboard Types
// ============================================

/** Statistics for admin dashboard */
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  adminUsers: number;
}

/** Options for fetching profiles with pagination and filters */
export interface GetProfilesOptions {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole | 'all';
  status?: 'completed' | 'onboarding' | 'all';
}

/** Paginated profiles response */
export interface PaginatedProfiles {
  profiles: Profile[];
  total: number;
  page: number;
  totalPages: number;
}

// ============================================
// Dock Preferences Types
// ============================================

/** Dock type enum matching database dock_type */
export type DockType = 'floating_islands_light' | 'floating_islands_dark';

/** Position of a single dock icon */
export interface DockIconPosition {
  /** Unique icon identifier */
  id: string;
  /** Order index in the dock */
  order: number;
}

/**
 * Dock preferences row type - represents user's dock customization
 */
export interface DockPreferences {
  /** UUID primary key */
  id: string;
  /** UUID - Foreign key to auth.users */
  user_id: string;
  /** Selected dock style */
  dock_type: DockType;
  /** Array of icon positions */
  icon_positions: DockIconPosition[];
  /** Timestamp when created */
  created_at: string;
  /** Timestamp when last updated */
  updated_at: string;
}

/**
 * Dock preferences insert type
 */
export interface DockPreferencesInsert {
  user_id: string;
  dock_type?: DockType;
  icon_positions?: DockIconPosition[];
}

/**
 * Dock preferences update type
 */
export interface DockPreferencesUpdate {
  dock_type?: DockType;
  icon_positions?: DockIconPosition[];
}

// ============================================
// Dock Items Types (Admin Managed)
// ============================================

export interface DockDropdownItem {
  label: string;
  href: string;
  icon?: string; // Icon name
}

export interface DockItem {
  id: string;
  label: string;
  icon: string; // Lucide icon name
  href?: string; // Optional, if it has dropdowns it might not navigate directly
  dropdown_items?: DockDropdownItem[];
  order: number;
  is_visible: boolean;
  required_role?: UserRole; // 'admin' or null (for all)
  created_at: string;
  updated_at: string;
}

export interface DockItemInsert {
  id?: string;
  label: string;
  icon: string;
  href?: string;
  dropdown_items?: DockDropdownItem[];
  order: number;
  is_visible?: boolean;
  required_role?: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface DockItemUpdate {
  label?: string;
  icon?: string;
  href?: string;
  dropdown_items?: DockDropdownItem[];
  order?: number;
  is_visible?: boolean;
  required_role?: UserRole;
  updated_at?: string;
}

// ============================================
// Re-exports for convenience
// ============================================

export type { User, Session } from '@supabase/supabase-js';
