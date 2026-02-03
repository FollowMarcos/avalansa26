/**
 * Canvas Export Utilities
 *
 * Functions for exporting React Flow canvas as images
 */

import { toPng, toJpeg } from 'html-to-image';
import { saveAs } from 'file-saver';

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
 * Export canvas element as PNG
 */
export async function exportCanvasAsPng(
  element: HTMLElement,
  filename: string = 'canvas',
  options: CanvasExportOptions = {}
): Promise<void> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  try {
    const dataUrl = await toPng(element, {
      pixelRatio: mergedOptions.pixelRatio,
      backgroundColor: mergedOptions.backgroundColor,
      filter: createFilter(mergedOptions),
      cacheBust: true,
    });

    // Create download
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Failed to export canvas as PNG:', error);
    throw new Error('Failed to export canvas');
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

  try {
    const dataUrl = await toJpeg(element, {
      quality: mergedOptions.quality,
      pixelRatio: mergedOptions.pixelRatio,
      backgroundColor: mergedOptions.backgroundColor,
      filter: createFilter(mergedOptions),
      cacheBust: true,
    });

    // Create download
    const link = document.createElement('a');
    link.download = `${filename}.jpg`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Failed to export canvas as JPEG:', error);
    throw new Error('Failed to export canvas');
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
