// Little Fables v3.3 — Art tab approval endpoint.
//
// Publishes a pending candidate: copies pending → approved, updates the
// sidecar meta.json status, and (for scenes) patches the pack JSON so the
// reader picks up the new img on next load. Dev-only: refuses to run under
// NODE_ENV=production so Vercel builds never mutate the checked-in pack file.
//
// Contract:
//   POST /api/art/approve
//     body: {
//       kind: 'sheet' | 'scene',
//       targetPath: string,            // path relative to public/art-preview
//       bookId?: string,               // required for kind='scene'
//       chapterIdx?: number,           // required for kind='scene'
//       pageIdx?: number,              // required for kind='scene'
//     }
//     → { ok: true, approvedUrl: string }

import { NextRequest, NextResponse } from 'next/server'
import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

export const runtime = 'nodejs'
export const maxDuration = 30

const ART_PREVIEW_ROOT = join(process.cwd(), 'public', 'art-preview')
const PACKS_DIR = join(process.cwd(), 'content', 'packs')

// Which pack file owns a given book id. For now only pack-000 exists.
// Extend by scanning content/packs/*.json if we ever ship more packs.
async function findPackFileForBook(bookId: string): Promise<string | null> {
  try {
    const files = await readdir(PACKS_DIR)
    for (const f of files) {
      if (!f.endsWith('.json')) continue
      const path = join(PACKS_DIR, f)
      const raw = await readFile(path, 'utf8')
      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        continue
      }
      const stories = (parsed as { stories?: Array<{ id: string }> })?.stories
      if (Array.isArray(stories) && stories.some((s) => s?.id === bookId)) {
        return path
      }
    }
  } catch {
    /* ignore */
  }
  return null
}

// Sanitize a path so it can never escape public/art-preview via `..` or an
// absolute path.
function safeResolveInsideArtPreview(rel: string): string | null {
  const abs = resolve(ART_PREVIEW_ROOT, rel)
  const relCheck = relative(ART_PREVIEW_ROOT, abs)
  // relCheck starts with '..' if abs escapes the root; empty string means the
  // target *is* the root, which is not a valid file target.
  if (!relCheck || relCheck.startsWith('..')) return null
  return abs
}

async function updateMeta(pendingAbs: string, status: 'approved' | 'rejected') {
  const metaPath = pendingAbs + '.meta.json'
  if (!existsSync(metaPath)) return
  try {
    const raw = await readFile(metaPath, 'utf8')
    const parsed = JSON.parse(raw) as Record<string, unknown>
    parsed.status = status
    parsed.decidedAt = new Date().toISOString()
    await writeFile(metaPath, JSON.stringify(parsed, null, 2), 'utf8')
  } catch {
    /* non-fatal */
  }
}

async function nextRefNumber(approvedDir: string): Promise<number> {
  try {
    const files = await readdir(approvedDir)
    let max = 0
    for (const f of files) {
      const m = f.match(/^ref-(\d+)\./)
      if (m) max = Math.max(max, Number(m[1]))
    }
    return max + 1
  } catch {
    return 1
  }
}

type ApproveBody = {
  kind?: 'sheet' | 'scene'
  targetPath?: string
  bookId?: string
  chapterIdx?: number
  pageIdx?: number
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Art approvals are dev-only. Run locally to publish new art.' },
      { status: 403 },
    )
  }

  let body: ApproveBody
  try {
    body = (await req.json()) as ApproveBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const { kind, targetPath } = body
  if ((kind !== 'sheet' && kind !== 'scene') || !targetPath) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const pendingAbs = safeResolveInsideArtPreview(targetPath)
  if (!pendingAbs || !existsSync(pendingAbs)) {
    return NextResponse.json({ error: 'target_not_found' }, { status: 404 })
  }

  // Derive extension (usually .png).
  const dotIdx = pendingAbs.lastIndexOf('.')
  const ext = dotIdx >= 0 ? pendingAbs.slice(dotIdx) : '.png'

  let approvedAbs: string
  let approvedUrl: string

  if (kind === 'sheet') {
    // Path shape: sheets/<charId>/pending/<file>
    const parts = targetPath.split('/').filter(Boolean)
    if (parts.length < 4 || parts[0] !== 'sheets' || parts[2] !== 'pending') {
      return NextResponse.json({ error: 'bad_sheet_path' }, { status: 400 })
    }
    const charId = parts[1]
    const approvedDir = join(ART_PREVIEW_ROOT, 'sheets', charId, 'approved')
    await mkdir(approvedDir, { recursive: true })
    const n = await nextRefNumber(approvedDir)
    approvedAbs = join(approvedDir, `ref-${n}${ext}`)
    approvedUrl = `/art-preview/sheets/${charId}/approved/ref-${n}${ext}`
    await copyFile(pendingAbs, approvedAbs)
  } else {
    // kind === 'scene'
    const { bookId, chapterIdx, pageIdx } = body
    if (!bookId || typeof chapterIdx !== 'number' || typeof pageIdx !== 'number') {
      return NextResponse.json({ error: 'missing_scene_fields' }, { status: 400 })
    }
    const approvedDir = join(ART_PREVIEW_ROOT, 'scenes', bookId, 'approved')
    await mkdir(approvedDir, { recursive: true })
    approvedAbs = join(approvedDir, `${chapterIdx}-${pageIdx}${ext}`)
    approvedUrl = `/art-preview/scenes/${bookId}/approved/${chapterIdx}-${pageIdx}${ext}`
    await copyFile(pendingAbs, approvedAbs)

    // Patch the pack JSON — set page.img on the matching book+chapter+page.
    const packPath = await findPackFileForBook(bookId)
    if (packPath) {
      try {
        const raw = await readFile(packPath, 'utf8')
        const pack = JSON.parse(raw) as {
          stories?: Array<{
            id: string
            chapters?: Array<{ pages?: Array<Record<string, unknown>> }>
            pages?: Array<Record<string, unknown>>
          }>
        }
        const story = pack.stories?.find((s) => s.id === bookId)
        if (story) {
          // Quick books have `pages` at the story root but the pack always
          // wraps them into a single chapter[0] on load. In the raw JSON they
          // usually live under chapters[0].pages — but handle both shapes.
          let page: Record<string, unknown> | undefined
          if (story.chapters && story.chapters[chapterIdx]) {
            const pages = story.chapters[chapterIdx].pages ?? []
            page = pages[pageIdx]
          } else if (chapterIdx === 0 && story.pages) {
            page = story.pages[pageIdx]
          }
          if (page) {
            page.img = approvedUrl
            await writeFile(packPath, JSON.stringify(pack, null, 1) + '\n', 'utf8')
          }
        }
      } catch (e) {
        // Log but do not fail the approval — the file is already published.
        console.warn('[art/approve] pack patch failed:', e)
      }
    }
  }

  await updateMeta(pendingAbs, 'approved')

  return NextResponse.json({ ok: true, approvedUrl })
}
