'use client'

// v3 §A3 + v3.1 P1-8 — the Contents spread.
//
// Reached from the folio dog-ear or as the "up one level" target from the
// reader page. Full-screen drawn overlay on top of the reader:
//
//   - `.lf-room` `data-register="story"` overlay (warm cream, not v2 white).
//   - Drawn shelf of chapters, one row per chapter, using a face-out spine
//     treatment via `BookCoverArt` (the same helper Home uses).
//   - ✓ / current (coral outline) / closed states drawn — no emoji.
//   - Display font throughout (`--font-display`).
//   - Tap-out or drawn back arrow closes.

import { useEffect } from 'react'
import type { Book } from '@/types/story'
import { BookCoverArt } from '../../art'

export interface ContentsProps {
  book: Book
  currentChapterIdx: number
  /** Page the child is on within the current chapter (0-based) — shown on the
   *  "You are here" row so a parent can see exactly where they are. */
  currentPageIdx?: number
  onPickChapter: (idx: number) => void
  onClose: () => void
}

const INK = 'var(--ink, #46362A)'
const INK_SOFT = 'var(--ink-soft, #6E5B49)'
const INK_FAINT = 'var(--ink-faint, #97836B)'
const CORAL = 'var(--pigment-terracotta, #D95B43)'

export function Contents({ book, currentChapterIdx, currentPageIdx, onPickChapter, onClose }: ContentsProps) {
  // Escape closes the overlay (assistive keyboards use it as back).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Contents — ${book.title}`}
      className="lf-room"
      data-register="story"
      onPointerUp={(e) => {
        // Tap-outside closes. Inner elements stopPropagation.
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        // Warm cream paper — never white.
        background: 'var(--paper, #F4EBD8)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header: drawn back arrow + book title in display font */}
      <header
        onPointerUp={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '22px 28px 12px',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          aria-label="Back to the page"
          onPointerUp={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="lf-press"
          style={{
            width: 56,
            height: 56,
            borderRadius: '50% 48% 52% 50%',
            border: `1.5px solid ${INK}`,
            background: 'var(--paper-bright, #F9F2E3)',
            color: INK,
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              font: 'italic 600 14px var(--font-body)',
              color: INK_FAINT,
              letterSpacing: '.04em',
            }}
          >
            Contents
          </div>
          <h2
            style={{
              margin: '2px 0 0',
              font: '700 26px var(--font-display, YoungSerif)',
              color: INK,
            }}
          >
            {book.title}
          </h2>
          <div
            style={{
              marginTop: 4,
              font: 'italic 600 14px var(--font-body)',
              color: INK_SOFT,
            }}
          >
            You’re in chapter {currentChapterIdx + 1} of {book.chapters.length} — tap any chapter to go there
          </div>
        </div>
      </header>

      {/* The shelf — chapters as face-out drawn covers */}
      <div
        onPointerUp={(e) => e.stopPropagation()}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '10px 28px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {book.chapters.map((ch, i) => {
          const painting = ch.status === 'painting' || !ch.pages || ch.pages.length === 0
          const done = !painting && i < currentChapterIdx
          const current = !painting && i === currentChapterIdx
          const future = !painting && i > currentChapterIdx
          const tappable = !painting

          // Build a mini "cover book" for BookCoverArt from the chapter.
          // The chapter's wash + first emoji drive the drawn treatment.
          const coverBook = {
            id: `${book.id}-ch${i}`,
            title: ch.title || `Chapter ${i + 1}`,
            wash: ch.wash ?? book.wash,
            coverEmoji: ch.emojis?.[0],
            emojis: ch.emojis,
          }

          return (
            <button
              key={i}
              type="button"
              disabled={!tappable}
              onPointerUp={(e) => {
                e.stopPropagation()
                if (!tappable) return
                onPickChapter(i)
              }}
              className="lf-press"
              aria-label={`Chapter ${i + 1}: ${ch.title || 'chapter'}${
                current ? ' — current' : done ? ' — read' : future ? ' — coming up' : ''
              }`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                padding: 12,
                borderRadius: 18,
                // Coral outline for current, warm ink outline for the rest.
                // No white cards.
                border: current ? `2.5px solid ${CORAL}` : `1.5px solid ${INK}`,
                background: current
                  ? 'color-mix(in oklab, var(--pigment-terracotta) 12%, var(--paper-bright))'
                  : 'var(--paper-bright, #F9F2E3)',
                cursor: tappable ? 'pointer' : 'default',
                textAlign: 'left',
                opacity: tappable ? 1 : 0.55,
                filter: 'drop-shadow(0 4px 8px rgba(94,62,26,.08))',
                touchAction: 'manipulation',
                WebkitUserSelect: 'none',
                userSelect: 'none',
              }}
            >
              {/* Drawn cover thumbnail — face-out spine + wash + motif */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {future ? (
                  // Closed-book state — a drawn closed cover, no emoji.
                  <ClosedCoverArt width={70} height={94} />
                ) : (
                  <BookCoverArt book={coverBook} width={70} height={94} />
                )}
                {done && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'var(--pigment-meadow, #A8B59A)',
                      border: `2px solid var(--paper-bright, #F9F2E3)`,
                      display: 'grid',
                      placeItems: 'center',
                      font: '700 14px var(--font-display, YoungSerif)',
                      color: INK,
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>

              {/* Row body */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    font: 'italic 600 13px var(--font-body)',
                    color: INK_FAINT,
                    marginBottom: 2,
                  }}
                >
                  Chapter {i + 1}
                  {ch.pages?.length ? ` · ${ch.pages.length} pages` : ''}
                </div>
                <div
                  style={{
                    font: `700 ${current ? 21 : 18}px var(--font-display, YoungSerif)`,
                    color: INK,
                    lineHeight: 1.25,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {ch.title || `Chapter ${i + 1}`}
                </div>
                {current && (
                  <div
                    style={{
                      font: '700 13.5px var(--font-display, YoungSerif)',
                      color: CORAL,
                      marginTop: 2,
                    }}
                  >
                    You are here
                    {typeof currentPageIdx === 'number' && ch.pages?.length
                      ? ` — page ${Math.min(currentPageIdx, ch.pages.length - 1) + 1} of ${ch.pages.length}`
                      : '!'}
                  </div>
                )}
                {done && !current && (
                  <div
                    style={{
                      font: 'italic 600 12.5px var(--font-body)',
                      color: INK_SOFT,
                      marginTop: 2,
                    }}
                  >
                    Re-read anytime
                  </div>
                )}
                {future && (
                  <div
                    style={{
                      font: 'italic 600 12.5px var(--font-body)',
                      color: INK_FAINT,
                      marginTop: 2,
                    }}
                  >
                    Coming up
                  </div>
                )}
                {painting && (
                  <div
                    style={{
                      font: 'italic 600 12.5px var(--font-body)',
                      color: INK_FAINT,
                      marginTop: 2,
                    }}
                  >
                    Still painting…
                  </div>
                )}
              </div>

              {/* Trailing drawn chevron */}
              {tappable && (
                <span
                  aria-hidden="true"
                  style={{
                    color: INK_SOFT,
                    font: '700 24px var(--font-display, YoungSerif)',
                    paddingRight: 6,
                  }}
                >
                  ›
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** A closed-book cover for future chapters — no emoji, quiet warm-paper spine.
 *  Drawn in the same hand as BookCoverArt so the shelf reads consistently. */
function ClosedCoverArt({ width = 70, height = 94 }: { width?: number; height?: number }) {
  return (
    <svg
      viewBox="0 0 96 128"
      width={width}
      height={height}
      role="img"
      aria-label="closed chapter"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <ellipse
        cx="48"
        cy="124"
        rx="42"
        ry="4"
        fill="var(--ink, #46362A)"
        opacity="0.12"
        filter="url(#lf-wash-edge)"
      />
      {/* spine */}
      <path
        d="M6 10 L14 8 L14 118 L6 120 Z"
        fill="rgba(94,62,26,.18)"
        filter="url(#lf-wash-edge)"
      />
      {/* front paper — muted honey */}
      <rect
        x="14"
        y="8"
        width="76"
        height="112"
        rx="3"
        fill="var(--paper-deep, #EADCC0)"
        filter="url(#lf-wash-edge)"
      />
      {/* subtle top rule */}
      <path
        d="M22 22 L82 22"
        stroke="var(--ink, #46362A)"
        strokeWidth="1.2"
        opacity="0.4"
        fill="none"
        filter="url(#lf-wobble)"
      />
      {/* an ink dot in the middle, like a bookmark */}
      <circle
        cx="52"
        cy="64"
        r="4"
        fill="var(--ink, #46362A)"
        opacity="0.35"
        filter="url(#lf-wobble)"
      />
      {/* ink frame */}
      <g fill="none" stroke="var(--ink, #46362A)" filter="url(#lf-wobble)">
        <rect x="14" y="8" width="76" height="112" rx="3" strokeWidth="2" opacity="0.85" />
        <path d="M6 10 L14 8 L14 118 L6 120 Z" strokeWidth="1.5" opacity="0.7" />
      </g>
    </svg>
  )
}
