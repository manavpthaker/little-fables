'use client'

// A real book object for the shelf — cloth cover with a blind-stamped frame,
// spine hinge, page-block edge, and the title set ON the cover in cream serif
// (no floating white chip). When approved cover ART exists (art pipeline →
// book.coverImage) it fills the face with a small title band at the foot.
// Each book leans a hair differently (--tilt from the id) so the shelf feels
// hand-placed; hover straightens and lifts it.

import type { Book } from '@/types/story'
import { MotifSvg, motifFor, spineHexFor } from './bookArt'

function tiltFor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  const tilts = ['-0.9deg', '-0.35deg', '0.35deg', '0.9deg']
  return tilts[Math.abs(h >> 3) % tilts.length]
}

/** The cover face. */
export function HomeBookCover({ book, className }: { book: Book; className?: string }) {
  const art = book.coverImage
  return (
    <div
      className={`lfh-cover ${className ?? ''}`}
      style={{ ['--spine' as string]: spineHexFor(book), ['--tilt' as string]: tiltFor(book.id) }}
    >
      {art ? (
        <>
          <img className="lfh-cover-art" src={art} alt="" loading="lazy" />
          <span className="lfh-cover-band">
            <span>{book.title}</span>
          </span>
        </>
      ) : (
        <>
          <span className="lfh-frame" aria-hidden="true" />
          <svg className="lfh-motif" viewBox="0 0 40 40" aria-hidden="true">
            <MotifSvg kind={motifFor(book.id)} />
          </svg>
          <span className="lfh-cover-title">{book.title}</span>
          {book.by && <span className="lfh-cover-by">{book.by}</span>}
        </>
      )}
      <span className="lfh-pages" aria-hidden="true" />
    </div>
  )
}
