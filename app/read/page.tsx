'use client'

// Little Fables — Home (v2).
// The buddy is the interface. Home is a buddy header with a spoken speech-bubble
// line + weekly sun row + Continue card (if any book has progress) + My World
// strip (badges, star words) + shelf split into Chapter books / Quick stories.
//
// See design/handoff-v2/app/screens-a.jsx `Home` for the visual reference and
// docs/PRD § "Home v2". Portrait variant reuses PortraitHome layout at narrow
// widths — implemented as CSS media queries here rather than two components.

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useSwApp } from './SwApp'
import { speak } from '@/lib/read/speech'
import {
  BuddyFace,
  ChapterDots,
  Confetti,
  Doodles,
  KidScreen,
  MatCover,
  Medallion,
  OfflineBanner,
  PillNav,
  ProgressRing,
  SpeechBubble,
  SunRow,
  WashScene,
} from './components'
import { BUDDIES, cp, getBuddy } from '@/lib/read/buddies'
import { BADGES } from '@/lib/read/badges'
import { loadShelf } from '@/lib/read/packs'
import {
  currentWeekSuns,
  loadBadges,
  loadBuddy,
  loadProgress,
  loadWordBook,
  loadWorldState,
} from '@/lib/read/storage'
import type { Book, BuddyDef } from '@/types/story'

type Suns = ReturnType<typeof currentWeekSuns>
type ProgressEntry = { chapter: number; page: number; updatedAt: number }

export default function Home() {
  const { online } = useSwApp()
  const router = useRouter()

  // First-run gate: while we don't yet know whether a buddy has been picked,
  // don't render anything. On mount we check storage — if there's no active
  // buddy, redirect to the carousel BEFORE any Home content flashes.
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
  }, [router])

  // Split into chapter books vs quick stories. Books with kind='chapter' (or
  // more than one non-empty chapter) go left; quick stories go right.
  const { chapterBooks, quickStories, continueBook, todaysPick } = useMemo(() => {
    const chapters: Book[] = []
    const quicks: Book[] = []
    for (const b of shelf) {
      const isChapter =
        b.kind === 'chapter' || (b.chapters.length > 1 && b.chapters.some((c) => c.title))
      if (isChapter) chapters.push(b)
      else quicks.push(b)
    }
    // Continue: pick the most recently touched book with mid-flight progress
    // (progress but not on the last chapter).
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

    // Deterministic daily pick for the "Today's adventure" card when nothing
    // is mid-flight. Buckets:
    //   (a) unfinished (progress > 0 but not on last chapter) — same as
    //       "continue" pool; already handled above.
    //   (b) unread (no progress at all).
    //   (c) least-recently-read (completed/on last chapter, oldest touched).
    // Tie-break by book id. The date seeds the bucket ordering so it's stable
    // for the whole day but rotates from day to day.
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
        // Simple deterministic rotation seeded by the date string.
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

  // Speech line derivation. Real callback (only if the child has actually made
  // a choice) wins. Otherwise: a first-run-safe greeting derived from the
  // buddy's `greet` line, extended with an action nudge — mention the current
  // book title if one is mid-flight.
  const speechLine = useMemo(() => {
    if (callback && choiceLogLen > 0) return callback
    const greet = cp(buddy.greet, energy)
    if (continueBook) return `${greet} Let's keep reading ${continueBook.title}!`
    if (shelf.length > 0) return `${greet} Pick a story from your shelf!`
    return greet
  }, [buddy, energy, callback, choiceLogLen, continueBook, shelf.length])

  const nudge = 'Read one chapter and find a new star word.'

  const handleBuddyTap = () => {
    // Fire-and-forget speech; navigate immediately.
    try {
      speak('Want to pick a different buddy?')
    } catch {
      /* ignore */
    }
  }

  if (!ready) return null

  return (
    <KidScreen label="Home" style={{ paddingBottom: 110 }}>
      <Doodles />
      {!online && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
          <OfflineBanner />
        </div>
      )}

      <style>{`
        .lf-home-wrap { position: relative; max-width: 1200px; margin: 0 auto; padding: 24px 32px; }
        .lf-home-header {
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
        }
        .lf-home-header .suns { margin-left: auto; text-align: right; }
        .lf-home-grid {
          display: grid; grid-template-columns: 1fr; gap: 18px; margin-top: 22px;
        }
        @media (min-width: 900px) {
          .lf-home-grid { grid-template-columns: 1fr 320px; }
          .lf-home-shelf { grid-column: 1 / -1; }
        }
        .lf-shelf-columns {
          display: grid; grid-template-columns: 1fr; gap: 24px;
        }
        @media (min-width: 900px) {
          .lf-shelf-columns { grid-template-columns: 1fr 1fr; gap: 32px; }
        }
      `}</style>

      <div className="lf-home-wrap">
        {/* (a) Buddy header */}
        <header className="lf-home-header">
          <Link
            href="/read/buddy"
            aria-label="Want to pick a different buddy?"
            onClick={handleBuddyTap}
            className="lf-press"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              borderRadius: '50%',
              cursor: 'pointer',
              minWidth: 56,
              minHeight: 56,
            }}
          >
            <BuddyFace buddy={buddy} size={92} />
          </Link>
          <SpeechBubble style={{ font: '700 17px/1.45 var(--font-body)' }}>{speechLine}</SpeechBubble>
          <div className="suns">
            <div style={{ font: '700 13px var(--font-body)', color: 'var(--lf-espresso-soft)', marginBottom: 6 }}>
              My reading suns
            </div>
            <SunRow suns={suns} />
          </div>
        </header>

        <div className="lf-home-grid">
          {/* (b) Continue or Today's adventure */}
          <ContinueCard
            book={continueBook}
            todaysPick={todaysPick}
            progress={continueBook ? progressMap[continueBook.id] : undefined}
            nudge={nudge}
          />

          {/* (c) My World strip */}
          <section aria-label="My world" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link
              href="/read/badges"
              className="lf-press"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                textDecoration: 'none',
                background: 'var(--lf-cream-card)',
                border: '1.5px solid var(--lf-cream-line)',
                borderRadius: 'var(--radius-card)',
                padding: '8px 14px 8px 8px',
                boxShadow: 'var(--shadow-warm)',
                minHeight: 56,
              }}
            >
              <span
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  background: 'var(--lf-pastel-lilac)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Medallion badge={BADGES[0]} size={40} />
              </span>
              <span style={{ font: '700 15px var(--font-display)', color: 'var(--lf-espresso)' }}>
                My badges{' '}
                <span style={{ font: '600 13px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>· {badgeCount}</span>
              </span>
              <span aria-hidden="true" style={{ marginLeft: 'auto', color: 'var(--lf-espresso-faint)', fontSize: 18 }}>
                ›
              </span>
            </Link>
            <Link
              href="/read/words"
              className="lf-press"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                textDecoration: 'none',
                background: 'var(--lf-cream-card)',
                border: '1.5px solid var(--lf-cream-line)',
                borderRadius: 'var(--radius-card)',
                padding: '8px 14px 8px 8px',
                boxShadow: 'var(--shadow-warm)',
                minHeight: 56,
              }}
            >
              <span
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  background: 'var(--lf-pastel-mint)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: 26,
                  filter: 'var(--shadow-emoji)',
                }}
                aria-hidden="true"
              >
                ⭐
              </span>
              <span style={{ font: '700 15px var(--font-display)', color: 'var(--lf-espresso)' }}>
                My words{' '}
                <span style={{ font: '600 13px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>· {wordCount}</span>
              </span>
              <span aria-hidden="true" style={{ marginLeft: 'auto', color: 'var(--lf-espresso-faint)', fontSize: 18 }}>
                ›
              </span>
            </Link>
          </section>

          {/* (d) Bookshelf — split */}
          <section className="lf-home-shelf" aria-label="Bookshelf">
            {shelf.length === 0 ? (
              <div
                style={{
                  padding: 32,
                  textAlign: 'center',
                  border: '1.5px dashed var(--lf-cream-line)',
                  borderRadius: 'var(--radius-card)',
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 54, filter: 'var(--shadow-emoji)' }}>
                  📚
                </span>
                <p style={{ margin: '8px 0 0', font: '700 17px var(--font-display)' }}>Your shelf is warming up</p>
                <p style={{ margin: '4px 0 0', font: '600 14px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
                  New stories appear here when Mom and Dad finish making them ✦
                </p>
              </div>
            ) : (
              <div className="lf-shelf-columns">
                <div>
                  <h3 style={{ margin: '0 0 10px', font: 'var(--text-section)' }}>Chapter books</h3>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {chapterBooks.length === 0 && (
                      <p style={{ font: 'var(--text-meta)', color: 'var(--lf-espresso-faint)' }}>
                        No chapter books yet.
                      </p>
                    )}
                    {chapterBooks.map((b) => (
                      <MatCover
                        key={b.id}
                        story={b}
                        ring={progressRingValue(b, progressMap[b.id])}
                        onClick={() => router.push(`/read/story/${b.id}`)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 10px', font: 'var(--text-section)' }}>Quick stories</h3>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {quickStories.length === 0 && (
                      <p style={{ font: 'var(--text-meta)', color: 'var(--lf-espresso-faint)' }}>
                        No quick stories yet.
                      </p>
                    )}
                    {quickStories.map((b) => (
                      <MatCover key={b.id} story={b} onClick={() => router.push(`/read/story/${b.id}`)} />
                    ))}
                  </div>
                </div>
                <p
                  style={{
                    gridColumn: '1 / -1',
                    margin: 0,
                    font: '600 13.5px var(--font-body)',
                    color: 'var(--lf-espresso-faint)',
                  }}
                >
                  New stories appear here when Mom and Dad finish making them ✦
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      <PillNav active="home" />
    </KidScreen>
  )
}

function progressRingValue(book: Book, prog: { chapter: number; page: number } | undefined): number | undefined {
  if (!prog) return undefined
  const totalChapters = Math.max(1, book.chapters.length)
  return Math.min(1, prog.chapter / totalChapters)
}

// Wrap MatCover so it navigates to /read/story/<id>. MatCover accepts an
// onClick — this thin wrapper is where the routing decision lives.
function _NavCover(_props: unknown) { return null } // (kept for potential extraction)

function ContinueCard({
  book,
  todaysPick,
  progress,
  nudge,
}: {
  book: Book | undefined
  todaysPick?: Book | undefined
  progress: { chapter: number; page: number } | undefined
  nudge: string
}) {
  if (!book) {
    // "Today's adventure" — render the deterministic daily pick with real
    // cover art + coral ▶ CTA. Falls back to a plain hint if the shelf is
    // completely empty.
    if (!todaysPick) {
      return (
        <section
          aria-label="Today's adventure"
          style={{
            background: 'var(--lf-cream-card)',
            border: '1.5px solid var(--lf-cream-line)',
            borderRadius: 'var(--radius-card)',
            padding: 18,
            display: 'flex',
            gap: 20,
            alignItems: 'center',
            boxShadow: 'var(--shadow-warm)',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                font: '700 12px var(--font-body)',
                color: 'var(--lf-espresso-faint)',
                textTransform: 'uppercase',
                letterSpacing: '.08em',
              }}
            >
              Today&rsquo;s adventure
            </div>
            <h2 style={{ margin: '4px 0 6px', font: '700 22px/1.15 var(--font-display)' }}>
              Your shelf is warming up
            </h2>
            <p style={{ margin: 0, font: '600 14px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>{nudge}</p>
          </div>
        </section>
      )
    }
    const wash = todaysPick.chapters[0]?.wash ?? todaysPick.wash ?? 'honey'
    return (
      <section
        aria-label="Today's adventure"
        style={{
          background: 'var(--lf-cream-card)',
          border: '1.5px solid var(--lf-cream-line)',
          borderRadius: 'var(--radius-card)',
          padding: 18,
          display: 'flex',
          gap: 20,
          alignItems: 'center',
          boxShadow: 'var(--shadow-warm)',
        }}
      >
        <WashScene
          wash={wash}
          img={todaysPick.coverImage}
          emojis={todaysPick.coverEmoji ? [todaysPick.coverEmoji] : []}
          doodle={!todaysPick.coverImage}
          style={{ width: 160, height: 130, borderRadius: 'var(--radius-cover)', flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              font: '700 12px var(--font-body)',
              color: 'var(--lf-espresso-faint)',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
            }}
          >
            Today&rsquo;s adventure
          </div>
          <h2 style={{ margin: '4px 0 6px', font: '700 22px/1.15 var(--font-display)' }}>{todaysPick.title}</h2>
          <p style={{ margin: 0, font: '600 14px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>{nudge}</p>
        </div>
        <Link
          href={`/read/story/${todaysPick.id}`}
          aria-label={`Start ${todaysPick.title}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
          }}
        >
          <span
            className="lf-press"
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--lf-coral)',
              color: '#fff',
              fontSize: 21,
              boxShadow: 'var(--shadow-coral-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingLeft: 3,
            }}
          >
            ▶
          </span>
          <span style={{ font: '700 12.5px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>Start!</span>
        </Link>
      </section>
    )
  }

  const chIdx = Math.min(book.chapters.length - 1, progress?.chapter ?? 0)
  const chapter = book.chapters[chIdx]
  const ringValue = progressRingValue(book, progress) ?? 0
  const label = book.kind === 'chapter' && chapter?.title ? `Chapter ${chIdx + 1} · ${chapter.title}` : 'Keep going'
  const wash = chapter?.wash ?? book.wash ?? 'honey'

  return (
    <section
      aria-label="Continue reading"
      style={{
        background: 'var(--lf-cream-card)',
        border: '1.5px solid var(--lf-cream-line)',
        borderRadius: 'var(--radius-card)',
        padding: 18,
        display: 'flex',
        gap: 20,
        alignItems: 'center',
        boxShadow: 'var(--shadow-warm)',
      }}
    >
      <WashScene
        wash={wash}
        img={book.coverImage}
        emojis={book.coverEmoji ? [book.coverEmoji] : []}
        doodle={!book.coverImage}
        style={{ width: 160, height: 130, borderRadius: 'var(--radius-cover)', flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            font: '700 12px var(--font-body)',
            color: 'var(--lf-espresso-faint)',
            textTransform: 'uppercase',
            letterSpacing: '.08em',
          }}
        >
          Keep going
        </div>
        <h2 style={{ margin: '4px 0 6px', font: '700 22px/1.15 var(--font-display)' }}>{book.title}</h2>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            font: '600 14px var(--font-body)',
            color: 'var(--lf-espresso-soft)',
          }}
        >
          {book.chapters.length > 1 && (
            <ChapterDots
              chapters={book.chapters.map((c, i) => ({
                status: i < chIdx ? 'done' : i === chIdx ? 'current' : (c.status ?? undefined),
              }))}
            />
          )}
          {label}
        </div>
        <p style={{ margin: '10px 0 0', font: '600 14px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
          Read one chapter and find a new star word.
        </p>
      </div>
      <Link
        href={`/read/story/${book.id}`}
        aria-label="Continue the story"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textDecoration: 'none' }}
      >
        <div style={{ position: 'relative', width: 64, height: 64 }}>
          <ProgressRing value={ringValue} size={64} stroke={6} />
          <span
            className="lf-press"
            style={{
              position: 'absolute',
              inset: 7,
              borderRadius: '50%',
              background: 'var(--lf-coral)',
              color: '#fff',
              fontSize: 21,
              boxShadow: 'var(--shadow-coral-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ▶
          </span>
        </div>
        <span style={{ font: '700 12.5px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>Read!</span>
      </Link>
    </section>
  )
}

// Silence unused-var warning for the Confetti import (used from other v2 pages;
// we re-import via components to keep the tree-shake grouped).
void Confetti
