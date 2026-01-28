import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development'

            if (isLocalEnv) {
                // we can be sure that is no load balancer in between, so no need to watch for X-Forwarded-Host
                // Validate 'next' param to ensure it starts with / and is not a protocol-relative URL (//)
                const safeNext = (next.startsWith('/') && !next.startsWith('//')) ? next : '/'
                return NextResponse.redirect(`${origin}${safeNext}`)
            } else if (forwardedHost) {
                const safeNext = (next.startsWith('/') && !next.startsWith('//')) ? next : '/'
                return NextResponse.redirect(`https://${forwardedHost}${safeNext}`)
            } else {
                const safeNext = (next.startsWith('/') && !next.startsWith('//')) ? next : '/'
                return NextResponse.redirect(`${origin}${safeNext}`)
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/?message=Could not exchange code for session`)
}
