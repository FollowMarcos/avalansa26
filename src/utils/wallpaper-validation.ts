export const MAX_WALLPAPER_SIZE = 50 * 1024 * 1024; // 50MB
export const MIN_WALLPAPER_WIDTH = 1280;
export const MIN_WALLPAPER_HEIGHT = 720;
export const MAX_WALLPAPER_WIDTH = 15360;
export const MAX_WALLPAPER_HEIGHT = 15360;

export const ALLOWED_WALLPAPER_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateWallpaperFile(file: File): ValidationResult {
  if (!ALLOWED_WALLPAPER_TYPES.has(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed.' };
  }

  if (file.size > MAX_WALLPAPER_SIZE) {
    return { valid: false, error: `File size must be under ${MAX_WALLPAPER_SIZE / 1024 / 1024}MB.` };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty.' };
  }

  return { valid: true };
}

export function validateWallpaperDimensions(
  width: number,
  height: number
): ValidationResult {
  if (width < MIN_WALLPAPER_WIDTH || height < MIN_WALLPAPER_HEIGHT) {
    return {
      valid: false,
      error: `Minimum resolution is ${MIN_WALLPAPER_WIDTH}x${MIN_WALLPAPER_HEIGHT}.`,
    };
  }

  if (width > MAX_WALLPAPER_WIDTH || height > MAX_WALLPAPER_HEIGHT) {
    return {
      valid: false,
      error: `Maximum resolution is ${MAX_WALLPAPER_WIDTH}x${MAX_WALLPAPER_HEIGHT}.`,
    };
  }

  return { valid: true };
}

export function computeAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const w = width / divisor;
  const h = height / divisor;

  // Map common ratios to standard names
  const ratio = w / h;
  if (Math.abs(ratio - 16 / 9) < 0.02) return '16:9';
  if (Math.abs(ratio - 16 / 10) < 0.02) return '16:10';
  if (Math.abs(ratio - 4 / 3) < 0.02) return '4:3';
  if (Math.abs(ratio - 21 / 9) < 0.02) return '21:9';
  if (Math.abs(ratio - 32 / 9) < 0.02) return '32:9';
  if (Math.abs(ratio - 3 / 2) < 0.02) return '3:2';
  if (Math.abs(ratio - 1) < 0.02) return '1:1';
  if (Math.abs(ratio - 9 / 16) < 0.02) return '9:16';

  return `${w}:${h}`;
}

export function getResolutionCategory(
  width: number,
  height: number
): string {
  const pixels = width * height;

  if (pixels >= 7680 * 4320) return '8K';
  if (pixels >= 5120 * 2880) return '5K';
  if (pixels >= 3840 * 2160) return '4K';
  if (pixels >= 2560 * 1440) return '2K';
  if (pixels >= 1920 * 1080) return 'Full HD';
  return 'HD';
}

export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image.'));
    };

    img.src = url;
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
