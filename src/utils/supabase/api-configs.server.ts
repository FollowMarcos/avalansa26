'use server';

import { createClient } from '@/utils/supabase/server';
import type {
  ApiConfig,
  ApiConfigInsert,
  ApiConfigUpdate,
} from '@/types/api-config';

/**
 * Environment variable for API key encryption
 * Must be set in .env.local
 */
const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET;

/**
 * Verify the current user is an admin
 */
async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin';
}

/**
 * Get current authenticated user ID
 */
async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Get all global API configs (admin only, for dashboard management)
 * Does not include the encrypted API key
 */
export async function getGlobalApiConfigs(): Promise<ApiConfig[]> {
  if (!(await isCurrentUserAdmin())) {
    return [];
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('api_configs')
    .select(
      'id, owner_id, name, provider, description, endpoint, model_id, model_info, access_level, allowed_users, is_active, created_at, updated_at'
    )
    .is('owner_id', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching global API configs:', error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Get personal API configs owned by the current user (for settings page)
 * Does not include the encrypted API key
 */
export async function getUserPersonalApiConfigs(): Promise<ApiConfig[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('api_configs')
    .select(
      'id, owner_id, name, provider, description, endpoint, model_id, model_info, access_level, allowed_users, is_active, created_at, updated_at'
    )
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching personal API configs:', error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Get all API configs accessible to the current user (for /create page)
 * Includes both global APIs and user's personal APIs
 * Does not include the encrypted API key
 */
export async function getAccessibleApiConfigs(): Promise<ApiConfig[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // RLS policies will filter to only accessible APIs
  const { data, error } = await supabase
    .from('api_configs')
    .select(
      'id, owner_id, name, provider, description, endpoint, model_id, model_info, access_level, allowed_users, is_active, created_at, updated_at'
    )
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching accessible APIs:', error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Get a single API config by ID
 * Does not include the encrypted API key
 */
export async function getApiConfig(id: string): Promise<ApiConfig | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('api_configs')
    .select(
      'id, owner_id, name, provider, description, endpoint, model_id, model_info, access_level, allowed_users, is_active, created_at, updated_at'
    )
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching API config:', error.message);
    return null;
  }

  return data;
}

/**
 * Create a new API config
 * For global APIs: only admins can create (owner_id must be null)
 * For personal APIs: users can create their own (owner_id = user.id)
 */
export async function createApiConfig(
  config: ApiConfigInsert
): Promise<ApiConfig | null> {
  if (!ENCRYPTION_KEY) {
    console.error('API_KEY_ENCRYPTION_SECRET not configured');
    return null;
  }

  const supabase = await createClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    console.error('Unauthorized: Must be logged in to create API config');
    return null;
  }

  // If creating a global API (owner_id is null), must be admin
  if (!config.owner_id) {
    if (!(await isCurrentUserAdmin())) {
      console.error('Unauthorized: Only admins can create global APIs');
      return null;
    }
  } else if (config.owner_id !== userId) {
    // Can only create personal APIs for yourself
    console.error('Unauthorized: Cannot create APIs for other users');
    return null;
  }

  // Encrypt the API key using the database function
  const { data: encryptedKey, error: encryptError } = await supabase.rpc(
    'encrypt_api_key',
    {
      plain_key: config.api_key,
      encryption_key: ENCRYPTION_KEY,
    }
  );

  if (encryptError || !encryptedKey) {
    console.error('Failed to encrypt API key:', encryptError?.message);
    return null;
  }

  // Prepare insert data (without plain api_key)
  const { api_key: _, ...configWithoutKey } = config;
  const insertData = {
    ...configWithoutKey,
    api_key_encrypted: encryptedKey,
  };

  const { data, error } = await supabase
    .from('api_configs')
    .insert(insertData)
    .select(
      'id, owner_id, name, provider, description, endpoint, model_id, model_info, access_level, allowed_users, is_active, created_at, updated_at'
    )
    .single();

  if (error) {
    console.error('Error creating API config:', error.message);
    return null;
  }

  return data;
}

/**
 * Update an existing API config
 * RLS policies enforce ownership/admin access
 */
export async function updateApiConfig(
  id: string,
  updates: ApiConfigUpdate
): Promise<ApiConfig | null> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    console.error('Unauthorized: Must be logged in to update API config');
    return null;
  }

  // Build update data
  const updateData: Record<string, unknown> = {};

  // Copy allowed fields
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.provider !== undefined) updateData.provider = updates.provider;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.endpoint !== undefined) updateData.endpoint = updates.endpoint;
  if (updates.model_id !== undefined) updateData.model_id = updates.model_id;
  if (updates.model_info !== undefined) updateData.model_info = updates.model_info;
  if (updates.access_level !== undefined) updateData.access_level = updates.access_level;
  if (updates.allowed_users !== undefined) updateData.allowed_users = updates.allowed_users;
  if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

  // If updating API key, encrypt it
  if (updates.api_key) {
    if (!ENCRYPTION_KEY) {
      console.error('API_KEY_ENCRYPTION_SECRET not configured');
      return null;
    }

    const { data: encryptedKey, error: encryptError } = await supabase.rpc(
      'encrypt_api_key',
      {
        plain_key: updates.api_key,
        encryption_key: ENCRYPTION_KEY,
      }
    );

    if (encryptError || !encryptedKey) {
      console.error('Failed to encrypt API key:', encryptError?.message);
      return null;
    }

    updateData.api_key_encrypted = encryptedKey;
  }

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('api_configs')
    .update(updateData)
    .eq('id', id)
    .select(
      'id, owner_id, name, provider, description, endpoint, model_id, model_info, access_level, allowed_users, is_active, created_at, updated_at'
    )
    .single();

  if (error) {
    console.error('Error updating API config:', error.message);
    return null;
  }

  return data;
}

/**
 * Delete an API config
 * RLS policies enforce ownership/admin access
 */
export async function deleteApiConfig(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.from('api_configs').delete().eq('id', id);

  if (error) {
    console.error('Error deleting API config:', error.message);
    return false;
  }

  return true;
}

/**
 * Get the decrypted API key for server-side use ONLY
 * This should NEVER be exposed to the frontend
 * Used by the generation API route to make actual API calls
 */
export async function getDecryptedApiKey(apiId: string): Promise<string | null> {
  if (!ENCRYPTION_KEY) {
    console.error('API_KEY_ENCRYPTION_SECRET not configured');
    return null;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error('Unauthorized: Must be logged in to use API');
    return null;
  }

  // First verify the user has access to this API via RLS
  const { data: config, error: configError } = await supabase
    .from('api_configs')
    .select('api_key_encrypted')
    .eq('id', apiId)
    .eq('is_active', true)
    .single();

  if (configError || !config) {
    console.error('API not found or access denied');
    return null;
  }

  // Decrypt the API key
  const { data: decryptedKey, error: decryptError } = await supabase.rpc(
    'decrypt_api_key',
    {
      encrypted_key: config.api_key_encrypted,
      encryption_key: ENCRYPTION_KEY,
    }
  );

  if (decryptError || !decryptedKey) {
    console.error('Failed to decrypt API key:', decryptError?.message);
    return null;
  }

  return decryptedKey;
}

/**
 * Get API stats for the dashboard (admin only)
 */
export async function getApiStats(): Promise<{
  totalApis: number;
  activeApis: number;
  globalApis: number;
  userApis: number;
}> {
  if (!(await isCurrentUserAdmin())) {
    return { totalApis: 0, activeApis: 0, globalApis: 0, userApis: 0 };
  }

  const supabase = await createClient();

  // Get total APIs
  const { count: totalApis } = await supabase
    .from('api_configs')
    .select('*', { count: 'exact', head: true });

  // Get active APIs
  const { count: activeApis } = await supabase
    .from('api_configs')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  // Get global APIs
  const { count: globalApis } = await supabase
    .from('api_configs')
    .select('*', { count: 'exact', head: true })
    .is('owner_id', null);

  // Get user APIs
  const { count: userApis } = await supabase
    .from('api_configs')
    .select('*', { count: 'exact', head: true })
    .not('owner_id', 'is', null);

  return {
    totalApis: totalApis ?? 0,
    activeApis: activeApis ?? 0,
    globalApis: globalApis ?? 0,
    userApis: userApis ?? 0,
  };
}
