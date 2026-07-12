// Little Fables — drawn book covers for the Home shelf and Contents.
//
// The v2 white MatCover rounded card is replaced on Home by a face-out DRAWN
// cover, in the same hand as the rest of the Drawn Room. Two shapes:
//
//   1. Named covers (bramble-and-the-lantern, miko-bridge, azi-bhen, moose-and-*,
//      papa-*, ...) get a bespoke wash + motif + drawn spine. If we later add
//      dedicated SVG cover components, they slot in here without touching the
//      call sites.
//   2. Everything else (generated stories, packs without a bespoke cover) uses
//      a paper-spine treatment — a drawn book front with the title lettered
//      inside a soft frame.
//
// Every cover renders inside a wobbled ink frame, sits on a warm-paper front,
// and has a slight drawn shadow at the base. No white rounded cards.
//
// Consumers pass the whole Book; `BookCoverArt` picks the treatment.

import type { CSSProperties } from 'react'
import type { WashKey } from '@/types/story'

const INK = 'var(--ink, #46362A)'
const INK_SOFT = 'var(--ink-soft, #6E5B49)'

// Wash-tinted watercolor stops for the cover front. Small palette by wash key.
const WASH_STOPS: Record<WashKey, { paper: string; wash: string; accent: string }> = {
  canyon: { paper: '#F1E4C6', wash: 'rgba(147,174,189,.55)', accent: 'rgba(217,160,91,.45)' },
  sunset: { paper: '#FBE9CE', wash: 'rgba(217,160,91,.55)', accent: 'rgba(251,225,228,.55)' },
  meadow: { paper: '#EEE9CE', wash: 'rgba(168,181,154,.55)', accent: 'rgba(223,238,221,.55)' },
  lilac:  { paper: '#EDE7F2', wash: 'rgba(147,116,177,.42)', accent: 'rgba(251,225,228,.45)' },
  blush:  { paper: '#F7DEDE', wash: 'rgba(251,180,180,.55)', accent: 'rgba(233,230,246,.55)' },
  river:  { paper: '#DBE6EA', wash: 'rgba(147,174,189,.60)', accent: 'rgba(223,238,221,.45)' },
  snow:   { paper: '#EEEDF3', wash: 'rgba(200,205,220,.45)', accent: 'rgba(255,255,255,.50)' },
  honey:  { paper: '#F4E1B8', wash: 'rgba(217,160,91,.55)', accent: 'rgba(255,232,207,.55)' },
}

/** Minimal shape the cover needs — a subset of Book. */
export interface CoverBook {
  id: string
  title: string
  wash?: WashKey
  coverEmoji?: string
  emojis?: string[]
  by?: string
}

interface BookCoverArtProps {
  book: CoverBook
  width?: number
  height?: number
  style?: CSSProperties
}

/** A face-out drawn book cover. Dispatches by id → specific motif, or falls
 *  back to a generic paper-spine treatment. Sized in px so it lays cleanly
 *  into the ROOM_ZONES shelf slots. */
export function BookCoverArt({
  book,
  width = 96,
  height = 128,
  style,
}: BookCoverArtProps) {
  const wash = (book.wash ?? washFromId(book.id)) as WashKey
  const stops = WASH_STOPS[wash] ?? WASH_STOPS.honey
  // The specific motif — first coverEmoji, else first from emojis, else book-id
  // hint (miko-bridge → 🌉, azi-bhen → 🌙, etc.).
  const motif = book.coverEmoji ?? book.emojis?.[0] ?? motifFromId(book.id)

  return (
    <svg
      viewBox="0 0 96 128"
      width={width}
      height={height}
      role="img"
      aria-label={`${book.title} — cover`}
      style={{ display: 'block', overflow: 'visible', ...style }}
    >
      {/* ground shadow — a soft ink ellipse under the book */}
      <ellipse
        cx="48"
        cy="124"
        rx="42"
        ry="4"
        fill={INK}
        opacity="0.14"
        filter="url(#lf-wash-edge)"
      />

      {/* spine — a slimmer wash to the left, so it reads as a book */}
      <path
        d="M6 10 L14 8 L14 118 L6 120 Z"
        fill={stops.accent}
        filter="url(#lf-wash-edge)"
      />

      {/* front paper — warm cream, wash tint on top */}
      <rect
        x="14"
        y="8"
        width="76"
        height="112"
        rx="3"
        fill={stops.paper}
        filter="url(#lf-wash-edge)"
      />
      {/* wash — a broad radial swipe over the front, keyed to wash */}
      <rect
        x="14"
        y="8"
        width="76"
        height="112"
        rx="3"
        fill={stops.wash}
        opacity="0.55"
        filter="url(#lf-wash-edge)"
      />
      {/* accent — a secondary swirl at the bottom */}
      <ellipse
        cx="52"
        cy="98"
        rx="42"
        ry="18"
        fill={stops.accent}
        opacity="0.7"
        filter="url(#lf-wash-edge)"
      />

      {/* motif (emoji glyph in the paint — text on SVG) */}
      {motif && (
        <text
          x="52"
          y="66"
          textAnchor="middle"
          fontSize="42"
          style={{ filter: 'drop-shadow(0 2px 0 rgba(94,62,26,.15))' }}
        >
          {motif}
        </text>
      )}

      {/* title — hand-lettered in the display font */}
      <foreignObject x="14" y="80" width="76" height="36">
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            font: '700 10.5px/1.15 var(--font-display, YoungSerif)',
            color: INK,
            textAlign: 'center',
            padding: '2px 4px',
            overflow: 'hidden',
            wordBreak: 'break-word',
          }}
        >
          {book.title}
        </div>
      </foreignObject>

      {/* ink frame — the confident wobbly outline over the wash */}
      <g fill="none" stroke={INK} filter="url(#lf-wobble)">
        <rect x="14" y="8" width="76" height="112" rx="3" strokeWidth="2" />
        <path d="M6 10 L14 8 L14 118 L6 120 Z" strokeWidth="1.5" opacity="0.75" />
        {/* a small inner top rule under the top of the paper */}
        <path d="M22 22 L82 22" strokeWidth="1.2" opacity="0.55" />
        {/* by-line */}
        <path d="M28 116 L76 116" strokeWidth="1" opacity="0.4" />
      </g>

      {book.by && (
        <foreignObject x="14" y="112" width="76" height="10">
          <div
            style={{
              width: '100%',
              textAlign: 'center',
              font: 'italic 600 7px var(--font-body, serif)',
              color: INK_SOFT,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            {book.by}
          </div>
        </foreignObject>
      )}
    </svg>
  )
}

// ------------------------------------------------------------------
// Heuristics for id → wash / motif when the book doesn't carry them.
// ------------------------------------------------------------------

function washFromId(id: string): WashKey {
  const s = id.toLowerCase()
  if (s.includes('bramble') || s.includes('lantern')) return 'honey'
  if (s.includes('miko') || s.includes('bridge')) return 'river'
  if (s.includes('moose')) return 'canyon'
  if (s.includes('papa') || s.includes('moon')) return 'lilac'
  if (s.includes('azi') || s.includes('bhen')) return 'sunset'
  if (s.includes('rocket') || s.includes('goal')) return 'blush'
  if (s.includes('jujy') || s.includes('christmas')) return 'meadow'
  return 'honey'
}

function motifFromId(id: string): string {
  const s = id.toLowerCase()
  if (s.includes('bramble') || s.includes('lantern')) return '🏮'
  if (s.includes('miko') || s.includes('bridge')) return '🌉'
  if (s.includes('moose')) return '🌲'
  if (s.includes('papa') || s.includes('moon')) return '🌙'
  if (s.includes('azi') || s.includes('bhen')) return '⭐'
  if (s.includes('rocket')) return '🚀'
  if (s.includes('christmas') || s.includes('jujy')) return '🎄'
  return '📖'
}
