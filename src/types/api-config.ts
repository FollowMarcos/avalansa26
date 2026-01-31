/**
 * API Configuration Types
 *
 * Types for managing API configurations in the dashboard and /create page.
 */

// ============================================
// Access Level Types
// ============================================

export type ApiAccessLevel = 'public' | 'authenticated' | 'restricted';

// ============================================
// Model Info Types
// ============================================

export interface ApiModelInfo {
  /** Human-readable display name for the model */
  displayName?: string;
  /** List of capabilities (e.g., 'text-to-image', 'image-to-image') */
  capabilities?: string[];
  /** Maximum tokens supported */
  maxTokens?: number;
  /** Whether the model supports image inputs */
  supportsImages?: boolean;
  /** Whether the model supports streaming responses */
  supportsStreaming?: boolean;
  /** Pricing information */
  pricing?: {
    input?: number;
    output?: number;
    unit?: string;
  };
}

// ============================================
// API Config Types
// ============================================

/**
 * API config row type - represents a complete API config from the database
 * Note: api_key_encrypted is never included in this type as it should never reach the frontend
 */
export interface ApiConfig {
  /** UUID primary key */
  id: string;
  /** Owner user ID - null for global/admin APIs, user_id for personal APIs */
  owner_id: string | null;
  /** Display name (e.g., "Gemini 3 Pro Image") */
  name: string;
  /** Provider identifier (e.g., 'google', 'openai') */
  provider: string;
  /** Optional description */
  description: string | null;
  /** API endpoint URL */
  endpoint: string;
  /** Model identifier (e.g., 'gemini-3-pro-image') */
  model_id: string | null;
  /** Additional model metadata */
  model_info: ApiModelInfo | null;
  /** Access level control */
  access_level: ApiAccessLevel;
  /** Array of user IDs with access (for restricted level) */
  allowed_users: string[];
  /** Whether the API is active and usable */
  is_active: boolean;
  /** Timestamp when created */
  created_at: string;
  /** Timestamp when last updated */
  updated_at: string;
}

/**
 * API config insert type - for creating new API configs
 * Note: api_key is plain text here, will be encrypted server-side
 */
export interface ApiConfigInsert {
  owner_id?: string | null;
  name: string;
  provider: string;
  description?: string | null;
  endpoint: string;
  /** Plain text API key - will be encrypted server-side */
  api_key: string;
  model_id?: string | null;
  model_info?: ApiModelInfo | null;
  access_level?: ApiAccessLevel;
  allowed_users?: string[];
  is_active?: boolean;
}

/**
 * API config update type - for updating existing API configs
 */
export interface ApiConfigUpdate {
  name?: string;
  provider?: string;
  description?: string | null;
  endpoint?: string;
  /** Plain text API key - optional, only if updating the key */
  api_key?: string;
  model_id?: string | null;
  model_info?: ApiModelInfo | null;
  access_level?: ApiAccessLevel;
  allowed_users?: string[];
  is_active?: boolean;
}

// ============================================
// Provider Constants
// ============================================

export const API_PROVIDERS = [
  { id: 'google', name: 'Google AI', icon: 'Sparkles' },
  { id: 'openai', name: 'OpenAI', icon: 'Brain' },
  { id: 'anthropic', name: 'Anthropic', icon: 'MessageSquare' },
  { id: 'stability', name: 'Stability AI', icon: 'Image' },
  { id: 'fal', name: 'Fal.ai', icon: 'Zap' },
  { id: 'replicate', name: 'Replicate', icon: 'Box' },
  { id: 'custom', name: 'Custom', icon: 'Settings' },
] as const;

export type ApiProvider = (typeof API_PROVIDERS)[number]['id'];

// ============================================
// Access Level Options (for UI)
// ============================================

export const API_ACCESS_LEVELS = [
  {
    value: 'public' as const,
    label: 'Public',
    description: 'All authenticated users can use this API',
    icon: 'Globe',
  },
  {
    value: 'authenticated' as const,
    label: 'Authenticated',
    description: 'All logged-in users can access this API',
    icon: 'Users',
  },
  {
    value: 'restricted' as const,
    label: 'Restricted',
    description: 'Only selected users can use this API',
    icon: 'Fingerprint',
  },
] as const;
