import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

// In-memory rate limiter (works for single-server deployments)
// For distributed systems, consider using @upstash/ratelimit with Redis
class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }>;
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number = 60, windowMs: number = 60000) {
    this.requests = new Map();
    this.limit = limit;
    this.windowMs = windowMs;

    // Clean up old entries every minute
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.requests.entries()) {
        if (now > value.resetTime) {
          this.requests.delete(key);
        }
      }
    }, 60000);
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
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
const apiLimiter = new RateLimiter(60, 60000); // 60 requests per minute for general API
const generateLimiter = new RateLimiter(10, 60000); // 10 requests per minute for generation
const authLimiter = new RateLimiter(5, 300000); // 5 requests per 5 minutes for auth

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'anonymous';
    const identifier = `${ip}:${pathname}`;

    let result;
    if (pathname.startsWith('/api/generate') || pathname.startsWith('/api/batch-status')) {
      // Strict limits for expensive generation endpoints
      result = generateLimiter.check(identifier);
    } else if (pathname.includes('/auth/')) {
      // Strict limits for auth endpoints
      result = authLimiter.check(identifier);
    } else {
      // General API rate limit
      result = apiLimiter.check(identifier);
    }

    if (!result.allowed) {
      const resetDate = new Date(result.resetTime);
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': generateLimiter['limit'].toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetDate.toISOString(),
          },
        }
      );
    }

    // Add rate limit headers to successful responses
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

    // Continue with Supabase session update for auth
    return await updateSession(request, response);
  }

  // For non-API routes, just update Supabase session
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
