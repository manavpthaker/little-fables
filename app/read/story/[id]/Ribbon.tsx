'use client'

// v3 §A3 — the drawn ribbon scrubber above the transport.
//
// - Chapter progress with a tick per page.
// - Draggable, snaps to page.
// - Fat thumb, ≥56px hit zone.
// - While dragging: speak the page label ("page four").
// - Reduced-motion disables the thumb bounce but drag still works.
//
// Pointer events only (A1). Uses `setPointerCapture` so the finger keeps
// authority even if it slides off the ribbon.

import { useCallback, useEffect, useRef, useState } from 'react'
import { speak, type SpeakHandle } from '@/lib/read/speech'

export interface RibbonProps {
  /** Chapter title — displayed as a quiet ink label above the ribbon. */
  chapter?: string
  /** Current page index (0-based). */
  pageIdx: number
  /** Total pages in the chapter. */
  totalPages: number
  /** Called when a drag or tap finalizes on a specific page. */
  onSeek: (pageIdx: number) => void
  /** Optional wrapper class (small-screen reader overrides target this). */
  className?: string
  /** Multi-chapter books: makes the label a tappable "Chapter N of M · Title"
   *  pill that opens Contents — the visible doorway to chapter navigation
   *  (the folio dog-ear stays as a secondary entrance). */
  chapterNav?: { idx: number; count: number; onOpen: () => void }
}

export function Ribbon({ chapter, pageIdx, totalPages, onSeek, className, chapterNav }: RibbonProps) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const speakRef = useRef<SpeakHandle | null>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const on = () => setReduced(mq.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])

  useEffect(() => () => speakRef.current?.cancel(), [])

  const idxAtX = useCallback(
    (clientX: number): number => {
      const track = trackRef.current
      if (!track || totalPages <= 0) return 0
      const rect = track.getBoundingClientRect()
      const t = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      // Snap: divide into `totalPages` equal buckets.
      const i = Math.min(totalPages - 1, Math.floor(t * totalPages + 1e-6))
      return i
    },
    [totalPages],
  )

  const announce = useCallback((n: number) => {
    // Announce the page label — "page four".
    speakRef.current?.cancel()
    const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
    const label = n < words.length ? words[n] : String(n)
    speakRef.current = speak(`page ${label}`, { allowSpeechSynthFallback: true })
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (totalPages <= 1) return
      const el = e.currentTarget
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        /* ignore — some environments don't support capture on divs */
      }
      const i = idxAtX(e.clientX)
      setDragIdx(i)
      if (i !== pageIdx) announce(i + 1)
    },
    [idxAtX, pageIdx, totalPages, announce],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (dragIdx == null) return
      const i = idxAtX(e.clientX)
      if (i !== dragIdx) {
        setDragIdx(i)
        announce(i + 1)
      }
    },
    [dragIdx, idxAtX, announce],
  )

  const finalize = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (dragIdx == null) return
      const el = e.currentTarget
      try {
        el.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      const final = dragIdx
      setDragIdx(null)
      if (final !== pageIdx) onSeek(final)
    },
    [dragIdx, pageIdx, onSeek],
  )

  const visIdx = dragIdx ?? pageIdx
  const pct = totalPages > 1 ? (visIdx / (totalPages - 1)) * 100 : 0

  return (
    <div className={className} style={{ padding: '0 32px 6px', flexShrink: 0 }}>
      <div
        className="lf-reader-ribbon-label"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          font: 'italic 600 13px var(--font-body)',
          color: 'var(--lf-espresso-faint)',
          marginBottom: 6,
          userSelect: 'none',
        }}
      >
        {chapterNav ? (
          <button
            type="button"
            aria-label={`Chapters — chapter ${chapterNav.idx + 1} of ${chapterNav.count}. Open the chapter list`}
            onPointerUp={(e) => {
              e.preventDefault()
              e.stopPropagation()
              chapterNav.onOpen()
            }}
            className="lf-press"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              minHeight: 40,
              padding: '4px 14px 4px 10px',
              borderRadius: 999,
              border: '1.5px solid var(--lf-cream-line)',
              background: 'var(--lf-cream-card)',
              color: 'var(--lf-espresso-soft)',
              cursor: 'pointer',
              touchAction: 'manipulation',
              font: '600 13px var(--font-body)',
              maxWidth: '72%',
              minWidth: 0,
            }}
          >
            {/* chapter-list glyph */}
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style={{ flexShrink: 0 }}>
              <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none">
                <path d="M2.5 3.5 h11" />
                <path d="M2.5 8 h11" />
                <path d="M2.5 12.5 h11" />
              </g>
            </svg>
            <span style={{ color: 'var(--lf-coral, #D2603A)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Chapter {chapterNav.idx + 1} of {chapterNav.count}
            </span>
            {chapter && (
              <span
                style={{
                  fontStyle: 'italic',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}
              >
                {chapter}
              </span>
            )}
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style={{ flexShrink: 0 }}>
              <path d="M2 4.5 L6 8.5 L10 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <span>{chapter ?? ' '}</span>
        )}
        <span style={{ flexShrink: 0 }}>
          page {visIdx + 1} of {totalPages}
        </span>
      </div>
      <div
        ref={trackRef}
        className="lf-reader-ribbon-track"
        role="slider"
        aria-label="Chapter scrubber"
        aria-valuemin={1}
        aria-valuemax={Math.max(1, totalPages)}
        aria-valuenow={visIdx + 1}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finalize}
        onPointerCancel={finalize}
        style={{
          position: 'relative',
          height: 56, // ≥56px hit zone per spec.
          display: 'flex',
          alignItems: 'center',
          cursor: totalPages > 1 ? 'pointer' : 'default',
          touchAction: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
      >
        {/* The ribbon (drawn ink line + terracotta filled portion). */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'var(--lf-cream-line)',
            borderRadius: 3,
            filter: 'url(#lf-wobble)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: `${pct}%`,
            height: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'var(--lf-coral)',
            borderRadius: 3,
            filter: 'url(#lf-wobble)',
            transition: dragIdx == null ? 'width 200ms var(--ease-out, ease-out)' : 'none',
          }}
        />
        {/* Ticks — one per page. */}
        {Array.from({ length: totalPages }).map((_, i) => {
          const tickPct = totalPages > 1 ? (i / (totalPages - 1)) * 100 : 50
          const done = i <= visIdx
          return (
            <span
              key={i}
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: `${tickPct}%`,
                top: '50%',
                width: 4,
                height: 10,
                marginLeft: -2,
                marginTop: -5,
                borderRadius: 1,
                background: done ? 'var(--lf-coral-deep)' : 'var(--lf-espresso-faint)',
                opacity: done ? 0.85 : 0.55,
              }}
            />
          )
        })}
        {/* Thumb — drawn dog-tag; ≥56px hit is the whole track, this is the visual. */}
        <div
          aria-hidden="true"
          className={reduced || dragIdx != null ? undefined : 'lf-breathe-slow'}
          style={{
            position: 'absolute',
            left: `${pct}%`,
            top: '50%',
            width: 34,
            height: 34,
            marginLeft: -17,
            marginTop: -17,
            borderRadius: '50% 48% 52% 50%',
            background: 'var(--lf-cream-card)',
            border: '2px solid var(--lf-coral)',
            boxShadow: '0 4px 10px rgba(94,62,26,.14)',
            display: 'grid',
            placeItems: 'center',
            transition: dragIdx == null ? 'left 200ms var(--ease-out, ease-out)' : 'none',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--lf-coral)',
            }}
          />
        </div>
      </div>
    </div>
  )
}
