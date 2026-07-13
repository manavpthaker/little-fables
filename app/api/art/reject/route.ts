// Little Fables v3.3 — Art tab rejection endpoint.
//
// Marks a pending candidate as rejected by updating its sidecar meta.json.
// The file itself stays in place so we can look at rejected variants later.
// Dev-only, mirroring /api/art/approve.

import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

export const runtime = 'nodejs'
export const maxDuration = 30

const ART_PREVIEW_ROOT = join(process.cwd(), 'public', 'art-preview')

function safeResolveInsideArtPreview(rel: string): string | null {
  const abs = resolve(ART_PREVIEW_ROOT, rel)
  const relCheck = relative(ART_PREVIEW_ROOT, abs)
  if (relCheck.startsWith('..')) return null
  return abs
}

type RejectBody = { targetPath?: string; reason?: string }

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Art rejections are dev-only.' },
      { status: 403 },
    )
  }

  let body: RejectBody
  try {
    body = (await req.json()) as RejectBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const { targetPath, reason } = body
  if (!targetPath) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const pendingAbs = safeResolveInsideArtPreview(targetPath)
  if (!pendingAbs || !existsSync(pendingAbs)) {
    return NextResponse.json({ error: 'target_not_found' }, { status: 404 })
  }

  const metaPath = pendingAbs + '.meta.json'
  let meta: Record<string, unknown> = {}
  if (existsSync(metaPath)) {
    try {
      meta = JSON.parse(await readFile(metaPath, 'utf8')) as Record<string, unknown>
    } catch {
      meta = {}
    }
  }
  meta.status = 'rejected'
  meta.decidedAt = new Date().toISOString()
  if (reason) meta.rejectReason = reason
  try {
    await writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf8')
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'write_failed' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
