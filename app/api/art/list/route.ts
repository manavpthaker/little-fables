// GET /api/art/list?kind=sheets            → character sheet groups (signed URLs)
// GET /api/art/list?kind=scenes&book=<id>   → pending + approved for a book
//
// Reads from Supabase (art_artifacts + signed candidate URLs). Parent-facing.

import { NextResponse, type NextRequest } from 'next/server'
import charactersJson from '@/content/art/characters.json'
import { admin, artConfigured } from '@/lib/art/supabase-admin'
import { listSceneArtifacts, listSheetArtifacts } from '@/lib/art/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!artConfigured()) {
    return NextResponse.json(
      { configured: false, error: 'Art storage not configured — see docs/art-production-setup.md.' },
      { status: 503 },
    )
  }
  const db = admin()!
  const kind = req.nextUrl.searchParams.get('kind')
  try {
    if (kind === 'sheets') {
      const chars = (charactersJson as { characters: Array<{ id: string; name: string; role?: string }> }).characters
      const groups = await listSheetArtifacts(db)
      const byId = new Map(groups.map((g) => [g.characterId, g]))
      const rows = chars.map((c) => {
        const g = byId.get(c.id)
        return { characterId: c.id, name: c.name, role: c.role ?? '', pending: g?.pending ?? [], approvedUrl: g?.approvedUrl ?? null }
      })
      return NextResponse.json({ configured: true, sheets: rows })
    }
    if (kind === 'scenes') {
      const book = req.nextUrl.searchParams.get('book')
      if (!book) return NextResponse.json({ error: 'book required' }, { status: 400 })
      const { pending, approved } = await listSceneArtifacts(db, book)
      return NextResponse.json({ configured: true, bookId: book, pending, approved })
    }
    return NextResponse.json({ error: 'kind must be sheets|scenes' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
