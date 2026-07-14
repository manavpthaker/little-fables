// Character reference material — the parent's own photos of the real plush
// (or approved drawings) plus free-text art direction, per character. This is
// what generation is conditioned on, so the model recreates THE character
// instead of guessing from the bible's text description.
//
// Stored in the PRIVATE candidates bucket under refs/{charId}/ — reference
// photos never get a public URL; the Art tab views them via signed URLs.
//
//   GET  /api/art/refs?characterId=char_jujy
//     → { refs: [{ path, url }], notes }
//   POST { characterId, action: 'upload', data (base64), mimeType }
//   POST { characterId, action: 'notes', notes }
//   POST { characterId, action: 'remove', path }

import { NextResponse, type NextRequest } from 'next/server'
import { admin, artConfigured, CANDIDATES_BUCKET } from '@/lib/art/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const NOTES_FILE = 'notes.txt'

function refDir(charId: string): string {
  return `refs/${charId}`
}
function okId(id: unknown): id is string {
  return typeof id === 'string' && /^[\w-]+$/.test(id)
}
function notConfigured() {
  return NextResponse.json({ error: 'Art storage not configured — see docs/art-production-setup.md.' }, { status: 503 })
}

export async function GET(req: NextRequest) {
  if (!artConfigured()) return notConfigured()
  const db = admin()!
  const characterId = req.nextUrl.searchParams.get('characterId')
  if (!okId(characterId)) return NextResponse.json({ error: 'characterId required' }, { status: 400 })
  const { data: files, error } = await db.storage.from(CANDIDATES_BUCKET).list(refDir(characterId))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const refs: Array<{ path: string; url: string }> = []
  let notes = ''
  for (const f of files ?? []) {
    const path = `${refDir(characterId)}/${f.name}`
    if (f.name === NOTES_FILE) {
      const dl = await db.storage.from(CANDIDATES_BUCKET).download(path)
      if (!dl.error && dl.data) notes = await dl.data.text()
      continue
    }
    const { data } = await db.storage.from(CANDIDATES_BUCKET).createSignedUrl(path, 600)
    if (data?.signedUrl) refs.push({ path, url: data.signedUrl })
  }
  return NextResponse.json({ characterId, refs, notes })
}

interface PostBody {
  characterId?: string
  action?: 'upload' | 'notes' | 'remove'
  data?: string
  mimeType?: string
  notes?: string
  path?: string
}

export async function POST(req: NextRequest) {
  if (!artConfigured()) return notConfigured()
  const db = admin()!
  let body: PostBody
  try {
    body = (await req.json()) as PostBody
  } catch {
    return NextResponse.json({ error: 'bad body' }, { status: 400 })
  }
  const { characterId } = body
  if (!okId(characterId)) return NextResponse.json({ error: 'characterId required' }, { status: 400 })

  try {
    if (body.action === 'upload') {
      if (!body.data || !body.mimeType?.startsWith('image/')) {
        return NextResponse.json({ error: 'data (base64) + image mimeType required' }, { status: 400 })
      }
      const buf = Buffer.from(body.data, 'base64')
      if (buf.length > 4 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image too large after resize — try again.' }, { status: 413 })
      }
      const ext = body.mimeType === 'image/png' ? 'png' : body.mimeType === 'image/webp' ? 'webp' : 'jpg'
      const path = `${refDir(characterId)}/${Math.random().toString(36).slice(2, 10)}.${ext}`
      const { error } = await db.storage.from(CANDIDATES_BUCKET).upload(path, buf, { contentType: body.mimeType, upsert: true })
      if (error) throw new Error(error.message)
      return NextResponse.json({ ok: true, path })
    }
    if (body.action === 'notes') {
      const path = `${refDir(characterId)}/${NOTES_FILE}`
      const { error } = await db.storage
        .from(CANDIDATES_BUCKET)
        .upload(path, Buffer.from(body.notes ?? '', 'utf8'), { contentType: 'text/plain', upsert: true })
      if (error) throw new Error(error.message)
      return NextResponse.json({ ok: true })
    }
    if (body.action === 'remove') {
      // Only paths inside this character's ref dir can be removed.
      if (!body.path?.startsWith(`${refDir(characterId)}/`) || body.path.includes('..')) {
        return NextResponse.json({ error: 'bad path' }, { status: 400 })
      }
      const { error } = await db.storage.from(CANDIDATES_BUCKET).remove([body.path])
      if (error) throw new Error(error.message)
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: 'action must be upload|notes|remove' }, { status: 400 })
  } catch (e) {
    console.error('[art/refs] failed:', (e as Error).message)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
