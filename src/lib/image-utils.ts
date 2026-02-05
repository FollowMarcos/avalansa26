/**
 * Target file size for prompt images (500KB)
 */
export const PROMPT_IMAGE_MAX_SIZE = 500 * 1024; // 500KB

/**
 * Maximum dimensions for prompt images
 */
export const PROMPT_IMAGE_MAX_DIMENSION = 1200;

/**
 * Resize an image to fit within a target file size (in bytes).
 * Uses iterative quality reduction and dimension scaling to achieve target size.
 * @param file - The input image file.
 * @param targetSizeBytes - Target maximum file size in bytes (default 500KB).
 * @param maxDimension - Maximum width/height dimension (default 1200px).
 * @returns A Promise resolving to the resized Blob and its dimensions.
 */
export async function resizeImageToSize(
  file: File,
  targetSizeBytes: number = PROMPT_IMAGE_MAX_SIZE,
  maxDimension: number = PROMPT_IMAGE_MAX_DIMENSION
): Promise<{ blob: Blob; width: number; height: number }> {
  // If already under size and is an acceptable format, check if we need to resize at all
  if (file.size <= targetSizeBytes && ['image/jpeg', 'image/webp'].includes(file.type)) {
    // Still need to check dimensions
    const dimensions = await getImageDimensions(file);
    if (dimensions.width <= maxDimension && dimensions.height <= maxDimension) {
      return { blob: file, width: dimensions.width, height: dimensions.height };
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read image file'));

    img.onload = async () => {
      try {
        let width = img.width;
        let height = img.height;

        // Scale down to max dimension while maintaining aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try to get under target size by adjusting quality
        let quality = 0.92;
        let blob: Blob | null = null;
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
          blob = await canvasToBlob(canvas, 'image/jpeg', quality);

          if (blob.size <= targetSizeBytes) {
            resolve({ blob, width, height });
            return;
          }

          // Reduce quality for next attempt
          quality -= 0.1;
          attempts++;

          // If quality is too low, also reduce dimensions
          if (quality < 0.5 && attempts < maxAttempts) {
            width = Math.round(width * 0.85);
            height = Math.round(height * 0.85);
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            quality = 0.8; // Reset quality after dimension reduction
          }
        }

        // Return best effort even if over target
        if (blob) {
          resolve({ blob, width, height });
        } else {
          reject(new Error('Failed to resize image'));
        }
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));

    reader.readAsDataURL(file);
  });
}

/**
 * Helper to convert canvas to blob with Promise API
 */
function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas to Blob conversion failed'));
        }
      },
      type,
      quality
    );
  });
}

/**
 * Get dimensions of an image file
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read image'));

    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => reject(new Error('Failed to load image'));

    reader.readAsDataURL(file);
  });
}

/**
 * Resize an image file to a specified dimension and format on the client side.
 * @param file - The input image file.
 * @param maxWidth - The maximum width of the output image.
 * @param maxHeight - The maximum height of the output image.
 * @param quality - The quality of the JPEG output (0 to 1).
 * @returns A Promise resolving to the resized Blob.
 */
export async function resizeImage(
    file: File,
    maxWidth: number = 300,
    maxHeight: number = 300,
    quality: number = 0.8
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };

        reader.onerror = (e) => {
            reject(e);
        };

        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions while maintaining aspect ratio
            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Canvas to Blob conversion failed'));
                    }
                },
                'image/jpeg',
                quality
            );
        };

        reader.readAsDataURL(file);
    });
}
