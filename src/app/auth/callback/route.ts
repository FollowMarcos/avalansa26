import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get user and check onboarding status
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let redirectPath = next;

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();

        // Redirect to onboarding if not completed
        if (!profile?.onboarding_completed) {
          redirectPath = '/onboarding/username';
        } else {
          // Validate 'next' param
          redirectPath =
            next.startsWith('/') && !next.startsWith('//') ? next : '/';
        }
      }

      // Use the origin from the request URL for safe redirection within the same domain
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  // Fallback to error page on the same origin
  return NextResponse.redirect(
    `${origin}/?message=Could not exchange code for session`
  );
}
