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

    // Strict domain allowlist - must match exactly or be a subdomain
    const allowedDomains = [
      'supabase.co',
      'supabase.in',
      'supabase.com',
      'storage.googleapis.com',
      'googleusercontent.com',
      'cloudflare.com',
      'cloudfront.net',
    ];

    /**
     * Check if hostname is allowed using strict subdomain matching.
     * Prevents SSRF bypasses like "supabase.evil.com" or "evilsupabase.com"
     */
    const isAllowedDomain = (hostname: string): boolean => {
      const normalizedHost = hostname.toLowerCase();
      return allowedDomains.some(domain => {
        // Exact match
        if (normalizedHost === domain) return true;
        // Valid subdomain match (must have dot before the domain)
        if (normalizedHost.endsWith(`.${domain}`)) return true;
        return false;
      });
    };

    if (!isAllowedDomain(url.hostname)) {
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
