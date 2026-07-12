'use client'

// v3 §A3 — the Contents spread. Reached from the folio dog-ear or as the "up
// one level" target from the reader page.
//
// - Full-screen overlay on the reader.
// - Drawn shelf-like list, one row per chapter, with scene thumbnails.
// - Read chapters ✓, current marked, future chapters show closed-book state.
//   (Painting copy is Phase 1 chapter-map's job — here future chapters are just
//    closed books.)
// - Back arrow (top-left) or tap-outside closes it.

import { useEffect } from 'react'
import type { Book } from '@/types/story'
import { WashScene } from '../../components'

export interface ContentsProps {
  book: Book
  currentChapterIdx: number
  onPickChapter: (idx: number) => void
  onClose: () => void
}

export function Contents({ book, currentChapterIdx, onPickChapter, onClose }: ContentsProps) {
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
      onPointerUp={(e) => {
        // Tap-outside closes. Inner elements stopPropagation.
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: 'var(--lf-cream)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header: back arrow + book title */}
      <header
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
            border: '1.5px solid var(--lf-cream-line)',
            background: 'var(--lf-cream-card)',
            color: 'var(--lf-espresso)',
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
          <div style={{ font: 'italic 600 14px var(--font-body)', color: 'var(--lf-espresso-faint)' }}>Contents</div>
          <h2 style={{ margin: '2px 0 0', font: '700 24px var(--font-display, YoungSerif)', color: 'var(--lf-espresso)' }}>
            {book.title}
          </h2>
        </div>
      </header>

      {/* Scrollable list */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '12px 28px 40px',
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
          const tappable = !painting // Any painted chapter is tappable per §A3 "re-read anytime".
          const thumb = ch.pages?.[0]?.img

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
              aria-label={`Chapter ${i + 1}: ${ch.title || 'chapter'}${current ? ' — current' : done ? ' — read' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                padding: 12,
                borderRadius: 18,
                border: current ? '2.5px solid var(--lf-coral)' : '1.5px solid var(--lf-cream-line)',
                background: current ? 'var(--lf-pastel-peach)' : 'var(--lf-cream-card)',
                cursor: tappable ? 'pointer' : 'default',
                textAlign: 'left',
                opacity: tappable ? 1 : 0.55,
                boxShadow: current
                  ? '0 6px 18px rgba(244,129,60,.22)'
                  : '0 4px 10px rgba(94,62,26,.08)',
                touchAction: 'manipulation',
                WebkitUserSelect: 'none',
                userSelect: 'none',
              }}
            >
              {/* Thumb */}
              <div
                style={{
                  position: 'relative',
                  width: 88,
                  height: 88,
                  flexShrink: 0,
                  borderRadius: 14,
                  overflow: 'hidden',
                  border: '1.5px solid var(--lf-cream-line)',
                  background: 'var(--lf-cream)',
                }}
              >
                {future ? (
                  // Closed-book state for a not-yet-read chapter.
                  <div
                    aria-hidden="true"
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 40,
                      opacity: 0.6,
                    }}
                  >
                    📕
                  </div>
                ) : thumb ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={thumb}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <WashScene
                    wash={ch.wash ?? book.wash ?? 'meadow'}
                    emojis={ch.emojis}
                    doodle={false}
                    style={{ width: '100%', height: '100%' }}
                  />
                )}
                {done && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'var(--lf-pastel-mint)',
                      border: '2px solid var(--lf-cream-card)',
                      display: 'grid',
                      placeItems: 'center',
                      font: '700 14px var(--font-body)',
                      color: 'var(--lf-espresso)',
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
                    color: 'var(--lf-espresso-faint)',
                    marginBottom: 2,
                  }}
                >
                  Chapter {i + 1}
                </div>
                <div
                  style={{
                    font: `700 ${current ? 19 : 17}px var(--font-display, YoungSerif)`,
                    color: 'var(--lf-espresso)',
                    lineHeight: 1.25,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {ch.title || `Chapter ${i + 1}`}
                </div>
                {current && (
                  <div style={{ font: '700 13.5px var(--font-body)', color: 'var(--lf-coral-deep)', marginTop: 2 }}>
                    You are here!
                  </div>
                )}
                {done && !current && (
                  <div style={{ font: '600 12.5px var(--font-body)', color: 'var(--lf-espresso-soft)', marginTop: 2 }}>
                    Re-read anytime
                  </div>
                )}
              </div>

              {/* Trailing chevron */}
              {tappable && (
                <span
                  aria-hidden="true"
                  style={{ color: 'var(--lf-espresso-soft)', fontSize: 22, paddingRight: 6 }}
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
