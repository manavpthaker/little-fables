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
import { admin, artConfigured, uploadCandidate, ARTIFACTS_TABLE, CANDIDATES_BUCKET } from '@/lib/art/supabase-admin'
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

  let body: { kind?: string; characterId?: string; bookId?: string; count?: number; limit?: number }
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
      // Chunked: generate up to `limit` missing images per call; the Art tab
      // loops while `remaining > 0`. Keeps each call well inside serverless
      // limits regardless of book length.
      return await genBook(db, apiKey, body.bookId, Math.min(8, Math.max(1, body.limit ?? 4)))
    }
    return NextResponse.json({ error: 'expected {kind:"sheet",characterId} or {kind:"book",bookId}' }, { status: 400 })
  } catch (e) {
    // Log the full error server-side so it shows in Vercel runtime logs, and
    // return the message to the Art tab.
    console.error('[art/generate] failed:', (e as Error).stack || (e as Error).message)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

/** Load the parent-uploaded reference photos + art-direction notes for a
 *  character from refs/{charId}/ in the private bucket. */
async function loadCharacterRefs(
  db: NonNullable<ReturnType<typeof admin>>,
  characterId: string,
): Promise<{ photos: GeminiImagePart[]; notes: string }> {
  const photos: GeminiImagePart[] = []
  let notes = ''
  const { data: files } = await db.storage.from(CANDIDATES_BUCKET).list(`refs/${characterId}`)
  for (const f of files ?? []) {
    const dl = await db.storage.from(CANDIDATES_BUCKET).download(`refs/${characterId}/${f.name}`)
    if (dl.error || !dl.data) continue
    if (f.name === 'notes.txt') {
      notes = await dl.data.text()
      continue
    }
    const buf = Buffer.from(await dl.data.arrayBuffer())
    const mime = f.name.endsWith('.png') ? 'image/png' : f.name.endsWith('.webp') ? 'image/webp' : 'image/jpeg'
    photos.push({ mimeType: mime, data: buf.toString('base64') })
  }
  return { photos: photos.slice(0, 6), notes }
}

async function genSheet(db: NonNullable<ReturnType<typeof admin>>, apiKey: string, characterId: string, count: number) {
  const c = BIBLE_BY_ID[characterId]
  if (!c) return NextResponse.json({ error: `unknown character ${characterId}` }, { status: 404 })
  const [styleRefs, { photos, notes }] = await Promise.all([loadStyleRefs(), loadCharacterRefs(db, characterId)])
  // Parent photos FIRST (the character), then style refs (the look) — capped.
  const referenceImages = [...photos, ...styleRefs].slice(0, 14)
  const prompt = characterPrompt(c, { photoRefCount: photos.length, notes })
  const created: string[] = []
  for (let i = 0; i < count; i++) {
    const res = await generateGeminiImage({ apiKey, prompt, referenceImages })
    for (const cand of res.candidates) {
      const ext = extFor(cand.mimeType)
      const path = `sheets/${characterId}/${stamp()}.${ext}`
      await uploadCandidate(db, path, Buffer.from(cand.base64, 'base64'), cand.mimeType)
      created.push(await insertPending(db, { kind: 'sheet', characterId, candidatePath: path, model: res.model, prompt }))
    }
  }
  return NextResponse.json({ ok: true, kind: 'sheet', characterId, created: created.length, usedPhotoRefs: photos.length })
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

/** The director plan is cached in the private bucket so chunked generation
 *  calls (and re-runs) don't re-pay the Anthropic pass per call. */
async function getPlan(db: NonNullable<ReturnType<typeof admin>>, bookId: string): Promise<ScenePlanEntry[]> {
  const path = `plans/${bookId}.json`
  const dl = await db.storage.from(CANDIDATES_BUCKET).download(path)
  if (!dl.error && dl.data) {
    try {
      return JSON.parse(await dl.data.text()) as ScenePlanEntry[]
    } catch {
      /* corrupt cache → regenerate */
    }
  }
  const plan = await directorPlan(bookId)
  await db.storage
    .from(CANDIDATES_BUCKET)
    .upload(path, Buffer.from(JSON.stringify(plan)), { contentType: 'application/json', upsert: true })
    .catch(() => {})
  return plan
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

async function genBook(db: NonNullable<ReturnType<typeof admin>>, apiKey: string, bookId: string, limit: number) {
  const plan = await getPlan(db, bookId)

  // One query for everything already generated for this book → occupied slots.
  const { data: existing } = await db
    .from(ARTIFACTS_TABLE)
    .select('kind, chapter_idx, page_idx')
    .eq('book_id', bookId)
    .in('status', ['pending', 'approved'])
  const occupied = new Set(
    ((existing ?? []) as Array<{ kind: string; chapter_idx: number | null; page_idx: number | null }>).map((r) =>
      r.kind === 'cover' ? 'cover' : `${r.chapter_idx}-${r.page_idx}`,
    ),
  )

  // Work list in order: cover first, then plan entries not yet generated.
  type Slot = { kind: 'cover' } | { kind: 'scene'; entry: ScenePlanEntry }
  const todo: Slot[] = []
  if (!occupied.has('cover')) todo.push({ kind: 'cover' })
  for (const entry of plan) {
    if (!occupied.has(`${entry.chapterIdx}-${entry.pageIdx}`)) todo.push({ kind: 'scene', entry })
  }

  const styleRefs = await loadStyleRefs()
  let created = 0
  for (const slot of todo.slice(0, limit)) {
    if (slot.kind === 'cover') {
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
      continue
    }
    const entry = slot.entry
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

  const remaining = Math.max(0, todo.length - Math.min(limit, todo.length))
  return NextResponse.json({
    ok: true, kind: 'book', bookId, created,
    done: todo.length - remaining, total: todo.length + occupied.size, remaining,
  })
}
