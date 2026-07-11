'use client'

// Reader v2 — with an integrated chapter map for multi-chapter books.
//
// Flow:
//   1. Load book. If chapters > 1 and the child hasn't picked a chapter, show
//      the ChapterMap (train-stops) with done ✓ / current ▶ / painting ✦.
//      Tap a finished chapter to re-read; the current chapter has a coral ▶.
//   2. Read pages of the picked chapter. Word highlight from TtsSource
//      timestamps via speak(). Falls back to text + tap-to-advance if TTS is
//      unavailable.
//   3. Ask block → mic; 2-miss mercy accepts anything and shows the hint.
//      /api/respond evaluates when reachable; keyword `matchesAny()` is the
//      offline fallback; if recognitionAvailable() is false, the tap fallback
//      is offered immediately.
//   4. Choice block → 2 canned options + a "…or tell me YOUR idea!" mic path
//      that captures childIdea and calls /api/story `continue`.
//   5. Chapter end → ChapterEnd. Book end (last chapter, or single-chapter
//      quick story) → BookComplete.
//
// Voice: treat speech as available (see docs/voice-architecture.md). If /api/tts
// isn't configured, TTS calls end() quickly and we render text-only with
// tap-to-advance.
//
// Not-touched: lib/read/speech.ts, app/api/**.

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { STARTER_STORIES } from '@/lib/read/starter-stories'
import { PACK_BOOKS } from '@/lib/read/packs'
import { getStory, saveStory, saveProgress, recordChoice, collectWord, getProgress } from '@/lib/read/storage'
import { pushStory } from '@/lib/read/sync'
import { loadUniverse } from '@/lib/universe/azad-verse'
import {
  listen,
  matchesAny,
  recognitionAvailable,
  speak,
  type SpeakHandle,
} from '@/lib/read/speech'
import { checkBadges } from '@/lib/read/badges'
import { getBuddy, cp } from '@/lib/read/buddies'
import { loadBuddy } from '@/lib/read/storage'
import type {
  Book,
  BuddyDef,
  Chapter,
  ChoiceOption,
  GenerateResponse,
  Page,
} from '@/types/story'
import {
  BuddyFace,
  CircleBtn,
  ChapterDots,
  KidScreen,
  ProgressBar,
  ProgressRing,
  SpeechBubble,
  WashScene,
  washBg,
} from '../../components'
import { ChapterEnd } from './EndPhase'
import { BookComplete } from './EndPhase'

type AskUiState = 'idle' | 'listening' | 'praise' | 'hint'

export default function ReaderRoute() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''
  const router = useRouter()

  const [book, setBook] = useState<Book | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    // Try saved → packs → starter (in that priority).
    const b =
      getStory(id) ??
      PACK_BOOKS.find((x) => x.id === id) ??
      STARTER_STORIES.find((x) => x.id === id) ??
      null
    if (!b) setNotFound(true)
    else setBook(b)
  }, [id])

  if (notFound) {
    return (
      <KidScreen label="Book not found">
        <main
          style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: 24,
            textAlign: 'center',
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 64 }}>📚</span>
          <p style={{ font: 'var(--text-story-title)' }}>Hmm, that book isn&rsquo;t on the shelf.</p>
          <Link
            href="/read"
            className="lf-press"
            style={{
              background: 'var(--lf-cream-card)',
              border: '1.5px solid var(--lf-cream-line)',
              borderRadius: 'var(--radius-pill)',
              padding: '12px 24px',
              font: 'var(--text-cta)',
              color: 'var(--lf-espresso)',
              textDecoration: 'none',
            }}
          >
            Back to the Bookshelf
          </Link>
        </main>
      </KidScreen>
    )
  }
  if (!book) return null

  return <ReaderBook book={book} onBookUpdate={setBook} onExit={() => router.push('/read')} />
}

function ReaderBook({
  book,
  onBookUpdate,
  onExit,
}: {
  book: Book
  onBookUpdate: (b: Book) => void
  onExit: () => void
}) {
  const isMultiChapter = book.chapters.length > 1
  const router = useRouter()

  // Buddy for header + celebrations.
  const [buddy, setBuddy] = useState<BuddyDef>(getBuddy(null))
  const [energy, setEnergy] = useState<'bouncy' | 'calm'>('bouncy')
  useEffect(() => {
    const bs = loadBuddy()
    setBuddy(getBuddy(bs.activeId))
    setEnergy(bs.energy)
  }, [])

  // ---- Phase: map | reading | chapterEnd | bookComplete ----
  // Multi-chapter books start on the map (unless resuming mid-chapter);
  // quick stories go straight to the pages.
  const [chapterIdx, setChapterIdx] = useState<number | null>(null)
  const [phase, setPhase] = useState<'map' | 'reading' | 'chapterEnd' | 'bookComplete'>(
    isMultiChapter ? 'map' : 'reading',
  )

  // Initial resume: if the reader has never picked a chapter, seed from stored
  // progress once the book is known.
  useEffect(() => {
    if (chapterIdx !== null) return
    if (!isMultiChapter) {
      setChapterIdx(0)
      return
    }
    const prog = getProgress(book.id)
    // Don't auto-open — the map is the right landing per handoff. But if
    // there's mid-chapter progress on the current chapter, we allow "Continue"
    // to drop into the reader directly via a URL hint (?resume=1). Kept simple.
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('resume')) {
      const cur = Math.min(book.chapters.length - 1, prog?.chapter ?? 0)
      setChapterIdx(cur)
      setPhase('reading')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id, isMultiChapter])

  // ---- Map phase ----
  if (phase === 'map' || chapterIdx === null) {
    return (
      <ChapterMap
        book={book}
        buddy={buddy}
        onExit={onExit}
        onPickChapter={(i) => {
          setChapterIdx(i)
          setPhase('reading')
        }}
      />
    )
  }

  const chapter = book.chapters[chapterIdx]!
  if (!chapter) return null

  if (phase === 'chapterEnd') {
    return (
      <ChapterEnd
        book={book}
        chapterIdx={chapterIdx}
        buddy={buddy}
        energy={energy}
        onNextChapter={() => {
          if (chapterIdx + 1 < book.chapters.length) {
            setChapterIdx(chapterIdx + 1)
            setPhase('reading')
          } else {
            setPhase('bookComplete')
          }
        }}
        onAllDone={() => router.push('/read')}
      />
    )
  }
  if (phase === 'bookComplete') {
    return (
      <BookComplete
        book={book}
        buddy={buddy}
        energy={energy}
        onDone={() => router.push('/read')}
      />
    )
  }

  return (
    <ReaderPages
      book={book}
      chapterIdx={chapterIdx}
      chapter={chapter}
      buddy={buddy}
      energy={energy}
      onExit={() => {
        if (isMultiChapter) setPhase('map')
        else onExit()
      }}
      onFinishChapter={async () => {
        // Persist progress + light today's sun.
        saveProgress({
          bookId: book.id,
          chapter: chapterIdx + 1,
          page: 0,
          updatedAt: Date.now(),
        })
        try {
          const granted = await checkBadges({
            bookCompletedId: chapterIdx + 1 >= book.chapters.length ? book.id : undefined,
          })
          if (granted.length > 0) {
            router.push(`/read/badges/earn/${granted[0]}`)
            return
          }
        } catch {
          /* ignore */
        }
        setPhase('chapterEnd')
      }}
      onBookUpdate={onBookUpdate}
    />
  )
}

/* ================= ChapterMap (v2) =================
 * Winding-path layout: stops offset vertically with a dotted connector line
 * between them. Current stop is largest with the buddy face beside it.
 * Finished stops show a scene-art thumbnail (from ch.pages[0].img) + ✓ badge.
 *
 * "Locked" states are split into two distinct copies:
 *   - painting  → chapter has `status: 'painting'` OR no playable pages yet
 *                 → "Not yet… Mom is still painting this one ✦"
 *   - locked    → chapter is complete but sequentially locked behind progress
 *                 (e.g. Cozy Circle Ch. 3 before you finish Ch. 2)
 *                 → "Not yet — finish this chapter first ✦"  (no painting copy)
 */
function ChapterMap({
  book,
  buddy,
  onExit,
  onPickChapter,
}: {
  book: Book
  buddy: BuddyDef
  onExit: () => void
  onPickChapter: (i: number) => void
}) {
  const prog = getProgress(book.id)
  const currentIdx = Math.min(book.chapters.length - 1, prog?.chapter ?? 0)

  type StopStatus = 'done' | 'current' | 'locked' | 'painting'
  const chapterIsPainting = (ch: Chapter) =>
    ch.status === 'painting' || !ch.pages || ch.pages.length === 0

  const stops = book.chapters.map((ch, i): { ch: Chapter; i: number; status: StopStatus } => {
    if (chapterIsPainting(ch)) return { ch, i, status: 'painting' }
    if (i < currentIdx) return { ch, i, status: 'done' }
    if (i === currentIdx) return { ch, i, status: 'current' }
    return { ch, i, status: 'locked' }
  })

  return (
    <KidScreen label={`Chapter map — ${book.title}`}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '26px 32px 0' }}>
        <CircleBtn label="Back home" onClick={onExit} size={52}>
          ‹
        </CircleBtn>
        <div>
          <h1 style={{ margin: 0, font: '700 27px var(--font-display)' }}>{book.title}</h1>
          <p style={{ margin: '2px 0 0', font: '600 14px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
            <span aria-hidden="true">🔊</span> Tap a story stop. Finished ones love a re-read!
          </p>
        </div>
        <span style={{ marginLeft: 'auto' }}>
          <ChapterDots
            chapters={stops.map(({ status }) => ({
              status: status === 'locked' ? undefined : status,
            }))}
            style={{ fontSize: 16 }}
          />
        </span>
      </header>

      <style>{`
        /* Winding-path chapter map. Every other stop offsets down so the row
           reads like a journey, not a file list. Dotted connectors thread
           between stops. Static composition — no animation (reduced-motion safe). */
        .lf-chmap {
          position: relative;
          padding: 40px 32px 120px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 8px 24px;
          justify-items: center;
          align-items: start;
        }
        .lf-chmap-stop { position: relative; text-align: center; width: 100%; max-width: 200px; }
        .lf-chmap-stop:nth-child(even) { margin-top: 40px; }
        /* Dotted connector — sits behind each stop and reaches to the next one. */
        .lf-chmap-stop:not(:last-child)::after {
          content: '';
          position: absolute;
          top: 55px;
          left: 60%;
          width: 80%;
          border-top: 3px dashed var(--lf-cream-line);
          z-index: 0;
          pointer-events: none;
        }
        .lf-chmap-stop:nth-child(even):not(:last-child)::after { top: 15px; }
        @media (max-width: 640px) {
          .lf-chmap { grid-template-columns: 1fr; }
          .lf-chmap-stop:nth-child(even) { margin-top: 0; }
          .lf-chmap-stop:not(:last-child)::after { display: none; }
        }
      `}</style>

      <div className="lf-chmap">
        {stops.map(({ ch, i, status }) => {
          if (status === 'painting') {
            return (
              <div key={i} className="lf-chmap-stop">
                <div
                  aria-hidden="true"
                  style={{
                    width: 110,
                    height: 110,
                    margin: '0 auto',
                    borderRadius: 'var(--radius-cover)',
                    border: '2px dashed var(--lf-cream-line)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 44,
                    opacity: 0.45,
                    position: 'relative',
                    zIndex: 1,
                    background: 'var(--lf-cream-card)',
                  }}
                >
                  <span style={{ filter: 'grayscale(1)' }}>📕</span>
                </div>
                <div style={{ marginTop: 8, font: '700 14px var(--font-display)', color: 'var(--lf-espresso-faint)' }}>
                  Not yet…
                </div>
                <div style={{ font: '600 12px/1.4 var(--font-body)', color: 'var(--lf-espresso-faint)' }}>
                  Mom is still painting this one ✦
                </div>
              </div>
            )
          }

          if (status === 'locked') {
            return (
              <div key={i} className="lf-chmap-stop">
                <div
                  aria-hidden="true"
                  style={{
                    width: 110,
                    height: 110,
                    margin: '0 auto',
                    borderRadius: 'var(--radius-cover)',
                    border: '1.5px solid var(--lf-cream-line)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 40,
                    opacity: 0.55,
                    position: 'relative',
                    zIndex: 1,
                    background: 'var(--lf-cream-card)',
                    boxShadow: 'var(--shadow-warm)',
                  }}
                >
                  <span>📕</span>
                </div>
                <div style={{ marginTop: 8, font: '700 14px var(--font-display)', color: 'var(--lf-espresso-faint)' }}>
                  {i + 1}. {ch.title || `Chapter ${i + 1}`}
                </div>
                <div style={{ font: '600 12px/1.4 var(--font-body)', color: 'var(--lf-espresso-faint)' }}>
                  Not yet — finish this chapter first ✦
                </div>
              </div>
            )
          }

          const current = status === 'current'
          const done = status === 'done'
          const thumbImg = ch.pages?.[0]?.img
          const size = current ? 150 : 110

          return (
            <div
              key={i}
              className="lf-chmap-stop"
              style={{ maxWidth: current ? 210 : 200 }}
            >
              {current && (
                <BuddyFace
                  buddy={buddy}
                  size={64}
                  style={{ position: 'absolute', left: '10%', top: -18, zIndex: 3 }}
                />
              )}
              <button
                type="button"
                className="lf-press"
                onClick={() => onPickChapter(i)}
                style={{
                  position: 'relative',
                  width: size,
                  height: size,
                  margin: '0 auto',
                  borderRadius: 'var(--radius-cover)',
                  border: current ? '2.5px solid var(--lf-coral)' : '1.5px solid var(--lf-cream-line)',
                  cursor: 'pointer',
                  background: 'var(--lf-cream-card)',
                  padding: 7,
                  boxShadow: current
                    ? 'var(--shadow-coral-glow), var(--shadow-warm-lg)'
                    : 'var(--shadow-warm)',
                  transform: current ? 'scale(1.05)' : 'none',
                  zIndex: 2,
                  overflow: 'visible',
                }}
              >
                {thumbImg ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={thumbImg}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: 12,
                      display: 'block',
                    }}
                  />
                ) : (
                  <WashScene
                    wash={ch.wash ?? book.wash ?? 'meadow'}
                    emojis={ch.emojis}
                    doodle={false}
                    style={{ width: '100%', height: '100%', borderRadius: 12 }}
                  />
                )}
                {done && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: 'var(--lf-pastel-mint)',
                      border: '2px solid var(--lf-cream-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      font: '700 16px var(--font-body)',
                      color: 'var(--lf-espresso)',
                    }}
                  >
                    ✓
                  </span>
                )}
                {current && (
                  <span
                    className="lf-mic-pulse"
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      right: -14,
                      bottom: -14,
                      width: 58,
                      height: 58,
                      borderRadius: '50%',
                      background: 'var(--lf-coral)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      boxShadow: 'var(--shadow-coral-glow)',
                    }}
                  >
                    ▶
                  </span>
                )}
              </button>
              <div
                style={{
                  marginTop: 12,
                  font: `700 ${current ? 17 : 14.5}px var(--font-display)`,
                  color: current ? 'var(--lf-espresso)' : 'var(--lf-espresso-soft)',
                }}
              >
                {i + 1}. {ch.title || `Chapter ${i + 1}`}
              </div>
              {current && (
                <div style={{ font: '600 12.5px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
                  You are here!
                </div>
              )}
            </div>
          )
        })}
      </div>
    </KidScreen>
  )
}

/* ================= ReaderPages ================= */
function ReaderPages({
  book,
  chapterIdx,
  chapter,
  buddy,
  energy,
  onExit,
  onFinishChapter,
  onBookUpdate,
}: {
  book: Book
  chapterIdx: number
  chapter: Chapter
  buddy: BuddyDef
  energy: 'bouncy' | 'calm'
  onExit: () => void
  onFinishChapter: () => void | Promise<void>
  onBookUpdate: (b: Book) => void
}) {
  const pages = chapter.pages
  const [pageIdx, setPageIdx] = useState(0)
  const [replayN, setReplayN] = useState(0)
  const [wordIdx, setWordIdx] = useState(-1)
  const [reading, setReading] = useState(true)
  const [askState, setAskState] = useState<AskUiState>('idle')
  const [tries, setTries] = useState(0)
  const [fallbackUnlocked, setFallbackUnlocked] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [choiceGen, setChoiceGen] = useState(false)
  const [choiceError, setChoiceError] = useState<string | null>(null)
  const [breatheDone, setBreatheDone] = useState(false)
  const [showAskStory, setShowAskStory] = useState(false)

  const speakRef = useRef<SpeakHandle | null>(null)
  const listenStopRef = useRef<(() => void) | null>(null)

  const page: Page | undefined = pages[pageIdx]
  const words = useMemo(() => (page ? page.text.split(/\s+/).filter(Boolean) : []), [page])
  const total = pages.length
  const isLastPage = pageIdx === total - 1
  const micOk = recognitionAvailable()

  // ---- narration lifecycle ----
  const stopAll = useCallback(() => {
    speakRef.current?.cancel()
    speakRef.current = null
    listenStopRef.current?.()
    listenStopRef.current = null
    setWordIdx(-1)
  }, [])

  const narrate = useCallback((text: string, onEnd?: () => void) => {
    speakRef.current?.cancel()
    setWordIdx(-1)
    speakRef.current = speak(text, {
      onWord: (i) => setWordIdx(i),
      onEnd: () => {
        setWordIdx(-1)
        onEnd?.()
      },
    })
  }, [])

  useEffect(() => {
    if (!page) return
    if (!reading) {
      speakRef.current?.cancel()
      setWordIdx(-1)
      return
    }
    const t = setTimeout(() => narrate(page.text), 350)
    return () => {
      clearTimeout(t)
      speakRef.current?.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIdx, reading, replayN, chapterIdx])

  // Reset per-page state.
  useEffect(() => {
    setAskState('idle')
    setTries(0)
    setFallbackUnlocked(false)
    setChosen(null)
    setChoiceGen(false)
    setChoiceError(null)
    setBreatheDone(false)
    setShowAskStory(false)
    if (page?.star) {
      const meaning = book.vocab.find((v) => v.word === page.star)
      if (meaning) collectWord(meaning, book.id)
    }
    // Save mid-chapter progress.
    saveProgress({ bookId: book.id, chapter: chapterIdx, page: pageIdx, updatedAt: Date.now() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIdx, chapterIdx])

  useEffect(() => () => stopAll(), [stopAll])

  // ---- ask ----
  const evaluate = useCallback(
    async (transcript: string) => {
      const ask = page?.ask
      if (!ask) return
      // Wonder asks — no evaluation; buddy responds and we mark praise.
      if (ask.kind === 'wonder') {
        setAskState('praise')
        narrate(ask.praise)
        return
      }

      // Fast keyword fallback first (works offline).
      const keywordOk = ask.answers && ask.answers.length > 0 && matchesAny(transcript, ask.answers)
      if (keywordOk) {
        setAskState('praise')
        narrate(ask.praise)
        return
      }
      // Judged evaluation via /api/respond.
      try {
        const res = await fetch('/api/respond', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            transcript,
            question: ask.question,
            praise: ask.praise,
            hint: ask.hint,
            skill: ask.skill,
            answers: ask.answers ?? [],
          }),
        })
        if (res.ok) {
          const data = (await res.json()) as { ok?: boolean; reply?: string }
          if (data.ok) {
            setAskState('praise')
            narrate(data.reply ?? ask.praise)
            return
          }
          // Judged as not matching — fall through to hint / mercy path below.
        }
      } catch {
        /* offline / not configured — canned praise+hint path below */
      }

      setTries((prev) => {
        const next = prev + 1
        if (next >= 2) {
          setFallbackUnlocked(true)
          setAskState('hint')
          narrate(ask.hint)
        } else {
          setAskState('hint')
          narrate(ask.hint, () => setAskState('idle'))
        }
        return next
      })
    },
    [page, narrate],
  )

  const handleMic = useCallback(() => {
    if (!page?.ask) return
    stopAll()
    if (!micOk) {
      setFallbackUnlocked(true)
      return
    }
    setAskState('listening')
    listenStopRef.current = listen({
      onResult: (t) => void evaluate(t),
      onEnd: () => {
        listenStopRef.current = null
        setAskState((s) => (s === 'listening' ? 'idle' : s))
      },
      onError: () => {
        // canned praise/hint fallback
        setAskState('hint')
        setFallbackUnlocked(true)
      },
    }).stop
  }, [page, micOk, stopAll, evaluate])

  const handleSayIt = useCallback(() => {
    if (!page?.ask) return
    stopAll()
    setAskState('praise')
    narrate(page.ask.praise)
  }, [page, stopAll, narrate])

  // ---- choices ----
  const applyBranchGenerated = useCallback(
    async (opt: { label: string; childIdea?: string }) => {
      try {
        const res = await fetch('/api/story', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            mode: 'continue',
            bookContext: {
              id: book.id,
              title: book.title,
              kind: book.kind,
              priorChapters: book.chapters.slice(0, chapterIdx + 1).map((c) => ({
                title: c.title,
                summary: c.pages.map((p) => p.text).join(' ').slice(0, 400),
              })),
            },
            choice: opt.label,
            childIdea: opt.childIdea,
            universe: loadUniverse(),
          }),
        })
        const data = (await res.json()) as GenerateResponse
        if (!res.ok || data.error) throw new Error(data.error || 'story engine error')

        // Record & clear the choice block from this page.
        recordChoice(book.id, chapterIdx, opt.label, opt.childIdea ?? opt.label)

        const cleaned = pages.map((p, i) => (i === pageIdx ? ({ ...p, choice: undefined } as Page) : p))
        const newPages = [...cleaned, ...(data.pages ?? [])]

        // Merge into the book (replace this chapter's pages).
        const nextChapters = book.chapters.map((c, i) =>
          i === chapterIdx ? { ...c, pages: newPages } : c,
        )
        const updated: Book = { ...book, chapters: nextChapters }
        saveStory(updated)
        void pushStory(updated)
        onBookUpdate(updated)
        setPageIdx(pageIdx + 1)
        setChoiceGen(false)
      } catch {
        setChoiceError('The story machine hiccuped. Try again!')
        setChoiceGen(false)
        setChosen(null)
      }
    },
    [book, chapterIdx, pageIdx, pages, onBookUpdate],
  )

  const applyBranchStarter = useCallback(
    (opt: ChoiceOption) => {
      recordChoice(book.id, chapterIdx, opt.label, opt.label)
      const branchPages = opt.pages ?? []
      const cleaned = pages.map((p, i) => (i === pageIdx ? ({ ...p, choice: undefined } as Page) : p))
      const newPages = [...cleaned]
      newPages.splice(pageIdx + 1, 0, ...branchPages)
      const nextChapters = book.chapters.map((c, i) =>
        i === chapterIdx ? { ...c, pages: newPages } : c,
      )
      const updated: Book = { ...book, chapters: nextChapters }
      onBookUpdate(updated)
      setPageIdx(pageIdx + 1)
      setChoiceGen(false)
      void checkBadges().catch(() => {})
    },
    [book, chapterIdx, pageIdx, pages, onBookUpdate],
  )

  const handleChoose = useCallback(
    (opt: ChoiceOption) => {
      if (chosen) return
      stopAll()
      setChosen(opt.label)
      setTimeout(() => {
        setChoiceGen(true)
        if (opt.pages && opt.pages.length > 0) {
          setTimeout(() => applyBranchStarter(opt), 1500)
        } else {
          void applyBranchGenerated({ label: opt.label })
        }
      }, 650)
    },
    [chosen, stopAll, applyBranchStarter, applyBranchGenerated],
  )

  const handleYourIdea = useCallback(async () => {
    if (chosen) return
    stopAll()
    setChosen('…YOUR idea!')
    if (!micOk) {
      // No mic — fall back to prompt() so this still works. Kid-friendly copy.
      const idea = window.prompt('Tell me YOUR idea!')
      if (!idea) {
        setChosen(null)
        return
      }
      setChoiceGen(true)
      void applyBranchGenerated({ label: 'your idea', childIdea: idea })
      return
    }
    // Listen once, hand transcript into `applyBranchGenerated` as `childIdea`.
    setChoiceGen(true)
    listenStopRef.current = listen({
      onResult: (t) => {
        listenStopRef.current = null
        void applyBranchGenerated({ label: 'your idea', childIdea: t })
      },
      onEnd: () => {
        listenStopRef.current = null
      },
      onError: () => {
        setChoiceError('The story machine hiccuped. Try again!')
        setChoiceGen(false)
        setChosen(null)
      },
    }).stop
  }, [chosen, micOk, stopAll, applyBranchGenerated])

  // ---- Ask the story (always-available mic; bounded to 2 exchanges) ----
  const [askStoryTurns, setAskStoryTurns] = useState(0)
  const [askStoryReply, setAskStoryReply] = useState<string | null>(null)
  const handleAskStory = useCallback(() => {
    if (askStoryTurns >= 2) return
    stopAll()
    listenStopRef.current = listen({
      onResult: async (transcript) => {
        try {
          const res = await fetch('/api/respond', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              transcript,
              question: 'Child asked a question about the story',
              praise: 'Great question!',
              hint: 'Let me think about that.',
              skill: 'wonder',
            }),
          })
          if (res.ok) {
            const data = (await res.json()) as { reply?: string }
            const reply = data.reply ?? 'Great question! Let’s keep going.'
            setAskStoryReply(reply)
            narrate(reply)
          } else {
            setAskStoryReply('Great question! Let’s keep going.')
          }
        } catch {
          setAskStoryReply('Great question! Let’s keep going.')
        }
        setAskStoryTurns((n) => n + 1)
      },
      onEnd: () => {
        listenStopRef.current = null
      },
    }).stop
  }, [askStoryTurns, stopAll, narrate])

  // ---- navigation ----
  const askAnswered = askState === 'praise' || (askState === 'hint' && fallbackUnlocked)
  const askBlocked = !!page?.ask && !askAnswered
  const choiceBlocked = !!page?.choice && !chosen
  const breatheBlocked = !!page?.breathe && !breatheDone
  const blocked = askBlocked || choiceBlocked || choiceGen || breatheBlocked

  const goNext = useCallback(() => {
    if (blocked) return
    stopAll()
    if (isLastPage) {
      void onFinishChapter()
      return
    }
    setPageIdx((i) => i + 1)
  }, [blocked, isLastPage, stopAll, onFinishChapter])

  const goPrev = useCallback(() => {
    if (pageIdx === 0) return
    stopAll()
    setPageIdx((i) => i - 1)
  }, [pageIdx, stopAll])

  const replayPage = useCallback(() => {
    if (!page) return
    stopAll()
    setReading(true)
    setReplayN((n) => n + 1)
    narrate(page.text)
  }, [page, stopAll, narrate])

  if (!page) return null

  const glow =
    askState === 'praise'
      ? '0 0 0 3px rgba(52, 211, 153, .55), 0 12px 30px rgba(52, 211, 153, .22)'
      : askState === 'hint'
        ? '0 0 0 3px rgba(251, 191, 36, .55), 0 12px 30px rgba(251, 191, 36, .22)'
        : 'none'

  const progress = (pageIdx + (page.ask && askAnswered ? 0.5 : 0)) / total
  const fullBleed = !!page.fullBleed

  return (
    <KidScreen
      label={`Reader — ${chapter.title || book.title}`}
      style={{
        // Reader is strictly viewport-fit — no page scroll.
        // Top bar → spread → footer, all inside 100dvh.
        height: '100dvh',
        maxHeight: '100dvh',
        minHeight: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`
        .lf-read-spread { display: grid; grid-template-columns: 1fr; flex: 1 1 auto; min-height: 0; overflow: hidden; }
        @media (min-width: 1000px) { .lf-read-spread { grid-template-columns: 46% 1fr; } }
      `}</style>

      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '18px 24px 8px',
          flexShrink: 0,
        }}
      >
        <CircleBtn label="Back" onClick={onExit}>
          ‹
        </CircleBtn>
        <span
          style={{
            background: 'var(--lf-cream-card)',
            border: '1.5px solid var(--lf-cream-line)',
            borderRadius: 'var(--radius-pill)',
            padding: '8px 18px',
            font: '700 14.5px var(--font-display)',
            color: 'var(--lf-espresso)',
          }}
        >
          {book.chapters.length > 1 ? `Chapter ${chapterIdx + 1} · ${chapter.title || ''}` : book.title}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            font: '600 13px var(--font-body)',
            color: 'var(--lf-espresso-soft)',
            background: 'var(--lf-cream-card)',
            border: '1.5px solid var(--lf-cream-line)',
            borderRadius: 'var(--radius-pill)',
            padding: '8px 14px',
          }}
        >
          Page {pageIdx + 1} of {total}
        </span>
        <CircleBtn
          label={reading ? 'Read-aloud is on' : 'Read-aloud is off'}
          onClick={() => setReading((r) => !r)}
        >
          <span aria-hidden="true">{reading ? '🔊' : '🔇'}</span>
        </CircleBtn>
        <button
          type="button"
          aria-label="Ask the story"
          onClick={handleAskStory}
          disabled={askStoryTurns >= 2}
          className="lf-press"
          style={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            background: 'var(--lf-cream-card)',
            border: '1.5px solid var(--lf-cream-line)',
            color:
              askStoryTurns >= 2 ? 'var(--lf-espresso-faint)' : 'var(--lf-espresso-soft)',
            fontSize: 18,
            cursor: askStoryTurns >= 2 ? 'default' : 'pointer',
            boxShadow: 'none',
          }}
        >
          ?
        </button>
      </div>

      <div className="lf-read-spread">
        {/* Left: art */}
        <div
          style={{
            position: 'relative',
            padding: fullBleed ? 0 : '4px 8px 18px 24px',
            minHeight: 0,
            minWidth: 0,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {page.img ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={page.img}
              alt=""
              style={
                fullBleed
                  ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }
                  : {
                      maxWidth: '100%',
                      maxHeight: '100%',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      borderRadius: 'var(--radius-hero)',
                      display: 'block',
                      boxShadow: 'var(--shadow-warm-lg)',
                      border: '1.5px solid var(--lf-cream-line)',
                      background: '#f7f1e3',
                    }
              }
            />
          ) : (
            <div
              aria-hidden="true"
              style={
                fullBleed
                  ? {
                      position: 'absolute',
                      inset: 0,
                      background: washBg(page.wash ?? chapter.wash ?? book.wash ?? 'meadow'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      filter: 'var(--shadow-emoji)',
                    }
                  : {
                      maxWidth: '100%',
                      maxHeight: '100%',
                      width: 'min(560px, 100%)',
                      aspectRatio: '4 / 3',
                      borderRadius: 'var(--radius-hero)',
                      background: washBg(page.wash ?? chapter.wash ?? book.wash ?? 'meadow'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 12,
                      boxShadow: 'var(--shadow-warm-lg)',
                      border: '1.5px solid var(--lf-cream-line)',
                      filter: 'var(--shadow-emoji)',
                    }
              }
            >
              {(page.emojis ?? []).map((e, i) => (
                <span key={i} style={{ fontSize: i === 0 ? 96 : 60 }}>
                  {e}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: words + teaching card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            padding: '4px 24px 0 24px',
          }}
        >
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <div
              style={{
                background: 'var(--lf-cream-card)',
                border: '1.5px solid var(--lf-cream-line)',
                borderRadius: 'var(--radius-card)',
                padding: '26px 30px',
                boxShadow: glow,
                transition: 'box-shadow 300ms var(--ease-out)',
              }}
            >
              <p style={{ margin: 0, font: 'var(--text-story-page)', color: 'var(--lf-espresso)' }}>
                {words.map((w, i) => (
                  <span
                    key={i}
                    style={
                      i === wordIdx
                        ? {
                            background: 'var(--lf-pastel-peach)',
                            borderBottom: '3px solid var(--lf-coral)',
                            borderRadius: 4,
                            padding: '0 3px',
                          }
                        : undefined
                    }
                  >
                    {w}{' '}
                  </span>
                ))}
              </p>

              {page.star && (
                <span
                  className="lf-screen-in"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(251,191,36,.16)',
                    border: '1.5px solid rgba(251,191,36,.5)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '5px 14px',
                    font: '700 13.5px var(--font-body)',
                    color: 'var(--lf-espresso)',
                    marginTop: 12,
                  }}
                >
                  ⭐ Star word: <strong>{page.star}</strong>
                </span>
              )}

              {page.breathe && (
                <div style={{ borderTop: '1.5px dashed var(--lf-cream-line)', marginTop: 18, paddingTop: 18 }}>
                  <BreatheAlong onDone={() => setBreatheDone(true)} done={breatheDone} />
                </div>
              )}

              {page.ask && (
                <div style={{ marginTop: 18, borderTop: '1.5px dashed var(--lf-cream-line)', paddingTop: 18 }}>
                  <AskInline
                    ask={page.ask}
                    state={askState}
                    onMic={handleMic}
                    onSayIt={!micOk || fallbackUnlocked ? handleSayIt : undefined}
                    fallbackUnlocked={fallbackUnlocked}
                  />
                </div>
              )}

              {page.choice && !choiceGen && (
                <div style={{ marginTop: 18, borderTop: '1.5px dashed var(--lf-cream-line)', paddingTop: 18 }}>
                  <ChoiceGrid
                    prompt={page.choice.prompt}
                    options={page.choice.options}
                    chosen={chosen}
                    onChoose={handleChoose}
                    onYourIdea={handleYourIdea}
                  />
                  {choiceError && (
                    <div
                      role="alert"
                      style={{
                        marginTop: 12,
                        background: 'var(--lf-pastel-peach)',
                        borderRadius: 14,
                        padding: '10px 14px',
                        font: '700 15px var(--font-body)',
                        color: 'var(--lf-espresso)',
                        textAlign: 'center',
                      }}
                    >
                      {choiceError}
                    </div>
                  )}
                </div>
              )}

              {choiceGen && (
                <div
                  className="lf-screen-in"
                  style={{
                    marginTop: 18,
                    borderTop: '1.5px dashed var(--lf-cream-line)',
                    paddingTop: 22,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                    textAlign: 'center',
                  }}
                >
                  <span aria-hidden="true" style={{ fontSize: 42, filter: 'var(--shadow-emoji)' }}>
                    ✨
                  </span>
                  <span style={{ font: '700 21px var(--font-display)' }}>Your choice is changing the story…</span>
                </div>
              )}

              {askStoryReply && (
                <div
                  className="lf-screen-in"
                  style={{
                    marginTop: 18,
                    background: 'var(--lf-pastel-lilac)',
                    borderRadius: 14,
                    padding: '12px 16px',
                    font: '700 15px/1.4 var(--font-body)',
                    color: 'var(--lf-espresso)',
                  }}
                >
                  <span aria-hidden="true">🔊</span> {askStoryReply}
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: '4px 10px 0', flexShrink: 0 }}>
            <ProgressBar value={progress} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                font: '600 14px var(--font-body)',
                color: 'var(--lf-espresso-soft)',
                marginTop: 7,
              }}
            >
              <span>{`page ${pageIdx + 1} of ${total}`}</span>
              <span>{chapter.title || book.title}</span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 26,
              padding: '10px 0 26px',
              flexShrink: 0,
            }}
          >
            <CircleBtn label="Previous page" onClick={goPrev} size={56} disabled={pageIdx === 0}>
              ‹
            </CircleBtn>
            <button
              type="button"
              aria-label="Next page"
              onClick={goNext}
              disabled={blocked}
              className="lf-press"
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                border: 'none',
                background: blocked ? 'var(--lf-cream-line)' : 'var(--lf-coral)',
                boxShadow: blocked ? 'none' : 'var(--shadow-coral-glow)',
                color: blocked ? 'var(--lf-espresso-faint)' : 'var(--sw-on-action)',
                fontSize: 27,
                cursor: blocked ? 'default' : 'pointer',
                paddingLeft: 5,
                boxSizing: 'border-box',
              }}
            >
              ▶
            </button>
            <CircleBtn label="Read this page again" onClick={replayPage} size={56}>
              ↺
            </CircleBtn>
          </div>
        </div>
      </div>
    </KidScreen>
  )
}

/* ---- BreatheAlong (in/out; auto-completes) ---- */
function BreatheAlong({ done, onDone }: { done: boolean; onDone: () => void }) {
  const [phase, setPhase] = useState<'in' | 'out'>('in')
  useEffect(() => {
    let n = 0
    const iv = setInterval(() => {
      n += 1
      setPhase((p) => (p === 'in' ? 'out' : 'in'))
      if (n >= 4) {
        clearInterval(iv)
        onDone()
      }
    }, 2600)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <div
        className={done ? '' : 'lf-breathe-slow'}
        aria-hidden="true"
        style={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          flexShrink: 0,
          background: 'var(--lf-pastel-mint)',
          border: '1.5px solid var(--lf-cream-line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 34,
          filter: 'var(--shadow-emoji)',
        }}
      >
        🫧
      </div>
      <div>
        <div
          style={{
            font: '700 11px var(--font-body)',
            color: 'var(--lf-espresso-faint)',
            textTransform: 'uppercase',
            letterSpacing: '.07em',
            marginBottom: 4,
          }}
        >
          breathe along
        </div>
        <div style={{ font: '700 21px var(--font-display)', color: 'var(--lf-espresso)' }}>
          {done ? 'Ahhh. All calm.' : phase === 'in' ? 'In…' : 'and out…'}
        </div>
        <div style={{ font: '600 13.5px var(--font-body)', color: 'var(--lf-espresso-soft)', marginTop: 3 }}>
          {done ? 'You will too.' : 'Follow the circle with your belly.'}
        </div>
      </div>
    </div>
  )
}

/* ---- AskInline: reader-embedded teaching moment ---- */
function AskInline({
  ask,
  state,
  onMic,
  onSayIt,
  fallbackUnlocked,
}: {
  ask: NonNullable<Page['ask']>
  state: AskUiState
  onMic: () => void
  onSayIt?: () => void
  fallbackUnlocked?: boolean
}) {
  if (state === 'praise') {
    return (
      <div
        className="lf-screen-in"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'var(--lf-pastel-mint)',
          borderRadius: 14,
          padding: '14px 16px',
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 26 }}>🎉</span>
        <span style={{ font: '700 17px/1.4 var(--font-body)', color: 'var(--lf-espresso)' }}>{ask.praise}</span>
      </div>
    )
  }
  return (
    <div>
      <div
        style={{
          font: '700 11px var(--font-body)',
          color: 'var(--lf-espresso-faint)',
          textTransform: 'uppercase',
          letterSpacing: '.07em',
          marginBottom: 8,
        }}
      >
        {ask.skill}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          type="button"
          aria-label={state === 'listening' ? 'Listening' : 'Answer out loud'}
          onClick={onMic}
          className="lf-press lf-mic-pulse"
          style={{
            width: 62,
            height: 62,
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            background: state === 'listening' ? 'var(--lf-coral-deep)' : 'var(--lf-coral)',
            color: '#fff',
            fontSize: 26,
            flexShrink: 0,
          }}
        >
          🎤
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ font: '700 18px/1.4 var(--font-body)', color: 'var(--lf-espresso)' }}>{ask.question}</div>
          {state === 'listening' && (
            <div
              style={{
                marginTop: 6,
                font: '700 14px var(--font-body)',
                color: 'var(--lf-coral-deep)',
              }}
            >
              Listening…
            </div>
          )}
          {state === 'hint' && (
            <div
              className="lf-screen-in"
              style={{
                marginTop: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(251,191,36,.18)',
                borderRadius: 10,
                padding: '7px 12px',
                font: '700 14.5px var(--font-body)',
                color: 'var(--lf-espresso)',
              }}
            >
              <span aria-hidden="true">💡</span> {ask.hint}
            </div>
          )}
          {onSayIt && (
            <button
              type="button"
              onClick={onSayIt}
              className="lf-press"
              style={{
                marginTop: 8,
                background: 'var(--lf-pastel-lilac)',
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                padding: '9px 16px',
                font: '700 14px var(--font-body)',
                color: 'var(--lf-espresso)',
                cursor: 'pointer',
                minHeight: 40,
              }}
            >
              {fallbackUnlocked ? 'I said it!' : 'Tap here when you said it'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---- ChoiceGrid: 2 canned options + a "…YOUR idea!" mic path ---- */
function ChoiceGrid({
  prompt,
  options,
  chosen,
  onChoose,
  onYourIdea,
}: {
  prompt: string
  options: ChoiceOption[]
  chosen: string | null
  onChoose: (o: ChoiceOption) => void
  onYourIdea: () => void
}) {
  const twoOptions = options.slice(0, 2)
  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-display)' }}>
      {prompt && (
        <div
          style={{
            font: '700 20px/1.3 var(--font-display)',
            color: 'var(--lf-espresso)',
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          {prompt}
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(3, 1fr)`,
          gap: 10,
        }}
      >
        {twoOptions.map((o) => {
          const isChosen = chosen === o.label
          const dim = chosen != null && !isChosen
          return (
            <button
              key={o.label}
              type="button"
              className="lf-press"
              onClick={() => onChoose(o)}
              disabled={chosen != null}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                border: isChosen ? '2.5px solid var(--lf-coral)' : '2px solid var(--lf-cream-line)',
                background: isChosen ? 'var(--lf-pastel-peach)' : 'var(--lf-cream-card)',
                borderRadius: 'var(--radius-cover)',
                padding: '16px 12px',
                color: 'var(--lf-espresso)',
                opacity: dim ? 0.45 : 1,
                minHeight: 56,
                cursor: chosen ? 'default' : 'pointer',
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 44, filter: 'var(--shadow-emoji)' }}>
                {o.emoji}
              </span>
              <span style={{ font: '600 15px/1.25 var(--font-display)', textAlign: 'center' }}>{o.label}</span>
            </button>
          )
        })}
        {/* …or tell me YOUR idea! */}
        <button
          type="button"
          className="lf-press"
          onClick={onYourIdea}
          disabled={chosen != null}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            border: chosen === '…YOUR idea!' ? '2.5px solid var(--lf-coral)' : '2px dashed var(--lf-cream-line)',
            background: chosen === '…YOUR idea!' ? 'var(--lf-pastel-peach)' : 'var(--lf-cream-card)',
            borderRadius: 'var(--radius-cover)',
            padding: '16px 12px',
            color: 'var(--lf-espresso)',
            opacity: chosen != null && chosen !== '…YOUR idea!' ? 0.45 : 1,
            minHeight: 56,
            cursor: chosen ? 'default' : 'pointer',
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 44, filter: 'var(--shadow-emoji)' }}>🎤</span>
          <span style={{ font: '600 15px/1.25 var(--font-display)', textAlign: 'center' }}>
            …or tell me YOUR idea!
          </span>
        </button>
      </div>
      <div
        style={{
          font: '600 14px var(--font-body)',
          color: 'var(--lf-espresso-soft)',
          textAlign: 'center',
          marginTop: 10,
        }}
      >
        <span aria-hidden="true">🎤</span> Say it out loud — or tap it!
      </div>
    </div>
  )
}

// (SpeechBubble, ProgressRing, cp are re-exported by ./components / buddies for
// use by child components inside the same file; kept for tree-shaking clarity.)
void SpeechBubble
void ProgressRing
void cp

