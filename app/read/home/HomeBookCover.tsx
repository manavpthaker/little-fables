'use client'

// Clean, legible book cover for the v4 home shelf. A colored spine + a simple
// white motif + a cream title panel — a real, distinct book, not a washed-out
// placeholder. Deliberately independent of the old drawn BookCoverArt.

import type { Book } from '@/types/story'

type Spine =
  | 'forest' | 'denim' | 'plum' | 'teal' | 'mustard' | 'brick' | 'clay' | 'slate'
type Motif =
  | 'tree' | 'train' | 'bus' | 'bird' | 'circle' | 'moon' | 'lantern' | 'star' | 'bridge' | 'rocket' | 'book'

// Spread covers across the whole palette so the shelf reads as a colorful
// bookcase. A stable hash of the id gives each book a fixed, varied color
// (semantic meaning is carried by the motif, not the hue).
const PALETTE: Spine[] = ['mustard', 'denim', 'forest', 'brick', 'teal', 'plum', 'clay', 'slate']
function spineFor(book: { id: string }): Spine {
  let h = 0
  for (let i = 0; i < book.id.length; i++) h = (h * 31 + book.id.charCodeAt(i)) | 0
  return PALETTE[Math.abs(h) % PALETTE.length]
}

function motifFor(id: string): Motif {
  const s = id.toLowerCase()
  if (s.includes('bramble') || s.includes('lantern')) return 'lantern'
  if (s.includes('moose')) return 'tree'
  if (s.includes('midnight') || s.includes('train')) return 'train'
  if (s.includes('bus') || s.includes('detour') || s.includes('yellow')) return 'bus'
  if (s.includes('coocoo')) return 'bird'
  if (s.includes('cozy') || s.includes('circle')) return 'circle'
  if (s.includes('papa') || s.includes('moon')) return 'moon'
  if (s.includes('azi') || s.includes('bhen')) return 'star'
  if (s.includes('miko') || s.includes('bridge')) return 'bridge'
  if (s.includes('rocket') || s.includes('goal')) return 'rocket'
  if (s.includes('jujy') || s.includes('christmas')) return 'tree'
  return 'book'
}

const DARK = 'rgba(0,0,0,.22)'

function MotifSvg({ kind }: { kind: Motif }) {
  const c = 'currentColor'
  switch (kind) {
    case 'tree':
      return <path d="M20 4 L30 20 H10 Z M20 14 L32 32 H8 Z" fill={c} />
    case 'train':
      return (
        <>
          <rect x="7" y="13" width="26" height="15" rx="4" fill={c} />
          <rect x="11" y="16" width="7" height="6" rx="1.5" fill={DARK} />
          <rect x="22" y="16" width="7" height="6" rx="1.5" fill={DARK} />
          <circle cx="14" cy="31" r="3.2" fill={c} />
          <circle cx="26" cy="31" r="3.2" fill={c} />
        </>
      )
    case 'bus':
      return (
        <>
          <rect x="6" y="12" width="28" height="15" rx="5" fill={c} />
          <rect x="9" y="15" width="6" height="6" rx="1.5" fill={DARK} />
          <rect x="17" y="15" width="6" height="6" rx="1.5" fill={DARK} />
          <rect x="25" y="15" width="6" height="6" rx="1.5" fill={DARK} />
          <circle cx="13" cy="29" r="3" fill={c} />
          <circle cx="27" cy="29" r="3" fill={c} />
        </>
      )
    case 'bird':
      return (
        <>
          <path d="M20 6 C12 6 8 14 12 22 C15 28 25 28 28 22 C32 14 28 6 20 6 Z" fill={c} />
          <circle cx="24" cy="12" r="2.4" fill={DARK} />
        </>
      )
    case 'circle':
      return (
        <>
          <circle cx="20" cy="20" r="14" fill="none" stroke={c} strokeWidth="3" />
          <circle cx="20" cy="20" r="8" fill="none" stroke={c} strokeWidth="3" />
          <circle cx="20" cy="20" r="2.5" fill={c} />
        </>
      )
    case 'moon':
      return <path d="M28 20 A11 11 0 1 1 17 9 A8.5 8.5 0 1 0 28 20 Z" fill={c} />
    case 'lantern':
      return (
        <>
          <rect x="13" y="8" width="14" height="20" rx="3" fill={c} />
          <rect x="16" y="2" width="8" height="6" rx="2" fill={c} />
          <circle cx="20" cy="18" r="4" fill={DARK} />
          <path d="M12 30h16l-2 6H14z" fill={c} />
        </>
      )
    case 'star':
      return <path d="M20 3 L24.5 14 L36 15 L27 23 L30 35 L20 28 L10 35 L13 23 L4 15 L15.5 14 Z" fill={c} />
    case 'bridge':
      return (
        <>
          <path d="M4 26 Q20 8 36 26" fill="none" stroke={c} strokeWidth="3.2" />
          <path d="M4 26 V33 M36 26 V33 M14 20 V30 M26 20 V30 M20 16 V31" stroke={c} strokeWidth="2.4" />
        </>
      )
    case 'rocket':
      return (
        <>
          <path d="M20 4 C26 10 26 20 22 28 H18 C14 20 14 10 20 4 Z" fill={c} />
          <circle cx="20" cy="15" r="3" fill={DARK} />
          <path d="M18 26 L13 32 L18 30 Z M22 26 L27 32 L22 30 Z" fill={c} />
        </>
      )
    case 'book':
    default:
      return (
        <>
          <path d="M20 10 C15 7 9 8 6 10 V30 C9 28 15 27 20 30 Z" fill={c} />
          <path d="M20 10 C25 7 31 8 34 10 V30 C31 28 25 27 20 30 Z" fill={c} />
          <path d="M20 10 V30" stroke={DARK} strokeWidth="1.5" />
        </>
      )
  }
}

export interface HomeBookCoverProps {
  book: Book
  /** 0..1 reading progress; when > 0 shows a thin progress bar under the cover. */
  progress?: number
  className?: string
}

/** The cover face only (colored front + motif + title panel). */
export function HomeBookCover({ book, className }: { book: Book; className?: string }) {
  const spine = spineFor(book)
  const motif = motifFor(book.id)
  return (
    <div className={`lfh-cover ${className ?? ''}`} style={{ ['--spine' as string]: `var(--${spine})` }}>
      <svg className="lfh-motif" viewBox="0 0 40 40" aria-hidden="true">
        <MotifSvg kind={motif} />
      </svg>
      <div className="lfh-panel">
        <span>{book.title}</span>
      </div>
    </div>
  )
}
