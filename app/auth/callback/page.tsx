import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: { code?: string; redirectTo?: string }
}) {
  const supabase = await createClient()

  if (searchParams.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(searchParams.code)
    
    if (error) {
      console.error('Auth callback error:', error)
      redirect('/auth/login?error=callback_error')
    }
  }

  // Redirect to the intended page or home
  const redirectTo = searchParams.redirectTo || '/'
  redirect(redirectTo)
}