import { createBrowserClient } from '@supabase/ssr'

// The kid app (/read) is designed to run with zero Supabase env vars.
// If they're missing, return null instead of throwing — auth-consuming code
// (AuthProvider, dashboard, login) checks for null and no-ops.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createBrowserClient(url, key)
}
