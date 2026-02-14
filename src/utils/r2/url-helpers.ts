const SUPABASE_STORAGE_HOST = 'knjrizclleralaxyhrwy.supabase.co';

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_DOMAIN || '';

/** Check whether a stored path uses the R2 `r2:` prefix convention */
export function isR2Path(path: string): boolean {
  return path.startsWith('r2:');
}

/** Strip the `r2:` prefix to get the raw R2 key */
export function stripR2Prefix(path: string): string {
  return path.startsWith('r2:') ? path.slice(3) : path;
}

/** Check whether a URL points to legacy Supabase storage */
export function isSupabaseUrl(url: string): boolean {
  return url.includes(SUPABASE_STORAGE_HOST);
}

/**
 * Resolve a stored path or URL to a displayable public URL.
 *
 * - Full URLs (http/https, data:, blob:) pass through unchanged.
 * - Paths with the `r2:` prefix are resolved to an R2 public URL.
 * - Bare paths (legacy) are resolved to a Supabase public URL.
 */
export function resolveStorageUrl(
  value: string,
  bucket: 'generations' | 'reference-images' | 'avatars'
): string {
  if (!value) return value;

  // Already a full URL — pass through
  if (
    value.startsWith('http') ||
    value.startsWith('data:') ||
    value.startsWith('blob:')
  ) {
    return value;
  }

  // New R2 path (prefixed with `r2:`)
  if (isR2Path(value)) {
    const key = stripR2Prefix(value);
    return `${R2_PUBLIC_URL}/${key}`;
  }

  // Legacy Supabase path (no prefix)
  return `https://${SUPABASE_STORAGE_HOST}/storage/v1/object/public/${bucket}/${value}`;
}
