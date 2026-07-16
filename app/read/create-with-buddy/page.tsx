'use client'

// The STORY KITCHEN, kid-facing — prompt-based (v4).
//
// The multi-step interview (seed → redirect → interview → readback →
// correction) is gone. One screen, one idea:
//   1. Cap check — read the parent-set maxCreationsPerDay guardrail. If
//      exhausted, buddy speaks an in-fiction "kitchen is resting" line and
//      offers a shelf book.
//   2. Prompt — buddy asks "What's YOUR story about?". The child answers by
//      tapping chips, talking into the mic, or (with a grown-up) typing.
//      Everything lands in one visible prompt line.
//   3. Writing moment — <WritingMoment /> while /api/story mode:'kid-story'
//      generates. The backend rubric pipeline (deterministic pre-check →
//      hard-gate judge → deferred soft score) runs unchanged; the prompt is
//      threaded through the same KidInterview seed the interview used to fill.
//   4. Landing — save + push, grant Storyteller badges, persist wildcards,
//      redirect to /read/story/{id}. On failure the buddy offers "try again"
//      or a shelf book — NEVER a dead screen.

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { speak, listen, type SpeakHandle, type ListenHandle } from '@/lib/read/speech'
import { loadUniverse } from '@/lib/universe/azad-verse'
import {
  addWildcards,
  loadBadges,
  loadBooks,
  saveStory,
  uid,
} from '@/lib/read/storage'
import { pushStory } from '@/lib/read/sync'
import { checkBadges } from '@/lib/read/badges'
import { recordCreation, remaining } from '@/lib/read/kid-creations'
import { getBuddy, cp } from '@/lib/read/buddies'
import { loadBuddy } from '@/lib/read/storage'
import type { Book, BuddyDef, KidInterview } from '@/types/story'
import { CreatureSprite, KidScreen, KitchenBack, MicIcon, SpeechBubble } from '../art'
import type { BuddyKind } from '../art'
import { loadProfile } from '@/lib/read/profile'
import { loadShelf } from '@/lib/read/packs'
import { loadProgress } from '@/lib/read/storage'
import { WritingMoment } from './WritingMoment'
import './kitchen.css'

// ---------- Guardrails helper (Agent B owns the module) ----------
// Best-effort: dynamic import so a missing module doesn't break the flow.
interface KidGuardrails {
  maxCreationsPerDay?: number
}
async function safeCallGuardrails(): Promise<KidGuardrails> {
  try {
    const specifier = ['@', 'lib', 'read', 'guardrails'].join('/').replace('@/', '@/')
    const mod: unknown = await import(/* webpackIgnore: true */ specifier).catch(() => null)
    if (!mod || typeof mod !== 'object') return {}
    const m = mod as { getGuardrails?: () => KidGuardrails | Promise<KidGuardrails>; loadGuardrails?: () => KidGuardrails | Promise<KidGuardrails> }
    const fn = m.getGuardrails ?? m.loadGuardrails
    if (typeof fn !== 'function') return {}
    const g = await fn()
    return g && typeof g === 'object' ? g : {}
  } catch {
    return {}
  }
}

// Best-effort profile probe for creativeGuardrails.maxCreationsPerDay.
async function loadCap(fallback: number): Promise<number> {
  try {
    const specifier = ['@', 'lib', 'read', 'profile'].join('/').replace('@/', '@/')
    const mod: unknown = await import(/* webpackIgnore: true */ specifier).catch(() => null)
    if (!mod || typeof mod !== 'object') return fallback
    const m = mod as { loadProfile?: () => { creativeGuardrails?: { maxCreationsPerDay?: number } } | Promise<{ creativeGuardrails?: { maxCreationsPerDay?: number } }> }
    if (typeof m.loadProfile !== 'function') return fallback
    const p = await m.loadProfile()
    const cap = p?.creativeGuardrails?.maxCreationsPerDay
    return typeof cap === 'number' && cap > 0 ? cap : fallback
  } catch {
    return fallback
  }
}

// ---------- kidifyInterest ----------
// Parent-authored profile interest strings ("AKAI keyboard, patience while
// learning") are not kid-mouth. This helper turns them into 1–3-word tap chips
// that sound like a 4-year-old suggested them. We first check a hand-curated
// map for the common Azi-verse defaults (higher fidelity than the algorithm),
// then fall back to a splitter that grabs the first noun-ish token.
const KID_INTEREST_MAP: Record<string, string> = {
  'guitar and music (azi\'s three-chord c-g-am progression)': 'guitar',
  'puzzles — fitting pieces together': 'puzzles',
  'akai keyboard, patience while learning': 'music',
  'motorcycles, dinosaurs, bridges': 'dinosaurs',
  'the moon and stars': 'the moon',
  'snow, honey, gardens, bees': 'bees',
  'trains and yellow buses': 'trains',
  'family video calls to colombia': 'family',
  'code-switching — spanish, english, gujarati, hindi, creole': 'silly words',
}
const KID_FILLER = new Set([
  'and', 'the', 'a', 'an', 'or', 'of', 'with', 'to', 'for', 'in', 'on',
  'my', 'our', 'your', 'his', 'her', 'their',
  'learning', 'patience', 'while', 'about', 'like', 'love',
])
function kidifyInterest(raw: string): string {
  const s = (raw || '').trim()
  if (!s) return ''
  const key = s.toLowerCase()
  if (KID_INTEREST_MAP[key]) return KID_INTEREST_MAP[key]
  // Grab the primary chunk before any comma, paren, or em-dash.
  const primary = s.split(/[,\(\)\-—–]/)[0]?.trim() ?? s
  // Tokenize, drop filler, keep up to 3 words.
  const words = primary
    .toLowerCase()
    .replace(/[^a-z\s']/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !KID_FILLER.has(w))
  if (words.length === 0) {
    const first = primary.toLowerCase().split(/\s+/)[0]
    return first ?? ''
  }
  return words.slice(0, 3).join(' ')
}

// ---------- Phase enum ----------
type Phase =
  // Loading + cap check.
  | 'loading'
  // Buddy speaks the cap message + offers a shelf book.
  | 'capped'
  // One prompt: chips + mic + typed input feed a single visible idea line.
  | 'prompt'
  // WritingMoment while /api/story is generating.
  | 'writing'
  // Fatal failure — buddy speaks the "needs more baking" line + try again.
  | 'failed'

// ---------- Component ----------

export default function CreateWithBuddy() {
  const router = useRouter()

  const [phase, setPhase] = useState<Phase>('loading')
  const [buddy, setBuddy] = useState<BuddyDef | null>(null)
  const [energy, setEnergy] = useState<'bouncy' | 'calm'>('bouncy')
  const [promptText, setPromptText] = useState<string>('')
  const [micListening, setMicListening] = useState(false)
  const [buddyLine, setBuddyLine] = useState<string>('')

  const speakRef = useRef<SpeakHandle | null>(null)
  const listenRef = useRef<ListenHandle | null>(null)
  const cancelledRef = useRef(false)
  const promptRef = useRef('')
  promptRef.current = promptText

  const featuredShelfBook = useMemo(() => {
    const shelf = loadBooks()
    return shelf[0]
  }, [])

  // Cleanup on unmount — always cancel any in-flight speech/listen.
  useEffect(() => {
    return () => {
      cancelledRef.current = true
      speakRef.current?.cancel()
      listenRef.current?.stop()
    }
  }, [])

  // Boot: pick buddy + cap check.
  useEffect(() => {
    ;(async () => {
      const bs = loadBuddy()
      if (!bs.activeId) {
        router.replace('/read/arrival')
        return
      }
      setBuddy(getBuddy(bs.activeId))
      setEnergy(bs.energy)

      const g = await safeCallGuardrails()
      const cap = await loadCap(typeof g.maxCreationsPerDay === 'number' ? g.maxCreationsPerDay : 2)
      const left = remaining(cap)
      if (left <= 0) {
        setPhase('capped')
        return
      }
      setPhase('prompt')
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Phase: capped ----
  useEffect(() => {
    if (phase !== 'capped' || !buddy) return
    const line = "The story kitchen needs to rest — how about we read one first? We can make another one soon."
    setBuddyLine(line)
    speakRef.current?.cancel()
    speakRef.current = speak(line)
  }, [phase, buddy])

  // ---- Phase: prompt ----
  useEffect(() => {
    if (phase !== 'prompt' || !buddy) return
    const q = "What's YOUR story about? Tell me anything!"
    setBuddyLine(q)
    speakRef.current?.cancel()
    speakRef.current = speak(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, buddy])

  /** Append a chunk of idea (chip tap or mic transcript) to the prompt line. */
  const appendIdea = useCallback((chunk: string) => {
    const t = chunk.trim()
    if (!t) return
    setPromptText((prev) => (prev.trim() ? `${prev.trim()} ${t}` : t))
  }, [])

  const openPromptMic = useCallback(() => {
    if (cancelledRef.current) return
    setMicListening(true)
    let got = false
    listenRef.current = listen({
      timeoutMs: 10000,
      onResult: (t) => {
        got = true
        setMicListening(false)
        appendIdea(t)
      },
      onEnd: () => {
        if (got || cancelledRef.current) return
        setMicListening(false)
        const line = 'Take your time. Tap the mic when you know.'
        setBuddyLine(line)
        speakRef.current = speak(line)
      },
      onError: () => {
        setMicListening(false)
      },
    })
  }, [appendIdea])

  // ---- Phase: writing (fires /api/story — the backend rubric pipeline) ----
  const makeStory = useCallback(async () => {
    const idea = promptRef.current.trim()
    if (!idea || cancelledRef.current) return
    listenRef.current?.stop()
    listenRef.current = null
    speakRef.current?.cancel()
    setMicListening(false)
    setPhase('writing')
    try {
      // The prompt rides the same KidInterview seed the interview flow used,
      // so stepSevenSeed / kidStoryPrompt on the server work unchanged: the
      // child's idea appears verbatim as originalSeed + an 'idea' extra.
      const interview: KidInterview = {
        answers: [],
        recipe: { extras: [{ slot: 'idea', value: idea }] },
        readBack: '',
        finishedAt: Date.now(),
      }
      const res = await fetch('/api/story', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode: 'kid-story',
          interview,
          originalSeed: idea,
          idea, // fallback for legacy prompt paths
          universe: loadUniverse(),
          by: 'Made by Azad',
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? `http ${res.status}`)
      }
      const data = (await res.json()) as Partial<Book> & {
        pages?: Book['chapters'][number]['pages']
        interview?: KidInterview
        wildcards?: Book['wildcards']
        author?: 'azad' | 'family'
        status?: string
      }
      if (data.status === 'needs-review') {
        // Failure path — surface the "needs more baking" line, not a dead
        // screen. Parents will see the draft in Parent Corner.
        setPhase('failed')
        return
      }

      // Assemble the Book. The API returns pages/chapters — we normalize to
      // a 1-chapter Book so the reader can play it as a quick story.
      const bookId = uid()
      const pages = Array.isArray(data.pages) ? data.pages : []
      const chapters = Array.isArray(data.chapters) && data.chapters.length > 0
        ? data.chapters
        : [{ title: data.title ?? 'A story by Azad', pages, status: 'current' as const }]
      const book: Book = {
        id: bookId,
        title: data.title ?? 'A story by Azad',
        by: data.by ?? 'Made by Azad',
        kind: 'quick',
        status: 'complete',
        source: 'generated',
        coverEmoji: data.coverEmoji ?? '',
        coverBg: data.coverBg,
        wash: data.wash,
        chapters,
        vocab: data.vocab ?? [],
        teachingGoals: data.teachingGoals ?? [],
        retellPrompts: data.retellPrompts ?? [
          'Who was in your story?',
          'What was the uh-oh?',
        ],
        qaRecord: data.qaRecord,
        skillTags: data.skillTags,
        charactersUsed: data.charactersUsed,
        mysteryWord: data.mysteryWord,
        interview,
        wildcards: (data as Book).wildcards,
        author: 'azad',
        artBrief: typeof data.artBrief === 'string' ? data.artBrief : undefined,
        createdAt: Date.now(),
        idea,
      }
      saveStory(book)
      void pushStory(book)

      // Fire deferred soft-scoring in the background. The Book is already on
      // the shelf; the kid is heading into the reader right now. When
      // /api/story-score returns we merge the softScore into qaRecord and
      // persist. If it fails (timeout, 502, offline) the Book stays at
      // needs-review — parents see it in the Corner.
      const scoreDeferred =
        (data as { scoreDeferred?: boolean }).scoreDeferred === true
      if (scoreDeferred) {
        void (async () => {
          try {
            const scoreRes = await fetch('/api/story-score', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                book,
                universe: loadUniverse(),
              }),
            })
            if (!scoreRes.ok) return
            const scored = (await scoreRes.json()) as {
              softScore?: number
              breakdown?: unknown
              notes?: string
              status?: string
            }
            if (typeof scored.softScore !== 'number') return
            const merged: Book = {
              ...book,
              qaRecord: {
                ...(book.qaRecord ?? { hardGates: { passed: true }, softScore: 0, revisions: 0 }),
                softScore: scored.softScore,
                breakdown: scored.breakdown as NonNullable<Book['qaRecord']>['breakdown'],
                notes: scored.notes ?? book.qaRecord?.notes,
              },
              status: scored.status === 'needs-review' ? 'needs-review' : 'complete',
            }
            saveStory(merged)
            void pushStory(merged)
          } catch {
            /* silent — Book stays at needs-review until retry */
          }
        })()
      }

      // Bump the daily counter.
      recordCreation()

      // Persist wildcards to the universe cast.
      if (book.wildcards && book.wildcards.length > 0) {
        addWildcards(book.wildcards)
      }

      // Storyteller badges. Count kid-authored books in local storage as the
      // creation count — the persisted `author: 'azad'` on Books is the truth.
      try {
        const kidCount = loadBooks().filter((b) => b.author === 'azad').length
        const before = new Set(loadBadges().ids)
        await checkBadges({ kidCreationsCount: kidCount })
        void before // (unused — kept for future analytics)
      } catch {
        /* ignore — badge grants are best-effort */
      }

      router.push(`/read/story/${book.id}`)
    } catch (e) {
      console.warn('[create-with-buddy] generation failed:', e)
      setPhase('failed')
    }
  }, [router])

  // ---- Phase: failed ----
  useEffect(() => {
    if (phase !== 'failed' || !buddy) return
    const line = "This story needs more baking — want to try again, or read one first?"
    setBuddyLine(line)
    speakRef.current?.cancel()
    speakRef.current = speak(line)
  }, [phase, buddy])

  const tryAgain = useCallback(() => {
    speakRef.current?.cancel()
    setPhase('prompt')
  }, [])

  // ---- Seed suggestion chips (touch-balance) ----
  // Interests from profile + up to two recently-read shelf titles + wildcards.
  // Tapping a chip drops it into the prompt line — the child can stack a few
  // ("dinosaurs" + "the moon") before hitting Make my story.
  const seedSuggestions = useMemo(() => {
    const out: string[] = []
    try {
      const p = loadProfile()
      const interests = (p.interests ?? []).slice(0, 3)
      for (const i of interests) {
        const k = kidifyInterest(i)
        if (k) out.push(k)
      }
    } catch {
      /* profile is best-effort */
    }
    try {
      const shelf = loadShelf()
      const prog = loadProgress()
      const touched = shelf
        .map((b) => ({ b, u: prog[b.id]?.updatedAt ?? 0 }))
        .filter((x) => x.u > 0)
        .sort((a, b) => b.u - a.u)
        .slice(0, 2)
      for (const t of touched) out.push(`another ${t.b.title}-like`)
    } catch {
      /* shelf is best-effort */
    }
    // Wildcards — always at least these so we hit 4-6 chips.
    for (const w of ['a hero', 'a helper', 'something silly']) out.push(w)
    // De-dupe, cap 6.
    const seen = new Set<string>()
    const dedup: string[] = []
    for (const s of out) {
      const k = s.toLowerCase()
      if (seen.has(k)) continue
      seen.add(k)
      dedup.push(s)
      if (dedup.length >= 6) break
    }
    return dedup
  }, [])

  const goBack = useCallback(() => {
    listenRef.current?.stop()
    listenRef.current = null
    speakRef.current?.cancel()
    router.push('/read')
  }, [router])

  // ---- Render ----
  if (!buddy) {
    return (
      <KidScreen label="Story kitchen">
        <div className="lf-room lf-kitchen" style={{ padding: 48, textAlign: 'center', color: 'var(--ink-soft, #6E5B49)' }}>
          Loading…
        </div>
      </KidScreen>
    )
  }

  // Writing moment is a totally different layout. The prompt shows up on the
  // open book in the child's handwriting.
  if (phase === 'writing') {
    return (
      <WritingMoment
        buddy={buddy}
        recipe={{ extras: [{ slot: 'idea', value: promptText.trim() }] }}
        spokenLine={`A story about ${promptText.trim()}. Let's find out how it turns out.`}
      />
    )
  }

  const canMake = promptText.trim().length > 0
  const buddyKind: BuddyKind = (buddy.id as BuddyKind) ?? 'bramble'
  const spritePose = micListening ? 'listening' : 'idle'

  return (
    <KidScreen label="Story kitchen" style={{ padding: 0 }}>
      <div
        className="lf-room lf-kitchen"
        style={{
          position: 'relative',
          minHeight: '100dvh',
          background: 'var(--paper, #F4EBD8)',
          backgroundImage: 'var(--texture-paper)',
          color: 'var(--ink, #46362A)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 22,
          padding: '32px 24px',
        }}
      >
        <KitchenBackButton onTap={goBack} />

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, maxWidth: 720, flexWrap: 'wrap', justifyContent: 'center', zIndex: 2 }}>
          <div style={{ pointerEvents: 'none' }}>
            <CreatureSprite kind={buddyKind} pose={spritePose} size={140} />
          </div>
          <SpeechBubble big style={{ marginBottom: 12, maxWidth: 520 }}>
            {buddyLine || cp(buddy.greet, energy)}
          </SpeechBubble>
        </div>

        {phase === 'prompt' && (
          <>
            {/* The prompt line — one visible place everything lands. Caveat
                 handwriting so it reads as the child's own idea on paper. */}
            <div
              className="lf-drawn-border"
              style={{
                width: 'min(560px, 92vw)',
                background: 'var(--paper-bright, #F9F2E3)',
                backgroundImage: 'var(--texture-paper)',
                borderRadius: '18px 22px 19px 21px',
                padding: '14px 18px',
                zIndex: 2,
              }}
            >
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void makeStory()
                  }
                }}
                placeholder="a bear who wants honey on the moon…"
                rows={2}
                aria-label="Your story idea"
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  background: 'transparent',
                  fontFamily: "var(--font-child-hand, 'Caveat'), cursive",
                  fontSize: 28,
                  lineHeight: 1.25,
                  color: 'var(--pigment-berry, #9B4A6B)',
                }}
              />
            </div>

            {/* Idea chips — tap to add to the prompt line. */}
            {seedSuggestions.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 12,
                  justifyContent: 'center',
                  maxWidth: 720,
                  zIndex: 2,
                }}
              >
                {seedSuggestions.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => appendIdea(chip)}
                    className="lf-press lf-drawn-border"
                    style={{
                      minHeight: 56,
                      padding: '10px 18px',
                      borderRadius: '14px 18px 15px 17px',
                      background: 'var(--paper-bright, #F9F2E3)',
                      backgroundImage: 'var(--texture-paper)',
                      color: 'var(--ink, #46362A)',
                      border: 'none',
                      font: '700 16px var(--font-body)',
                      cursor: 'pointer',
                      fontStyle: 'italic',
                      touchAction: 'manipulation',
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Mic + the one big button. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap', justifyContent: 'center', zIndex: 2 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  aria-label={micListening ? 'Tap when done' : 'Say it out loud'}
                  onClick={() => {
                    if (micListening) {
                      listenRef.current?.stop()
                      return
                    }
                    speakRef.current?.cancel()
                    openPromptMic()
                  }}
                  className="lf-press lf-drawn-border lf-drawn-border--bold"
                  style={{
                    width: 92,
                    height: 92,
                    borderRadius: '50% 48% 52% 50%',
                    border: 'none',
                    background: micListening
                      ? 'var(--pigment-terracotta-deep, #C7452F)'
                      : 'var(--pigment-terracotta, #D95B43)',
                    backgroundImage: 'var(--texture-paper)',
                    color: '#F9F2E3',
                    boxShadow: '0 8px 20px rgba(217,91,67,.4)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    touchAction: 'manipulation',
                  }}
                >
                  <MicIcon size={42} />
                </button>
                <div
                  style={{
                    font: '600 14px var(--font-body)',
                    fontStyle: 'italic',
                    color: micListening ? 'var(--pigment-terracotta-deep, #C7452F)' : 'var(--ink-soft, #6E5B49)',
                    minHeight: 20,
                  }}
                >
                  {micListening ? "I'm listening!" : 'tap to talk'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => void makeStory()}
                disabled={!canMake}
                className="lf-press lf-drawn-border lf-drawn-border--bold"
                style={{
                  minHeight: 68,
                  padding: '14px 34px',
                  borderRadius: '22px 26px 23px 25px',
                  background: canMake ? 'var(--pigment-terracotta, #D95B43)' : 'var(--paper-bright, #F9F2E3)',
                  backgroundImage: 'var(--texture-paper)',
                  color: canMake ? '#F9F2E3' : 'var(--ink-faint, #97836B)',
                  border: 'none',
                  font: '700 22px var(--font-display)',
                  boxShadow: canMake ? '0 8px 18px rgba(217,91,67,.4)' : 'none',
                  cursor: canMake ? 'pointer' : 'default',
                  touchAction: 'manipulation',
                }}
              >
                Make my story! ✨
              </button>
            </div>
          </>
        )}

        {phase === 'failed' && (
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', zIndex: 2 }}>
            <button
              type="button"
              onClick={tryAgain}
              className="lf-press lf-drawn-border lf-drawn-border--bold"
              style={{
                minHeight: 68,
                padding: '14px 34px',
                borderRadius: '22px 26px 23px 25px',
                border: 'none',
                background: 'var(--pigment-terracotta, #D95B43)',
                backgroundImage: 'var(--texture-paper)',
                color: '#F9F2E3',
                font: '700 20px var(--font-display)',
                boxShadow: '0 8px 18px rgba(217,91,67,.4)',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            {featuredShelfBook && (
              <button
                type="button"
                className="lf-press lf-drawn-border"
                onClick={() => router.push(`/read/story/${featuredShelfBook.id}`)}
                style={{
                  minHeight: 68,
                  padding: '14px 30px',
                  borderRadius: '22px 26px 23px 25px',
                  border: 'none',
                  background: 'var(--paper-bright, #F9F2E3)',
                  backgroundImage: 'var(--texture-paper)',
                  color: 'var(--ink, #46362A)',
                  font: '700 19px var(--font-display)',
                  cursor: 'pointer',
                }}
              >
                Read {featuredShelfBook.title} instead ▶
              </button>
            )}
          </div>
        )}

        {phase === 'capped' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', zIndex: 2 }}>
            {featuredShelfBook ? (
              <button
                type="button"
                className="lf-press lf-drawn-border lf-drawn-border--bold"
                onClick={() => router.push(`/read/story/${featuredShelfBook.id}`)}
                style={{
                  minHeight: 68,
                  padding: '14px 34px',
                  borderRadius: '22px 26px 23px 25px',
                  border: 'none',
                  background: 'var(--pigment-terracotta, #D95B43)',
                  backgroundImage: 'var(--texture-paper)',
                  color: '#F9F2E3',
                  font: '700 20px var(--font-display)',
                  boxShadow: '0 8px 18px rgba(217,91,67,.4)',
                  cursor: 'pointer',
                }}
              >
                Read {featuredShelfBook.title} instead ▶
              </button>
            ) : (
              <button
                type="button"
                className="lf-press lf-drawn-border lf-drawn-border--bold"
                onClick={() => router.push('/read')}
                style={{
                  minHeight: 68,
                  padding: '14px 34px',
                  borderRadius: '22px 26px 23px 25px',
                  border: 'none',
                  background: 'var(--pigment-terracotta, #D95B43)',
                  backgroundImage: 'var(--texture-paper)',
                  color: '#F9F2E3',
                  font: '700 20px var(--font-display)',
                  boxShadow: '0 8px 18px rgba(217,91,67,.4)',
                  cursor: 'pointer',
                }}
              >
                Back to my shelf
              </button>
            )}
          </div>
        )}
      </div>
    </KidScreen>
  )
}

/* ================= KitchenBackButton =================
 * The drawn door-edge in the top-left corner of every kitchen screen. Tap
 * = back to the room. Positioned absolutely so it never fights the
 * flex-centered content.
 */
function KitchenBackButton({ onTap }: { onTap: () => void }) {
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label="Back"
      className="lf-press"
      style={{
        position: 'absolute',
        top: 18,
        left: 18,
        width: 56,
        height: 56,
        padding: 0,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        zIndex: 5,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <KitchenBack size={56} />
    </button>
  )
}
