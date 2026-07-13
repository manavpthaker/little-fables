'use client'

// Clean, legible book cover for the v4 home shelf. A colored spine + a simple
// white motif + a cream title panel — a real, distinct book, not a washed-out
// placeholder. Art logic is shared with the reader scene (see bookArt).

import type { Book } from '@/types/story'
import { MotifSvg, motifFor, spineHexFor } from './bookArt'

/** The cover face (colored front + motif + title panel). */
export function HomeBookCover({ book, className }: { book: Book; className?: string }) {
  return (
    <div
      className={`lfh-cover ${className ?? ''}`}
      style={{ ['--spine' as string]: spineHexFor(book) }}
    >
      <svg className="lfh-motif" viewBox="0 0 40 40" aria-hidden="true">
        <MotifSvg kind={motifFor(book.id)} />
      </svg>
      <div className="lfh-panel">
        <span>{book.title}</span>
      </div>
    </div>
  )
}
