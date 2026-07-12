// Little Fables — client-side intent dispatcher (PRD R16 / R17 / R18).
//
// The API classifies a transcript against the CLOSED whitelist below and
// returns { intent, args?, buddyLine, confidence, options? }. This module is
// the "suspenders" half of R18: even if the server returned something wrong,
// we ONLY dispatch to safe kid-facing routes here. Parent surfaces
// (/read/parent, /story/create, /dashboard, /auth) are never reachable
// through this dispatcher.
//
// It also encodes the R17 misfire flow — a module-scoped miss-counter tracks
// how many "none" results we've seen for the current surface. After N misses
// we stop re-asking and hold the toast open as a tap fallback.

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { speak } from '@/lib/read/speech'

// -------- The whitelist. Belt AND suspenders (see PRD R18). --------
export type Intent =
  | 'open_book'
  | 'continue'
  | 'show_badges'
  | 'show_words'
  | 'show_map'
  | 'switch_buddy'
  | 'replay_chapter'
  | 'make_story'
  | 'read_this'
  | 'go_home'
  | 'none'

const KID_SAFE_INTENTS: Intent[] = [
  'open_book',
  'continue',
  'show_badges',
  'show_words',
  'show_map',
  'switch_buddy',
  'replay_chapter',
  'make_story',
  'read_this',
  'go_home',
  'none',
]

/** Routes the dispatcher is allowed to navigate to. Kid surfaces only. */
const SAFE_ROUTE_PREFIXES = ['/read'] as const

/**
 * Blocked route prefixes. If any dispatched intent somehow tries to land on
 * one of these it's coerced to 'none' before nav. This is the R18 suspenders.
 */
const BLOCKED_ROUTE_PREFIXES = ['/read/parent', '/story/create', '/dashboard', '/auth'] as const

function routeIsSafe(path: string): boolean {
  if (BLOCKED_ROUTE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return false
  return SAFE_ROUTE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
}

// -------- Types the API and callers exchange. --------

export interface IntentApiResult {
  intent: Intent
  args?: { bookId?: string; hint?: string }
  buddyLine: string
  confidence?: 'high' | 'medium' | 'low'
  options?: string[]
}

export interface IntentDispatchContext {
  router: AppRouterInstance
  /** Pulse a target card/button before nav. */
  onHighlight?: (targetId: string) => void
  /** Show the misfire toast. If options is provided, render tap chips. */
  onOffer?: (msg: string, options?: string[]) => void
  /** The mid-flight book id (for `continue`). */
  currentBookId?: string | null
  /** The current chapter index (reader). */
  currentChapterIdx?: number
  /** Reader hooks — the page wires these to setPhase / replay / read-aloud. */
  onReplayChapter?: () => void
  onShowMap?: () => void
  onReadThis?: () => void
  /** Shelf snapshot used for fuzzy `open_book` matching by hint. */
  shelf?: Array<{ id: string; title: string }>
}

// -------- Misfire counter (R17) — per-surface, module scoped. --------
//
// We reset on real intent success (anything except 'none'). Two consecutive
// misses on the same surface tells the client "stop reopening the mic — the
// tap fallback is enough." The Reader/Home pages read this via
// `hasReachedMissCap()` before deciding to auto-relisten.

const missCounts: Record<string, number> = {}

function bumpMiss(surface: string): number {
  const n = (missCounts[surface] ?? 0) + 1
  missCounts[surface] = n
  return n
}

function resetMiss(surface: string): void {
  missCounts[surface] = 0
}

export function currentMissCount(surface: string): number {
  return missCounts[surface] ?? 0
}

/** After 2 misses on the same surface we stop re-opening the mic. */
export function hasReachedMissCap(surface: string, cap = 2): boolean {
  return (missCounts[surface] ?? 0) >= cap
}

export function resetMissCounter(surface: string): void {
  resetMiss(surface)
}

// -------- Cheap fuzzy match for open_book hints. --------
//
// Strategy: normalize both hint and each shelf title to a bag of lowercase
// alphanumeric words, then score by:
//   (a) substring hit anywhere in the title → strong (+3)
//   (b) shared word count with hint tokens → +1 each
//   (c) title starts with hint → +2 tiebreak
// Return the highest scoring book above threshold 2. Deliberately simple —
// we don't want to compete with the model here; this is a safety net for
// when the model returned only a hint.

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'the', 'my', 'me', 'i', 'to', 'of', 'in', 'on', 'it', 'is', 'was', 'be',
  'book', 'story', 'one', 'that', 'this', 'please',
])

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
}

export function bestBookMatch(
  hint: string,
  shelf: Array<{ id: string; title: string }>,
): { id: string; title: string } | null {
  if (!hint || !shelf?.length) return null
  const hintTokens = tokens(hint)
  const hintLow = hint.toLowerCase()
  if (hintTokens.length === 0 && hintLow.trim().length === 0) return null

  let best: { book: { id: string; title: string }; score: number } | null = null
  for (const b of shelf) {
    const titleLow = b.title.toLowerCase()
    let score = 0
    if (hintLow && titleLow.includes(hintLow)) score += 3
    for (const t of hintTokens) {
      if (t.length < 3) continue
      if (titleLow.includes(t)) score += 1
    }
    if (hintTokens[0] && titleLow.startsWith(hintTokens[0])) score += 2
    if (!best || score > best.score) best = { book: b, score }
  }
  if (!best || best.score < 2) return null
  return best.book
}

// -------- The dispatcher. --------
//
// Speaks the buddyLine (fire-and-forget) and then performs the intent. For
// nav intents we highlight the target first (~1.4s pulse) before router.push
// so the child sees WHICH card the buddy meant. Non-nav intents (replay, map,
// read_this) just fire the caller-supplied hook.

const HIGHLIGHT_MS = 1400

export async function dispatchIntent(
  result: IntentApiResult,
  ctx: IntentDispatchContext,
  opts: { surface?: string } = {},
): Promise<void> {
  const surface = opts.surface ?? 'home'

  // Coerce anything unknown to none. (R18 suspenders.)
  const intent: Intent = KID_SAFE_INTENTS.includes(result.intent) ? result.intent : 'none'

  const speakLine = (line: string) => {
    if (!line) return
    try {
      speak(line)
    } catch {
      /* speech is fire-and-forget */
    }
  }

  const goSafe = (path: string) => {
    if (!routeIsSafe(path)) {
      // Fall through to none if a bad path somehow made it here.
      ctx.onOffer?.(result.buddyLine || "Hmm, let's stay in the story world.")
      return
    }
    ctx.router.push(path)
  }

  const highlightThen = (targetId: string, path: string) => {
    if (ctx.onHighlight) ctx.onHighlight(targetId)
    // Speak while we highlight; nav after the pulse settles.
    setTimeout(() => goSafe(path), HIGHLIGHT_MS)
  }

  switch (intent) {
    case 'open_book': {
      let bookId = result.args?.bookId
      // If no bookId but we have a hint + shelf, do a cheap match.
      if (!bookId && result.args?.hint && ctx.shelf?.length) {
        const match = bestBookMatch(result.args.hint, ctx.shelf)
        if (match) bookId = match.id
      }
      if (!bookId) {
        // No target we can act on — degrade to none.
        bumpMiss(surface)
        speakLine(result.buddyLine)
        ctx.onOffer?.(result.buddyLine, result.options)
        return
      }
      resetMiss(surface)
      speakLine(result.buddyLine)
      highlightThen(`book:${bookId}`, `/read/story/${encodeURIComponent(bookId)}`)
      return
    }

    case 'continue': {
      const bookId = ctx.currentBookId ?? undefined
      if (!bookId) {
        bumpMiss(surface)
        speakLine(result.buddyLine)
        ctx.onOffer?.(result.buddyLine, result.options)
        return
      }
      resetMiss(surface)
      speakLine(result.buddyLine)
      highlightThen('continue', `/read/story/${encodeURIComponent(bookId)}?resume=1`)
      return
    }

    case 'show_badges':
      resetMiss(surface)
      speakLine(result.buddyLine)
      goSafe('/read/badges')
      return

    case 'show_words':
      resetMiss(surface)
      speakLine(result.buddyLine)
      goSafe('/read/words')
      return

    case 'switch_buddy':
      resetMiss(surface)
      speakLine(result.buddyLine)
      goSafe('/read/buddy')
      return

    case 'make_story':
      resetMiss(surface)
      speakLine(result.buddyLine)
      // Prefer the buddy-driven flow (v3 story kitchen). Fall through to the
      // legacy /read/create if that route doesn't exist yet — routing is a
      // client concern in Next; a 404 there is fine for now.
      goSafe('/read/create-with-buddy')
      return

    case 'go_home':
      resetMiss(surface)
      speakLine(result.buddyLine)
      goSafe('/read')
      return

    case 'show_map':
      resetMiss(surface)
      speakLine(result.buddyLine)
      ctx.onShowMap?.()
      return

    case 'replay_chapter':
      resetMiss(surface)
      speakLine(result.buddyLine)
      ctx.onReplayChapter?.()
      return

    case 'read_this':
      resetMiss(surface)
      speakLine(result.buddyLine)
      ctx.onReadThis?.()
      return

    case 'none':
    default: {
      bumpMiss(surface)
      speakLine(result.buddyLine)
      ctx.onOffer?.(result.buddyLine, result.options)
      return
    }
  }
}

// -------- Convenience: fetch + dispatch from a transcript. --------
//
// Callers can also call /api/respond themselves and pass the result into
// dispatchIntent; this is a small helper so most callsites are one line.

export interface AskIntentRequest {
  transcript: string
  surface: 'home' | 'reader' | 'end' | 'other'
  state?: {
    hasMidFlightBook?: { id: string; title: string }
    shelf?: Array<{ id: string; title: string }>
    currentBook?: { id: string; title: string; chapterIdx?: number; totalChapters?: number }
    childName?: string
    lastIntentsMissed?: number
  }
}

export async function askIntent(req: AskIntentRequest): Promise<IntentApiResult> {
  try {
    const res = await fetch('/api/respond', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mode: 'intent',
        transcript: req.transcript,
        surface: req.surface,
        state: {
          ...(req.state ?? {}),
          lastIntentsMissed: currentMissCount(req.surface),
        },
      }),
    })
    if (!res.ok) throw new Error(`intent http ${res.status}`)
    const data = (await res.json()) as IntentApiResult
    // Belt-and-suspenders sanity check.
    if (!data || typeof data.buddyLine !== 'string' || !KID_SAFE_INTENTS.includes(data.intent)) {
      return {
        intent: 'none',
        buddyLine: "Hmm, I didn't quite catch that — just tap what you want.",
        confidence: 'low',
      }
    }
    return data
  } catch {
    return {
      intent: 'none',
      buddyLine: "Hmm, I didn't quite catch that — just tap what you want.",
      confidence: 'low',
    }
  }
}
