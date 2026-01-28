import { cache } from 'react'
import { createClient } from './server'

/**
 * Deduplicated auth check for React Server Components.
 * This prevents multiple calls to Supabase auth in the same request.
 */
export const getUser = cache(async () => {
    const supabase = await createClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        return null
    }

    return user
})
