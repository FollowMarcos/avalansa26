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

    // Only allow HTTPS (block file://, ftp://, data:, etc.)
    if (url.protocol !== 'https:') {
      return NextResponse.json(
        { error: 'Only HTTPS URLs are allowed' },
        { status: 400 }
      );
    }

    // Strict domain allowlist - only Supabase storage and known image CDNs
    const allowedDomains = [
      'supabase.co',
      'supabase.in',
      'supabase.com',
      'storage.googleapis.com',
    ];

    /**
     * Check if hostname is allowed using strict subdomain matching.
     * Prevents SSRF bypasses like "supabase.evil.com" or "evilsupabase.com"
     */
    const isAllowedDomain = (hostname: string): boolean => {
      const normalizedHost = hostname.toLowerCase();
      return allowedDomains.some(domain => {
        if (normalizedHost === domain) return true;
        if (normalizedHost.endsWith(`.${domain}`)) return true;
        return false;
      });
    };

    if (!isAllowedDomain(url.hostname)) {
      console.warn(`[proxy-image] Blocked domain: ${url.hostname}`);
      return NextResponse.json(
        { error: 'Image URL not from allowed domain' },
        { status: 403 }
      );
    }

    // Fetch with timeout protection (10 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(imageUrl, {
      headers: { 'Accept': 'image/*' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: 502 }
      );
    }

    // Validate content-type is an actual image
    const contentType = response.headers.get('content-type') || '';
    const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    const isValidImage = VALID_IMAGE_TYPES.some(type => contentType.includes(type));

    if (!isValidImage) {
      return NextResponse.json(
        { error: 'Response is not a valid image type' },
        { status: 400 }
      );
    }

    // Check content-length before loading into memory
    const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: 'Image too large' },
        { status: 413 }
      );
    }

    const buffer = await response.arrayBuffer();

    // Double-check actual size
    if (buffer.byteLength > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: 'Image too large' },
        { status: 413 }
      );
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
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
