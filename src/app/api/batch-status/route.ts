import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getBatchJob, getPendingBatchJobs, getRecentBatchJobs } from '@/utils/supabase/batch-jobs.server';

export interface BatchStatusResponse {
  success: boolean;
  job?: {
    id: string;
    status: string;
    results?: Array<{
      requestIndex: number;
      success: boolean;
      imageUrl?: string;
      error?: string;
    }>;
    error?: string;
    createdAt: string;
    completedAt?: string;
    estimatedCompletion?: string;
  };
  jobs?: Array<{
    id: string;
    status: string;
    createdAt: string;
    completedAt?: string;
  }>;
  error?: string;
}

/**
 * GET /api/batch-status?id=<jobId>
 * Get status of a specific batch job
 *
 * GET /api/batch-status?pending=true
 * Get all pending batch jobs for the current user
 *
 * GET /api/batch-status?recent=true
 * Get recent batch jobs for the current user
 */
export async function GET(request: NextRequest): Promise<NextResponse<BatchStatusResponse>> {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('id');
    const pending = searchParams.get('pending');
    const recent = searchParams.get('recent');

    // Get specific job
    if (jobId) {
      const job = await getBatchJob(jobId);

      if (!job) {
        return NextResponse.json(
          { success: false, error: 'Batch job not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        job: {
          id: job.id,
          status: job.status,
          results: job.results ?? undefined,
          error: job.error_message ?? undefined,
          createdAt: job.created_at,
          completedAt: job.completed_at ?? undefined,
          estimatedCompletion: job.estimated_completion ?? undefined,
        },
      });
    }

    // Get pending jobs
    if (pending === 'true') {
      const jobs = await getPendingBatchJobs();

      return NextResponse.json({
        success: true,
        jobs: jobs.map(job => ({
          id: job.id,
          status: job.status,
          createdAt: job.created_at,
          completedAt: job.completed_at ?? undefined,
        })),
      });
    }

    // Get recent jobs
    if (recent === 'true') {
      const jobs = await getRecentBatchJobs(20);

      return NextResponse.json({
        success: true,
        jobs: jobs.map(job => ({
          id: job.id,
          status: job.status,
          createdAt: job.created_at,
          completedAt: job.completed_at ?? undefined,
        })),
      });
    }

    return NextResponse.json(
      { success: false, error: 'Missing required parameter: id, pending, or recent' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Batch status error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get batch status' },
      { status: 500 }
    );
  }
}
