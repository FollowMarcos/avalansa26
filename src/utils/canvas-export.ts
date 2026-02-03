/**
 * Canvas Export Utilities
 *
 * Functions for exporting React Flow canvas as images
 */

import { toPng, toJpeg } from 'html-to-image';

export interface CanvasExportOptions {
  quality?: number;
  pixelRatio?: number;
  backgroundColor?: string;
  includeControls?: boolean;
  includeMinimap?: boolean;
}

const DEFAULT_OPTIONS: CanvasExportOptions = {
  quality: 0.95,
  pixelRatio: 2,
  backgroundColor: '#ffffff',
  includeControls: false,
  includeMinimap: false,
};

/**
 * Filter function to exclude React Flow UI elements from screenshot
 */
function createFilter(options: CanvasExportOptions) {
  return (node: HTMLElement): boolean => {
    const className = node.className;
    if (typeof className !== 'string') return true;

    // Always exclude attribution
    if (className.includes('react-flow__attribution')) return false;

    // Optionally exclude controls
    if (!options.includeControls && className.includes('react-flow__controls')) {
      return false;
    }

    // Optionally exclude minimap
    if (!options.includeMinimap && className.includes('react-flow__minimap')) {
      return false;
    }

    return true;
  };
}

/**
 * Fetch an image and convert to data URL to bypass CORS
 */
async function fetchAsDataUrl(url: string): Promise<string> {
  try {
    // Use our proxy endpoint for external images
    const isExternal = !url.startsWith(window.location.origin) && !url.startsWith('data:');
    const fetchUrl = isExternal ? `/api/proxy-image?url=${encodeURIComponent(url)}` : url;

    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn(`Could not fetch image ${url}:`, error);
    // Return a placeholder or the original URL
    return url;
  }
}

/**
 * Pre-process images in the element to convert external URLs to data URLs
 * This bypasses CORS restrictions when capturing the canvas
 */
async function preprocessImages(element: HTMLElement): Promise<Map<HTMLImageElement, string>> {
  const images = element.querySelectorAll('img');
  const originalSrcs = new Map<HTMLImageElement, string>();

  await Promise.all(
    Array.from(images).map(async (img) => {
      const src = img.src;
      if (src && !src.startsWith('data:')) {
        originalSrcs.set(img, src);
        try {
          const dataUrl = await fetchAsDataUrl(src);
          img.src = dataUrl;
        } catch (error) {
          console.warn(`Could not convert image to data URL: ${src}`);
        }
      }
    })
  );

  return originalSrcs;
}

/**
 * Restore original image sources after export
 */
function restoreImages(originalSrcs: Map<HTMLImageElement, string>): void {
  originalSrcs.forEach((src, img) => {
    img.src = src;
  });
}

/**
 * Export canvas element as PNG
 */
export async function exportCanvasAsPng(
  element: HTMLElement,
  filename: string = 'canvas',
  options: CanvasExportOptions = {}
): Promise<void> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  // Pre-process images to handle CORS
  const originalSrcs = await preprocessImages(element);

  try {
    const exportOptions: Parameters<typeof toPng>[1] = {
      pixelRatio: mergedOptions.pixelRatio,
      backgroundColor: mergedOptions.backgroundColor,
      filter: createFilter(mergedOptions),
      cacheBust: true,
      skipFonts: true, // Skip font loading which can cause issues
      includeQueryParams: true,
    };

    const dataUrl = await toPng(element, exportOptions);

    // Create download
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Failed to export canvas as PNG:', error);
    throw new Error(
      error instanceof Error
        ? `Export failed: ${error.message}`
        : 'Failed to export canvas. This may be due to cross-origin image restrictions.'
    );
  } finally {
    // Always restore original image sources
    restoreImages(originalSrcs);
  }
}

/**
 * Export canvas element as JPEG
 */
export async function exportCanvasAsJpeg(
  element: HTMLElement,
  filename: string = 'canvas',
  options: CanvasExportOptions = {}
): Promise<void> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  // Pre-process images to handle CORS
  const originalSrcs = await preprocessImages(element);

  try {
    const exportOptions: Parameters<typeof toPng>[1] = {
      quality: mergedOptions.quality,
      pixelRatio: mergedOptions.pixelRatio,
      backgroundColor: mergedOptions.backgroundColor,
      filter: createFilter(mergedOptions),
      cacheBust: true,
      skipFonts: true,
      includeQueryParams: true,
    };

    const dataUrl = await toJpeg(element, exportOptions);

    // Create download
    const link = document.createElement('a');
    link.download = `${filename}.jpg`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Failed to export canvas as JPEG:', error);
    throw new Error(
      error instanceof Error
        ? `Export failed: ${error.message}`
        : 'Failed to export canvas. This may be due to cross-origin image restrictions.'
    );
  } finally {
    // Always restore original image sources
    restoreImages(originalSrcs);
  }
}

/**
 * Export canvas element as blob (for further processing)
 */
export async function exportCanvasAsBlob(
  element: HTMLElement,
  format: 'png' | 'jpeg' = 'png',
  options: CanvasExportOptions = {}
): Promise<Blob> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  try {
    const exportFn = format === 'png' ? toPng : toJpeg;
    const dataUrl = await exportFn(element, {
      quality: mergedOptions.quality,
      pixelRatio: mergedOptions.pixelRatio,
      backgroundColor: mergedOptions.backgroundColor,
      filter: createFilter(mergedOptions),
      cacheBust: true,
    });

    // Convert data URL to blob
    const response = await fetch(dataUrl);
    return await response.blob();
  } catch (error) {
    console.error('Failed to export canvas as blob:', error);
    throw new Error('Failed to export canvas');
  }
}
