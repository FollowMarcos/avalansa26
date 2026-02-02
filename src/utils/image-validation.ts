/**
 * Image validation utilities with magic byte checking
 * Prevents malicious file uploads by validating file signatures
 */

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'] as const;

// Maximum file sizes (in bytes)
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
export const MAX_REFERENCE_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate image file magic bytes (file signature)
 * This prevents attackers from uploading malicious files with fake extensions
 */
function validateMagicBytes(header: Uint8Array): boolean {
  // JPEG: FF D8 FF
  if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4E &&
    header[3] === 0x47 &&
    header[4] === 0x0D &&
    header[5] === 0x0A &&
    header[6] === 0x1A &&
    header[7] === 0x0A
  ) {
    return true;
  }

  // GIF: 47 49 46 38 (GIF8)
  if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38) {
    return true;
  }

  // WebP: 52 49 46 46 ... 57 45 42 50 (RIFF...WEBP)
  if (
    header[0] === 0x52 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x46 &&
    header[8] === 0x57 &&
    header[9] === 0x45 &&
    header[10] === 0x42 &&
    header[11] === 0x50
  ) {
    return true;
  }

  return false;
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Comprehensive image file validation
 * - Checks MIME type
 * - Validates file extension
 * - Verifies magic bytes
 * - Enforces size limits
 */
export async function validateImageFile(
  file: File,
  maxSize: number = MAX_AVATAR_SIZE
): Promise<ImageValidationResult> {
  // 1. Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.',
    };
  }

  // 2. Validate file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
  if (!hasValidExtension) {
    return {
      valid: false,
      error: 'Invalid file extension. Only .jpg, .jpeg, .png, .webp, and .gif are allowed.',
    };
  }

  // 3. Check file size
  if (file.size > maxSize) {
    const maxSizeMB = Math.floor(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxSizeMB}MB.`,
    };
  }

  // 4. Validate magic bytes (file signature)
  try {
    const arrayBuffer = await file.slice(0, 12).arrayBuffer();
    const header = new Uint8Array(arrayBuffer);

    if (!validateMagicBytes(header)) {
      return {
        valid: false,
        error: 'File is corrupted or not a valid image. Magic byte validation failed.',
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to read file. Please try a different image.',
    };
  }

  return { valid: true };
}

/**
 * Validate multiple image files (for batch uploads)
 */
export async function validateImageFiles(
  files: File[],
  maxSize: number = MAX_REFERENCE_IMAGE_SIZE
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await validateImageFile(files[i], maxSize);
    if (!result.valid && result.error) {
      errors.push(`File ${i + 1} (${files[i].name}): ${result.error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
