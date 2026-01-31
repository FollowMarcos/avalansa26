import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * Proxy endpoint to fetch images server-side, bypassing CORS restrictions.
 * Used when adding generated images as reference images.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Verify user is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Validate URL is from allowed domains (our storage or known image hosts)
    const url = new URL(imageUrl);
    const allowedHosts = [
      'supabase.co',
      'supabase.in',
      'supabase.com',
      'storage.googleapis.com',
      'googleusercontent.com',
      'cdn.supabase.co',
      // Common CDN domains that Supabase might use
      'cloudflare.com',
      'cloudfront.net',
    ];

    // Also allow any subdomain of supabase domains
    const isAllowed = allowedHosts.some(host =>
      url.hostname.endsWith(host) || url.hostname.includes('supabase')
    );

    if (!isAllowed) {
      console.warn(`[proxy-image] Blocked domain: ${url.hostname}`);
      return NextResponse.json(
        { error: `Image URL not from allowed domain: ${url.hostname}` },
        { status: 403 }
      );
    }

    // Fetch the image server-side (no CORS restrictions)
    const response = await fetch(imageUrl, {
      headers: {
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = await response.arrayBuffer();

    // Return the image with proper headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Proxy image error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}
