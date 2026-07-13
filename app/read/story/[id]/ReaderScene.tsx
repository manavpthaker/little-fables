'use client'

// The reader's page-art panel for pages that don't have a real illustration
// yet. Instead of an empty dotted placeholder, show an intentional colored
// scene keyed to the book — the same spine color + motif as its cover, so the
// page feels like part of the book. The art pipeline can replace this per page.

import type { CSSProperties } from 'react'
import type { Book } from '@/types/story'
import { MotifSvg, motifFor, spineHexFor } from '../../home/bookArt'

export function ReaderScene({ book, style }: { book: Book; style?: CSSProperties }) {
  return (
    <div
      className="lf-reader-scene"
      aria-hidden="true"
      style={{ ['--spine' as string]: spineHexFor(book), ...style }}
    >
      <svg className="lf-reader-scene-motif" viewBox="0 0 40 40">
        <MotifSvg kind={motifFor(book.id)} />
      </svg>
    </div>
  )
}
