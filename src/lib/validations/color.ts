/**
 * Validate and sanitize CSS color values from user/database input.
 * Prevents CSS injection via inline style attributes.
 *
 * Only allows:
 * - Hex colors: #fff, #ffffff, #ffffffff (with alpha)
 * - Named CSS colors are NOT allowed (too many to allowlist safely)
 */
const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function isValidCssColor(color: string | null | undefined): boolean {
  if (!color) return false;
  return HEX_COLOR_PATTERN.test(color.trim());
}

/**
 * Returns the color if valid, otherwise returns the fallback.
 * Use this when passing database-sourced colors to inline styles.
 */
export function safeColor(
  color: string | null | undefined,
  fallback?: string
): string | undefined {
  if (!color) return fallback;
  return isValidCssColor(color) ? color.trim() : fallback;
}
