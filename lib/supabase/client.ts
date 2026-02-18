import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        lock: async (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
          return await fn()
        },
      },
    }
  )
}

