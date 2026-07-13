// POST /api/art/generate — run Gemini on the server, upload candidates to the
// private bucket, and insert `pending` rows. Never called from a kid surface.
//
//   { kind: 'sheet', characterId }        → 1-2 candidate sheets for a character
//   { kind: 'book',  bookId }             → director plan → cover + every scene
//
// Long-running: one Gemini request per image, sequential, resumable (skips a
// slot that already has a pending/approved artifact). If it times out, re-run.

import { NextResponse, type NextRequest } from 'next/server'
import charactersJson from '@/content/art/characters.json'
import packJson from '@/content/packs/pack-000-family-originals.json'
import { admin, artConfigured, uploadCandidate, ARTIFACTS_TABLE } from '@/lib/art/supabase-admin'
import { insertPending } from '@/lib/art/store'
import { generateGeminiImage, type GeminiImagePart } from '@/lib/art/gemini'
import {
  characterPrompt,
  scenePrompt,
  loadStyleRefs,
  type CharacterBibleEntry,
  type ScenePlanEntry,
} from '@/lib/art/prompts'
import { callAnthropicJSON, extractJSON } from '@/lib/art/anthropic'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const BIBLE = (charactersJson as { characters: CharacterBibleEntry[] }).characters
const BIBLE_BY_ID: Record<string, CharacterBibleEntry> = Object.fromEntries(BIBLE.map((c) => [c.id, c]))

function notConfigured() {
  return NextResponse.json(
    { error: 'Art storage is not configured. See docs/art-production-setup.md.' },
    { status: 503 },
  )
}
function extFor(mime: string): string {
  return mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
}
function stamp(): string {
  // Unique-ish suffix without Date.now sensitivity concerns (route runtime).
  return Math.random().toString(36).slice(2, 10)
}

export async function POST(req: NextRequest) {
  if (!artConfigured()) return notConfigured()
  const db = admin()!
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not set in this environment.' }, { status: 503 })

  let body: { kind?: string; characterId?: string; bookId?: string; count?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad body' }, { status: 400 })
  }

  try {
    if (body.kind === 'sheet' && body.characterId) {
      return await genSheet(db, apiKey, body.characterId, Math.min(2, Math.max(1, body.count ?? 1)))
    }
    if (body.kind === 'book' && body.bookId) {
      return await genBook(db, apiKey, body.bookId)
    }
    return NextResponse.json({ error: 'expected {kind:"sheet",characterId} or {kind:"book",bookId}' }, { status: 400 })
  } catch (e) {
    // Log the full error server-side so it shows in Vercel runtime logs, and
    // return the message to the Art tab.
    console.error('[art/generate] failed:', (e as Error).stack || (e as Error).message)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

async function alreadyHas(db: NonNullable<ReturnType<typeof admin>>, filter: Record<string, unknown>): Promise<boolean> {
  let q = db.from(ARTIFACTS_TABLE).select('id', { count: 'exact', head: true }).in('status', ['pending', 'approved'])
  for (const [k, v] of Object.entries(filter)) q = q.eq(k, v)
  const { count } = await q
  return (count ?? 0) > 0
}

async function genSheet(db: NonNullable<ReturnType<typeof admin>>, apiKey: string, characterId: string, count: number) {
  const c = BIBLE_BY_ID[characterId]
  if (!c) return NextResponse.json({ error: `unknown character ${characterId}` }, { status: 404 })
  const styleRefs = await loadStyleRefs()
  const created: string[] = []
  for (let i = 0; i < count; i++) {
    const res = await generateGeminiImage({ apiKey, prompt: characterPrompt(c), referenceImages: styleRefs })
    for (const cand of res.candidates) {
      const ext = extFor(cand.mimeType)
      const path = `sheets/${characterId}/${stamp()}.${ext}`
      await uploadCandidate(db, path, Buffer.from(cand.base64, 'base64'), cand.mimeType)
      created.push(await insertPending(db, { kind: 'sheet', characterId, candidatePath: path, model: res.model, prompt: characterPrompt(c) }))
    }
  }
  return NextResponse.json({ ok: true, kind: 'sheet', characterId, created: created.length })
}

// ---- book: director plan (Anthropic) → cover + scenes ----

async function directorPlan(bookId: string): Promise<ScenePlanEntry[]> {
  const book = (packJson as { stories: Array<{ id: string; title: string; chapters?: Array<{ pages: Array<{ text: string; scene?: string | null }> }> }> }).stories.find((s) => s.id === bookId)
  if (!book) throw new Error(`book ${bookId} not in pack`)
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY not set (needed for the director plan).')
  const compactBible = BIBLE.map((c) => ({ id: c.id, name: c.name, role: c.role, visualAnchors: c.visualAnchors }))
  const pages = (book.chapters ?? []).flatMap((ch, ci) =>
    ch.pages.map((p, pi) => ({ chapterIdx: ci, pageIdx: pi, sceneKey: p.scene ?? null, text: p.text })),
  )
  const system = `You are the art director for a warm watercolor+ink children's picture book. For EACH page produce one plan entry. Return ONLY a JSON array, one object per page in order:
{"chapterIdx":n,"pageIdx":n,"sceneKey":string|null,"characters":[bible ids present],"setting":str,"action":str,"mood":str,"composition":str,"paletteHint":"canyon|sunset|meadow|lilac|blush|river|snow|honey","styleAnchors":[]}
Bible ids allowed: ${compactBible.map((c) => c.id).join(', ')}. Use [] if none appear. No prose, JSON only.`
  const user = `Book: ${book.title}\nBible: ${JSON.stringify(compactBible)}\nPages:\n${JSON.stringify(pages).slice(0, 12000)}`
  const { text } = await callAnthropicJSON({ apiKey: anthropicKey, model: process.env.ART_DIRECTOR_MODEL || 'claude-haiku-4-5-20251001', system, user, maxTokens: 8000 })
  return extractJSON(text) as ScenePlanEntry[]
}

/** Fetch approved character-sheet refs (public live URLs) for a scene. */
async function sceneRefs(db: NonNullable<ReturnType<typeof admin>>, charIds: string[], styleRefs: GeminiImagePart[]): Promise<GeminiImagePart[]> {
  const refs: GeminiImagePart[] = []
  if (charIds.length) {
    const { data } = await db.from(ARTIFACTS_TABLE).select('character_id, live_url').eq('kind', 'sheet').eq('status', 'approved').in('character_id', charIds)
    for (const r of (data ?? []) as Array<{ live_url: string | null }>) {
      if (!r.live_url) continue
      try {
        const resp = await fetch(r.live_url)
        const buf = Buffer.from(await resp.arrayBuffer())
        refs.push({ mimeType: resp.headers.get('content-type') || 'image/jpeg', data: buf.toString('base64') })
      } catch {
        /* skip */
      }
    }
  }
  return [...refs, ...styleRefs].slice(0, 14)
}

async function genBook(db: NonNullable<ReturnType<typeof admin>>, apiKey: string, bookId: string) {
  const plan = await directorPlan(bookId)
  const styleRefs = await loadStyleRefs()
  let created = 0
  let skipped = 0

  // Cover: use the first plan entry's characters as a hint.
  if (!(await alreadyHas(db, { kind: 'cover', book_id: bookId }))) {
    const coverChars = plan[0]?.characters ?? []
    const refs = await sceneRefs(db, coverChars, styleRefs)
    const coverPrompt = `Square book COVER, warm watercolor + ink. An iconic, inviting moment. Characters: ${coverChars.map((id) => BIBLE_BY_ID[id]?.name).filter(Boolean).join(', ') || '(setting only)'}. No text, no title, no border.`
    const res = await generateGeminiImage({ apiKey, prompt: coverPrompt, referenceImages: refs })
    const cand = res.candidates[0]
    if (cand) {
      const path = `books/${bookId}/cover/${stamp()}.${extFor(cand.mimeType)}`
      await uploadCandidate(db, path, Buffer.from(cand.base64, 'base64'), cand.mimeType)
      await insertPending(db, { kind: 'cover', bookId, candidatePath: path, model: res.model, prompt: coverPrompt })
      created++
    }
  } else skipped++

  for (const entry of plan) {
    if (await alreadyHas(db, { kind: 'scene', book_id: bookId, chapter_idx: entry.chapterIdx, page_idx: entry.pageIdx })) {
      skipped++
      continue
    }
    const refs = await sceneRefs(db, entry.characters ?? [], styleRefs)
    const prompt = scenePrompt(entry, BIBLE_BY_ID)
    const res = await generateGeminiImage({ apiKey, prompt, referenceImages: refs })
    const cand = res.candidates[0]
    if (!cand) continue
    const path = `books/${bookId}/${entry.chapterIdx}-${entry.pageIdx}/${stamp()}.${extFor(cand.mimeType)}`
    await uploadCandidate(db, path, Buffer.from(cand.base64, 'base64'), cand.mimeType)
    await insertPending(db, {
      kind: 'scene', bookId, chapterIdx: entry.chapterIdx, pageIdx: entry.pageIdx,
      candidatePath: path, model: res.model, prompt,
    })
    created++
  }
  return NextResponse.json({ ok: true, kind: 'book', bookId, created, skipped, plan: plan.length })
}
