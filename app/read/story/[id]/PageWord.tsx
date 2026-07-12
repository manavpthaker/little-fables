'use client'

// v3 §A3 — words are the timeline.
//
// - Tap → narration seeks to that word and plays from there.
// - Press-and-hold (≥350ms) → speak that word alone (+ meaning if star word).
//   No seek, no state change to main narration highlight.
//
// Pointer events only per A1. `.lf-press` gives <100ms drawn press feedback.

import { useCallback, useRef } from 'react'

export interface PageWordProps {
  word: string
  wordIdx: number
  isStar: boolean
  isHighlighted: boolean
  meaning?: string
  onSeek: (wordIdx: number) => void
  onHold: (word: string, meaning?: string) => void
}

const HOLD_MS = 350
/** Movement threshold — beyond this, treat the pointer as a scroll/drag and cancel the interaction. */
const SLOP_PX = 12

export function PageWord({
  word,
  wordIdx,
  isStar,
  isHighlighted,
  meaning,
  onSeek,
  onHold,
}: PageWordProps) {
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heldRef = useRef(false)
  const originRef = useRef<{ x: number; y: number } | null>(null)
  const activePointerRef = useRef<number | null>(null)

  const clearTimer = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLSpanElement>) => {
      // Ignore secondary buttons — this is a touch/pen surface.
      if (e.button !== 0 && e.pointerType === 'mouse') return
      activePointerRef.current = e.pointerId
      heldRef.current = false
      originRef.current = { x: e.clientX, y: e.clientY }
      clearTimer()
      holdTimerRef.current = setTimeout(() => {
        heldRef.current = true
        onHold(word, meaning)
      }, HOLD_MS)
    },
    [word, meaning, onHold, clearTimer],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLSpanElement>) => {
      if (activePointerRef.current !== e.pointerId) return
      const origin = originRef.current
      if (!origin) return
      const dx = e.clientX - origin.x
      const dy = e.clientY - origin.y
      if (Math.hypot(dx, dy) > SLOP_PX) {
        // The child is scrolling / swiping — cancel this interaction cleanly.
        clearTimer()
        activePointerRef.current = null
        originRef.current = null
      }
    },
    [clearTimer],
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLSpanElement>) => {
      if (activePointerRef.current !== e.pointerId) return
      clearTimer()
      const wasHeld = heldRef.current
      activePointerRef.current = null
      originRef.current = null
      heldRef.current = false
      if (wasHeld) return // hold already fired — don't also seek.
      onSeek(wordIdx)
    },
    [wordIdx, clearTimer, onSeek],
  )

  const onPointerCancel = useCallback(() => {
    clearTimer()
    activePointerRef.current = null
    originRef.current = null
    heldRef.current = false
  }, [clearTimer])

  return (
    <span
      role="button"
      aria-label={isStar ? `star word — ${word}` : word}
      tabIndex={-1}
      className="lf-press"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={{
        display: 'inline',
        cursor: 'pointer',
        padding: '0 3px',
        borderRadius: 4,
        touchAction: 'manipulation',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        background: isHighlighted ? 'var(--glow-lamplight, rgba(242,196,96,.55))' : undefined,
        borderBottom: isHighlighted
          ? '3px solid var(--lf-coral)'
          : isStar
            ? '2.5px dotted rgba(251,191,36,.75)'
            : undefined,
        transition: 'background 140ms ease-out',
      }}
    >
      {word}
    </span>
  )
}
