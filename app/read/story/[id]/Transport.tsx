'use client'

// v3 Drawn Room reader transport — §A3 verbatim.
// `◀ prev page | ▶/⏸ play–pause | next page ▶`
//
// Three controls, standard symbols, fixed positions, fixed meanings:
//   - Play (terracotta, ≥72px) → narrates the current page; never navigates.
//   - Prev / Next (quiet ink chevrons, ≥56px) → page turns; never play.
//   - Ordering + spacing are drawn-consistent across every book/mode.
//
// Pointer events only (A1). Pressed feedback via `.lf-press` (token layer).

import type { CSSProperties } from 'react'

export interface TransportProps {
  playing: boolean
  onPlayToggle: () => void
  onPrev: () => void
  onNext: () => void
  canPrev: boolean
  canNext: boolean
  /** Optional wrapper class (small-screen reader overrides target this). */
  className?: string
}

export function Transport({ playing, onPlayToggle, onPrev, onNext, canPrev, canNext, className }: TransportProps) {
  return (
    <div
      role="group"
      aria-label="Reader controls"
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        padding: '10px 0 22px',
        flexShrink: 0,
      }}
    >
      <ChevronBtn dir="prev" onPress={onPrev} disabled={!canPrev} />
      <PlayBtn playing={playing} onPress={onPlayToggle} />
      <ChevronBtn dir="next" onPress={onNext} disabled={!canNext} />
    </div>
  )
}

function PlayBtn({ playing, onPress }: { playing: boolean; onPress: () => void }) {
  // Terracotta, largest, drawn. 78px hit target (≥72px per spec).
  const size = 78
  return (
    <button
      type="button"
      aria-label={playing ? 'Pause narration' : 'Play narration'}
      aria-pressed={playing}
      onPointerUp={(e) => {
        // Pointer-only handler (A1). onClick would double-fire on touch+mouse.
        e.preventDefault()
        onPress()
      }}
      className="lf-press"
      style={{
        width: size,
        height: size,
        borderRadius: '50% 48% 52% 50%',
        border: 'none',
        cursor: 'pointer',
        background: 'var(--lf-coral)',
        color: '#FBF4E6',
        boxShadow: 'var(--shadow-coral-glow, 0 0 32px rgba(244,129,60,.5)), 0 6px 22px rgba(94,62,26,.22)',
        display: 'grid',
        placeItems: 'center',
        touchAction: 'manipulation',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {playing ? <PauseGlyph /> : <PlayGlyph />}
    </button>
  )
}

function ChevronBtn({ dir, onPress, disabled }: { dir: 'prev' | 'next'; onPress: () => void; disabled?: boolean }) {
  const flip = dir === 'prev'
  const size = 60
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50% 48% 52% 50%',
    border: '1.5px solid var(--lf-cream-line)',
    cursor: disabled ? 'default' : 'pointer',
    background: 'var(--lf-cream-card)',
    color: disabled ? 'var(--lf-espresso-faint)' : 'var(--lf-espresso)',
    display: 'grid',
    placeItems: 'center',
    opacity: disabled ? 0.5 : 1,
    touchAction: 'manipulation',
    WebkitUserSelect: 'none',
    userSelect: 'none',
    boxShadow: disabled ? 'none' : '0 4px 12px rgba(94,62,26,.10)',
  }
  return (
    <button
      type="button"
      aria-label={flip ? 'Previous page' : 'Next page'}
      onPointerUp={(e) => {
        if (disabled) return
        e.preventDefault()
        onPress()
      }}
      disabled={disabled}
      className="lf-press"
      style={style}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        aria-hidden="true"
        style={{ transform: flip ? 'scaleX(-1)' : undefined }}
      >
        <path
          d="M10 4 L22 14 L10 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#lf-wobble)"
        />
      </svg>
    </button>
  )
}

function PlayGlyph() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <path
        d="M10 6 L28 17 L10 28 Z"
        fill="currentColor"
        filter="url(#lf-wobble)"
      />
    </svg>
  )
}

function PauseGlyph() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <rect x="8" y="6" width="6.5" height="22" rx="1.5" fill="currentColor" filter="url(#lf-wobble)" />
      <rect x="19.5" y="6" width="6.5" height="22" rx="1.5" fill="currentColor" filter="url(#lf-wobble)" />
    </svg>
  )
}
