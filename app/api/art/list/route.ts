// Little Fables v3.3 — Art tab manifest endpoint.
//
// Returns the current state of pending/approved art artifacts on disk so the
// Parent Corner Art tab can render candidates for review. Read-only: never
// mutates the file system. Node runtime (needs fs.readdir).
//
// Contract:
//   GET /api/art/list?kind=sheets
//     → [{ characterId, name, role, pending: string[], approved: string[] }]
//
//   GET /api/art/list?kind=scenes&book=<bookId>
//     → { bookId, pages: [{ chapterIdx, pageIdx, pending: string[], approved: string[] }] }
//
// All url paths are /art-preview/... (public-facing URLs), not filesystem paths.

import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import charactersJson from '@/content/art/characters.json'

export const runtime = 'nodejs'

type CharacterEntry = {
  id: string
  name: string
  role?: string
}

type CharactersFile = {
  characters: CharacterEntry[]
}

const ART_PREVIEW_ROOT = join(process.cwd(), 'public', 'art-preview')

async function listDirSafe(path: string): Promise<string[]> {
  try {
    const entries = await readdir(path, { withFileTypes: true })
    return entries
      .filter((e) => e.isFile() && !e.name.endsWith('.meta.json') && !e.name.startsWith('.'))
      .map((e) => e.name)
      .sort()
  } catch {
    return []
  }
}

async function dirExists(path: string): Promise<boolean> {
  try {
    const s = await stat(path)
    return s.isDirectory()
  } catch {
    return false
  }
}

async function listSheets() {
  const chars = (charactersJson as CharactersFile).characters ?? []
  const out = await Promise.all(
    chars.map(async (c) => {
      const base = join(ART_PREVIEW_ROOT, 'sheets', c.id)
      const [pending, approved] = await Promise.all([
        listDirSafe(join(base, 'pending')),
        listDirSafe(join(base, 'approved')),
      ])
      return {
        characterId: c.id,
        name: c.name,
        role: c.role ?? '',
        pending: pending.map((f) => `/art-preview/sheets/${c.id}/pending/${f}`),
        approved: approved.map((f) => `/art-preview/sheets/${c.id}/approved/${f}`),
      }
    })
  )
  return out
}

async function listScenes(bookId: string) {
  const base = join(ART_PREVIEW_ROOT, 'scenes', bookId)
  const pendingDir = join(base, 'pending')
  const approvedDir = join(base, 'approved')

  // Map "chapterIdx-pageIdx" → { pending: [...], approved: [...] }
  const pageMap = new Map<string, { chapterIdx: number; pageIdx: number; pending: string[]; approved: string[] }>()

  const pushRow = (chapterIdx: number, pageIdx: number) => {
    const key = `${chapterIdx}-${pageIdx}`
    let row = pageMap.get(key)
    if (!row) {
      row = { chapterIdx, pageIdx, pending: [], approved: [] }
      pageMap.set(key, row)
    }
    return row
  }

  if (await dirExists(pendingDir)) {
    const files = await listDirSafe(pendingDir)
    for (const f of files) {
      // Pending naming: `<chapterIdx>-<pageIdx>-candidate-<ts>.png`
      const m = f.match(/^(\d+)-(\d+)-/)
      if (!m) continue
      const row = pushRow(Number(m[1]), Number(m[2]))
      row.pending.push(`/art-preview/scenes/${bookId}/pending/${f}`)
    }
  }

  if (await dirExists(approvedDir)) {
    const files = await listDirSafe(approvedDir)
    for (const f of files) {
      // Approved naming: `<chapterIdx>-<pageIdx>.png`
      const m = f.match(/^(\d+)-(\d+)\./)
      if (!m) continue
      const row = pushRow(Number(m[1]), Number(m[2]))
      row.approved.push(`/art-preview/scenes/${bookId}/approved/${f}`)
    }
  }

  const pages = Array.from(pageMap.values()).sort((a, b) =>
    a.chapterIdx === b.chapterIdx ? a.pageIdx - b.pageIdx : a.chapterIdx - b.chapterIdx,
  )
  return { bookId, pages }
}

export async function GET(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get('kind')
  try {
    if (kind === 'sheets') {
      const data = await listSheets()
      return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
    }
    if (kind === 'scenes') {
      const book = req.nextUrl.searchParams.get('book')
      if (!book) {
        return NextResponse.json({ error: 'missing_book' }, { status: 400 })
      }
      const data = await listScenes(book)
      return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
    }
    return NextResponse.json({ error: 'unknown_kind' }, { status: 400 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
