import { createBrowserClient } from '@supabase/ssr'

let browserClient: ReturnType<typeof createBrowserClient> | null = null
const SUPABASE_REQUEST_TIMEOUT_MS = 15000

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const fetchWithTimeout: typeof fetch = async (input, init = {}) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), SUPABASE_REQUEST_TIMEOUT_MS)

  const onAbort = () => controller.abort()
  init.signal?.addEventListener('abort', onAbort, { once: true })

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    })
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      // Reset cached client so next call starts with a fresh instance.
      browserClient = null
      throw new Error('Supabase request timed out')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
    init.signal?.removeEventListener('abort', onAbort)
  }
}

export function createClient() {
  if (browserClient) {
    return browserClient
  }

  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: fetchWithTimeout,
      },
      auth: {
        lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
          return await fn()
        },
      },
    }
  )

  return browserClient
}

