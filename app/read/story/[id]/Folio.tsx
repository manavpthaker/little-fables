'use client'

// v3 §A3 — the drawn folio dog-ear (top-right).
// Tap → opens the Contents spread. Position: fixed top-right, ≥56px tap target.

import type { CSSProperties } from 'react'

export interface FolioProps {
  pageIdx: number
  totalPages: number
  onOpen: () => void
  style?: CSSProperties
}

export function Folio({ pageIdx, totalPages, onOpen, style }: FolioProps) {
  return (
    <button
      type="button"
      aria-label={`Contents — page ${pageIdx + 1} of ${totalPages}`}
      onPointerUp={(e) => {
        e.preventDefault()
        onOpen()
      }}
      className="lf-press"
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        width: 68,
        height: 60,
        padding: 0,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        touchAction: 'manipulation',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        zIndex: 6,
        ...style,
      }}
    >
      <svg width="68" height="60" viewBox="0 0 68 60" aria-hidden="true">
        {/* Dog-ear paper triangle */}
        <path
          d="M6 6 L62 6 L62 46 Q 40 40 22 54 Q 12 40 6 6 Z"
          fill="var(--lf-cream-card)"
          stroke="var(--lf-cream-line)"
          strokeWidth="1.5"
          filter="url(#lf-wobble)"
        />
        {/* Curled corner shading */}
        <path
          d="M62 46 Q 46 44 34 54 L 62 54 Z"
          fill="var(--lf-cream-line)"
          opacity="0.7"
          filter="url(#lf-wash-edge)"
        />
      </svg>
      <span
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-58%, -60%)',
          font: 'italic 700 13px var(--font-body)',
          color: 'var(--lf-espresso-soft)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        {pageIdx + 1} of {totalPages}
      </span>
    </button>
  )
}
