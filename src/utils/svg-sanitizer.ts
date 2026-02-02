/**
 * SVG Sanitization Utility
 *
 * SECURITY NOTE: This function provides basic SVG sanitization for hardcoded presets.
 * For user-uploaded SVG content, use a proper library like DOMPurify.
 */

// Dangerous SVG tags and attributes that could execute scripts
const DANGEROUS_TAGS = ['script', 'iframe', 'object', 'embed', 'link'];
const DANGEROUS_ATTRIBUTES = ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseenter'];
const DANGEROUS_PROTOCOLS = ['javascript:', 'data:text/html'];

/**
 * Basic SVG sanitization for hardcoded preset content
 * This is a lightweight check since we control the preset sources
 *
 * @param svg - SVG string to sanitize
 * @returns Sanitized SVG string
 */
export function sanitizeSvg(svg: string): string {
  // Remove any script tags
  let sanitized = svg;

  // Remove dangerous tags
  DANGEROUS_TAGS.forEach((tag) => {
    const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gis');
    sanitized = sanitized.replace(regex, '');
  });

  // Remove dangerous event handlers
  DANGEROUS_ATTRIBUTES.forEach((attr) => {
    const regex = new RegExp(`${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  // Remove javascript: and data:text/html protocols
  DANGEROUS_PROTOCOLS.forEach((protocol) => {
    const regex = new RegExp(protocol, 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  return sanitized;
}

/**
 * Safe component props for rendering SVG content
 * Use this to render preset SVG content with basic sanitization
 */
export interface SafeSvgProps {
  svg: string;
  className?: string;
  ariaHidden?: boolean;
}

/**
 * Get sanitized SVG for rendering
 *
 * IMPORTANT: This is designed for trusted, hardcoded preset content only.
 * For user-uploaded SVG, install and use DOMPurify:
 *
 * ```bash
 * npm install dompurify @types/dompurify
 * ```
 *
 * ```typescript
 * import DOMPurify from 'dompurify';
 * const clean = DOMPurify.sanitize(userSvg);
 * ```
 */
export function getSanitizedSvgHtml(svg: string): { __html: string } {
  return { __html: sanitizeSvg(svg) };
}

/**
 * Validate SVG is from trusted source (preset avatars)
 * Returns true only if SVG appears to be from our preset collection
 */
export function isPresetSvg(svg: string): boolean {
  // Check for our preset SVG characteristics
  // All our presets start with <svg and contain viewBox
  if (!svg.trim().startsWith('<svg') || !svg.includes('viewBox')) {
    return false;
  }

  // Additional safety: Check it doesn't contain dangerous content
  const hasDangerousTags = DANGEROUS_TAGS.some((tag) =>
    svg.toLowerCase().includes(`<${tag}`)
  );
  const hasDangerousAttrs = DANGEROUS_ATTRIBUTES.some((attr) =>
    svg.toLowerCase().includes(attr)
  );
  const hasDangerousProtocols = DANGEROUS_PROTOCOLS.some((protocol) =>
    svg.toLowerCase().includes(protocol)
  );

  return !hasDangerousTags && !hasDangerousAttrs && !hasDangerousProtocols;
}
