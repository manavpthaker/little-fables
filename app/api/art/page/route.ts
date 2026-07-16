// POST /api/art/page  { bookId, chapterIdx, pageIdx, pageText?, prevText?,
//                       bookTitle?, chapterTitle? }
//
// The text fields are for GENERATED kid books, which live only in the
// reader's device storage — the client sends the page text and we illustrate
// it. Pack books ignore those fields and use the server's copy of the text.
//
// Generate-while-reading: called by the reader when a page has no art. Returns
// the page's illustration URL, generating it on the spot if needed:
//
//   approved already   → { url }                       (instant)
//   someone generating → { status: 'generating' }      (client polls)
//   nothing yet        → generate from the PAGE TEXT (characters detected by
//                        name against the bible, approved sheets as refs),
//                        publish straight to the PUBLIC live bucket, → { url }
//
// NOTE: this path intentionally skips the parent approval gate for scenes —
// the parent controls the look via approved character sheets, and art fades in
// while the child reads. Flash tier (~$0.07/page), cached forever after the
// first reader hits a page. Set ART_AUTO_GENERATE=0 to turn the whole thing
// off (the reader then just keeps its endpaper placeholders).

import { NextResponse, type NextRequest } from 'next/server'
import charactersJson from '@/content/art/characters.json'
import packJson from '@/content/packs/pack-000-family-originals.json'
import {
  admin,
  artConfigured,
  ARTIFACTS_TABLE,
  LIVE_BUCKET,
} from '@/lib/art/supabase-admin'
import { generateGeminiImage, type GeminiImagePart } from '@/lib/art/gemini'
import {
  detectCharacters,
  loadStyleRefs,
  passageScenePrompt,
  type CharacterBibleEntry,
} from '@/lib/art/prompts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

const BIBLE = (charactersJson as { characters: CharacterBibleEntry[] }).characters
const LOCK_FRESH_MS = 3 * 60 * 1000

interface PackPage {
  text: string
  img?: string
}
interface PackChapter {
  title?: string
  pages: PackPage[]
}
interface PackStory {
  id: string
  title: string
  chapters?: PackChapter[]
}

function extFor(mime: string): string {
  return mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
}

export async function POST(req: NextRequest) {
  if (process.env.ART_AUTO_GENERATE === '0') {
    return NextResponse.json({ status: 'disabled' }, { status: 200 })
  }
  if (!artConfigured()) return NextResponse.json({ status: 'disabled' })
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ status: 'disabled' })
  const db = admin()!

  let body: {
    bookId?: string
    chapterIdx?: number
    pageIdx?: number
    bookTitle?: string
    chapterTitle?: string
    pageText?: string
    prevText?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad body' }, { status: 400 })
  }
  const { bookId } = body
  const chapterIdx = Number(body.chapterIdx)
  const pageIdx = Number(body.pageIdx)
  if (!bookId || !Number.isInteger(chapterIdx) || !Number.isInteger(pageIdx)) {
    return NextResponse.json({ error: 'bookId, chapterIdx, pageIdx required' }, { status: 400 })
  }

  // Resolve the page. Pack books use OUR copy of the text (client fields are
  // ignored). Generated kid books exist only in the reader's device storage,
  // so the client sends the text along — clamp it so the endpoint can't be fed
  // arbitrary essays.
  const story = (packJson as { stories: PackStory[] }).stories.find((s) => s.id === bookId)
  const chapter = story?.chapters?.[chapterIdx]
  const packPage = chapter?.pages?.[pageIdx]
  const clamp = (s: unknown, max: number) => (typeof s === 'string' ? s.slice(0, max).trim() : '')
  let bookTitle: string
  let chapterTitle: string | undefined
  let pageText: string
  let prevText: string | undefined
  if (story && chapter && packPage) {
    if (packPage.img) return NextResponse.json({ url: packPage.img })
    bookTitle = story.title
    chapterTitle = chapter.title
    pageText = packPage.text
    prevText = chapter.pages[pageIdx - 1]?.text
  } else {
    pageText = clamp(body.pageText, 1500)
    if (!pageText) return NextResponse.json({ status: 'disabled' })
    bookTitle = clamp(body.bookTitle, 120) || 'A story by Azad'
    chapterTitle = clamp(body.chapterTitle, 120) || undefined
    prevText = clamp(body.prevText, 1500) || undefined
    if (chapterIdx < 0 || chapterIdx > 30 || pageIdx < 0 || pageIdx > 60) {
      return NextResponse.json({ status: 'disabled' })
    }
  }

  try {
    // Existing state for this slot.
    const { data: rows } = await db
      .from(ARTIFACTS_TABLE)
      .select('id, status, live_url, created_at')
      .eq('kind', 'scene')
      .eq('book_id', bookId)
      .eq('chapter_idx', chapterIdx)
      .eq('page_idx', pageIdx)
      .order('created_at', { ascending: false })
      .limit(3)
    const approved = (rows ?? []).find((r) => r.status === 'approved' && r.live_url)
    if (approved) return NextResponse.json({ url: approved.live_url })
    const pending = (rows ?? []).find((r) => r.status === 'pending')
    if (pending && Date.now() - new Date(pending.created_at as string).getTime() < LOCK_FRESH_MS) {
      return NextResponse.json({ status: 'generating' })
    }

    // Take the lock (a pending row). Reuse a stale pending row if present.
    let lockId: string
    if (pending) {
      lockId = pending.id as string
      await db.from(ARTIFACTS_TABLE).update({ created_at: new Date().toISOString() }).eq('id', lockId)
    } else {
      const { data: ins, error } = await db
        .from(ARTIFACTS_TABLE)
        .insert({
          kind: 'scene',
          book_id: bookId,
          chapter_idx: chapterIdx,
          page_idx: pageIdx,
          candidate_path: `auto/${bookId}/${chapterIdx}-${pageIdx}`,
          status: 'pending',
          model: null,
        })
        .select('id')
        .single()
      if (error) throw new Error(error.message)
      lockId = ins.id as string
    }

    // Build the brief straight from the page text.
    const characters = detectCharacters(pageText, BIBLE)
    const charRefs: GeminiImagePart[] = []
    if (characters.length) {
      const { data: sheets } = await db
        .from(ARTIFACTS_TABLE)
        .select('live_url')
        .eq('kind', 'sheet')
        .eq('status', 'approved')
        .in('character_id', characters.map((c) => c.id))
      for (const s of (sheets ?? []) as Array<{ live_url: string | null }>) {
        if (!s.live_url) continue
        try {
          const resp = await fetch(s.live_url)
          charRefs.push({
            mimeType: resp.headers.get('content-type') || 'image/jpeg',
            data: Buffer.from(await resp.arrayBuffer()).toString('base64'),
          })
        } catch {
          /* skip */
        }
      }
    }
    const styleRefs = await loadStyleRefs()
    const prompt = passageScenePrompt({
      bookTitle,
      chapterTitle,
      pageText,
      prevText,
      characters,
      photoRefCount: charRefs.length,
    })

    // Flash tier for interiors — fast + cheap; cascade still falls back.
    const res = await generateGeminiImage({
      apiKey,
      prompt,
      referenceImages: [...charRefs, ...styleRefs].slice(0, 14),
      preferModel: 'gemini-3.1-flash-image',
    })
    const cand = res.candidates[0]
    if (!cand) throw new Error('model returned no image')

    // Publish straight to the PUBLIC live bucket.
    const livePath = `books/${bookId}/${chapterIdx}-${pageIdx}.${extFor(cand.mimeType)}`
    const up = await db.storage
      .from(LIVE_BUCKET)
      .upload(livePath, Buffer.from(cand.base64, 'base64'), { contentType: cand.mimeType, upsert: true })
    if (up.error) throw new Error(`live upload failed: ${up.error.message}`)
    const { data: pub } = db.storage.from(LIVE_BUCKET).getPublicUrl(livePath)

    await db
      .from(ARTIFACTS_TABLE)
      .update({ status: 'approved', live_url: pub.publicUrl, model: res.model, approved_at: new Date().toISOString() })
      .eq('id', lockId)

    return NextResponse.json({ url: pub.publicUrl })
  } catch (e) {
    console.error('[art/page] failed:', (e as Error).stack || (e as Error).message)
    // Best-effort: release the lock so a later reader can retry.
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
