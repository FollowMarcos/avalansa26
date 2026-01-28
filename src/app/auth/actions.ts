'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Provider } from '@supabase/supabase-js'

export async function signInWith(provider: Provider) {
    const supabase = await createClient()
    const currentHeaders = await headers()
    const origin = currentHeaders.get('origin')

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${origin}/auth/callback`,
        },
    })

    if (error) {
        console.error('OAuth error:', error)
        return redirect('/?message=Could not authenticate user')
    }

    if (data.url) {
        return redirect(data.url)
    }
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    return redirect('/')
}
