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
  // v3.2 — no emoji motif on covers. The wash + drawn spine + hand-lettered
  // title carry the cover; a small drawn glyph is chosen from the book id.
  const motifKind = motifKindFromId(book.id)

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

      {/* motif — a small drawn glyph, hand-inked. */}
      <CoverMotif kind={motifKind} />


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

type MotifKind = 'lantern' | 'bridge' | 'tree' | 'moon' | 'star' | 'rocket' | 'evergreen' | 'book'

function motifKindFromId(id: string): MotifKind {
  const s = id.toLowerCase()
  if (s.includes('bramble') || s.includes('lantern')) return 'lantern'
  if (s.includes('miko') || s.includes('bridge')) return 'bridge'
  if (s.includes('moose')) return 'tree'
  if (s.includes('papa') || s.includes('moon')) return 'moon'
  if (s.includes('azi') || s.includes('bhen')) return 'star'
  if (s.includes('rocket')) return 'rocket'
  if (s.includes('christmas') || s.includes('jujy')) return 'evergreen'
  return 'book'
}

/** A small drawn glyph rendered on the cover in place of the v2 emoji motif.
 *  Sits at (52, 52) in the parent SVG (viewBox 0 0 96 128). */
function CoverMotif({ kind }: { kind: MotifKind }) {
  switch (kind) {
    case 'lantern':
      return (
        <g filter="url(#lf-wobble)">
          <path d="M46 34 L58 34 L58 42 L46 42 Z" fill="var(--pigment-berry, #9B4A6B)" opacity="0.85" />
          <ellipse cx="52" cy="56" rx="12" ry="16" fill="var(--pigment-butter, #EFC85C)" opacity="0.85" />
          <ellipse cx="52" cy="56" rx="12" ry="16" fill="none" stroke={INK} strokeWidth="2" />
          <path d="M46 34 L58 34 L58 42 L46 42 Z" fill="none" stroke={INK} strokeWidth="2" />
          <path d="M52 74 L52 82" stroke={INK} strokeWidth="2" />
        </g>
      )
    case 'bridge':
      return (
        <g filter="url(#lf-wobble)" stroke={INK} strokeWidth="2" fill="none">
          <path d="M28 62 Q 52 42 76 62" />
          <path d="M28 68 L76 68" />
          <path d="M34 62 L34 72 M46 54 L46 72 M58 54 L58 72 M70 62 L70 72" />
        </g>
      )
    case 'tree':
      return (
        <g filter="url(#lf-wobble)">
          <path d="M52 30 L38 56 L46 56 L34 74 L70 74 L58 56 L66 56 Z" fill="var(--pigment-sage, #7C9A62)" opacity="0.85" />
          <rect x="49" y="74" width="6" height="10" fill="#5B4637" />
          <path d="M52 30 L38 56 L46 56 L34 74 L70 74 L58 56 L66 56 Z" fill="none" stroke={INK} strokeWidth="2" />
        </g>
      )
    case 'moon':
      return (
        <g filter="url(#lf-wobble)">
          <path
            d="M 60 34 Q 40 40 40 56 Q 40 74 60 78 Q 46 68 46 56 Q 46 44 60 34 Z"
            fill="var(--pigment-butter, #EFC85C)"
            opacity="0.95"
          />
          <path
            d="M 60 34 Q 40 40 40 56 Q 40 74 60 78 Q 46 68 46 56 Q 46 44 60 34 Z"
            fill="none"
            stroke={INK}
            strokeWidth="2"
          />
        </g>
      )
    case 'star':
      return (
        <g filter="url(#lf-wobble)">
          <path
            d="M 52 34 L 58 50 L 74 52 L 62 62 L 66 78 L 52 68 L 38 78 L 42 62 L 30 52 L 46 50 Z"
            fill="var(--pigment-marigold, #E2A93B)"
            stroke={INK}
            strokeWidth="2"
          />
        </g>
      )
    case 'rocket':
      return (
        <g filter="url(#lf-wobble)">
          <path d="M52 30 Q 44 40 44 60 L 44 70 L 60 70 L 60 60 Q 60 40 52 30 Z" fill="var(--pigment-terracotta, #D95B43)" opacity="0.9" />
          <path d="M44 60 L 36 74 L 44 74 Z M 60 60 L 68 74 L 60 74 Z" fill="var(--pigment-berry, #9B4A6B)" opacity="0.85" />
          <path d="M52 30 Q 44 40 44 60 L 44 70 L 60 70 L 60 60 Q 60 40 52 30 Z" fill="none" stroke={INK} strokeWidth="2" />
          <circle cx="52" cy="48" r="4" fill="var(--paper-bright, #F9F2E3)" stroke={INK} strokeWidth="1.6" />
        </g>
      )
    case 'evergreen':
      return (
        <g filter="url(#lf-wobble)">
          <path d="M52 30 L36 50 L44 50 L32 68 L44 68 L34 82 L70 82 L60 68 L72 68 L60 50 L68 50 Z" fill="var(--pigment-sage, #7C9A62)" opacity="0.85" />
          <path d="M52 30 L36 50 L44 50 L32 68 L44 68 L34 82 L70 82 L60 68 L72 68 L60 50 L68 50 Z" fill="none" stroke={INK} strokeWidth="2" />
        </g>
      )
    case 'book':
    default:
      return (
        <g filter="url(#lf-wobble)">
          <path d="M32 44 L52 40 L52 74 L32 78 Z" fill="var(--paper-bright, #F9F2E3)" />
          <path d="M72 44 L52 40 L52 74 L72 78 Z" fill="var(--paper-bright, #F9F2E3)" />
          <path d="M32 44 L52 40 L52 74 L32 78 Z M 72 44 L 52 40 L 52 74 L 72 78 Z" fill="none" stroke={INK} strokeWidth="2" />
          <path d="M36 52 L48 50 M 36 58 L 48 56 M 36 64 L 48 62 M 56 50 L 68 52 M 56 56 L 68 58 M 56 62 L 68 64" stroke={INK} strokeWidth="1.4" opacity="0.6" />
        </g>
      )
  }
}
