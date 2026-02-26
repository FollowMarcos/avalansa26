import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { configureBucketCors } from '@/utils/r2/client';

/**
 * One-time setup endpoint to configure CORS on the R2 bucket.
 * Only callable by admin users.
 *
 * POST /api/setup/r2-cors
 * Body: { origins: ["https://yourdomain.com", "http://localhost:3000"] }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Admin-only
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const origins: string[] = body.origins;

    if (!origins || !Array.isArray(origins) || origins.length === 0) {
      return NextResponse.json(
        { error: 'Provide an array of allowed origins, e.g. ["https://yourdomain.com"]' },
        { status: 400 }
      );
    }

    await configureBucketCors(origins);

    return NextResponse.json({ success: true, origins });
  } catch (error) {
    console.error('R2 CORS setup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to configure CORS' },
      { status: 500 }
    );
  }
}
