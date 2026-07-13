// POST /api/art/approve  { id }
//
// Copies the candidate into the PUBLIC live bucket, flips the artifact to
// 'approved', supersedes any prior approval for the same slot, and returns the
// live URL. The reader/shelf pick it up from /api/art/live on next load — no
// redeploy, no pack edit.

import { NextResponse, type NextRequest } from 'next/server'
import { admin, artConfigured } from '@/lib/art/supabase-admin'
import { approveArtifact } from '@/lib/art/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  if (!artConfigured()) {
    return NextResponse.json({ error: 'Art storage not configured — see docs/art-production-setup.md.' }, { status: 503 })
  }
  let body: { id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad body' }, { status: 400 })
  }
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  try {
    const liveUrl = await approveArtifact(admin()!, body.id)
    return NextResponse.json({ ok: true, liveUrl })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
