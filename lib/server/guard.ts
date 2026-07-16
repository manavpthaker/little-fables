// Request guards for the cost-bearing API routes (TTS, art, story generation).
// The app is a public site whose endpoints spend real money per call, so:
//
//  - sameOriginOk(): reject browser calls from OTHER sites (CSRF-style abuse).
//    Requests without an Origin header pass — the daily budget below is the
//    actual wallet protection; this just stops embedded cross-site scripting
//    of our endpoints.
//
//  - underDailyBudget(kind, limit): a per-day circuit breaker counted in
//    Supabase (usage_counters + bump_usage() — supabase/migrations/0003).
//    FAIL-OPEN by design: if the table/function is missing or Supabase is
//    unreachable, the call is allowed and a warning is logged. The reader
//    must keep working even when the breaker can't be read.
//
// Limits are env-tunable (e.g. TTS_DAILY_LIMIT) so a binge day can be
// unblocked from Vercel env without a deploy.

import type { NextRequest } from 'next/server'
import { admin } from '@/lib/art/supabase-admin'

export function sameOriginOk(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return true
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? ''
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export type UsageKind = 'tts' | 'art' | 'story' | 'respond' | 'listen' | 'score'

export function dailyLimit(kind: UsageKind, fallback: number): number {
  const env = process.env[`${kind.toUpperCase()}_DAILY_LIMIT`]
  const n = Number(env)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export async function underDailyBudget(kind: UsageKind, limit: number): Promise<boolean> {
  const db = admin()
  if (!db) return true // storage not configured — nothing to count against
  try {
    const { data, error } = await db.rpc('bump_usage', { p_kind: kind })
    if (error) {
      console.warn(`[guard] usage counter unavailable (${kind}):`, error.message)
      return true
    }
    const count = typeof data === 'number' ? data : Number(data)
    if (!Number.isFinite(count)) return true
    if (count > limit) {
      console.warn(`[guard] daily ${kind} budget reached: ${count}/${limit}`)
      return false
    }
    return true
  } catch (e) {
    console.warn(`[guard] usage counter threw (${kind}):`, (e as Error).message)
    return true
  }
}
