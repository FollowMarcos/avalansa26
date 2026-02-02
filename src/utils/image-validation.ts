/**
 * SECURE Image validation utilities with comprehensive checks
 *
 * Security improvements:
 * - Added dimension validation (prevents image bombs)
 * - Added zero-byte file check
 * - Added aspect ratio validation
 * - Better error messages
 */

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'] as const;

// Maximum file sizes (in bytes)
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
export const MAX_REFERENCE_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

// Maximum dimensions (prevents decompression bombs)
export const MAX_IMAGE_WIDTH = 4096;
export const MAX_IMAGE_HEIGHT = 4096;
export const MIN_IMAGE_WIDTH = 1;
export const MIN_IMAGE_HEIGHT = 1;

/**
 * Validate image file magic bytes (file signature)
 * This prevents attackers from uploading malicious files with fake extensions
 */
function validateMagicBytes(header: Uint8Array): boolean {
  // JPEG: FF D8 FF
  if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47 &&
    header[4] === 0x0d &&
    header[5] === 0x0a &&
    header[6] === 0x1a &&
    header[7] === 0x0a
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
  dimensions?: { width: number; height: number };
}

/**
 * Comprehensive image file validation with dimension checking
 *
 * Validates:
 * - MIME type (allowlist)
 * - File extension (allowlist)
 * - Magic bytes (file signature)
 * - File size (min/max)
 * - Image dimensions (prevents bombs)
 * - Image can be decoded
 */
export async function validateImageFile(
  file: File,
  maxSize: number = MAX_AVATAR_SIZE,
  maxDimensions: { width: number; height: number } = {
    width: MAX_IMAGE_WIDTH,
    height: MAX_IMAGE_HEIGHT,
  }
): Promise<ImageValidationResult> {
  // 0. Check for zero-byte file
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty (0 bytes).',
    };
  }

  // 1. Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
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
      error: 'Failed to read file header. Please try a different image.',
    };
  }

  // 5. Validate image dimensions (prevents decompression bombs)
  try {
    // Use createImageBitmap to decode and get dimensions
    const imageBitmap = await createImageBitmap(file);

    // Check dimensions are non-zero
    if (imageBitmap.width === 0 || imageBitmap.height === 0) {
      imageBitmap.close();
      return {
        valid: false,
        error: 'Invalid image dimensions (width or height is 0).',
      };
    }

    // Check dimensions don't exceed limits (prevents image bombs)
    if (imageBitmap.width > maxDimensions.width || imageBitmap.height > maxDimensions.height) {
      imageBitmap.close();
      return {
        valid: false,
        error: `Image dimensions too large. Maximum: ${maxDimensions.width}x${maxDimensions.height}px. Yours: ${imageBitmap.width}x${imageBitmap.height}px`,
      };
    }

    // Check minimum dimensions
    if (imageBitmap.width < MIN_IMAGE_WIDTH || imageBitmap.height < MIN_IMAGE_HEIGHT) {
      imageBitmap.close();
      return {
        valid: false,
        error: `Image too small. Minimum: ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT}px.`,
      };
    }

    const dimensions = { width: imageBitmap.width, height: imageBitmap.height };
    imageBitmap.close();

    return { valid: true, dimensions };
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to decode image. File may be corrupted or in an unsupported format.',
    };
  }
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

/**
 * Additional validation for avatar images (stricter)
 * - Enforces square or near-square aspect ratios
 * - Smaller file size limits
 */
export async function validateAvatarImage(file: File): Promise<ImageValidationResult> {
  const result = await validateImageFile(file, MAX_AVATAR_SIZE, {
    width: 2048, // Avatars don't need to be huge
    height: 2048,
  });

  if (!result.valid) {
    return result;
  }

  // Check aspect ratio for avatars (should be roughly square)
  if (result.dimensions) {
    const { width, height } = result.dimensions;
    const aspectRatio = width / height;

    // Allow aspect ratios between 1:2 and 2:1
    if (aspectRatio < 0.5 || aspectRatio > 2) {
      return {
        valid: false,
        error: 'Avatar must have a roughly square aspect ratio (between 1:2 and 2:1).',
      };
    }
  }

  return result;
}
