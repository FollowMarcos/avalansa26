/**
 * SECURE SVG Sanitization using DOMPurify
 *
 * CRITICAL SECURITY IMPROVEMENTS:
 * - Uses DOMPurify (battle-tested, prevents 100+ XSS vectors)
 * - Proper DOM parsing (not regex)
 * - Mutation XSS protection
 * - Comprehensive allowlists
 *
 * To install:
 * npm install isomorphic-dompurify
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize SVG using DOMPurify with strict SVG profile
 *
 * This is safe for user-uploaded SVG content.
 *
 * @param svg - SVG string to sanitize
 * @returns Sanitized SVG string
 */
export function sanitizeSvg(svg: string): string {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },

    // Block dangerous tags that can execute scripts
    FORBID_TAGS: [
      'script',
      'iframe',
      'object',
      'embed',
      'link',
      'foreignObject', // Can contain arbitrary HTML
      'use', // Can reference external resources (SSRF)
    ],

    // Block event handlers and dangerous attributes
    FORBID_ATTR: [
      'onerror',
      'onload',
      'onclick',
      'onmouseover',
      'onmouseenter',
      'onmouseleave',
      'onmousedown',
      'onmouseup',
      'onanimationend',
      'onanimationiteration',
      'onanimationstart',
      'ontransitionend',
      'onbegin',
      'onend',
      'onrepeat',
      'xlink:href', // Block external references
      'href', // We'll allow this but sanitize URLs
    ],

    // Sanitize URLs in remaining allowed attributes
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,

    // Allow data URIs only for images (not for scripts)
    ADD_DATA_URI_TAGS: ['image'],

    // Return as string
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,

    // Keep safe HTML/SVG structure
    KEEP_CONTENT: false,

    // Additional safety
    FORCE_BODY: false,
    SANITIZE_DOM: true,
    SAFE_FOR_TEMPLATES: true,
  });
}

/**
 * Sanitize preset SVG (even stricter - for hardcoded presets only)
 *
 * Only allows basic SVG shapes, no external references, no styles
 */
export function sanitizePresetSvg(svg: string): string {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true },

    // Only allow these specific tags for presets
    ALLOWED_TAGS: [
      'svg',
      'path',
      'circle',
      'ellipse',
      'rect',
      'line',
      'polyline',
      'polygon',
      'g',
      'defs',
      'clipPath',
      'linearGradient',
      'radialGradient',
      'stop',
    ],

    // Only allow these specific attributes
    ALLOWED_ATTR: [
      'viewBox',
      'width',
      'height',
      'fill',
      'stroke',
      'stroke-width',
      'stroke-linecap',
      'stroke-linejoin',
      'd',
      'cx',
      'cy',
      'r',
      'rx',
      'ry',
      'x',
      'y',
      'x1',
      'y1',
      'x2',
      'y2',
      'points',
      'transform',
      'id',
      'class',
      'opacity',
      'fill-opacity',
      'stroke-opacity',
      'clip-path',
      'offset',
      'stop-color',
      'stop-opacity',
    ],

    // No external references at all
    FORBID_TAGS: ['use', 'script', 'foreignObject', 'image', 'a', 'style', 'link'],

    KEEP_CONTENT: false,
    SANITIZE_DOM: true,
  });
}

/**
 * Validate SVG is safe for display
 *
 * Additional validation beyond sanitization
 */
export function validateSvg(svg: string): { valid: boolean; error?: string } {
  // Check minimum requirements
  if (!svg || svg.trim().length === 0) {
    return { valid: false, error: 'SVG is empty' };
  }

  // Check maximum size (prevent DoS)
  const MAX_SVG_SIZE = 1024 * 1024; // 1MB
  if (svg.length > MAX_SVG_SIZE) {
    return { valid: false, error: 'SVG file too large (max 1MB)' };
  }

  // Must start with <svg
  if (!svg.trim().startsWith('<svg')) {
    return { valid: false, error: 'Invalid SVG format (must start with <svg)' };
  }

  // Must have viewBox or width/height
  if (!svg.includes('viewBox') && !svg.includes('width=')) {
    return { valid: false, error: 'SVG must have viewBox or width/height attributes' };
  }

  // Check for suspicious patterns (additional safety)
  const suspiciousPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /data:text\/html/i,
    /<iframe[^>]*>/i,
    /on\w+\s*=/i, // Event handlers
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(svg)) {
      return {
        valid: false,
        error: 'SVG contains potentially dangerous content',
      };
    }
  }

  return { valid: true };
}

/**
 * Complete SVG validation and sanitization pipeline
 */
export async function processSvg(
  svg: string,
  options: { isPreset?: boolean } = {}
): Promise<{ success: boolean; sanitized?: string; error?: string }> {
  // 1. Validate
  const validation = validateSvg(svg);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    // 2. Sanitize
    const sanitized = options.isPreset ? sanitizePresetSvg(svg) : sanitizeSvg(svg);

    // 3. Verify sanitization didn't destroy the SVG
    if (!sanitized || sanitized.trim().length === 0) {
      return { success: false, error: 'SVG sanitization resulted in empty output' };
    }

    // 4. Final validation after sanitization
    const finalValidation = validateSvg(sanitized);
    if (!finalValidation.valid) {
      return { success: false, error: 'SVG failed validation after sanitization' };
    }

    return { success: true, sanitized };
  } catch (error) {
    return {
      success: false,
      error: `Sanitization error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Safe component props for rendering SVG content
 */
export interface SafeSvgProps {
  svg: string;
  className?: string;
  ariaHidden?: boolean;
}

/**
 * Get sanitized SVG for use with dangerouslySetInnerHTML
 *
 * @param svg - Raw SVG string
 * @param isPreset - Whether this is a trusted preset (uses stricter rules)
 * @returns Object with __html property for React
 */
export function getSanitizedSvgHtml(
  svg: string,
  isPreset: boolean = false
): { __html: string } {
  const sanitized = isPreset ? sanitizePresetSvg(svg) : sanitizeSvg(svg);
  return { __html: sanitized };
}

/**
 * Example usage in React component:
 *
 * ```tsx
 * import { getSanitizedSvgHtml } from '@/utils/svg-sanitizer.secure';
 *
 * function SafeSvgComponent({ userSvg }: { userSvg: string }) {
 *   const sanitizedSvg = getSanitizedSvgHtml(userSvg);
 *   return <div dangerouslySetInnerHTML={sanitizedSvg} />;
 * }
 * ```
 */

// ============================================================================
// TESTING UTILITIES
// ============================================================================

/**
 * XSS test vectors for SVG sanitization testing
 *
 * All of these should be sanitized/blocked
 */
export const XSS_TEST_VECTORS = [
  // Script tags
  '<svg><script>alert(1)</script></svg>',
  '<svg><script xlink:href="data:text/javascript,alert(1)"/></svg>',

  // Event handlers
  '<svg><circle onload="alert(1)" cx="50" cy="50" r="40"/></svg>',
  '<svg><animate onbegin="alert(1)" attributeName="x" dur="1s"/></svg>',

  // Foreign objects
  '<svg><foreignObject><body xmlns="http://www.w3.org/1999/xhtml"><script>alert(1)</script></body></foreignObject></svg>',

  // External references
  '<svg><use href="javascript:alert(1)"/></svg>',
  '<svg><use href="data:text/html,<script>alert(1)</script>"/></svg>',

  // CSS injection
  '<svg><style>* { background: url("javascript:alert(1)"); }</style></svg>',

  // HTML entities
  '<svg><script>&#97;&#108;&#101;&#114;&#116;&#40;&#49;&#41;</script></svg>',

  // CDATA
  '<svg><![CDATA[<script>alert(1)</script>]]></svg>',

  // Nested tags (mutation XSS)
  '<svg><scr<script>ipt>alert(1)</script></svg>',
];

/**
 * Run XSS tests against sanitizer
 * Use this in your test suite
 */
export function testSanitizer(): { passed: number; failed: number; failures: string[] } {
  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const vector of XSS_TEST_VECTORS) {
    const sanitized = sanitizeSvg(vector);

    // Check if dangerous content was removed
    const stillDangerous =
      sanitized.includes('<script') ||
      sanitized.includes('javascript:') ||
      sanitized.includes('onerror=') ||
      sanitized.includes('onload=') ||
      sanitized.includes('<foreignObject');

    if (stillDangerous) {
      failed++;
      failures.push(`Failed to sanitize: ${vector.slice(0, 100)}...`);
    } else {
      passed++;
    }
  }

  return { passed, failed, failures };
}
