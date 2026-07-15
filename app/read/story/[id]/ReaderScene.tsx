'use client'

// The reader's page-art panel for pages that don't have a real illustration
// yet. Instead of an empty dotted placeholder, show an intentional colored
// scene keyed to the book — the same spine color + motif as its cover, so the
// page feels like part of the book. The art pipeline can replace this per page.
//
// `painting` — generate-while-reading is making this page's illustration right
// now: the panel gets a soft light sweep, pulsing pigment dots, and a quiet
// "painting this page…" label. The indicator fades in after a short delay so a
// fast answer (cached art / disabled) never flashes it.

import type { CSSProperties } from 'react'
import type { Book } from '@/types/story'
import { MotifSvg, motifFor, spineHexFor } from '../../home/bookArt'

export function ReaderScene({
  book,
  style,
  painting = false,
}: {
  book: Book
  style?: CSSProperties
  painting?: boolean
}) {
  return (
    <div
      className={`lf-reader-scene${painting ? ' lf-reader-scene--painting' : ''}`}
      aria-hidden="true"
      style={{ ['--spine' as string]: spineHexFor(book), ...style }}
    >
      <svg className="lf-reader-scene-motif" viewBox="0 0 40 40">
        <MotifSvg kind={motifFor(book.id)} />
      </svg>
      {painting && (
        <div className="lf-painting-indicator">
          <span className="lf-painting-dot" />
          <span className="lf-painting-dot" />
          <span className="lf-painting-dot" />
          <span className="lf-painting-label">painting this page…</span>
        </div>
      )}
    </div>
  )
}
