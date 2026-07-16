'use client'

// Little Fables — Home v3 (the Drawn Room).
// The buddy is on the rug in a room lit by the real clock. Everything else is
// hung on the walls / shelf / windowsill of that room. Preserved from v2:
//   - BuddyMic (buddy face tap-to-listen with intent dispatch)
//   - IntentHighlight wrappers for Continue + shelf items
//   - First-run redirect to /read/buddy when no active buddy
//   - Real world-memory callback line
//   - Deterministic todaysPick
//   - currentWeekSuns() row
//   - OfflineBanner
//   - MakeAStoryDoor → /read/create-with-buddy
//   - Badge / word wall counts
//   - pullAll() on mount when signed in
//
// Replaced from v2:
//   - Grid layout, pastel washes, sw-app classes → the Drawn Room stage,
//     tokens under `.lf-room`, tap zones over the north-star painting.
//
// A1 touch-balance: exactly one coral action per screen. On Home that's the
// Continue card (or Today's-adventure if none in flight). Every voice-reachable
// action has a tap element visible. Decorative art is `pointer-events: none`.

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRoomShell } from './RoomShell'
import { listen, recognitionAvailable } from '@/lib/read/speech'
import { askIntent, dispatchIntent, hasReachedMissCap } from '@/lib/read/intents'
import { BUDDIES, cp, getBuddy } from '@/lib/read/buddies'
import { loadShelf } from '@/lib/read/packs'
import { fetchCoverOverrides } from '@/lib/read/artOverrides'
import {
  currentWeekSuns,
  loadBadges,
  loadBuddy,
  loadProgress,
  loadWordBook,
  loadWorldState,
} from '@/lib/read/storage'
import { pullAll } from '@/lib/read/sync'
import type { Book, BuddyDef } from '@/types/story'
import { CreatureSprite, IntentToast, OfflineBanner } from './art'
import type { BuddyKind } from './art'
import { useLighting } from '@/lib/read/useLighting'
import type { LightingKeyframe } from '@/lib/read/lighting'
import { HomeBookCover } from './home/HomeBookCover'
import './home/home.css'

type Suns = ReturnType<typeof currentWeekSuns>
type ProgressEntry = { chapter: number; page: number; updatedAt: number }

export default function Home() {
  const { online } = useRoomShell()
  const router = useRouter()

  const [ready, setReady] = useState(false)
  const [buddy, setBuddy] = useState<BuddyDef>(BUDDIES[0])
  const [energy, setEnergy] = useState<'bouncy' | 'calm'>('bouncy')
  const [shelf, setShelf] = useState<Book[]>([])
  const [suns, setSuns] = useState<Suns>([])
  const [badgeCount, setBadgeCount] = useState(0)
  const [wordCount, setWordCount] = useState(0)
  const [callback, setCallback] = useState<string | undefined>(undefined)
  const [choiceLogLen, setChoiceLogLen] = useState(0)
  const [progressMap, setProgressMap] = useState<Record<string, ProgressEntry>>({})

  // Book-opening transition: tapping a book lifts its cover off the shelf and
  // grows it toward the center over a paper backdrop, then the reader takes
  // over. `opening` pins the tapped cover's rect; `openingOn` (set a frame
  // later) triggers the CSS transitions.
  const [opening, setOpening] = useState<{ book: Book; rect: DOMRect } | null>(null)
  const [openingOn, setOpeningOn] = useState(false)
  const openBook = useCallback(
    (book: Book, from: HTMLElement | null) => {
      const dest = `/read/story/${book.id}`
      const reduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const coverEl = from?.querySelector<HTMLElement>('.lfh-cover')
      if (reduced || !coverEl) {
        router.push(dest)
        return
      }
      router.prefetch(dest)
      setOpening({ book, rect: coverEl.getBoundingClientRect() })
      requestAnimationFrame(() => requestAnimationFrame(() => setOpeningOn(true)))
      window.setTimeout(() => router.push(dest), 520)
    },
    [router],
  )

  useEffect(() => {
    const bs = loadBuddy()
    if (bs.activeId === null) {
      router.replace('/read/arrival')
      return
    }
    setBuddy(getBuddy(bs.activeId))
    setEnergy(bs.energy)
    setShelf(loadShelf())
    // Approved cover art (published on prod via Parent Corner → Art) lights up
    // the shelf without a redeploy. Best-effort + non-blocking.
    void fetchCoverOverrides().then((covers) => {
      if (Object.keys(covers).length === 0) return
      setShelf((prev) => prev.map((b) => (covers[b.id] ? { ...b, coverImage: covers[b.id] } : b)))
    })
    setSuns(currentWeekSuns())
    setBadgeCount(loadBadges().ids.length)
    setWordCount(loadWordBook().words.length)
    const ws = loadWorldState()
    setCallback(ws.latestCallback)
    setChoiceLogLen(ws.choiceLog.length)
    const p = loadProgress()
    const m: Record<string, ProgressEntry> = {}
    for (const [id, v] of Object.entries(p))
      m[id] = { chapter: v.chapter, page: v.page, updatedAt: v.updatedAt }
    setProgressMap(m)
    setReady(true)
    // Fire-and-forget: reconcile the shelf / progress with the server if we
    // happen to be signed in. Preserved from v2.
    void pullAll().catch(() => {})
  }, [router])

  const { chapterBooks, quickStories, continueBook, todaysPick } = useMemo(() => {
    const chapters: Book[] = []
    const quicks: Book[] = []
    for (const b of shelf) {
      const isChapter =
        b.kind === 'chapter' || (b.chapters.length > 1 && b.chapters.some((c) => c.title))
      if (isChapter) chapters.push(b)
      else quicks.push(b)
    }
    const all = chapters.concat(quicks)
    const midFlight = all
      .map((b) => ({ b, prog: progressMap[b.id] }))
      .filter((x) => {
        if (!x.prog) return false
        if (x.prog.chapter === 0 && x.prog.page === 0) return false
        return x.prog.chapter < x.b.chapters.length
      })
      .sort((a, b) => (b.prog!.updatedAt || 0) - (a.prog!.updatedAt || 0))
    const cont = midFlight[0]?.b

    let today: Book | undefined
    if (!cont && all.length > 0) {
      const unread: Book[] = []
      const finished: { b: Book; touched: number }[] = []
      for (const b of all) {
        const p = progressMap[b.id]
        if (!p || (p.chapter === 0 && p.page === 0)) unread.push(b)
        else finished.push({ b, touched: p.updatedAt || 0 })
      }
      const dayKey = new Date().toISOString().slice(0, 10)
      const rotate = <T,>(arr: T[]): T[] => {
        if (arr.length <= 1) return arr
        let seed = 0
        for (let i = 0; i < dayKey.length; i++) seed = (seed * 31 + dayKey.charCodeAt(i)) | 0
        const n = Math.abs(seed) % arr.length
        return arr.slice(n).concat(arr.slice(0, n))
      }
      const unreadSorted = rotate([...unread].sort((a, b) => a.id.localeCompare(b.id)))
      if (unreadSorted.length > 0) {
        today = unreadSorted[0]
      } else if (finished.length > 0) {
        finished.sort((a, b) => a.touched - b.touched || a.b.id.localeCompare(b.b.id))
        today = finished[0].b
      }
    }

    return {
      chapterBooks: chapters,
      quickStories: quicks,
      continueBook: cont,
      todaysPick: today,
    }
  }, [shelf, progressMap])

  // v3.1: the buddy's speech tracks the real clock. We prefer the buddy's own
  // greet line at dawn/morning (it's built for that beat), but past midday we
  // shift to a daypart-shaped line so 8am and 8pm never feel the same.
  const lighting = useLighting()
  const speechLine = useMemo(() => {
    if (callback && choiceLogLen > 0) return callback
    const greet = daypartGreet(lighting.keyframe, buddy, energy)
    if (continueBook) return `${greet} Let's keep reading ${continueBook.title}!`
    if (shelf.length > 0) return `${greet} Pick a story from your shelf!`
    return greet
  }, [buddy, energy, callback, choiceLogLen, continueBook, shelf.length, lighting.keyframe])

  // ---- Voice intent layer (PRD R16/R17/R18) — preserved from v2 ----
  const [listening, setListening] = useState(false)
  const [, setHighlightTarget] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; options?: string[] } | null>(null)
  const listenStopRef = useRef<(() => void) | null>(null)

  useEffect(() => () => {
    listenStopRef.current?.()
  }, [])

  const stateForIntent = useMemo(
    () => ({
      hasMidFlightBook: continueBook
        ? { id: continueBook.id, title: continueBook.title }
        : undefined,
      shelf: shelf.slice(0, 24).map((b) => ({ id: b.id, title: b.title })),
    }),
    [continueBook, shelf],
  )

  const handleIntentResult = useCallback(
    async (transcript: string) => {
      const result = await askIntent({
        transcript,
        surface: 'home',
        state: stateForIntent,
      })
      await dispatchIntent(
        result,
        {
          router,
          onHighlight: (id) => {
            setHighlightTarget(id)
            setTimeout(() => setHighlightTarget(null), 1400)
          },
          onOffer: (msg, options) => setToast({ msg, options }),
          currentBookId: continueBook?.id ?? null,
          shelf: stateForIntent.shelf,
        },
        { surface: 'home' },
      )
    },
    [router, stateForIntent, continueBook],
  )

  const handleBuddyMicTap = useCallback(() => {
    if (listening) {
      listenStopRef.current?.()
      listenStopRef.current = null
      setListening(false)
      return
    }
    if (!recognitionAvailable()) {
      setToast({
        msg: 'Tap what you want:',
        options: continueBook
          ? ['Keep reading', 'Pick a new buddy']
          : ['My books', 'Pick a new buddy'],
      })
      return
    }
    if (hasReachedMissCap('home')) {
      setToast((t) => t ?? { msg: 'Or just tap what you want.' })
      return
    }
    setListening(true)
    listenStopRef.current = listen({
      onResult: (t) => {
        void handleIntentResult(t)
      },
      onEnd: () => {
        listenStopRef.current = null
        setListening(false)
      },
      onError: () => {
        listenStopRef.current = null
        setListening(false)
        setToast({ msg: "I couldn't hear you — just tap what you want." })
      },
    }).stop
  }, [listening, continueBook, handleIntentResult])

  const handleToastPick = useCallback(
    (_i: number, label: string) => {
      setToast(null)
      void handleIntentResult(label)
    },
    [handleIntentResult],
  )

  if (!ready) return null

  const buddyKind: BuddyKind = (buddy.id as BuddyKind) ?? 'bramble'

  const allBooks = chapterBooks.concat(quickStories)
  const heroBook = continueBook ?? todaysPick
  const shelfBooks = allBooks.filter((b) => b.id !== heroBook?.id)

  let heroSub = 'Read one chapter and find a new star word.'
  if (continueBook) {
    const prog = progressMap[continueBook.id]
    const chIdx = Math.min(continueBook.chapters.length - 1, prog?.chapter ?? 0)
    const ch = continueBook.chapters[chIdx]
    heroSub =
      continueBook.chapters.length > 1 && ch?.title
        ? `Chapter ${chIdx + 1} · ${ch.title}`
        : 'Keep going'
  }

  return (
    <div className="lf-home">
      {!online && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40 }}>
          <OfflineBanner />
        </div>
      )}
      {toast && (
        <IntentToast
          message={toast.msg}
          options={toast.options}
          onPick={handleToastPick}
          onClose={() => setToast(null)}
        />
      )}

      <div className="lfh-wrap">
        {/* greeting — tap the buddy to talk */}
        <div className="lfh-hello">
          <button
            type="button"
            className="lfh-buddy"
            aria-label={listening ? 'Listening — tap to stop' : 'Tap and talk to your buddy'}
            onClick={handleBuddyMicTap}
          >
            <CreatureSprite kind={buddyKind} pose={listening ? 'listening' : 'idle'} size={84} />
          </button>
          <div className="lfh-bubble">{speechLine}</div>
          <div className="lfh-stats">
            <Link className="lfh-chip" href="/read/words">
              Words <b>{wordCount}</b>
            </Link>
            <Link className="lfh-chip" href="/read/badges">
              Badges <b>{badgeCount}</b>
            </Link>
          </div>
        </div>

        {/* reading days this week */}
        {suns.length > 0 && (
          <div className="lfh-days" aria-label="Reading days this week">
            {suns.map((s) => (
              <span
                key={s.iso}
                className={`lfh-day${s.lit ? ' lit' : ''}${s.today ? ' today' : ''}`}
              >
                {s.letter}
              </span>
            ))}
          </div>
        )}

        {/* keep reading / today's pick — the one coral action */}
        {heroBook ? (
          <Link
            className="lfh-hero"
            href={`/read/story/${heroBook.id}`}
            aria-label={continueBook ? `Keep reading ${heroBook.title}` : `Start ${heroBook.title}`}
            onClick={(e) => {
              e.preventDefault()
              openBook(heroBook, e.currentTarget)
            }}
          >
            <HomeBookCover book={heroBook} />
            <div className="lfh-hero-body">
              <div className="lfh-eyebrow">{continueBook ? 'Keep reading' : "Today's adventure"}</div>
              <h1 className="lfh-hero-title">{heroBook.title}</h1>
              <div className="lfh-hero-sub">{heroSub}</div>
            </div>
            <span className="lfh-play">
              <span className="lfh-play-btn">
                <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
                  <path d="M11 7 L27 17 L11 27 Z" fill="#FBF5E8" />
                </svg>
              </span>
              {continueBook ? 'Read' : 'Start'}
            </span>
          </Link>
        ) : (
          <Link className="lfh-hero" href="/read/create-with-buddy" aria-label="Make your first story">
            <div className="lfh-hero-body">
              <div className="lfh-eyebrow">Let&apos;s begin</div>
              <h1 className="lfh-hero-title">Make your first story</h1>
              <div className="lfh-hero-sub">Tell me who it&apos;s about and I&apos;ll write it with you.</div>
            </div>
            <span className="lfh-play">
              <span className="lfh-play-btn">
                <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
                  <path d="M17 7 V27 M7 17 H27" stroke="#FBF5E8" strokeWidth="3.4" strokeLinecap="round" />
                </svg>
              </span>
              Make
            </span>
          </Link>
        )}

        {/* the shelf — every book, legible and distinct */}
        {shelfBooks.length > 0 && (
          <>
            <div className="lfh-shelf-head">
              <h2>Your books</h2>
              <span>
                {allBooks.length} {allBooks.length === 1 ? 'story' : 'stories'}
              </span>
            </div>
            <div className="lfh-shelf">
              {shelfBooks.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className="lfh-book"
                  aria-label={b.title}
                  onClick={(e) => openBook(b, e.currentTarget)}
                >
                  {/* Title lives ON the cover now (real book, no caption). */}
                  <HomeBookCover book={b} />
                </button>
              ))}
              <button
                type="button"
                className="lfh-make"
                aria-label="Make a new story"
                onClick={() => router.push('/read/create-with-buddy')}
              >
                <svg className="lfh-plus" viewBox="0 0 34 34" aria-hidden="true">
                  <path d="M17 7 V27 M7 17 H27" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
                </svg>
                <span>Make a story</span>
              </button>
            </div>
          </>
        )}

        <div className="lfh-note">Tap a book to fall in · tap your buddy to talk</div>
      </div>

      {/* Book-opening transition: the tapped cover lifts and grows toward the
          center over a rising paper backdrop, then the reader route loads. */}
      {opening && (
        <>
          <div className={`lfh-open-backdrop${openingOn ? ' on' : ''}`} aria-hidden="true" />
          <div
            className="lfh-open-cover"
            aria-hidden="true"
            style={{
              left: opening.rect.left,
              top: opening.rect.top,
              width: opening.rect.width,
              height: opening.rect.height,
              transform: openingOn ? openTransform(opening.rect) : 'none',
            }}
          >
            <HomeBookCover book={opening.book} />
          </div>
        </>
      )}
    </div>
  )
}

/** Transform that carries a shelf cover to the viewport center at a
 *  satisfying "picked up the book" size. */
function openTransform(rect: DOMRect): string {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const scale = Math.min((vw * 0.44) / rect.width, (vh * 0.74) / rect.height)
  const dx = vw / 2 - (rect.left + rect.width / 2)
  const dy = vh / 2 - (rect.top + rect.height / 2)
  return `translate(${dx}px, ${dy}px) scale(${scale})`
}

// ------------------------------------------------------------------


// v3.1 P1-6 — the buddy's greeting keys off the clock so 8am and 8pm never
// feel the same. Dawn / morning keep the buddy's own "good morning" line
// (which each buddy defines); midday+ shift to daypart-shaped lines. Real
// callback lines from world-memory always win (handled at the caller).
function daypartGreet(
  keyframe: LightingKeyframe,
  buddy: BuddyDef,
  energy: 'bouncy' | 'calm',
): string {
  switch (keyframe) {
    case 'dawn':
    case 'morning':
      return cp(buddy.greet, energy)
    case 'midday':
      return 'What a bright day for a story.'
    case 'golden':
      return "The light's just right for a story."
    case 'dusk':
      return 'Story time in the almost-dark?'
    case 'night':
    default:
      return 'One more before the moon says goodnight?'
  }
}

