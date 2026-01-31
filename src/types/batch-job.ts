/**
 * Batch Job Types
 *
 * Types for tracking async generation jobs (e.g., Gemini Batch API)
 */

export type BatchJobStatus =
  | 'pending'      // Job created, not yet submitted
  | 'submitted'    // Submitted to provider
  | 'processing'   // Being processed by provider
  | 'completed'    // Successfully completed
  | 'failed'       // Job failed
  | 'cancelled';   // Cancelled by user

export interface BatchJobRequest {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: string;
  imageSize?: string;
  referenceImages?: string[]; // Base64 encoded
}

export interface BatchJobResult {
  requestIndex: number;
  success: boolean;
  imageUrl?: string;
  imageBase64?: string;
  error?: string;
}

export interface BatchJob {
  id: string;
  user_id: string;
  api_config_id: string | null;
  provider_job_id: string | null;
  status: BatchJobStatus;
  requests: BatchJobRequest[];
  results: BatchJobResult[] | null;
  error_message: string | null;
  created_at: string;
  submitted_at: string | null;
  completed_at: string | null;
  estimated_completion: string | null;
}

export interface BatchJobInsert {
  user_id: string;
  api_config_id: string;
  requests: BatchJobRequest[];
  status?: BatchJobStatus;
}

export interface BatchJobUpdate {
  provider_job_id?: string;
  status?: BatchJobStatus;
  results?: BatchJobResult[];
  error_message?: string;
  submitted_at?: string;
  completed_at?: string;
  estimated_completion?: string;
}
