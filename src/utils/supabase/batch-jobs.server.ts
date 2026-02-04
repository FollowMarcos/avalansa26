'use server';

import { createClient } from '@/utils/supabase/server';
import type {
  BatchJob,
  BatchJobInsert,
  BatchJobUpdate,
  BatchJobRequest,
  BatchJobResult,
} from '@/types/batch-job';
import { getDecryptedApiKey, getApiConfig } from './api-configs.server';
import { getImagesAsBase64, getReferenceImageUrls } from './storage.server';
import { saveGeneration } from './generations.server';

/**
 * Create a new batch job
 */
export async function createBatchJob(
  data: BatchJobInsert
): Promise<BatchJob | null> {
  const supabase = await createClient();

  const { data: job, error } = await supabase
    .from('batch_jobs')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Error creating batch job:', error.message);
    return null;
  }

  return job;
}

/**
 * Get a batch job by ID
 */
export async function getBatchJob(id: string): Promise<BatchJob | null> {
  const supabase = await createClient();

  const { data: job, error } = await supabase
    .from('batch_jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching batch job:', error.message);
    return null;
  }

  return job;
}

/**
 * Get all pending/processing batch jobs for the current user
 */
export async function getPendingBatchJobs(): Promise<BatchJob[]> {
  const supabase = await createClient();

  const { data: jobs, error } = await supabase
    .from('batch_jobs')
    .select('*')
    .in('status', ['pending', 'submitted', 'processing'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending batch jobs:', error.message);
    return [];
  }

  return jobs ?? [];
}

/**
 * Get recent batch jobs for the current user (including completed)
 */
export async function getRecentBatchJobs(limit: number = 20): Promise<BatchJob[]> {
  const supabase = await createClient();

  const { data: jobs, error } = await supabase
    .from('batch_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent batch jobs:', error.message);
    return [];
  }

  return jobs ?? [];
}

/**
 * Update a batch job
 */
export async function updateBatchJob(
  id: string,
  updates: BatchJobUpdate
): Promise<BatchJob | null> {
  const supabase = await createClient();

  const { data: job, error } = await supabase
    .from('batch_jobs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating batch job:', error.message);
    return null;
  }

  return job;
}

/**
 * Cancel a batch job
 */
export async function cancelBatchJob(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('batch_jobs')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .in('status', ['pending', 'submitted', 'processing']);

  if (error) {
    console.error('Error cancelling batch job:', error.message);
    return false;
  }

  return true;
}

/**
 * Submit a batch job to Gemini Batch API
 * This creates the JSONL, uploads it, and starts the batch job
 */
export async function submitGeminiBatchJob(
  batchJobId: string,
  apiConfigId: string,
  requests: BatchJobRequest[]
): Promise<{ success: boolean; providerJobId?: string; error?: string }> {
  try {
    // Get API config and key
    const apiConfig = await getApiConfig(apiConfigId);
    if (!apiConfig) {
      return { success: false, error: 'API config not found' };
    }

    const apiKey = await getDecryptedApiKey(apiConfigId);
    if (!apiKey) {
      return { success: false, error: 'Failed to get API key' };
    }

    // Build JSONL content for batch
    const jsonlLines = requests.map((req, index) => {
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

      // Add prompt
      let promptText = req.prompt;
      if (req.negativePrompt) {
        promptText += `\n\nAvoid: ${req.negativePrompt}`;
      }
      parts.push({ text: promptText });

      // Note: Reference images are fetched during processing, not here
      // This JSONL is for documentation purposes only in this simplified implementation

      // Build request object
      const requestObj = {
        request: {
          contents: [{ parts }],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
          },
        },
      };

      return JSON.stringify(requestObj);
    });

    const jsonlContent = jsonlLines.join('\n');

    // For now, we'll use a simplified approach since the full Batch API
    // requires Google Cloud Storage integration. We'll simulate it with
    // sequential requests but at batch pricing timing.

    // Update job status to submitted
    await updateBatchJob(batchJobId, {
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      // Estimate 1-4 hours for batch processing
      estimated_completion: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    });

    // In a production implementation, you would:
    // 1. Upload JSONL to Google Cloud Storage
    // 2. Call the Batch API to create a job
    // 3. Store the job ID for polling

    // For this implementation, we'll process in the background
    // and return immediately (simulating batch behavior)
    processGeminiBatchInBackground(batchJobId, apiKey, apiConfig.endpoint, apiConfig.model_id, requests);

    return {
      success: true,
      providerJobId: `batch-${batchJobId}`,
    };
  } catch (error) {
    console.error('Error submitting Gemini batch job:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit batch job',
    };
  }
}

/**
 * Process Gemini batch job in background
 * This simulates the batch API behavior by processing sequentially with delays
 */
async function processGeminiBatchInBackground(
  batchJobId: string,
  apiKey: string,
  endpoint: string,
  modelId: string | null,
  requests: BatchJobRequest[]
): Promise<void> {
  try {
    // Get batch job to retrieve user_id and api_config_id
    const batchJob = await getBatchJob(batchJobId);
    if (!batchJob) {
      console.error('Batch job not found:', batchJobId);
      return;
    }

    // Update to processing
    await updateBatchJob(batchJobId, { status: 'processing' });

    const results: BatchJobResult[] = [];

    for (let i = 0; i < requests.length; i++) {
      const req = requests[i];

      try {
        // Build request parts
        const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

        let promptText = req.prompt;
        if (req.negativePrompt) {
          promptText += `\n\nAvoid: ${req.negativePrompt}`;
        }
        parts.push({ text: promptText });

        // Fetch reference images from storage
        if (req.referenceImagePaths && req.referenceImagePaths.length > 0) {
          const referenceImages = await getImagesAsBase64(req.referenceImagePaths);
          for (const base64Image of referenceImages) {
            const mimeMatch = base64Image.match(/^data:([^;]+);base64,/);
            const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
            const data = mimeMatch ? base64Image.replace(/^data:[^;]+;base64,/, '') : base64Image;
            parts.push({ inlineData: { mimeType, data } });
          }
        }

        const requestBody = {
          contents: [{ parts }],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
          },
        };

        const apiEndpoint = endpoint || `https://generativelanguage.googleapis.com/v1beta/models/${modelId || 'gemini-2.0-flash-exp-image-generation'}:generateContent`;

        const response = await fetch(`${apiEndpoint}?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          results.push({
            requestIndex: i,
            success: false,
            error: `API error: ${errorText}`,
          });
          continue;
        }

        const data = await response.json();

        // Extract image from response
        if (data.candidates && data.candidates[0]?.content?.parts) {
          for (const part of data.candidates[0].content.parts) {
            if (part.inlineData) {
              const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              results.push({
                requestIndex: i,
                success: true,
                imageUrl: dataUrl,
                imageBase64: part.inlineData.data,
              });

              // Get reference image URLs if any were used
              const referenceImageInfo = req.referenceImagePaths && req.referenceImagePaths.length > 0
                ? await getReferenceImageUrls(req.referenceImagePaths)
                : [];

              // Save to user's generation history
              await saveGeneration({
                user_id: batchJob.user_id,
                api_config_id: batchJob.api_config_id,
                prompt: req.prompt,
                negative_prompt: req.negativePrompt,
                image_url: dataUrl,
                settings: {
                  aspectRatio: req.aspectRatio,
                  imageSize: req.imageSize,
                  generationSpeed: 'relaxed',
                  referenceImages: referenceImageInfo.length > 0 ? referenceImageInfo : undefined,
                },
              });

              break; // Only take first image per request
            }
          }
        } else {
          results.push({
            requestIndex: i,
            success: false,
            error: 'No image in response',
          });
        }

        // Add delay between requests to simulate batch processing
        // and respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        results.push({
          requestIndex: i,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Update job with results
    await updateBatchJob(batchJobId, {
      status: 'completed',
      results,
      completed_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error processing batch job:', error);
    await updateBatchJob(batchJobId, {
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Processing failed',
      completed_at: new Date().toISOString(),
    });
  }
}

/**
 * Check status of a batch job
 * Returns the current status and results if available
 */
export async function checkBatchJobStatus(
  batchJobId: string
): Promise<{ status: string; results?: BatchJobResult[]; error?: string } | null> {
  const job = await getBatchJob(batchJobId);

  if (!job) {
    return null;
  }

  return {
    status: job.status,
    results: job.results ?? undefined,
    error: job.error_message ?? undefined,
  };
}
