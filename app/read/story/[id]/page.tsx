'use client'

// Reader v3 — Drawn Room, §A3 transport, A1 touch-native gestures.
//
// The reader is now a media player whose track is the chapter (spec §A3):
//   ◀ prev page | ▶/⏸ play–pause | next page ▶
// Three controls, standard symbols, fixed positions, fixed meanings:
//   - Play (terracotta, ≥72px) → narrates current page. NEVER navigates.
//   - Prev / Next (ink chevrons, ≥56px) → page turns. NEVER play.
//   - Play mode is continuous: page narrates → 1.5s breath → auto-turn.
//   - Interactive moments (ask / choice / breathe) pause playback.
//   - Chapter end in play mode → chapter-end screen (never auto-start next).
//   - Ribbon scrubber above transport → drag-to-seek + snap-to-page.
//   - Folio dog-ear (top-right) → opens Contents overlay.
//   - Back arrow (top-left) → up exactly one level: page → Contents → room.
//   - Words are the timeline: tap → seek+play; press-and-hold → speak-only.
//
// Interactions preserved verbatim:
//   - Ask block: mic → /api/respond → 2-miss mercy → tap fallback.
//   - Choice block: three paths (A, B, "…YOUR idea" mic → /api/story continue).
//   - Breathe: BreatheAlong (extracted).
//   - Ask-the-story bounded 2 exchanges (v3 R16 intent-first, story-Q&A fallback).
//   - Mystery-word tap + celebration overlay.
//   - Chapter end → EndPhase.ChapterEnd, book end → Comfort ritual + BookComplete.

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { STARTER_STORIES } from '@/lib/read/starter-stories'
import { PACK_BOOKS } from '@/lib/read/packs'
import {
  getStory,
  saveStory,
  saveProgress,
  recordChoice,
  collectWord,
  getProgress,
  foundMysteryWord,
  loadBuddy,
} from '@/lib/read/storage'
import { pushStory } from '@/lib/read/sync'
import { loadUniverse } from '@/lib/universe/azad-verse'
import {
  getCachedAudio,
  listen,
  matchesAny,
  putCachedAudio,
  recognitionAvailable,
  speak,
  webTtsSource,
  type SpeakHandle,
  type TtsSource,
  type WordTimestamp,
} from '@/lib/read/speech'
import { checkBadges } from '@/lib/read/badges'
import { fetchBookOverrides, type BookOverrides } from '@/lib/read/artOverrides'
import { getBuddy } from '@/lib/read/buddies'
import type {
  Book,
  BuddyDef,
  Chapter,
  ChoiceOption,
  GenerateResponse,
  Page,
} from '@/types/story'
import { DrawnConfetti, IntentToast, KidScreen, MicIcon, SpeakerIcon } from '../../art'
import { ReaderScene } from './ReaderScene'
import './reader.css'
import { askIntent, dispatchIntent, hasReachedMissCap } from '@/lib/read/intents'
import { ChapterEnd, ComfortRitualBeat, BookComplete } from './EndPhase'
import { ChevronBtn, PlayBtn } from './Transport'
import { Ribbon } from './Ribbon'
import { Folio } from './Folio'
import { Contents } from './Contents'
import { BreatheAlong } from './BreatheAlong'
import { PageWord } from './PageWord'
import { useReaderTransport } from './useReaderTransport'

type AskUiState = 'idle' | 'listening' | 'praise' | 'hint'

// ---------- Layered TtsSource for page narration ----------
// Pack/family books ship pre-generated ElevenLabs audio
// (scripts/generate-audio.ts →
//   /public/audio/{bookId}/{ch}-{p}.mp3 + .timestamps.json).
// Generated kid books have no static files, so narration was silent for them.
// Order: IndexedDB cache → static file → live /api/tts (then cached in
// IndexedDB so each page is paid for once per device). If everything fails the
// transport still falls through to speechSynth (allowSpeechSynthFallback).
//
// STALENESS GUARD: audio recorded for an older revision of the text is worse
// than no audio — the voice reads different words than the page shows. Every
// layer's timestamps are checked against the CURRENT page text (normalized
// word-by-word); a mismatch falls through to the next layer, ending at live
// TTS. Stale pages self-heal instead of desyncing.
function normWord(w: string): string {
  return w.toLowerCase().replace(/[^a-z0-9']/gi, '')
}
function audioMatchesText(timestamps: WordTimestamp[], text: string): boolean {
  const textWords = text.split(/\s+/).map(normWord).filter(Boolean)
  const tsWords = timestamps.map((t) => normWord(t.word)).filter(Boolean)
  if (textWords.length !== tsWords.length) return false
  for (let i = 0; i < textWords.length; i++) {
    if (textWords[i] !== tsWords[i]) return false
  }
  return true
}
function pageTtsSource(bookId: string, chapterIdx: number, pageIdx: number): TtsSource {
  return {
    async fetch(text) {
      const cached = await getCachedAudio(bookId, chapterIdx, pageIdx)
      if (cached && audioMatchesText(cached.timestamps, text)) {
        return { audio: cached.audio, mimeType: cached.mimeType, timestamps: cached.timestamps }
      }
      try {
        const base = `/audio/${bookId}/${chapterIdx}-${pageIdx}`
        const [audioRes, tsRes] = await Promise.all([
          fetch(`${base}.mp3`),
          fetch(`${base}.timestamps.json`),
        ])
        if (!audioRes.ok) throw new Error(`no cached audio (${audioRes.status})`)
        if (!tsRes.ok) throw new Error(`no cached timestamps (${tsRes.status})`)
        const [audio, timestamps] = await Promise.all([
          audioRes.blob(),
          tsRes.json() as Promise<WordTimestamp[]>,
        ])
        if (!audioMatchesText(timestamps, text)) throw new Error('static audio is stale for this text')
        return { audio, mimeType: audio.type || 'audio/mpeg', timestamps }
      } catch {
        // Generated book, missing static file, or stale audio — synthesize on
        // demand and cache the fresh result.
        const result = await webTtsSource.fetch(text, { voice: 'narrator' })
        void putCachedAudio(bookId, chapterIdx, pageIdx, {
          mimeType: result.mimeType,
          audio: result.audio,
          timestamps: result.timestamps,
        })
        return result
      }
    },
  }
}

/** Try to fetch just the timestamps JSON so we can enable word-seek without
 *  paying for a full audio decode. Falls back to the IndexedDB cache (where
 *  on-demand TTS for generated books lands). Timestamps that don't align with
 *  the current page text are rejected (stale audio → wrong-word seeks). */
async function fetchTimestamps(
  bookId: string,
  chapterIdx: number,
  pageIdx: number,
  pageText: string,
): Promise<WordTimestamp[] | null> {
  try {
    const res = await fetch(`/audio/${bookId}/${chapterIdx}-${pageIdx}.timestamps.json`)
    if (res.ok) {
      const ts = (await res.json()) as WordTimestamp[]
      if (audioMatchesText(ts, pageText)) return ts
    }
  } catch {
    /* fall through to the cache */
  }
  try {
    const cached = await getCachedAudio(bookId, chapterIdx, pageIdx)
    if (cached && audioMatchesText(cached.timestamps, pageText)) return cached.timestamps
    return null
  } catch {
    return null
  }
}

/* ================= ReaderRoute (loader) ================= */
export default function ReaderRoute() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''
  const router = useRouter()

  const [book, setBook] = useState<Book | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
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
        <div className="lf-room" data-register="story" style={{ minHeight: '100dvh' }}>
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
            <svg width="80" height="70" viewBox="0 0 100 88" aria-hidden="true">
              {/* a drawn stack of two closed books */}
              <path d="M 10 40 L 90 30 L 92 74 L 12 84 Z" fill="var(--pigment-terracotta, #D95B43)" opacity="0.7" filter="url(#lf-wash-edge)" />
              <path d="M 20 12 L 88 6 L 90 36 L 22 44 Z" fill="var(--pigment-butter, #EFC85C)" opacity="0.85" filter="url(#lf-wash-edge)" />
              <g fill="none" stroke="var(--ink, #46362A)" strokeWidth="2.4" filter="url(#lf-wobble)">
                <path d="M 10 40 L 90 30 L 92 74 L 12 84 Z" />
                <path d="M 20 12 L 88 6 L 90 36 L 22 44 Z" />
              </g>
            </svg>
            <p style={{ font: '700 22px var(--font-display, YoungSerif)' }}>
              Hmm, that book isn&rsquo;t on the shelf.
            </p>
            <Link
              href="/read"
              className="lf-press"
              style={{
                background: 'var(--lf-cream-card)',
                border: '1.5px solid var(--lf-cream-line)',
                borderRadius: 999,
                padding: '12px 24px',
                font: '700 18px var(--font-display, YoungSerif)',
                color: 'var(--lf-espresso)',
                textDecoration: 'none',
              }}
            >
              Back to the Bookshelf
            </Link>
          </main>
        </div>
      </KidScreen>
    )
  }
  if (!book) return null

  return (
    <ReaderBook
      book={book}
      onBookUpdate={setBook}
      onExit={() => router.push('/read')}
    />
  )
}

/* ================= ReaderBook (phase controller) ================= */
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

  // Buddy for celebrations (kept for parity with EndPhase).
  const [buddy, setBuddy] = useState<BuddyDef>(getBuddy(null))
  const [energy, setEnergy] = useState<'bouncy' | 'calm'>('bouncy')
  useEffect(() => {
    const bs = loadBuddy()
    setBuddy(getBuddy(bs.activeId))
    setEnergy(bs.energy)
  }, [])

  // Phase: reading | chapterEnd | comfortRitual | bookComplete
  // v3 removes the standalone ChapterMap phase — the Contents overlay lives
  // inside the reader, opened via the folio dog-ear.
  const [chapterIdx, setChapterIdx] = useState<number | null>(null)
  const [phase, setPhase] = useState<'reading' | 'chapterEnd' | 'comfortRitual' | 'bookComplete'>('reading')
  const [showContents, setShowContents] = useState(false)

  useEffect(() => {
    if (chapterIdx !== null) return
    // Tapping a book (or Continue) goes straight into reading, resuming the
    // saved chapter — the pageIdx effect in ReaderPages resumes the saved page.
    // We no longer force the Contents chapter-map on entry: it made "tap my
    // book" feel like opening a menu, and (with the old back model) trapped the
    // child in a page<->Contents loop with no way back to the room. The chapter
    // map is opt-in via the folio dog-ear.
    if (!isMultiChapter) {
      setChapterIdx(0)
      return
    }
    const prog = getProgress(book.id)
    setChapterIdx(Math.min(book.chapters.length - 1, prog?.chapter ?? 0))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id, isMultiChapter])

  if (chapterIdx === null) return null
  const chapter = book.chapters[chapterIdx]
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
          } else if (book.comfortRitual && !book.comfortRitual.alreadyClosed) {
            setPhase('comfortRitual')
          } else {
            setPhase('bookComplete')
          }
        }}
        onAllDone={() => router.push('/read')}
      />
    )
  }
  if (phase === 'comfortRitual' && book.comfortRitual) {
    return (
      <ComfortRitualBeat ritual={book.comfortRitual} onDone={() => setPhase('bookComplete')} />
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
    <>
      <ReaderPages
        book={book}
        chapterIdx={chapterIdx}
        chapter={chapter}
        onExit={() => {
          // Back always leaves the book and returns to the room — one tap, from
          // any page, every book (single- or multi-chapter). The chapter map is
          // the folio dog-ear, never the back target; making it the back target
          // created a page<->Contents loop with no exit to the room.
          onExit()
        }}
        onOpenContents={() => setShowContents(true)}
        onFinishChapter={async () => {
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
      {showContents && (
        <Contents
          book={book}
          currentChapterIdx={chapterIdx}
          currentPageIdx={(() => {
            const prog = getProgress(book.id)
            return prog && prog.chapter === chapterIdx ? prog.page : 0
          })()}
          onPickChapter={(i) => {
            // v3.1 P1-7 — When jumping to a DIFFERENT chapter, we must not
            // leave the old chapter's page index in place: pageIdx belongs to
            // the current chapter and would land the child mid-chapter (or
            // past the end) of the new one. Reset to saved progress for that
            // chapter if any, else page 0. Same chapter = no reset (child just
            // dismissed Contents).
            if (i !== chapterIdx) {
              const prog = getProgress(book.id)
              const progPage = prog && prog.chapter === i ? prog.page : 0
              const targetChapter = book.chapters[i]
              const maxPage = Math.max(0, (targetChapter?.pages?.length ?? 1) - 1)
              const nextPageIdx = Math.min(progPage, maxPage)
              // Persist the landing spot so the ReaderPages `pageIdx` reset
              // effect picks it up. We use a keyed re-mount by writing progress
              // — the effect keyed on [pageIdx, chapterIdx] will handle it.
              saveProgress({
                bookId: book.id,
                chapter: i,
                page: nextPageIdx,
                updatedAt: Date.now(),
              })
              setChapterIdx(i)
            }
            setShowContents(false)
            setPhase('reading')
          }}
          onClose={() => setShowContents(false)}
        />
      )}
    </>
  )
}

/* ================= ReaderPages ================= */
interface ReaderPagesProps {
  book: Book
  chapterIdx: number
  chapter: Chapter
  onExit: () => void
  onOpenContents: () => void
  onFinishChapter: () => void | Promise<void>
  onBookUpdate: (b: Book) => void
}

function ReaderPages({
  book,
  chapterIdx,
  chapter,
  onExit,
  onOpenContents,
  onFinishChapter,
  onBookUpdate,
}: ReaderPagesProps) {
  const routerReader = useRouter()
  const pages = chapter.pages
  const [pageIdx, setPageIdx] = useState(0)
  const [askState, setAskState] = useState<AskUiState>('idle')
  // Tries counter drives the 2-miss mercy → tap fallback. Read only via the
  // setter's `prev` — the value itself is intentionally not observed.
  const [, setTries] = useState(0)
  const [fallbackUnlocked, setFallbackUnlocked] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [choiceGen, setChoiceGen] = useState(false)
  const [choiceError, setChoiceError] = useState<string | null>(null)
  const [breatheDone, setBreatheDone] = useState(false)
  const [mysteryFound, setMysteryFound] = useState<null | {
    word: string
    language: string
    meaning?: string
  }>(null)
  const [mysteryAlready, setMysteryAlready] = useState(false)

  // Cached timestamps for the current page (enables exact word-tap seek).
  const [pageTimestamps, setPageTimestamps] = useState<WordTimestamp[] | null>(null)

  const listenStopRef = useRef<(() => void) | null>(null)
  const oneShotSpeakRef = useRef<SpeakHandle | null>(null)
  // Scroll viewport for the reading text — used to keep the narrated word in
  // view on short screens (phone-landscape), where a long page scrolls.
  const textColRef = useRef<HTMLDivElement | null>(null)

  const page: Page | undefined = pages[pageIdx]
  const words = useMemo(() => (page ? page.text.split(/\s+/).filter(Boolean) : []), [page])

  // Approved art overrides (published on prod via Parent Corner → Art). Applied
  // over page.img so an approval goes live on the next open, with no redeploy.
  // Best-effort + non-blocking: absent overrides just leave the placeholder.
  const [artOverrides, setArtOverrides] = useState<BookOverrides>({ pages: {} })
  useEffect(() => {
    let live = true
    void fetchBookOverrides(book.id).then((o) => {
      if (live) setArtOverrides(o)
    })
    return () => {
      live = false
    }
  }, [book.id])

  // Generate-while-reading: pages without art ask /api/art/page for one. The
  // server generates it on first request (then it's cached forever) and the
  // image FADES IN over the endpaper when it lands. Fully best-effort — the
  // route answers 'disabled' when the art env is off, and reading never waits.
  const [autoArt, setAutoArt] = useState<Record<string, string>>({})
  // Pages whose art is being generated RIGHT NOW — drives the "painting this
  // page…" indicator on the endpaper.
  const [artPainting, setArtPainting] = useState<Record<string, boolean>>({})
  const artInflight = useRef<Set<string>>(new Set())
  const artDisabled = useRef(false)
  const requestPageArt = useCallback(
    (ci: number, pi: number) => {
      const key = `${ci}-${pi}`
      if (artDisabled.current || artInflight.current.has(key)) return
      artInflight.current.add(key)
      setArtPainting((prev) => ({ ...prev, [key]: true }))
      const settle = () => setArtPainting((prev) => ({ ...prev, [key]: false }))
      const attempt = async (tries: number): Promise<void> => {
        try {
          const r = await fetch('/api/art/page', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            // Text fields let the server illustrate GENERATED books too (they
            // only exist in this device's storage, so the server can't look
            // them up). For pack books the server ignores these and uses its
            // own copy of the text.
            body: JSON.stringify({
              bookId: book.id,
              chapterIdx: ci,
              pageIdx: pi,
              bookTitle: book.title,
              chapterTitle: chapter.title,
              pageText: pages[pi]?.text,
              prevText: pi > 0 ? pages[pi - 1]?.text : undefined,
              // Whole-book visual brief — anchors every scene in one world.
              artBrief: book.artBrief,
              moral: book.teachingGoals?.[0],
            }),
          })
          const j = (await r.json().catch(() => ({}))) as { url?: string; status?: string }
          if (j.url) {
            setAutoArt((prev) => ({ ...prev, [key]: j.url! }))
            settle()
          } else if (j.status === 'disabled') {
            artDisabled.current = true
            settle()
          } else if (j.status === 'generating' && tries < 40) {
            setTimeout(() => void attempt(tries + 1), 3000)
          } else {
            artInflight.current.delete(key) // allow a later retry
            settle()
          }
        } catch {
          artInflight.current.delete(key)
          settle()
        }
      }
      void attempt(0)
    },
    [book.id, book.title, book.artBrief, book.teachingGoals, chapter.title, pages],
  )
  useEffect(() => {
    // Pack books use the server's copy of the text; generated books send
    // theirs along in the request. Either way the route answers 'disabled'
    // once when art is off, and we stop asking.
    if (!page) return
    const key = `${chapterIdx}-${pageIdx}`
    if (!page.img && !artOverrides.pages[key] && !autoArt[key]) {
      requestPageArt(chapterIdx, pageIdx)
    }
    // Prefetch the NEXT page's art so it's usually ready by the page turn.
    const next = pages[pageIdx + 1]
    if (next && !next.img && !artOverrides.pages[`${chapterIdx}-${pageIdx + 1}`]) {
      requestPageArt(chapterIdx, pageIdx + 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterIdx, pageIdx, page])

  const effectiveImg =
    autoArt[`${chapterIdx}-${pageIdx}`] ?? artOverrides.pages[`${chapterIdx}-${pageIdx}`] ?? page?.img

  // Mystery-word test — is this page's star the book's hidden heritage word?
  const isMysteryStar = useMemo(() => {
    const mw = book.mysteryWord
    if (!mw || !page?.star) return false
    return page.star.toLowerCase() === mw.word.toLowerCase()
  }, [book.mysteryWord, page])

  const total = pages.length
  const isLastPage = pageIdx === total - 1
  const micOk = recognitionAvailable()

  // Gates: anything that must pause playback and hand control to the child.
  const askAnswered = askState === 'praise' || (askState === 'hint' && fallbackUnlocked)
  const askBlocked = !!page?.ask && !askAnswered
  const choiceBlocked = !!page?.choice && !chosen
  const breatheBlocked = !!page?.breathe && !breatheDone
  const gated = askBlocked || choiceBlocked || choiceGen || breatheBlocked

  // ---- Transport (owns playback state, word highlight, auto-turn) ----
  const audioSource = useMemo(
    () => (page ? pageTtsSource(book.id, chapterIdx, pageIdx) : undefined),
    [book.id, chapterIdx, pageIdx, page],
  )

  const transportPage = useMemo(
    () =>
      page
        ? {
            source: audioSource,
            timestamps: pageTimestamps ?? undefined,
            text: page.text,
          }
        : null,
    [audioSource, pageTimestamps, page],
  )

  const transport = useReaderTransport({
    page: transportPage,
    gated,
    isLastPage,
    onAutoNext: () => {
      // Continuous play mode — but only if we're still in narrative reading
      // (not gated). Extra guard because state can shift between the timer
      // firing and now.
      if (gated) return
      if (isLastPage) return
      setPageIdx((i) => i + 1)
    },
  })

  // v3.1 P1-7 — When `chapterIdx` changes (via Contents pick or auto-advance),
  // land on that chapter's saved-progress page (or 0). Without this, the old
  // chapter's `pageIdx` bleeds into the new chapter and the child can land
  // past-the-end or mid-chapter unexpectedly.
  useEffect(() => {
    const prog = getProgress(book.id)
    const target =
      prog && prog.chapter === chapterIdx
        ? Math.min(prog.page, Math.max(0, pages.length - 1))
        : 0
    setPageIdx(target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterIdx, book.id])

  // Pre-fetch timestamps so word-tap seek is exact even before the user hits play.
  useEffect(() => {
    let cancelled = false
    setPageTimestamps(null)
    if (!page) return
    void fetchTimestamps(book.id, chapterIdx, pageIdx, page.text).then((ts) => {
      if (!cancelled) setPageTimestamps(ts)
    })
    return () => {
      cancelled = true
    }
  }, [book.id, chapterIdx, pageIdx, page])

  // Reset per-page state (star collection + progress).
  useEffect(() => {
    setAskState('idle')
    setTries(0)
    setFallbackUnlocked(false)
    setChosen(null)
    setChoiceGen(false)
    setChoiceError(null)
    setBreatheDone(false)
    if (page?.star) {
      const meaning = book.vocab.find((v) => v.word === page.star)
      if (meaning) collectWord(meaning, book.id)
    }
    saveProgress({
      bookId: book.id,
      chapter: chapterIdx,
      page: pageIdx,
      updatedAt: Date.now(),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIdx, chapterIdx])

  // ---- Mystery word tap ----
  const handleMysteryTap = useCallback(() => {
    const mw = book.mysteryWord
    if (!mw || !isMysteryStar) return
    const isNew = foundMysteryWord(book.id, mw)
    if (isNew) {
      setMysteryFound({ word: mw.word, language: mw.language, meaning: mw.meaning })
      oneShotSpeakRef.current?.cancel()
      const meaningPart = mw.meaning ? ` That means ${mw.meaning}.` : ''
      oneShotSpeakRef.current = speak(`You found the mystery word — ${mw.word}!${meaningPart}`, {
        allowSpeechSynthFallback: true,
      })
      setTimeout(() => setMysteryFound(null), 2400)
    } else {
      setMysteryAlready(true)
      setTimeout(() => setMysteryAlready(false), 1400)
    }
  }, [book.id, book.mysteryWord, isMysteryStar])

  // ---- Ask block ----
  const evaluate = useCallback(
    async (transcript: string) => {
      const ask = page?.ask
      if (!ask) return

      if (ask.kind === 'wonder') {
        setAskState('praise')
        return
      }

      const keywordOk = ask.answers && ask.answers.length > 0 && matchesAny(transcript, ask.answers)
      if (keywordOk) {
        setAskState('praise')
        oneShotSpeakRef.current?.cancel()
        oneShotSpeakRef.current = speak(ask.praise, { allowSpeechSynthFallback: true })
        return
      }
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
            oneShotSpeakRef.current?.cancel()
            oneShotSpeakRef.current = speak(data.reply ?? ask.praise, { allowSpeechSynthFallback: true })
            return
          }
        }
      } catch {
        /* offline / not configured */
      }

      setTries((prev) => {
        const next = prev + 1
        if (next >= 2) {
          setFallbackUnlocked(true)
          setAskState('hint')
          oneShotSpeakRef.current?.cancel()
          oneShotSpeakRef.current = speak(ask.hint, { allowSpeechSynthFallback: true })
        } else {
          setAskState('hint')
          oneShotSpeakRef.current?.cancel()
          oneShotSpeakRef.current = speak(ask.hint, {
            allowSpeechSynthFallback: true,
            onEnd: () => setAskState('idle'),
          })
        }
        return next
      })
    },
    [page],
  )

  const handleMic = useCallback(() => {
    if (!page?.ask) return
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
        setAskState('hint')
        setFallbackUnlocked(true)
      },
    }).stop
  }, [page, micOk, evaluate])

  const handleSayIt = useCallback(() => {
    if (!page?.ask) return
    setAskState('praise')
    oneShotSpeakRef.current?.cancel()
    oneShotSpeakRef.current = speak(page.ask.praise, { allowSpeechSynthFallback: true })
  }, [page])

  // v3.1 P0-1 — Touch chip taps go through the SAME evaluation the mic uses,
  // so tap and speech are indistinguishable to the child. If the tapped chip
  // text matches a known answer (matchesAny fast-path), we praise; otherwise
  // we still send it through evaluate() and let the /api/respond judge decide.
  //
  // Voice–touch race: whichever fires first commits state. `askState` guards
  // the mic listener from stomping on a praise state (`onEnd` only reverts
  // from 'listening' → 'idle'), and evaluate() short-circuits once we're in
  // 'praise'. If the mic is still open when the child taps a chip, we stop it.
  const handleTapAnswer = useCallback(
    (chipText: string) => {
      if (!page?.ask) return
      // Stop the mic if it's live; a tap answer wins.
      if (listenStopRef.current) {
        try {
          listenStopRef.current()
        } catch {
          /* ignore */
        }
        listenStopRef.current = null
      }
      setAskState('idle')
      void evaluate(chipText)
    },
    [page, evaluate],
  )

  const handleSkipAsk = useCallback(() => {
    if (!page?.ask) return
    // "Skip for now" is the touch escape hatch — same terminal state as a
    // correct answer, but no praise line (we still play the ask's praise so
    // the child hears a warm buddy voice on the way out).
    if (listenStopRef.current) {
      try {
        listenStopRef.current()
      } catch {
        /* ignore */
      }
      listenStopRef.current = null
    }
    setAskState('praise')
    oneShotSpeakRef.current?.cancel()
    oneShotSpeakRef.current = speak(page.ask.praise, { allowSpeechSynthFallback: true })
  }, [page])

  // ---- Choices ----
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

        recordChoice(book.id, chapterIdx, opt.label, opt.childIdea ?? opt.label)

        const cleaned = pages.map((p, i) => (i === pageIdx ? ({ ...p, choice: undefined } as Page) : p))
        const newPages = [...cleaned, ...(data.pages ?? [])]

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
      transport.pause()
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
    [chosen, transport, applyBranchStarter, applyBranchGenerated],
  )

  const handleYourIdea = useCallback(async () => {
    if (chosen) return
    transport.pause()
    setChosen('…YOUR idea!')
    if (!micOk) {
      const idea = window.prompt('Tell me YOUR idea!')
      if (!idea) {
        setChosen(null)
        return
      }
      setChoiceGen(true)
      void applyBranchGenerated({ label: 'your idea', childIdea: idea })
      return
    }
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
  }, [chosen, micOk, transport, applyBranchGenerated])

  // ---- Ask-the-story (v3 R16 intent-first, story-Q&A fallback) ----
  const [askStoryTurns, setAskStoryTurns] = useState(0)
  const [askStoryReply, setAskStoryReply] = useState<string | null>(null)
  const [intentToast, setIntentToast] = useState<{ msg: string; options?: string[] } | null>(null)
  const [intentListening, setIntentListening] = useState(false)

  const readerIntentState = useMemo(
    () => ({
      currentBook: {
        id: book.id,
        title: book.title,
        chapterIdx,
        totalChapters: book.chapters.length,
      },
      hasMidFlightBook: { id: book.id, title: book.title },
    }),
    [book, chapterIdx],
  )

  const askTheStoryFallback = useCallback(
    async (transcript: string) => {
      try {
        const res = await fetch('/api/respond', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            mode: 'ask-the-story',
            transcript,
            context: {
              bookTitle: book.title,
              chapterTitle: chapter.title,
              pageText: page?.text ?? '',
            },
          }),
        })
        if (res.ok) {
          const data = (await res.json()) as { buddyReply?: string; reply?: string }
          const reply = data.buddyReply ?? data.reply ?? 'Great question! Let’s keep going.'
          setAskStoryReply(reply)
          oneShotSpeakRef.current?.cancel()
          oneShotSpeakRef.current = speak(reply, { allowSpeechSynthFallback: true })
        } else {
          setAskStoryReply('Great question! Let’s keep going.')
        }
      } catch {
        setAskStoryReply('Great question! Let’s keep going.')
      }
      setAskStoryTurns((n) => n + 1)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [book.title, chapter.title],
  )

  const runReaderIntent = useCallback(
    async (transcript: string) => {
      const result = await askIntent({
        transcript,
        surface: 'reader',
        state: readerIntentState,
      })
      if (result.intent === 'none') {
        if (result.options && result.options.length > 0) {
          setIntentToast({ msg: result.buddyLine, options: result.options })
          return
        }
        await askTheStoryFallback(transcript)
        return
      }
      await dispatchIntent(
        result,
        {
          router: routerReader,
          onOffer: (msg, options) => setIntentToast({ msg, options }),
          onShowMap: onOpenContents,
          onReplayChapter: () => {
            transport.stop()
            setPageIdx(0)
          },
          onReadThis: () => {
            if (!page) return
            transport.play()
          },
          currentBookId: book.id,
          currentChapterIdx: chapterIdx,
        },
        { surface: 'reader' },
      )
    },
    [readerIntentState, routerReader, onOpenContents, book.id, chapterIdx, page, transport, askTheStoryFallback],
  )

  const handleAskStory = useCallback(() => {
    if (askStoryTurns >= 2) return
    transport.pause()
    if (!recognitionAvailable()) {
      setIntentToast({ msg: 'Tap what you want:', options: ['Read this page again', 'Go home'] })
      return
    }
    if (intentListening) {
      listenStopRef.current?.()
      listenStopRef.current = null
      setIntentListening(false)
      return
    }
    if (hasReachedMissCap('reader')) {
      setIntentToast((t) => t ?? { msg: 'Or just tap what you want.' })
      return
    }
    setIntentListening(true)
    listenStopRef.current = listen({
      onResult: (t) => {
        void runReaderIntent(t)
      },
      onEnd: () => {
        listenStopRef.current = null
        setIntentListening(false)
      },
      onError: () => {
        listenStopRef.current = null
        setIntentListening(false)
        setIntentToast({ msg: "I couldn't hear you — just tap what you want." })
      },
    }).stop
  }, [askStoryTurns, intentListening, transport, runReaderIntent])

  const handleIntentToastPick = useCallback(
    (_i: number, label: string) => {
      setIntentToast(null)
      void runReaderIntent(label)
    },
    [runReaderIntent],
  )

  // ---- Navigation — Transport chevrons + swipe. Never plays. ----
  const goNext = useCallback(() => {
    // v3.1 P0-1 / §A3 touch-balance: prev/next chevrons and swipe are NEVER
    // gated. A child who doesn't speak must always be able to page through.
    // Gates apply only to auto-turn during continuous play mode (that lives
    // in useReaderTransport, which pauses when `gated` is true). Manual page
    // turns are always the child's prerogative — even if an ask / choice /
    // breathe is unresolved on this page, they can move on and come back.
    if (isLastPage) {
      void onFinishChapter()
      return
    }
    setPageIdx((i) => i + 1)
  }, [isLastPage, onFinishChapter])

  const goPrev = useCallback(() => {
    if (pageIdx === 0) return
    setPageIdx((i) => i - 1)
  }, [pageIdx])

  // ---- Word-level interactions ----
  const wordMeaning = useCallback(
    (word: string): string | undefined => {
      const v = book.vocab.find((x) => x.word.toLowerCase() === word.toLowerCase())
      return v?.meaning
    },
    [book.vocab],
  )

  // Tap on a word = SAY THAT WORD again (word learning first). It used to
  // seek narration there, but without exact timestamps seek degraded to
  // restarting the whole page — and a child learning to read wants the word
  // repeated, not the story rewound. Narration pauses; the tapped word lights
  // while it's spoken; play resumes on the terracotta button.
  const onWordSeek = useCallback(
    (wordIdx: number) => {
      const w = words[wordIdx]?.replace(/[.,!?;:'"]/g, '')
      if (!w) return
      transport.speakOne(w, undefined, wordIdx)
    },
    [transport, words],
  )

  // Hold = the word plus its meaning (star words) — the deeper dive.
  const onWordHold = useCallback(
    (word: string) => {
      const meaning = wordMeaning(word)
      transport.speakOne(word, meaning)
    },
    [transport, wordMeaning],
  )

  // Follow the narration: when the highlighted word changes during playback,
  // keep it in view. `block: 'nearest'` only scrolls when the word has actually
  // gone past an edge, so words already on screen never jitter, and a paused
  // child scrolling by hand is never fought (wordIdx doesn't change when
  // paused). This is what makes a long page readable on a short phone screen.
  useEffect(() => {
    if (transport.wordIdx < 0) return
    const col = textColRef.current
    if (!col) return
    const spans = col.querySelectorAll('span[role="button"]')
    const el = spans[transport.wordIdx] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [transport.wordIdx])

  // ---- Kamishibai swipe: page follows finger 1:1 (A1). ----
  const [dragDx, setDragDx] = useState(0)
  const swipeRef = useRef<{ startX: number; startY: number; pid: number | null; committed: boolean }>({
    startX: 0,
    startY: 0,
    pid: null,
    committed: false,
  })

  const onSwipeDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Only accept touch/pen — mouse can page-turn via chevrons.
    if (e.pointerType === 'mouse') return
    swipeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      pid: e.pointerId,
      committed: false,
    }
    // P0: do NOT setPointerCapture here. Capturing on pointerdown retargets all
    // subsequent pointer events to this surface, which steals word taps/holds
    // (PageWord never gets its pointerup) — "words are the timeline" dies on
    // touch while working fine with a mouse. We only capture once the gesture
    // has actually committed to a horizontal swipe (see onSwipeMove).
  }, [])

  const onSwipeMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const s = swipeRef.current
      if (s.pid !== e.pointerId) return
      const dx = e.clientX - s.startX
      const dy = e.clientY - s.startY
      // Determine axis intent once we've moved past slop.
      if (!s.committed) {
        const dist = Math.hypot(dx, dy)
        if (dist < 24) return // ≥24px slop per A1.
        if (Math.abs(dx) < Math.abs(dy)) {
          // Vertical scroll — bail out of gesture.
          swipeRef.current = { ...s, pid: null }
          setDragDx(0)
          return
        }
        swipeRef.current = { ...s, committed: true }
        // Now that this is definitively a horizontal page-turn (past the 24px
        // slop, and a word tap/hold could no longer be intended), take pointer
        // capture so the drag keeps tracking even if the finger slides off the
        // surface. Taps never reach here, so they're no longer stolen.
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          /* ignore — some environments don't support capture */
        }
      }
      setDragDx(dx)
    },
    [],
  )

  const onSwipeUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const s = swipeRef.current
      if (s.pid !== e.pointerId) return
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      const dx = dragDx
      swipeRef.current = { startX: 0, startY: 0, pid: null, committed: false }
      // Commit thresholds — either half-page or a fast flick.
      const width = e.currentTarget.getBoundingClientRect().width || 1
      const ratio = Math.abs(dx) / width
      const commit = ratio > 0.28
      setDragDx(0)
      if (!commit) return
      if (dx < 0) goNext()
      else goPrev()
    },
    [dragDx, goNext, goPrev],
  )

  if (!page) return null

  const fullBleed = !!page.fullBleed
  const chapterLabel = book.chapters.length > 1 ? chapter.title || `Chapter ${chapterIdx + 1}` : book.title

  return (
    <KidScreen
      label={`Reader — ${chapter.title || book.title}`}
      style={{
        height: '100dvh',
        maxHeight: '100dvh',
        minHeight: 0,
        overflow: 'hidden',
        background: 'var(--lf-cream)',
      }}
    >
      <div
        className="lf-room lf-read"
        data-register="story"
        style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          touchAction: 'manipulation',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
      >
        {/* Mystery word celebration overlay */}
        {mysteryFound && (
          <div
            role="dialog"
            aria-live="polite"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 60,
              background: 'var(--paper-bright, #F9F2E3)',
              backgroundImage: 'var(--texture-paper)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              padding: 32,
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <DrawnConfetti n={20} />
            <div
              aria-hidden="true"
              style={{
                width: 128,
                height: 128,
                borderRadius: '50%',
                background: 'var(--lf-cream-card)',
                border: '2.5px solid rgba(251,191,36,.7)',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 0 40px rgba(251,191,36,.4)',
              }}
            >
              <svg width="72" height="72" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  d="M 10 2 L 12 8 L 18 9 L 13 13 L 15 19 L 10 15 L 5 19 L 7 13 L 2 9 L 8 8 Z"
                  fill="var(--pigment-butter, #EFC85C)"
                  stroke="var(--ink, #46362A)"
                  strokeWidth="1"
                  filter="url(#lf-wobble)"
                />
              </svg>
            </div>
            <div style={{ font: '700 22px var(--font-display, YoungSerif)', color: 'var(--lf-espresso)' }}>
              You found a mystery word!
            </div>
            <div style={{ font: '700 44px var(--font-display, YoungSerif)', color: 'var(--lf-espresso)' }}>
              {mysteryFound.word}
            </div>
            {mysteryFound.meaning && (
              <div style={{ font: '600 18px/1.5 var(--font-body)', color: 'var(--lf-espresso-soft)', maxWidth: 420 }}>
                {mysteryFound.meaning}
              </div>
            )}
          </div>
        )}

        {intentToast && (
          <IntentToast
            message={intentToast.msg}
            options={intentToast.options}
            onPick={handleIntentToastPick}
            onClose={() => setIntentToast(null)}
          />
        )}

        {mysteryAlready && (
          <div
            role="status"
            className="lf-screen-in"
            style={{
              position: 'fixed',
              top: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 60,
              background: 'var(--lf-pastel-mint)',
              borderRadius: 999,
              padding: '8px 16px',
              font: '700 14px var(--font-body)',
              color: 'var(--lf-espresso)',
              boxShadow: '0 6px 18px rgba(94,62,26,.14)',
              pointerEvents: 'none',
            }}
          >
            already discovered ✓
          </div>
        )}

        {/* Top-left: quiet ink back arrow — always up one level. */}
        <button
          type="button"
          aria-label="Back"
          onPointerUp={(e) => {
            e.preventDefault()
            onExit()
          }}
          className="lf-press"
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            width: 56,
            height: 56,
            borderRadius: '50% 48% 52% 50%',
            border: '1.5px solid var(--lf-cream-line)',
            background: 'var(--lf-cream-card)',
            color: 'var(--lf-espresso)',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            zIndex: 6,
            touchAction: 'manipulation',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 30 30" aria-hidden="true">
            <path
              d="M19 4 L7 15 L19 26"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#lf-wobble)"
            />
          </svg>
        </button>

        {/* Top-right: folio dog-ear → Contents overlay. */}
        <Folio pageIdx={pageIdx} totalPages={total} onOpen={onOpenContents} />

        {/* Top: quiet chapter/book label — atmosphere, not a control. */}
        <div
          className="lf-reader-chapline"
          style={{
            paddingTop: 26,
            textAlign: 'center',
            font: 'italic 600 16px var(--font-body)',
            color: 'var(--lf-espresso-faint)',
            pointerEvents: 'none',
            flexShrink: 0,
          }}
        >
          {book.title}
          {book.chapters.length > 1 ? ` — ${chapter.title}` : ''}
        </div>

        {/* v3 R16 — "?" mic (voice intent → story-Q&A fallback). */}
        <button
          type="button"
          aria-label="Ask the story"
          onPointerUp={(e) => {
            e.preventDefault()
            handleAskStory()
          }}
          disabled={askStoryTurns >= 2}
          className="lf-press"
          style={{
            position: 'absolute',
            top: 20,
            right: 90,
            width: 46,
            height: 46,
            borderRadius: '50%',
            background: 'var(--lf-cream-card)',
            border: '1.5px solid var(--lf-cream-line)',
            color: askStoryTurns >= 2 ? 'var(--lf-espresso-faint)' : 'var(--lf-espresso-soft)',
            fontSize: 18,
            cursor: askStoryTurns >= 2 ? 'default' : 'pointer',
            zIndex: 6,
            touchAction: 'manipulation',
          }}
        >
          ?
        </button>

        {/* Kamishibai swipe surface — the spread. */}
        <div
          onPointerDown={onSwipeDown}
          onPointerMove={onSwipeMove}
          onPointerUp={onSwipeUp}
          onPointerCancel={onSwipeUp}
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            overflow: 'hidden',
            position: 'relative',
            touchAction: 'pan-y',
          }}
        >
          <div
            className="lf-reader-spread"
            style={{
              flex: 1,
              minHeight: 0,
              display: 'grid',
              // Portrait phones re-stack this via .lf-reader-spread CSS.
              gridTemplateColumns: fullBleed ? '1fr' : 'minmax(0, 46%) minmax(0, 54%)',
              transform: `translateX(${dragDx}px)`,
              transition: dragDx === 0 ? 'transform 260ms var(--ease-slide, ease-out)' : 'none',
              willChange: 'transform',
            }}
          >
            {/* Left: art. Any page with a REAL illustration gets the
                picture-book spread treatment — art fills its page edge to
                edge (same as the starters' fullBleed pages); only the
                endpaper placeholder keeps the floating-panel inset. */}
            <div
              className="lf-reader-artcol"
              style={{
                position: 'relative',
                padding: fullBleed || effectiveImg ? 0 : '20px 14px 14px 32px',
                minHeight: 0,
                minWidth: 0,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {effectiveImg && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={effectiveImg}
                  className="lf-page-art-fade"
                  src={effectiveImg}
                  alt=""
                  style={{
                    // Every real illustration fills its page like a picture
                    // book. 'center top' keeps faces in frame (v3.2 #7 —
                    // children's-book art carries its subject in the top half).
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center top',
                  }}
                />
              )}
              {effectiveImg && !fullBleed && (
                // Gutter shadow — the soft fold where the art page meets the
                // text page, selling the two columns as one open spread.
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: '0 0 0 auto',
                    width: 26,
                    background: 'linear-gradient(to left, rgba(60,40,20,.18), transparent)',
                    pointerEvents: 'none',
                  }}
                />
              )}
              {!effectiveImg && (
                // No real illustration for this page yet — show an intentional
                // colored scene panel keyed to the book (its cover's spine
                // color + motif), not an empty placeholder. The art pipeline
                // can replace this per page over time. While generate-while-
                // reading is making this page's art, the panel shows the
                // "painting this page…" indicator.
                <ReaderScene book={book} painting={!!artPainting[`${chapterIdx}-${pageIdx}`]} />
              )}
            </div>

            {/* Right: words + teaching card */}
            <div
              ref={textColRef}
              className="lf-reader-textcol"
              style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                padding: '20px 32px 14px 18px',
                overflowY: 'auto',
                overscrollBehavior: 'contain',
              }}
            >
              <div
                // Re-keying per page replays the entrance — each page turn the
                // words settle onto the paper instead of snapping into place.
                key={`${chapterIdx}-${pageIdx}`}
                className="lf-reader-textcard lf-page-enter"
                style={{
                  background: 'var(--paper-bright, var(--lf-cream-card))',
                  border: '1.5px solid var(--lf-cream-line)',
                  borderRadius: 22,
                  padding: '26px 30px',
                  boxShadow: '0 6px 20px rgba(94,62,26,.12)',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    font: '600 24px/1.65 var(--font-body, Alegreya)',
                    color: 'var(--lf-espresso, var(--ink))',
                  }}
                >
                  {words.map((w, i) => (
                    <span key={i}>
                      <PageWord
                        word={w}
                        wordIdx={i}
                        isStar={!!page.star && w.replace(/[.,!?;:'"]/g, '').toLowerCase() === page.star.toLowerCase()}
                        isHighlighted={i === transport.wordIdx}
                        meaning={wordMeaning(w.replace(/[.,!?;:'"]/g, ''))}
                        onSeek={onWordSeek}
                        onHold={onWordHold}
                      />
                      {' '}
                    </span>
                  ))}
                </p>

                {page.star && !isMysteryStar && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(251,191,36,.16)',
                      border: '1.5px solid rgba(251,191,36,.5)',
                      borderRadius: 999,
                      padding: '5px 14px',
                      font: '700 13.5px var(--font-body)',
                      color: 'var(--lf-espresso)',
                      marginTop: 12,
                    }}
                  >
                    ⭐ Star word: <strong>{page.star}</strong>
                  </span>
                )}

                {page.star && isMysteryStar && book.mysteryWord && (
                  <button
                    type="button"
                    className="lf-press"
                    aria-label={`Mystery word — tap to reveal ${page.star}`}
                    onPointerUp={(e) => {
                      e.preventDefault()
                      handleMysteryTap()
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(251,191,36,.22)',
                      border: '1.5px dashed rgba(251,191,36,.7)',
                      borderRadius: 999,
                      padding: '5px 14px',
                      font: '700 13.5px var(--font-body)',
                      color: 'var(--lf-espresso)',
                      marginTop: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <span aria-hidden="true">⭐✨</span>
                    Star word: <strong>{page.star}</strong>
                  </button>
                )}

                {page.breathe && (
                  <div style={{ borderTop: '1.5px dashed var(--lf-cream-line)', marginTop: 18, paddingTop: 18 }}>
                    <BreatheAlong onDone={() => setBreatheDone(true)} done={breatheDone} />
                  </div>
                )}

                {page.ask && (
                  <div
                    style={{
                      marginTop: 18,
                      borderTop: '1.5px dashed var(--lf-cream-line)',
                      paddingTop: 18,
                    }}
                  >
                    <AskInline
                      ask={page.ask}
                      state={askState}
                      onMic={handleMic}
                      onSayIt={!micOk || fallbackUnlocked ? handleSayIt : undefined}
                      fallbackUnlocked={fallbackUnlocked}
                      chips={chipsForAsk(page.ask)}
                      onTapAnswer={handleTapAnswer}
                      onSkip={handleSkipAsk}
                    />
                  </div>
                )}

                {page.choice && !choiceGen && (
                  <div
                    style={{
                      marginTop: 18,
                      borderTop: '1.5px dashed var(--lf-cream-line)',
                      paddingTop: 18,
                    }}
                  >
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
                    <span aria-hidden="true" style={{ fontSize: 42 }}>
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
                    <SpeakerIcon size={16} /> {askStoryReply}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar — prev · play · scrubber · next in ONE row. The old
            stacked ribbon + transport ate ~40% of a phone-landscape screen;
            this gives that height back to the art and the words. Chevrons are
            always live (v3.1 P0-1) so a touch-only child can leave the page;
            auto-turn still respects gates via useReaderTransport. */}
        <div
          className="lf-reader-bottombar"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '0 16px 10px',
            flexShrink: 0,
          }}
        >
          <ChevronBtn dir="prev" onPress={goPrev} disabled={pageIdx === 0} size={50} />
          <PlayBtn playing={transport.playing} onPress={transport.toggle} size={64} />
          <Ribbon
            className="lf-reader-ribbon lf-ribbon-inline"
            chapter={chapterLabel}
            pageIdx={pageIdx}
            totalPages={total}
            onSeek={(i) => {
              if (gated) return
              setPageIdx(i)
            }}
            chapterNav={
              book.chapters.length > 1
                ? { idx: chapterIdx, count: book.chapters.length, onOpen: onOpenContents }
                : undefined
            }
          />
          <ChevronBtn dir="next" onPress={goNext} size={50} />
        </div>
      </div>
    </KidScreen>
  )
}

/* ---- chipsForAsk — v3.1 P0-1 touch chip catalog per ask type -------------
 * Adapts InterviewPhase's `chipsForSlot` idea to the reader's AskBlock. Rules:
 *   1. Counting asks (skill mentions "count" or answers contain 1..9 as
 *      digits or "one"/"two"/…) → number chips 1..5, regardless of the pack's
 *      exact answers. This guarantees a touch child always sees a number to
 *      tap.
 *   2. Wonder asks (`ask.kind === 'wonder'`) or asks with no `answers` →
 *      three warm-generic chips ("Yes", "Not sure", "I don't know"). The mic
 *      still wins for anything meaningful; these give a touch child a way
 *      through.
 *   3. Otherwise (keyword asks like "colors: red, blue, green") → render
 *      each of `ask.answers` as a chip.
 *
 * Chips are drawn as small pastel pills co-present with the mic; they don't
 * suppress the mic and don't gate. */
const NUMBER_WORDS: Record<string, string> = {
  one: '1', two: '2', three: '3', four: '4', five: '5',
  six: '6', seven: '7', eight: '8', nine: '9',
}

function chipsForAsk(ask: NonNullable<Page['ask']>): string[] {
  const isCounting =
    /count|number/i.test(ask.skill || '') ||
    (ask.answers ?? []).some((a) => /^(\d|one|two|three|four|five|six|seven|eight|nine)\b/i.test(a.trim()))
  if (isCounting) {
    return ['1', '2', '3', '4', '5']
  }
  if (ask.kind === 'wonder' || !ask.answers || ask.answers.length === 0) {
    return ['Yes', 'Not sure', "I don't know"]
  }
  // De-dupe and cap at 5 to keep the row tap-friendly. Normalize obvious
  // number-word answers to digits so a child can pick either.
  const out = new Set<string>()
  for (const raw of ask.answers) {
    const s = raw.trim()
    if (!s) continue
    const norm = NUMBER_WORDS[s.toLowerCase()] ?? s
    out.add(norm)
    if (out.size >= 5) break
  }
  return Array.from(out)
}

/* ---- AskInline (v3.1 P0-1: mic + chips + skip-for-now, all co-present) --- */
function AskInline({
  ask,
  state,
  onMic,
  onSayIt,
  fallbackUnlocked,
  chips,
  onTapAnswer,
  onSkip,
}: {
  ask: NonNullable<Page['ask']>
  state: AskUiState
  onMic: () => void
  onSayIt?: () => void
  fallbackUnlocked?: boolean
  chips: string[]
  onTapAnswer: (chip: string) => void
  onSkip: () => void
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
        <svg width="32" height="26" viewBox="0 0 44 36" aria-hidden="true">
          <path
            d="M 14 18 L 15.5 23 L 20.5 24 L 16 27 L 17 32 L 14 29 L 11 32 L 12 27 L 8 24 L 12.5 23 Z"
            fill="var(--pigment-butter, #EFC85C)" stroke="var(--ink, #46362A)" strokeWidth="1.2" filter="url(#lf-wobble)"
          />
          <path
            d="M 30 10 L 31.2 13 L 34 13.6 L 31.5 15.6 L 32.4 18.8 L 30 17 L 27.6 18.8 L 28.5 15.6 L 26 13.6 L 28.8 13 Z"
            fill="var(--pigment-marigold, #E2A93B)" stroke="var(--ink, #46362A)" strokeWidth="1.2" filter="url(#lf-wobble)"
          />
        </svg>
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
          onPointerUp={(e) => {
            e.preventDefault()
            onMic()
          }}
          className="lf-press lf-mic-pulse"
          style={{
            width: 62,
            height: 62,
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            background: state === 'listening' ? 'var(--lf-coral-deep)' : 'var(--lf-coral)',
            color: '#fff',
            flexShrink: 0,
            touchAction: 'manipulation',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MicIcon size={30} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ font: '700 18px/1.4 var(--font-body)', color: 'var(--lf-espresso)' }}>{ask.question}</div>
          {state === 'listening' && (
            <div style={{ marginTop: 6, font: '700 14px var(--font-body)', color: 'var(--lf-coral-deep)' }}>
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
              <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
                {/* a drawn lantern hint dot */}
                <circle cx="10" cy="9" r="5" fill="var(--pigment-butter, #EFC85C)" stroke="var(--ink, #46362A)" strokeWidth="1.4" filter="url(#lf-wobble)" />
                <path d="M 8 15 L 12 15 M 9 17 L 11 17" stroke="var(--ink, #46362A)" strokeWidth="1.4" strokeLinecap="round" filter="url(#lf-wobble)" />
              </svg>
              {ask.hint}
            </div>
          )}
          {onSayIt && (
            <button
              type="button"
              onPointerUp={(e) => {
                e.preventDefault()
                onSayIt()
              }}
              className="lf-press"
              style={{
                marginTop: 8,
                background: 'var(--lf-pastel-lilac)',
                border: 'none',
                borderRadius: 999,
                padding: '9px 16px',
                font: '700 14px var(--font-body)',
                color: 'var(--lf-espresso)',
                cursor: 'pointer',
                minHeight: 44,
                touchAction: 'manipulation',
              }}
            >
              {fallbackUnlocked ? 'I said it!' : 'Tap here when you said it'}
            </button>
          )}
        </div>
      </div>

      {/* v3.1 P0-1 — drawn chip catalog + skip-for-now.
          Always co-present with the mic from first paint, so a touch-only
          child has a way through. Chips route through the same evaluate()
          the mic uses; skip lands directly in praise (touch escape hatch). */}
      <div
        style={{
          marginTop: 12,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            className="lf-press"
            onPointerUp={(e) => {
              e.preventDefault()
              onTapAnswer(c)
            }}
            aria-label={`Answer ${c}`}
            style={{
              background: 'var(--lf-pastel-peach)',
              border: '1.5px solid var(--lf-cream-line)',
              borderRadius: 999,
              padding: '10px 16px',
              font: '700 15px var(--font-body)',
              color: 'var(--lf-espresso)',
              cursor: 'pointer',
              minHeight: 44,
              minWidth: 44,
              touchAction: 'manipulation',
            }}
          >
            {c}
          </button>
        ))}
        <button
          type="button"
          className="lf-press"
          onPointerUp={(e) => {
            e.preventDefault()
            onSkip()
          }}
          aria-label="Skip this question for now"
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: '1.5px dashed var(--lf-cream-line)',
            borderRadius: 999,
            padding: '10px 16px',
            font: 'italic 700 14px var(--font-body)',
            color: 'var(--lf-espresso-soft)',
            cursor: 'pointer',
            minHeight: 44,
            touchAction: 'manipulation',
          }}
        >
          skip for now
        </button>
      </div>
    </div>
  )
}

/* ---- ChoiceGrid (unchanged behavior) ---- */
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {twoOptions.map((o) => {
          const isChosen = chosen === o.label
          const dim = chosen != null && !isChosen
          return (
            <button
              key={o.label}
              type="button"
              className="lf-press"
              onPointerUp={(e) => {
                e.preventDefault()
                onChoose(o)
              }}
              disabled={chosen != null}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                border: isChosen ? '2.5px solid var(--lf-coral)' : '2px solid var(--lf-cream-line)',
                background: isChosen ? 'var(--lf-pastel-peach)' : 'var(--lf-cream-card)',
                borderRadius: 18,
                padding: '16px 12px',
                color: 'var(--lf-espresso)',
                opacity: dim ? 0.45 : 1,
                minHeight: 56,
                cursor: chosen ? 'default' : 'pointer',
                touchAction: 'manipulation',
              }}
            >
              <span style={{ font: '700 17px/1.25 var(--font-display)', textAlign: 'center' }}>{o.label}</span>
            </button>
          )
        })}
        <button
          type="button"
          className="lf-press"
          onPointerUp={(e) => {
            e.preventDefault()
            onYourIdea()
          }}
          disabled={chosen != null}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            border: chosen === '…YOUR idea!' ? '2.5px solid var(--lf-coral)' : '2px dashed var(--lf-cream-line)',
            background: chosen === '…YOUR idea!' ? 'var(--lf-pastel-peach)' : 'var(--lf-cream-card)',
            borderRadius: 18,
            padding: '16px 12px',
            color: 'var(--lf-espresso)',
            opacity: chosen != null && chosen !== '…YOUR idea!' ? 0.45 : 1,
            minHeight: 56,
            cursor: chosen ? 'default' : 'pointer',
            touchAction: 'manipulation',
          }}
        >
          <MicIcon size={44} color="var(--lf-coral-deep, #C7452F)" />
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
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          width: '100%',
        }}
      >
        <MicIcon size={14} color="var(--lf-espresso-soft, #6E5B49)" /> Say it out loud — or tap it!
      </div>
    </div>
  )
}
