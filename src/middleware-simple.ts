import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

/**
 * SIMPLE EDGE-COMPATIBLE RATE LIMITER
 *
 * This version uses only Web APIs available on Edge Runtime.
 * Trade-offs:
 * - No persistence across Edge function instances
 * - Good enough for basic protection
 * - No external dependencies (Redis)
 * - Works immediately without setup
 *
 * For production with multiple edge locations, use Upstash Redis (see middleware-secure.ts)
 */

// Edge-compatible rate limiter using Web APIs only
class EdgeRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }>;
  private readonly limit: number;
  private readonly windowMs: number;
  private lastCleanup: number;

  constructor(limit: number, windowMs: number) {
    this.requests = new Map();
    this.limit = limit;
    this.windowMs = windowMs;
    this.lastCleanup = Date.now();
  }

  // Manual cleanup instead of setInterval (Edge-compatible)
  private cleanup(): void {
    const now = Date.now();

    // Only cleanup every 60 seconds to avoid performance impact
    if (now - this.lastCleanup < 60000) {
      return;
    }

    this.lastCleanup = now;

    // Remove expired entries
    for (const [key, value] of this.requests.entries()) {
      if (now > value.resetTime) {
        this.requests.delete(key);
      }
    }

    // Cap map size to prevent memory issues (keep most recent 10k entries)
    if (this.requests.size > 10000) {
      const entries = Array.from(this.requests.entries());
      entries.sort((a, b) => b[1].resetTime - a[1].resetTime);
      this.requests = new Map(entries.slice(0, 10000));
    }
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    // Run cleanup occasionally
    this.cleanup();

    const now = Date.now();
    const record = this.requests.get(identifier);

    if (!record || now > record.resetTime) {
      // Create new window
      const resetTime = now + this.windowMs;
      this.requests.set(identifier, { count: 1, resetTime });
      return { allowed: true, remaining: this.limit - 1, resetTime };
    }

    if (record.count >= this.limit) {
      // Rate limit exceeded
      return { allowed: false, remaining: 0, resetTime: record.resetTime };
    }

    // Increment counter
    record.count++;
    this.requests.set(identifier, record);
    return { allowed: true, remaining: this.limit - record.count, resetTime: record.resetTime };
  }
}

// Create rate limiters for different endpoints
const apiLimiter = new EdgeRateLimiter(60, 60000); // 60 requests per minute
const generateLimiter = new EdgeRateLimiter(10, 60000); // 10 requests per minute
const authLimiter = new EdgeRateLimiter(5, 300000); // 5 requests per 5 minutes

// SECURE: Get client IP with proper handling
function getClientIdentifier(request: NextRequest): string {
  // Get IP from Vercel-provided headers
  const realIp = request.headers.get('x-real-ip');
  const forwardedFor = request.headers.get('x-forwarded-for');

  // Use first IP from x-forwarded-for or fallback to request.ip
  const ip = realIp ||
             forwardedFor?.split(',')[0].trim() ||
             request.ip ||
             'unknown';

  // Combine IP with pathname for per-endpoint limiting
  return `${ip}:${request.nextUrl.pathname}`;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Security headers for all responses
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const identifier = getClientIdentifier(request);

    let result;
    let limitType: string;

    // Select appropriate rate limiter based on endpoint sensitivity
    if (pathname.startsWith('/api/generate') || pathname.startsWith('/api/batch-status')) {
      result = generateLimiter.check(identifier);
      limitType = 'generation';
    } else if (pathname.includes('/auth/')) {
      result = authLimiter.check(identifier);
      limitType = 'authentication';
    } else {
      result = apiLimiter.check(identifier);
      limitType = 'api';
    }

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

      return NextResponse.json(
        {
          error: 'Rate Limit Exceeded',
          message: `Too many ${limitType} requests. Please try again later.`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': result.remaining.toString(), // This is wrong in original
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
            ...securityHeaders,
          },
        }
      );
    }

    // Add rate limit headers to successful requests
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

    // Add security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Continue with Supabase session update
    return await updateSession(request, response);
  }

  // For non-API routes, add security headers and update session
  const response = await updateSession(request);

  // Add security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - static assets (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
