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
import { useSwApp } from './SwApp'
import { listen, recognitionAvailable } from '@/lib/read/speech'
import { askIntent, dispatchIntent, hasReachedMissCap } from '@/lib/read/intents'
import {
  BuddyMic,
  IntentHighlight,
  IntentToast,
  MatCover,
  OfflineBanner,
  PillNav,
  ProgressRing,
  SpeechBubble,
  WashScene,
} from './components'
import { BUDDIES, cp, getBuddy } from '@/lib/read/buddies'
import { loadShelf } from '@/lib/read/packs'
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
import { LightingProvider } from './room/LightingProvider'
import { RoomScene, ZonedOverlay, ROOM_ZONES } from './room/RoomScene'
import { CreatureSprite, MedallionMount, StarWordPin, SunPin } from './art'
import type { BuddyKind } from './art'

type Suns = ReturnType<typeof currentWeekSuns>
type ProgressEntry = { chapter: number; page: number; updatedAt: number }

export default function Home() {
  const { online } = useSwApp()
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

  useEffect(() => {
    const bs = loadBuddy()
    if (bs.activeId === null) {
      router.replace('/read/buddy')
      return
    }
    setBuddy(getBuddy(bs.activeId))
    setEnergy(bs.energy)
    setShelf(loadShelf())
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

  const speechLine = useMemo(() => {
    if (callback && choiceLogLen > 0) return callback
    const greet = cp(buddy.greet, energy)
    if (continueBook) return `${greet} Let's keep reading ${continueBook.title}!`
    if (shelf.length > 0) return `${greet} Pick a story from your shelf!`
    return greet
  }, [buddy, energy, callback, choiceLogLen, continueBook, shelf.length])

  // ---- Voice intent layer (PRD R16/R17/R18) — preserved from v2 ----
  const [listening, setListening] = useState(false)
  const [highlightTarget, setHighlightTarget] = useState<string | null>(null)
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

  // Take up to 5 word pins for the wall (visual). The full list is behind
  // /read/words.
  const wordPinCount = Math.min(wordCount, 5)
  const badgeMountCount = Math.max(4, Math.min(6, badgeCount + 2))

  return (
    <LightingProvider className="lf-room" style={{ minHeight: '100dvh', position: 'relative' }}>
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

      <RoomScene>
        {/* --------- Windowsill: weekly sun row --------- */}
        <ZonedOverlay zone="suns" style={{ pointerEvents: 'none' }}>
          <div
            aria-label="My reading suns"
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              flexWrap: 'wrap',
            }}
          >
            {suns.map((s) => (
              <SunPin
                key={s.iso}
                letter={s.letter}
                lit={s.lit}
                today={s.today}
                size={36}
              />
            ))}
          </div>
        </ZonedOverlay>

        {/* --------- Wall: star word pins → /read/words --------- */}
        <Link
          href="/read/words"
          aria-label={`My words · ${wordCount}`}
          className="lf-press"
          style={{
            position: 'absolute',
            left: `${(ROOM_ZONES.wordWall.x / 1180) * 100}%`,
            top: `${(ROOM_ZONES.wordWall.y / 820) * 100}%`,
            width: `${(ROOM_ZONES.wordWall.w / 1180) * 100}%`,
            height: `${(ROOM_ZONES.wordWall.h / 820) * 100}%`,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            padding: 8,
            alignContent: 'flex-start',
            justifyContent: 'space-around',
            textDecoration: 'none',
            borderRadius: 12,
            touchAction: 'manipulation',
          }}
        >
          {Array.from({ length: Math.max(3, wordPinCount) }).map((_, i) => (
            <StarWordPin key={i} size={54} />
          ))}
          <span
            style={{
              position: 'absolute',
              bottom: -22,
              left: 8,
              font: '700 14px var(--font-body, serif)',
              color: 'var(--ink-soft, #6E5B49)',
              pointerEvents: 'none',
            }}
          >
            My words · {wordCount}
          </span>
        </Link>

        {/* --------- Shelf: face-out covers (chapter + quick books) --------- */}
        <ZonedOverlay
          zone="shelfTop"
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          {chapterBooks.slice(0, 3).map((b) => (
            <IntentHighlight
              key={b.id}
              active={highlightTarget === `book:${b.id}`}
              style={{ display: 'block' }}
            >
              <MatCover
                story={b}
                ring={progressRingValue(b, progressMap[b.id])}
                onClick={() => router.push(`/read/story/${b.id}`)}
              />
            </IntentHighlight>
          ))}
        </ZonedOverlay>

        <ZonedOverlay
          zone="shelfBottom"
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          {quickStories.slice(0, 3).map((b) => (
            <IntentHighlight
              key={b.id}
              active={highlightTarget === `book:${b.id}`}
              style={{ display: 'block' }}
            >
              <MatCover story={b} onClick={() => router.push(`/read/story/${b.id}`)} />
            </IntentHighlight>
          ))}
        </ZonedOverlay>

        {/* --------- Medallion row (below the shelf → /read/badges) --------- */}
        <Link
          href="/read/badges"
          aria-label={`My badges · ${badgeCount}`}
          className="lf-press"
          style={{
            position: 'absolute',
            left: `${(ROOM_ZONES.medallions.x / 1180) * 100}%`,
            top: `${(ROOM_ZONES.medallions.y / 820) * 100}%`,
            width: `${(ROOM_ZONES.medallions.w / 1180) * 100}%`,
            height: `${(ROOM_ZONES.medallions.h / 820) * 100}%`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            gap: 8,
            padding: '0 8px',
            borderRadius: 12,
            textDecoration: 'none',
            touchAction: 'manipulation',
          }}
        >
          {Array.from({ length: badgeMountCount }).map((_, i) => (
            <MedallionMount key={i} earned={i < badgeCount} size={44} />
          ))}
          <span
            style={{
              position: 'absolute',
              bottom: -22,
              right: 8,
              font: '700 14px var(--font-body, serif)',
              color: 'var(--ink-soft, #6E5B49)',
              pointerEvents: 'none',
            }}
          >
            My badges · {badgeCount}
          </span>
        </Link>

        {/* --------- Writing desk: the story kitchen door --------- */}
        <button
          type="button"
          onClick={() => router.push('/read/create-with-buddy')}
          aria-label="Make a story with me"
          className="lf-press"
          style={{
            position: 'absolute',
            left: `${(ROOM_ZONES.desk.x / 1180) * 100}%`,
            top: `${(ROOM_ZONES.desk.y / 820) * 100}%`,
            width: `${(ROOM_ZONES.desk.w / 1180) * 100}%`,
            height: `${(ROOM_ZONES.desk.h / 820) * 100}%`,
            background: 'transparent',
            border: '2px dashed color-mix(in oklab, var(--pigment-terracotta) 40%, transparent)',
            borderRadius: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: 6,
            font: '700 13px var(--font-body, serif)',
            color: 'var(--pigment-terracotta, #D95B43)',
            touchAction: 'manipulation',
          }}
        >
          Make a story with me
        </button>

        {/* --------- Buddy on the rug (BuddyMic — voice + tap) --------- */}
        <div
          style={{
            position: 'absolute',
            left: `${(ROOM_ZONES.buddy.x / 1180) * 100}%`,
            top: `${(ROOM_ZONES.buddy.y / 820) * 100}%`,
            width: `${(ROOM_ZONES.buddy.w / 1180) * 100}%`,
            height: `${(ROOM_ZONES.buddy.h / 820) * 100}%`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 8,
          }}
        >
          {/* the drawn buddy — a decorative body under the interactive face */}
          <div style={{ pointerEvents: 'none' }}>
            <CreatureSprite
              kind={buddyKind}
              pose={listening ? 'listening' : 'idle'}
              size={140}
            />
          </div>
          <BuddyMic
            buddy={buddy}
            size={72}
            listening={listening}
            onTap={handleBuddyMicTap}
            label={listening ? 'Listening — tap to stop' : 'Tap and talk to your buddy'}
          />
        </div>

        {/* --------- Speech bubble (above the buddy) --------- */}
        <div
          style={{
            position: 'absolute',
            left: `${((ROOM_ZONES.buddy.x + 200) / 1180) * 100}%`,
            top: `${((ROOM_ZONES.buddy.y - 100) / 820) * 100}%`,
            maxWidth: '32%',
            pointerEvents: 'none',
          }}
        >
          <SpeechBubble style={{ font: '700 17px/1.45 var(--font-body)' }}>
            {speechLine}
          </SpeechBubble>
        </div>

        {/* --------- Continue / Today's adventure (the COraL action) --------- */}
        <IntentHighlight
          active={
            highlightTarget === 'continue' ||
            (continueBook != null && highlightTarget === `book:${continueBook.id}`)
          }
          style={{
            position: 'absolute',
            left: `${(ROOM_ZONES.continue.x / 1180) * 100}%`,
            top: `${(ROOM_ZONES.continue.y / 820) * 100}%`,
            width: `${(ROOM_ZONES.continue.w / 1180) * 100}%`,
            display: 'block',
          }}
        >
          <ContinueCard
            book={continueBook}
            todaysPick={todaysPick}
            progress={continueBook ? progressMap[continueBook.id] : undefined}
          />
        </IntentHighlight>
      </RoomScene>

      <PillNav active="home" />
    </LightingProvider>
  )
}

// ------------------------------------------------------------------

function progressRingValue(
  book: Book,
  prog: { chapter: number; page: number } | undefined,
): number | undefined {
  if (!prog) return undefined
  const totalChapters = Math.max(1, book.chapters.length)
  return Math.min(1, prog.chapter / totalChapters)
}

function ContinueCard({
  book,
  todaysPick,
  progress,
}: {
  book: Book | undefined
  todaysPick?: Book | undefined
  progress: { chapter: number; page: number } | undefined
}) {
  const nudge = 'Read one chapter and find a new star word.'

  // Empty shelf.
  if (!book && !todaysPick) {
    return (
      <section
        aria-label="Today's adventure"
        style={{
          background: 'var(--paper-bright, #F9F2E3)',
          border: '2.5px solid var(--pigment-terracotta, #D95B43)',
          borderRadius: 18,
          padding: 16,
          boxShadow:
            '0 0 0 4px color-mix(in oklab, var(--pigment-terracotta) 18%, transparent)',
        }}
      >
        <div
          style={{
            font: '700 12px var(--font-body)',
            color: 'var(--ink-faint, #97836B)',
            textTransform: 'uppercase',
            letterSpacing: '.08em',
          }}
        >
          Today&rsquo;s adventure
        </div>
        <h2
          style={{
            margin: '4px 0 6px',
            font: '700 20px/1.15 var(--font-display, serif)',
            color: 'var(--ink, #46362A)',
          }}
        >
          Your shelf is warming up
        </h2>
        <p
          style={{
            margin: 0,
            font: '600 14px var(--font-body, serif)',
            color: 'var(--ink-soft, #6E5B49)',
          }}
        >
          {nudge}
        </p>
      </section>
    )
  }

  const target = book ?? todaysPick!
  const wash = target.chapters[0]?.wash ?? target.wash ?? 'honey'
  const ringValue = book ? (progressRingValue(book, progress) ?? 0) : 0
  const chIdx = book ? Math.min(book.chapters.length - 1, progress?.chapter ?? 0) : 0
  const chapter = book?.chapters[chIdx]
  const label = book
    ? book.kind === 'chapter' && chapter?.title
      ? `Chapter ${chIdx + 1} · ${chapter.title}`
      : 'Keep going'
    : "Today's adventure"

  return (
    <section
      aria-label={book ? 'Continue reading' : "Today's adventure"}
      style={{
        background: 'var(--paper-bright, #F9F2E3)',
        border: '2.5px solid var(--pigment-terracotta, #D95B43)',
        borderRadius: 18,
        padding: 14,
        display: 'flex',
        gap: 14,
        alignItems: 'center',
        boxShadow:
          '0 0 0 4px color-mix(in oklab, var(--pigment-terracotta) 18%, transparent)',
      }}
    >
      <WashScene
        wash={wash}
        img={target.coverImage}
        emojis={target.coverEmoji ? [target.coverEmoji] : []}
        doodle={!target.coverImage}
        style={{
          width: 118,
          height: 96,
          borderRadius: 12,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            font: '700 11px var(--font-body)',
            color: 'var(--ink-faint, #97836B)',
            textTransform: 'uppercase',
            letterSpacing: '.08em',
          }}
        >
          {book ? 'Keep going' : "Today's adventure"}
        </div>
        <h2
          style={{
            margin: '2px 0 4px',
            font: '700 18px/1.15 var(--font-display, serif)',
            color: 'var(--ink, #46362A)',
          }}
        >
          {target.title}
        </h2>
        <p
          style={{
            margin: 0,
            font: '600 13px var(--font-body, serif)',
            color: 'var(--ink-soft, #6E5B49)',
          }}
        >
          {book ? label : nudge}
        </p>
      </div>
      <Link
        href={`/read/story/${target.id}`}
        aria-label={book ? 'Continue the story' : `Start ${target.title}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          textDecoration: 'none',
        }}
      >
        <div style={{ position: 'relative', width: 56, height: 56 }}>
          {book && <ProgressRing value={ringValue} size={56} stroke={5} />}
          <span
            className="lf-press"
            style={{
              position: 'absolute',
              inset: book ? 6 : 0,
              borderRadius: '50%',
              background: 'var(--pigment-terracotta, #D95B43)',
              color: '#fff',
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingLeft: 3,
            }}
          >
            ▶
          </span>
        </div>
        <span
          style={{
            font: '700 11px var(--font-body)',
            color: 'var(--ink-soft, #6E5B49)',
          }}
        >
          {book ? 'Read!' : 'Start!'}
        </span>
      </Link>
    </section>
  )
}
