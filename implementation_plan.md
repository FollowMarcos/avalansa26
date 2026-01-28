# Supabase OAuth Implementation Plan

## 1. Environment Setup
- [x] Configure `.env.local` with Supabase URL and Anon Key.
- [x] Ensure `src/utils/supabase` contains client, server, and middleware utilities.
- [x] Ensure `src/middleware.ts` is correctly configured to update the session.

## 2. Server Actions for Auth
- [x] Create `src/app/auth/actions.ts` (or similar) to handle OAuth sign-in redirection.
    - Function `signInWith(provider)` that redirects to Supabase OAuth URL.
    - Added `signOut` function.

## 3. Auth Callback Route
- [x] Create `src/app/auth/callback/route.ts` to handle the code exchange.
    - Exchange `code` for session.
    - Redirect user to protected page (e.g., `/dashboard` or origin).

## 4. Login UI
- [x] Create `src/app/login/page.tsx`.
- [x] Create a Login Component (e.g. `src/components/auth-form.tsx` or handle directly in page).
    - Buttons for "Sign in with Google", "Sign in with GitHub", etc.

## 5. Testing
- [x] Verify build passes.
- [ ] Verify runtime redirects (Manual testing required).
