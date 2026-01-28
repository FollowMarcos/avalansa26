import { z } from 'zod';

/**
 * Username validation schema
 * - 3-20 characters
 * - Alphanumeric + underscores only
 * - Must start with a letter
 * - Converted to lowercase
 */
export const usernameSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(
      /^[a-zA-Z][a-zA-Z0-9_]*$/,
      'Username must start with a letter and contain only letters, numbers, and underscores'
    )
    .transform((val) => val.toLowerCase()),
});

/**
 * Bio validation schema
 * - Optional but max 200 chars when provided
 */
export const bioSchema = z.object({
  bio: z
    .string()
    .max(200, 'Bio must be at most 200 characters')
    .optional()
    .or(z.literal('')),
});

/**
 * Interests validation schema
 * - Array of strings
 * - Each tag 1-30 chars
 * - Max 10 tags
 */
export const interestsSchema = z.object({
  interests: z
    .array(
      z
        .string()
        .min(1, 'Tag cannot be empty')
        .max(30, 'Tag must be at most 30 characters')
    )
    .max(10, 'Maximum 10 interests allowed'),
});

export type UsernameFormData = z.infer<typeof usernameSchema>;
export type BioFormData = z.infer<typeof bioSchema>;
export type InterestsFormData = z.infer<typeof interestsSchema>;
