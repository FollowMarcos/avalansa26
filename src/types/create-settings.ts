export type ImageSize = '0.5K' | '1K' | '2K' | '4K';

export type AspectRatio =
  | '1:1'
  | '2:3' | '3:2'
  | '3:4' | '4:3'
  | '4:5' | '5:4'
  | '9:16' | '16:9'
  | '21:9'
  | '1:4' | '4:1'
  | '1:8' | '8:1';

export interface CreateSettings {
  id: string;
  allowed_image_sizes: ImageSize[];
  max_output_count: number;
  allowed_aspect_ratios: AspectRatio[];
  maintenance_mode: boolean;
  maintenance_message: string | null;
  allow_fast_mode: boolean;
  allow_relaxed_mode: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSettingsUpdate {
  allowed_image_sizes?: ImageSize[];
  max_output_count?: number;
  allowed_aspect_ratios?: AspectRatio[];
  maintenance_mode?: boolean;
  maintenance_message?: string | null;
  allow_fast_mode?: boolean;
  allow_relaxed_mode?: boolean;
}

// Base options for admin UI (model-exclusive options are handled separately)
export const ALL_IMAGE_SIZES: ImageSize[] = ['1K', '2K', '4K'];

export const ALL_ASPECT_RATIOS: AspectRatio[] = [
  '1:1',
  '2:3',
  '3:2',
  '3:4',
  '4:3',
  '4:5',
  '5:4',
  '9:16',
  '16:9',
  '21:9',
];

/** Aspect ratios only available for gemini-3.1-flash-image-preview */
export const FLASH_31_ONLY_ASPECT_RATIOS: AspectRatio[] = ['1:4', '4:1', '1:8', '8:1'];

/** Image sizes only available for gemini-3.1-flash-image-preview */
export const FLASH_31_ONLY_IMAGE_SIZES: ImageSize[] = ['0.5K'];
