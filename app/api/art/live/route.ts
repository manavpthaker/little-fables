// GET /api/art/live?book=<id>   → approved overrides for one book { cover, pages }
// GET /api/art/live?covers=1     → { covers: { bookId: url } } for the shelf
//
// PUBLIC + kid-facing: returns ONLY approved (public) art URLs — never a
// candidate. This is how an approval goes live without a redeploy. Degrades to
// empty when the art env isn't configured, so the reader just shows placeholders.

import { NextResponse, type NextRequest } from 'next/server'
import { admin, artConfigured } from '@/lib/art/supabase-admin'
import { approvedCovers, approvedOverridesForBook } from '@/lib/art/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!artConfigured()) {
    return NextResponse.json({ configured: false, pages: {}, covers: {} })
  }
  const db = admin()!
  const sp = req.nextUrl.searchParams
  try {
    if (sp.get('covers')) {
      return NextResponse.json(
        { configured: true, covers: await approvedCovers(db) },
        { headers: { 'cache-control': 'public, max-age=30' } },
      )
    }
    const book = sp.get('book')
    if (!book) return NextResponse.json({ error: 'book or covers required' }, { status: 400 })
    const overrides = await approvedOverridesForBook(db, book)
    return NextResponse.json(
      { configured: true, ...overrides },
      { headers: { 'cache-control': 'public, max-age=30' } },
    )
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, pages: {}, covers: {} }, { status: 500 })
  }
}
