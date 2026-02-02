import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// SECURE: Use Upstash Redis for distributed rate limiting
// Works across all Edge deployments, no memory leaks
const redis = Redis.fromEnv();

const rateLimiters = {
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute
    analytics: true,
    prefix: 'ratelimit:api',
  }),
  generate: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
    analytics: true,
    prefix: 'ratelimit:generate',
  }),
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '5 m'), // 5 requests per 5 minutes
    analytics: true,
    prefix: 'ratelimit:auth',
  }),
};

// SECURE: Get real IP with proper fallback chain
function getClientIdentifier(request: NextRequest): string {
  // Vercel provides x-real-ip and x-forwarded-for
  // Priority: x-real-ip > x-forwarded-for first entry > request.ip
  const realIp = request.headers.get('x-real-ip');
  const forwardedFor = request.headers.get('x-forwarded-for');

  const ip = realIp ||
             forwardedFor?.split(',')[0].trim() ||
             request.ip ||
             'anonymous';

  return `${ip}:${request.nextUrl.pathname}`;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const identifier = getClientIdentifier(request);

    // Select appropriate rate limiter
    let limiter: Ratelimit;
    let limitType: string;

    if (pathname.startsWith('/api/generate') || pathname.startsWith('/api/batch-status')) {
      limiter = rateLimiters.generate;
      limitType = 'generate';
    } else if (pathname.includes('/auth/')) {
      limiter = rateLimiters.auth;
      limitType = 'auth';
    } else {
      limiter = rateLimiters.api;
      limitType = 'api';
    }

    // Check rate limit
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);

      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded for ${limitType} endpoints. Please try again later.`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(reset).toISOString(),
            // Security headers
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
          },
        }
      );
    }

    // Add rate limit headers to successful responses
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString());

    // Security headers for all API responses
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Continue with Supabase session update
    return await updateSession(request, response);
  }

  // For non-API routes, just update Supabase session
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
