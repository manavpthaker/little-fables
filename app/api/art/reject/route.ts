// POST /api/art/reject  { id }  → mark an artifact rejected (stays for audit).

import { NextResponse, type NextRequest } from 'next/server'
import { admin, artConfigured } from '@/lib/art/supabase-admin'
import { rejectArtifact } from '@/lib/art/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
    await rejectArtifact(admin()!, body.id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
