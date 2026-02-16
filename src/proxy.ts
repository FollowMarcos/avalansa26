import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/', '/auth/callback', '/auth/error', '/u', '/share'];

const ONBOARDING_ROUTES = [
  '/onboarding',
  '/onboarding/username',
  '/onboarding/bio',
  '/onboarding/interests',
  '/onboarding/complete',
];

const ADMIN_ROUTES = ['/dashboard'];

// ============================================================================
// RATE LIMITING (Edge-compatible)
// ============================================================================
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

  private cleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanup < 60000) return;

    this.lastCleanup = now;
    for (const [key, value] of this.requests.entries()) {
      if (now > value.resetTime) {
        this.requests.delete(key);
      }
    }

    // Cap map size to prevent memory issues
    if (this.requests.size > 10000) {
      const entries = Array.from(this.requests.entries());
      entries.sort((a, b) => b[1].resetTime - a[1].resetTime);
      this.requests = new Map(entries.slice(0, 10000));
    }
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number; limit: number } {
    this.cleanup();
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (!record || now > record.resetTime) {
      const resetTime = now + this.windowMs;
      this.requests.set(identifier, { count: 1, resetTime });
      return { allowed: true, remaining: this.limit - 1, resetTime, limit: this.limit };
    }

    if (record.count >= this.limit) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime, limit: this.limit };
    }

    record.count++;
    this.requests.set(identifier, record);
    return { allowed: true, remaining: this.limit - record.count, resetTime: record.resetTime, limit: this.limit };
  }
}

// Create rate limiters for different endpoint types
const apiLimiter = new EdgeRateLimiter(60, 60000); // 60 req/min for general API
const generateLimiter = new EdgeRateLimiter(10, 60000); // 10 req/min for generation
const authLimiter = new EdgeRateLimiter(5, 300000); // 5 req/5min for auth

// Get client identifier with proper IP handling
function getClientIdentifier(request: NextRequest): string {
  // Next.js 16+ provides IP through headers (no request.ip)
  const realIp = request.headers.get('x-real-ip');
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = realIp || forwardedFor?.split(',')[0].trim() || 'unknown';
  return `${ip}:${request.nextUrl.pathname}`;
}

// ============================================================================
// PROXY FUNCTION (combines auth + rate limiting)
// ============================================================================
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ============================================================================
  // RATE LIMITING (check before expensive auth operations)
  // ============================================================================
  if (pathname.startsWith('/api/')) {
    const identifier = getClientIdentifier(request);
    let result;
    let limitType: string;

    // Select rate limiter based on endpoint sensitivity
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
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
          },
        }
      );
    }

    // Add rate limit headers for successful requests (will be added to response later)
    request.headers.set('X-RateLimit-Remaining-Internal', result.remaining.toString());
    request.headers.set('X-RateLimit-Reset-Internal', new Date(result.resetTime).toISOString());
    request.headers.set('X-RateLimit-Limit-Internal', result.limit.toString());
  }

  // ============================================================================
  // AUTHENTICATION & ROUTING (original logic)
  // ============================================================================
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicRoute = PUBLIC_ROUTES.some((route) => {
    if (route === '/u') {
      const segments = pathname.split('/').filter(Boolean);
      return segments.length === 2 && segments[0] === 'u';
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
  const isOnboardingRoute = ONBOARDING_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route)
  );

  // Allow public routes without auth check
  if (isPublicRoute) {
    return response;
  }

  // If not authenticated and not on public route, redirect to home
  if (!user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Check onboarding status and role for authenticated users
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed, role')
    .eq('id', user.id)
    .single();

  const onboardingComplete = profile?.onboarding_completed ?? false;
  const userRole = profile?.role ?? 'user';

  // If onboarding not complete and trying to access protected route
  if (!onboardingComplete && !isOnboardingRoute) {
    return NextResponse.redirect(new URL('/onboarding/username', request.url));
  }

  // If onboarding complete and trying to access onboarding routes (except complete)
  if (onboardingComplete && isOnboardingRoute && pathname !== '/onboarding/complete') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Check admin routes - only allow admin users
  const isAdminRoute = ADMIN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  if (isAdminRoute && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // ============================================================================
  // SECURITY HEADERS (add to all responses)
  // ============================================================================
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self' blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src * data: blob:; font-src 'self' data:; connect-src 'self' data: blob: https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://generativelanguage.googleapis.com https://*.r2.dev https://*.r2.cloudflarestorage.com; media-src 'self' blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
  );

  // Add rate limit headers if this was an API request
  if (pathname.startsWith('/api/')) {
    const remaining = request.headers.get('X-RateLimit-Remaining-Internal');
    const reset = request.headers.get('X-RateLimit-Reset-Internal');
    const limit = request.headers.get('X-RateLimit-Limit-Internal');

    if (remaining) response.headers.set('X-RateLimit-Remaining', remaining);
    if (reset) response.headers.set('X-RateLimit-Reset', reset);
    if (limit) response.headers.set('X-RateLimit-Limit', limit);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
