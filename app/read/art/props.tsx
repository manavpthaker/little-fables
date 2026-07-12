// Little Fables — drawn room props.
// The pieces the Drawn Room overlays on top of the north-star painting: the
// window frame (for sky tinting overlays), a shelf-slot niche, rug, writing
// desk (kitchen door), crate, doorway, and the small decorative pieces (sun,
// star word pin, medallion mount, envelope). Story-page art from art2.jsx
// is a TODO — the reader still uses v2 WashScene until the transport lands.

import type { CSSProperties } from 'react'

const INK = 'var(--ink, #46362A)'

// ------------------------------------------------------------------
// Room-scale scenery — used by RoomScene, sized in stage coordinates.
// ------------------------------------------------------------------

interface WindowFrameProps {
  width?: number
  height?: number
  style?: CSSProperties
}

/** A drawn window with the sky driven by `--light-sky`. */
export function WindowFrame({ width = 224, height = 314, style }: WindowFrameProps) {
  return (
    <svg
      viewBox="0 0 224 314"
      width={width}
      height={height}
      style={{ display: 'block', overflow: 'visible', ...style }}
      aria-hidden="true"
    >
      {/* the sky — driven live by --light-sky (see LightingProvider) */}
      <rect
        x="8"
        y="8"
        width="208"
        height="298"
        fill="var(--light-sky)"
        opacity="0.94"
        filter="url(#lf-wash-edge)"
      ></rect>
      {/* soft ambient wash */}
      <rect
        x="8"
        y="8"
        width="208"
        height="298"
        fill="var(--light-ambient)"
        opacity="1"
        filter="url(#lf-wash-edge)"
      ></rect>
      {/* the rooftops on the horizon */}
      <path
        d="M8 264 Q 76 244 138 260 Q 178 270 216 258 L216 306 L8 306 Z"
        fill="var(--pigment-dusk, #5D6A8A)"
        opacity="0.42"
        filter="url(#lf-wash-edge)"
      ></path>
      {/* mullions */}
      <g fill="none" stroke={INK} filter="url(#lf-wobble)">
        <rect x="8" y="8" width="208" height="298" strokeWidth="3"></rect>
        <path d="M112 8 L112 306" strokeWidth="2.6"></path>
        <path d="M8 158 L216 158" strokeWidth="2.6"></path>
      </g>
      {/* sill */}
      <rect
        x="0"
        y="306"
        width="224"
        height="18"
        fill="#C89A5E"
        opacity="0.6"
        filter="url(#lf-wash-edge)"
      ></rect>
      <path
        d="M0 306 L224 306"
        stroke={INK}
        strokeWidth="2.2"
        fill="none"
        filter="url(#lf-wobble)"
      ></path>
    </svg>
  )
}

interface ShelfNicheProps {
  width?: number
  height?: number
  style?: CSSProperties
}

/** A single face-out shelf slot the size of one book cover. */
export function ShelfNiche({ width = 84, height = 108, style }: ShelfNicheProps) {
  return (
    <svg
      viewBox="0 0 84 108"
      width={width}
      height={height}
      style={{ display: 'block', overflow: 'visible', ...style }}
      aria-hidden="true"
    >
      <rect
        x="0"
        y="0"
        width="84"
        height="108"
        rx="4"
        fill="var(--paper-deep, #EADCC0)"
        opacity="0.6"
        filter="url(#lf-wash-edge)"
      ></rect>
      <rect
        x="0"
        y="0"
        width="84"
        height="108"
        rx="4"
        fill="none"
        stroke={INK}
        strokeWidth="1.6"
        opacity="0.55"
        filter="url(#lf-wobble)"
      ></rect>
    </svg>
  )
}

interface RugProps {
  width?: number
  height?: number
  style?: CSSProperties
}

/** The rug on the floor — where the buddy sits. */
export function Rug({ width = 380, height = 116, style }: RugProps) {
  return (
    <svg
      viewBox="0 0 380 116"
      width={width}
      height={height}
      style={{ display: 'block', overflow: 'visible', ...style }}
      aria-hidden="true"
    >
      <ellipse
        cx="190"
        cy="60"
        rx="182"
        ry="52"
        fill="var(--pigment-marigold, #E2A93B)"
        opacity="0.55"
        filter="url(#lf-wash-edge)"
      ></ellipse>
      <ellipse
        cx="190"
        cy="60"
        rx="150"
        ry="40"
        fill="var(--pigment-terracotta, #D95B43)"
        opacity="0.28"
        filter="url(#lf-wash-edge)"
      ></ellipse>
      <ellipse
        cx="190"
        cy="60"
        rx="182"
        ry="52"
        fill="none"
        stroke={INK}
        strokeWidth="1.8"
        opacity="0.5"
        filter="url(#lf-wobble)"
      ></ellipse>
    </svg>
  )
}

interface WritingDeskProps {
  width?: number
  height?: number
  style?: CSSProperties
}

/** The little writing desk — v3's "story kitchen door". A small desk with a
 *  book and a cup drawn in the same hand. */
export function WritingDesk({ width = 180, height = 150, style }: WritingDeskProps) {
  return (
    <svg
      viewBox="0 0 180 150"
      width={width}
      height={height}
      style={{ display: 'block', overflow: 'visible', ...style }}
      aria-hidden="true"
    >
      {/* desk surface */}
      <path
        d="M6 78 L174 68 L172 92 L8 100 Z"
        fill="#C89A5E"
        opacity="0.75"
        filter="url(#lf-wash-edge)"
      ></path>
      {/* legs */}
      <path
        d="M24 96 L20 140 M154 90 L158 140"
        stroke="#5B4637"
        strokeWidth="6"
        opacity="0.85"
        filter="url(#lf-wash-edge)"
      ></path>
      {/* open book on top */}
      <path
        d="M56 60 L108 56 L110 74 L58 78 Z"
        fill="var(--paper-bright, #F9F2E3)"
        opacity="0.95"
        filter="url(#lf-wash-edge)"
      ></path>
      {/* cup */}
      <ellipse
        cx="132"
        cy="66"
        rx="10"
        ry="4"
        fill="var(--pigment-terracotta, #D95B43)"
        opacity="0.85"
        filter="url(#lf-wash-edge)"
      ></ellipse>
      <path
        d="M122 66 L124 76 Q 132 82 140 74 L142 64"
        fill="var(--pigment-terracotta, #D95B43)"
        opacity="0.7"
        filter="url(#lf-wash-edge)"
      ></path>
      {/* ink */}
      <g fill="none" stroke={INK} filter="url(#lf-wobble)">
        <path d="M6 78 L174 68 L172 92 L8 100 Z" strokeWidth="2"></path>
        <path d="M24 96 L20 140 M154 90 L158 140" strokeWidth="2.2"></path>
        <path d="M56 60 L108 56 L110 74 L58 78 Z" strokeWidth="1.8"></path>
        <path
          d="M82 58 L83 76"
          strokeWidth="1.4"
          opacity="0.75"
        ></path>
        <path d="M122 66 L124 76 Q 132 82 140 74 L142 64" strokeWidth="1.6"></path>
        <ellipse cx="132" cy="66" rx="10" ry="4" strokeWidth="1.4"></ellipse>
      </g>
    </svg>
  )
}

/** The wrapped crate — "someone new is coming".
 *  Ported from design/handoff-v4-hifi/project/app/art2.jsx CrateArt. */
export function CrateArt() {
  return (
    <svg
      viewBox="0 0 110 78"
      width="110"
      height="78"
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      <ellipse cx="55" cy="72" rx="46" ry="7" fill="var(--shadow-cool)" filter="url(#lf-wash-edge)"></ellipse>
      <path
        d="M12 26 L98 26 L94 70 L16 70 Z"
        fill="#C89A5E"
        opacity="0.6"
        filter="url(#lf-wash-edge)"
      ></path>
      <path
        d="M50 26 L54 70 M12 46 L96 46"
        stroke="var(--pigment-berry, #9B4A6B)"
        strokeWidth="6"
        opacity="0.6"
        filter="url(#lf-wash-edge)"
      ></path>
      <g fill="none" stroke={INK} strokeWidth="2" filter="url(#lf-wobble)">
        <path d="M12 26 L98 26 L94 70 L16 70 Z"></path>
        <path d="M50 26 L54 70 M12 46 L96 46" strokeWidth="1.6"></path>
        <path
          d="M52 26 q -6 -12 6 -14 q 8 -2 6 8 q 8 -8 12 0 q 2 6 -8 8"
          strokeWidth="1.8"
        ></path>
      </g>
    </svg>
  )
}

/** Door edge on the far left wall of the landscape room.
 *  Ported from design/handoff-v4-hifi/project/app/art2.jsx DoorEdgeArt. */
export function DoorEdgeArt() {
  return (
    <svg
      viewBox="0 0 76 500"
      width="76"
      height="500"
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      <rect
        x="0"
        y="12"
        width="58"
        height="474"
        fill="#C89A5E"
        opacity="0.34"
        filter="url(#lf-wash-edge)"
      ></rect>
      <g fill="none" stroke={INK} filter="url(#lf-wobble)">
        <path d="M58 6 L58 492" strokeWidth="2.6"></path>
        <path d="M66 0 L66 500" strokeWidth="2" opacity="0.7"></path>
        <path d="M0 14 L56 12 M0 486 L56 488" strokeWidth="2"></path>
        <path d="M44 236 q 8 6 0 14" strokeWidth="2.4"></path>
      </g>
      <circle cx="42" cy="250" r="3.4" fill="#B98A50" opacity="0.9" filter="url(#lf-wobble)"></circle>
    </svg>
  )
}

// ------------------------------------------------------------------
// Small decorative pins & mounts.
// ------------------------------------------------------------------

interface SunPinProps {
  size?: number
  lit?: boolean
  today?: boolean
  letter?: string
}

/** A single sun in the weekly sun row (windowsill).
 *  `lit` = the child read that day. `today` = today (drawn with a slight glow). */
export function SunPin({ size = 40, lit = false, today = false, letter }: SunPinProps) {
  const face = lit
    ? 'var(--pigment-butter, #EFC85C)'
    : 'var(--paper-deep, #EADCC0)'
  const halo = lit ? 'var(--pigment-marigold, #E2A93B)' : 'transparent'
  return (
    <svg
      viewBox="0 0 44 44"
      width={size}
      height={size}
      style={{ display: 'block', overflow: 'visible' }}
      role="img"
      aria-label={
        letter ? `${letter}${today ? ' — today' : ''}${lit ? ' — read' : ''}` : 'sun'
      }
    >
      <circle
        cx="22"
        cy="22"
        r="14"
        fill={halo}
        opacity="0.35"
        filter="url(#lf-wash-edge)"
      ></circle>
      <circle
        cx="22"
        cy="22"
        r="9"
        fill={face}
        opacity="0.95"
        filter="url(#lf-wash-edge)"
      ></circle>
      <g stroke={INK} strokeWidth="1.6" filter="url(#lf-wobble)" fill="none">
        <circle cx="22" cy="22" r="9"></circle>
        <path d="M22 6 L22 11 M22 33 L22 38 M6 22 L11 22 M33 22 L38 22 M11 11 L14 14 M30 30 L33 33 M33 11 L30 14 M14 30 L11 33"></path>
      </g>
      {today && (
        <circle
          cx="22"
          cy="22"
          r="17"
          fill="none"
          stroke="var(--pigment-terracotta, #D95B43)"
          strokeWidth="1.6"
          strokeDasharray="3 3"
          opacity="0.8"
          filter="url(#lf-wobble)"
        ></circle>
      )}
    </svg>
  )
}

interface StarWordPinProps {
  size?: number
  label?: string
}

/** A single word-pin on the wall — a small drawn tag with pigment. */
export function StarWordPin({ size = 44, label }: StarWordPinProps) {
  return (
    <svg
      viewBox="0 0 68 40"
      width={size}
      height={(size * 40) / 68}
      style={{ display: 'block', overflow: 'visible' }}
      role="img"
      aria-label={label ? `word pin: ${label}` : 'word pin'}
    >
      <path
        d="M4 8 L54 4 L64 20 L54 36 L4 32 Z"
        fill="var(--paper-bright, #F9F2E3)"
        opacity="0.95"
        filter="url(#lf-wash-edge)"
      ></path>
      <path
        d="M4 8 L54 4 L64 20 L54 36 L4 32 Z"
        fill="none"
        stroke={INK}
        strokeWidth="1.8"
        filter="url(#lf-wobble)"
      ></path>
      <circle
        cx="54"
        cy="20"
        r="2"
        fill="var(--pigment-terracotta, #D95B43)"
        filter="url(#lf-wobble)"
      ></circle>
    </svg>
  )
}

interface MedallionMountProps {
  size?: number
  earned?: boolean
  label?: string
}

/** A small drawn mount on the shelf where a medallion goes.
 *  `earned` fills the mount with butter; otherwise it's a soft empty ring. */
export function MedallionMount({ size = 44, earned = false, label }: MedallionMountProps) {
  const face = earned
    ? 'var(--pigment-butter, #EFC85C)'
    : 'var(--paper-deep, #EADCC0)'
  return (
    <svg
      viewBox="0 0 44 44"
      width={size}
      height={size}
      style={{ display: 'block', overflow: 'visible' }}
      role="img"
      aria-label={label ?? (earned ? 'earned medallion' : 'medallion mount')}
    >
      <circle
        cx="22"
        cy="22"
        r="16"
        fill={face}
        opacity={earned ? 0.95 : 0.6}
        filter="url(#lf-wash-edge)"
      ></circle>
      <circle
        cx="22"
        cy="22"
        r="16"
        fill="none"
        stroke={INK}
        strokeWidth="1.8"
        filter="url(#lf-wobble)"
      ></circle>
      {earned && (
        <path
          d="M14 22 l 6 6 l 10 -12"
          fill="none"
          stroke={INK}
          strokeWidth="2.2"
          strokeLinecap="round"
          filter="url(#lf-wobble)"
        ></path>
      )}
    </svg>
  )
}

/** A drawn envelope — reused as the parent-corner mail dot.
 *  Ported from design/handoff-v4-hifi/project/app/art2.jsx EnvelopeArt. */
export function EnvelopeArt({ size = 92 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 100 70"
      width={size}
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      <path
        d="M6 12 L94 12 L92 62 L8 62 Z"
        fill="var(--paper-bright, #F9F2E3)"
        filter="url(#lf-wash-edge)"
      ></path>
      <path
        d="M6 12 L50 42 L94 12"
        fill="none"
        stroke="var(--pigment-terracotta, #D95B43)"
        strokeWidth="4"
        opacity="0.55"
        filter="url(#lf-wash-edge)"
      ></path>
      <g fill="none" stroke={INK} strokeWidth="2" filter="url(#lf-wobble)">
        <path d="M6 12 L94 12 L92 62 L8 62 Z"></path>
        <path d="M6 12 L50 42 L94 12" strokeWidth="1.8"></path>
      </g>
    </svg>
  )
}

// ------------------------------------------------------------------
// TODO: port from art2.jsx when the reader ships v3 transport.
// BridgeArt, WindArt, RopeArt, StepsArt, BoulderArt, NeckPathArt, MotoPathArt,
// BellyArt, CrossingArt, SingingBridgeArt, MooseSkyArt, PapaMoonArt,
// CozyRingArt, BrambleWaveArt, AziBhenArt, MoonInWindow, PencilMotif,
// SunMotif, BridgeMotif, and the six book cover arts. These are story-page
// pieces (not room props) — deferred until Phase 2's reader transport lands.
