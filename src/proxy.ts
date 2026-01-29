import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/', '/auth/callback', '/auth/error', '/u'];

const ONBOARDING_ROUTES = [
  '/onboarding',
  '/onboarding/username',
  '/onboarding/bio',
  '/onboarding/interests',
  '/onboarding/complete',
];

const ADMIN_ROUTES = ['/dashboard'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );
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

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
