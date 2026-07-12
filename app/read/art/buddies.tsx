// Little Fables — the six buddy creatures.
// Ported from design/handoff-v4-hifi/project/app/art.jsx (OtterArt, AnkyArt,
// MotoArt, RockyArt, RustyArt) + a Bramble bear placeholder for the design
// system's Buddy component (which lived in the handoff bundle, not in code).
// The bear is drawn here with the same hand.

import type { CSSProperties } from 'react'

const INK = 'var(--ink, #46362A)'
const WASH = { filter: 'url(#lf-wash-edge)' } as const
const LINE = {
  fill: 'none' as const,
  stroke: INK,
  strokeWidth: 2.2,
  filter: 'url(#lf-wobble)',
} as const

// ------------------------------------------------------------------
// The six buddy drawings. Each renders into the <g> of a 220×200 viewBox.
// ------------------------------------------------------------------

export function BrambleArt() {
  // Bramble — the honey bear. Simplified drawn version of the design-system
  // Buddy component; poses come from the wrapper.
  return (
    <g>
      <g {...WASH}>
        <ellipse cx="110" cy="180" rx="70" ry="12" fill="var(--shadow-warm)"></ellipse>
        <path
          d="M40 168 q -8 -84 70 -88 q 82 -4 76 82 q 0 22 -20 30 q -60 14 -110 4 z"
          fill="#C89A5E"
          opacity="0.9"
        ></path>
        <ellipse cx="110" cy="140" rx="34" ry="30" fill="#E8D3A8" opacity="0.95"></ellipse>
        <circle cx="110" cy="66" r="34" fill="#C89A5E" opacity="0.92"></circle>
        <ellipse cx="110" cy="78" rx="16" ry="12" fill="#E8D3A8" opacity="0.95"></ellipse>
        <circle cx="80" cy="34" r="12" fill="#A87840" opacity="0.9"></circle>
        <circle cx="140" cy="34" r="12" fill="#A87840" opacity="0.9"></circle>
        <circle cx="80" cy="34" r="6" fill="#E8D3A8" opacity="0.95"></circle>
        <circle cx="140" cy="34" r="6" fill="#E8D3A8" opacity="0.95"></circle>
      </g>
      <g {...LINE}>
        <path d="M42 166 q -8 -80 68 -84 q 82 -4 76 80 q 0 22 -20 28"></path>
        <path d="M84 56 A 34 34 0 1 1 138 56"></path>
        <circle cx="80" cy="34" r="12"></circle>
        <circle cx="140" cy="34" r="12"></circle>
        <ellipse cx="110" cy="78" rx="16" ry="12" strokeWidth="1.8"></ellipse>
        <path d="M100 82 q 10 6 20 0" strokeWidth="1.8"></path>
      </g>
      <ellipse cx="110" cy="74" rx="5" ry="4" fill={INK}></ellipse>
      <circle cx="97" cy="60" r="2.8" fill={INK}></circle>
      <circle cx="123" cy="60" r="2.8" fill={INK}></circle>
      <path
        d="M92 68 q 3 2 6 0 M122 68 q 3 2 6 0"
        stroke="var(--pigment-terracotta)"
        strokeWidth="2"
        opacity="0.4"
        fill="none"
        filter="url(#lf-wobble)"
      ></path>
    </g>
  )
}

export function OtterArt() {
  return (
    <g>
      <g {...WASH}>
        <path
          d="M96 178 q -26 -8 -24 -46 q 2 -44 30 -62 q 10 -6 22 0 q 28 18 28 62 q 0 38 -24 46 q -16 6 -32 0"
          fill="#8A6A48"
          opacity="0.85"
        ></path>
        <ellipse cx="112" cy="132" rx="20" ry="34" fill="#E8D3A8" opacity="0.9"></ellipse>
        <circle cx="112" cy="62" r="27" fill="#8A6A48" opacity="0.9"></circle>
        <ellipse cx="112" cy="72" rx="15" ry="11" fill="#E8D3A8" opacity="0.95"></ellipse>
        <circle cx="92" cy="42" r="7.5" fill="#8A6A48" opacity="0.95"></circle>
        <circle cx="132" cy="42" r="7.5" fill="#8A6A48" opacity="0.95"></circle>
        <path
          d="M124 172 q 34 10 44 -12 q 6 -16 -8 -20 q -4 18 -20 22"
          fill="#75583B"
          opacity="0.85"
        ></path>
        <ellipse cx="88" cy="180" rx="16" ry="8" fill="#75583B" opacity="0.8"></ellipse>
        <ellipse cx="130" cy="182" rx="16" ry="8" fill="#75583B" opacity="0.8"></ellipse>
      </g>
      <g {...LINE}>
        <path d="M98 176 q -24 -10 -22 -44 q 2 -44 30 -62 q 10 -6 22 0 q 28 18 28 62 q 0 34 -22 44"></path>
        <path d="M87 51 A 27 27 0 1 1 137 51"></path>
        <circle cx="92" cy="42" r="7.5"></circle>
        <circle cx="132" cy="42" r="7.5"></circle>
        <path d="M124 170 q 32 10 42 -10 q 6 -15 -8 -19" strokeWidth="2"></path>
        <ellipse cx="88" cy="180" rx="16" ry="8"></ellipse>
        <ellipse cx="130" cy="182" rx="16" ry="8"></ellipse>
        <path d="M104 76 q 8 6 16 0" strokeWidth="1.8"></path>
        <path
          d="M84 66 l -12 -2 M84 72 l -11 3 M140 66 l 12 -2 M140 72 l 11 3"
          strokeWidth="1.3"
        ></path>
      </g>
      <ellipse cx="112" cy="66" rx="4.4" ry="3.4" fill={INK}></ellipse>
      <circle cx="100" cy="56" r="2.6" fill={INK}></circle>
      <circle cx="124" cy="56" r="2.6" fill={INK}></circle>
      <path
        d="M96 66 q 3 2 6 0 M126 66 q 3 2 6 0"
        stroke="var(--pigment-terracotta)"
        strokeWidth="2"
        opacity="0.4"
        fill="none"
        filter="url(#lf-wobble)"
      ></path>
    </g>
  )
}

export function AnkyArt() {
  return (
    <g>
      <g {...WASH}>
        <path
          d="M34 150 q 4 -44 56 -46 q 54 -2 62 40 q 4 26 -22 32 l -76 0 q -22 -6 -20 -26"
          fill="#7C9A62"
          opacity="0.8"
        ></path>
        <path
          d="M60 106 q 4 -12 14 -6 M84 100 q 4 -14 16 -7 M112 99 q 5 -13 16 -5 M138 106 q 6 -11 14 -3"
          fill="#5F7C48"
          opacity="0.85"
        ></path>
        <circle cx="46" cy="96" r="22" fill="#94AF7C" opacity="0.9"></circle>
        <path
          d="M148 152 q 26 2 38 -12 q 8 -10 -2 -16 q -10 12 -30 10"
          fill="#5F7C48"
          opacity="0.8"
        ></path>
        <circle cx="186" cy="130" r="12" fill="#94AF7C" opacity="0.9"></circle>
        <ellipse cx="66" cy="178" rx="13" ry="7" fill="#5F7C48" opacity="0.85"></ellipse>
        <ellipse cx="122" cy="180" rx="13" ry="7" fill="#5F7C48" opacity="0.85"></ellipse>
      </g>
      <g {...LINE}>
        <path d="M36 148 q 4 -42 54 -44 q 54 -2 62 38 q 4 26 -22 32"></path>
        <circle cx="46" cy="96" r="22"></circle>
        <path
          d="M60 104 q 4 -12 14 -6 M84 98 q 4 -14 16 -7 M112 97 q 5 -13 16 -5 M138 104 q 6 -11 14 -3"
          strokeWidth="1.8"
        ></path>
        <path d="M148 150 q 26 2 38 -12 q 8 -10 -2 -16" strokeWidth="2"></path>
        <circle cx="186" cy="130" r="12"></circle>
        <ellipse cx="66" cy="178" rx="13" ry="7"></ellipse>
        <ellipse cx="122" cy="180" rx="13" ry="7"></ellipse>
        <path d="M34 104 q -6 4 -6 10" strokeWidth="1.6"></path>
      </g>
      <circle cx="40" cy="92" r="2.5" fill={INK}></circle>
      <circle cx="54" cy="92" r="2.5" fill={INK}></circle>
      <path
        d="M42 102 q 4 3 9 0"
        stroke={INK}
        strokeWidth="1.8"
        fill="none"
        filter="url(#lf-wobble)"
      ></path>
    </g>
  )
}

export function MotoArt() {
  return (
    <g>
      <g {...WASH}>
        <circle cx="70" cy="168" r="17" fill="#5B4637" opacity="0.55"></circle>
        <circle cx="152" cy="168" r="17" fill="#5B4637" opacity="0.55"></circle>
        <path d="M56 152 q 40 -18 92 -2 l -6 14 q -40 -12 -80 2 z" fill="#E2A93B" opacity="0.85"></path>
        <path
          d="M138 148 L150 108 l 14 -4"
          fill="none"
          stroke="#E2A93B"
          strokeWidth="9"
          opacity="0.85"
        ></path>
        <path
          d="M96 142 q -4 -38 20 -56 q 16 -10 28 4 q 14 18 2 52"
          fill="#9A93A8"
          opacity="0.85"
        ></path>
        <circle cx="126" cy="74" r="20" fill="#9A93A8" opacity="0.9"></circle>
        <circle cx="112" cy="56" r="10" fill="#9A93A8" opacity="0.95"></circle>
        <circle cx="142" cy="56" r="10" fill="#9A93A8" opacity="0.95"></circle>
        <circle cx="112" cy="57" r="4.6" fill="#E8D3A8" opacity="0.95"></circle>
        <circle cx="142" cy="57" r="4.6" fill="#E8D3A8" opacity="0.95"></circle>
        <ellipse cx="118" cy="118" rx="13" ry="18" fill="#E8D3A8" opacity="0.85"></ellipse>
      </g>
      <g {...LINE}>
        <circle cx="70" cy="168" r="17"></circle>
        <circle cx="152" cy="168" r="17"></circle>
        <path d="M58 150 q 40 -16 88 -2"></path>
        <path d="M140 146 L151 108 l 13 -4" strokeWidth="2.4"></path>
        <path d="M98 140 q -4 -36 18 -54 q 16 -10 28 4 q 14 18 2 50"></path>
        <path d="M112 88 A 20 20 0 1 1 142 86" strokeWidth="2"></path>
        <circle cx="112" cy="56" r="10"></circle>
        <circle cx="142" cy="56" r="10"></circle>
        <path d="M96 140 q -18 10 -28 2" strokeWidth="2"></path>
      </g>
      <ellipse cx="127" cy="82" rx="3.6" ry="2.8" fill={INK}></ellipse>
      <circle cx="119" cy="72" r="2.3" fill={INK}></circle>
      <circle cx="136" cy="72" r="2.3" fill={INK}></circle>
    </g>
  )
}

export function RockyArt() {
  return (
    <g>
      <g {...WASH}>
        <path
          d="M78 176 q -18 -10 -14 -48 q 4 -42 34 -56 q 12 -6 24 0 q 30 14 32 56 q 2 38 -16 48 q -30 10 -60 0"
          fill="#8B93A8"
          opacity="0.85"
        ></path>
        <ellipse cx="110" cy="136" rx="20" ry="30" fill="#D8D3C4" opacity="0.9"></ellipse>
        <circle cx="110" cy="62" r="28" fill="#8B93A8" opacity="0.9"></circle>
        <ellipse
          cx="96"
          cy="58"
          rx="10"
          ry="7"
          fill="#4A5468"
          opacity="0.8"
          transform="rotate(-12 96 58)"
        ></ellipse>
        <ellipse
          cx="124"
          cy="58"
          rx="10"
          ry="7"
          fill="#4A5468"
          opacity="0.8"
          transform="rotate(12 124 58)"
        ></ellipse>
        <ellipse cx="110" cy="74" rx="13" ry="9" fill="#D8D3C4" opacity="0.95"></ellipse>
        <path
          d="M86 36 l 8 12 M134 36 l -8 12"
          stroke="#4A5468"
          strokeWidth="11"
          strokeLinecap="round"
          opacity="0.85"
        ></path>
      </g>
      <g {...LINE}>
        <path d="M80 174 q -16 -12 -12 -46 q 4 -42 32 -54 q 12 -6 24 0 q 30 14 32 54 q 2 36 -14 46"></path>
        <path d="M84 50 A 28 28 0 1 1 136 50"></path>
        <path d="M84 34 l 10 14 M136 34 l -10 14" strokeWidth="2"></path>
        <path d="M102 78 q 8 6 16 0" strokeWidth="1.8"></path>
      </g>
      <ellipse cx="110" cy="70" rx="4.2" ry="3.2" fill={INK}></ellipse>
      <circle cx="97" cy="59" r="2.6" fill="#F9F2E3"></circle>
      <circle cx="123" cy="59" r="2.6" fill="#F9F2E3"></circle>
      <circle cx="97" cy="59" r="1.6" fill={INK}></circle>
      <circle cx="123" cy="59" r="1.6" fill={INK}></circle>
    </g>
  )
}

export function RustyArt() {
  return (
    <g>
      <g {...WASH}>
        <path
          d="M84 178 q -20 -10 -16 -50 q 4 -40 32 -54 q 12 -6 24 0 q 28 14 30 54 q 2 40 -14 50 q -28 10 -56 0"
          fill="#C97B5A"
          opacity="0.85"
        ></path>
        <ellipse cx="112" cy="138" rx="19" ry="28" fill="#EFD8B8" opacity="0.9"></ellipse>
        <circle cx="112" cy="62" r="28" fill="#C97B5A" opacity="0.9"></circle>
        <path
          d="M88 42 q -14 -2 -16 16 q 0 12 10 16 q 2 -20 12 -28"
          fill="#A85D40"
          opacity="0.9"
        ></path>
        <path
          d="M136 40 q 16 0 16 20 q 0 22 -16 22 q -6 0 -8 -8 q 8 -12 4 -30"
          fill="#A85D40"
          opacity="0.9"
        ></path>
        <ellipse cx="112" cy="76" rx="14" ry="10" fill="#EFD8B8" opacity="0.95"></ellipse>
      </g>
      <g {...LINE}>
        <path d="M86 176 q -18 -12 -14 -48 q 4 -40 30 -52 q 12 -6 24 0 q 28 14 30 52 q 2 36 -12 48"></path>
        <path d="M88 40 q -14 0 -16 17 q 0 12 10 16"></path>
        <path d="M136 38 q 16 2 16 21 q 0 22 -16 22" strokeWidth="2"></path>
        <path d="M89 47 A 28 28 0 0 1 135 45"></path>
        <path d="M104 80 q 8 6 16 0" strokeWidth="1.8"></path>
      </g>
      <ellipse cx="112" cy="70" rx="4.6" ry="3.6" fill={INK}></ellipse>
      <circle cx="100" cy="58" r="2.6" fill={INK}></circle>
      <circle cx="124" cy="58" r="2.6" fill={INK}></circle>
    </g>
  )
}

// ------------------------------------------------------------------
// CreatureSprite — wraps a buddy drawing with a shared pose behavior.
// ------------------------------------------------------------------

export type BuddyKind = 'bramble' | 'otter' | 'anky' | 'moto' | 'rocky' | 'rusty'
export type BuddyPose = 'idle' | 'listening' | 'pointing' | 'celebrating'

const KIND_TO_ART: Record<BuddyKind, () => React.ReactElement> = {
  bramble: BrambleArt,
  otter: OtterArt,
  anky: AnkyArt,
  moto: MotoArt,
  rocky: RockyArt,
  rusty: RustyArt,
}

interface CreatureSpriteProps {
  kind: BuddyKind
  pose?: BuddyPose
  size?: number
  style?: CSSProperties
  ariaLabel?: string
}

export function CreatureSprite({
  kind,
  pose = 'idle',
  size = 200,
  style,
  ariaLabel,
}: CreatureSpriteProps) {
  const Art = KIND_TO_ART[kind] ?? BrambleArt
  const lean =
    pose === 'listening'
      ? 'rotate(-5deg) translateX(-4px)'
      : pose === 'pointing'
        ? 'rotate(4deg) translateX(3px)'
        : 'none'
  return (
    <svg
      viewBox="0 0 220 200"
      width={size * 1.1}
      height={size}
      style={{ display: 'block', overflow: 'visible', ...style }}
      role="img"
      aria-label={ariaLabel ?? `${kind}, ${pose}`}
    >
      {pose === 'celebrating' && (
        <g>
          <ellipse
            cx="110"
            cy="110"
            rx="100"
            ry="88"
            fill="var(--glow-lamplight, rgba(242,196,96,0.55))"
            opacity="0.7"
            filter="url(#lf-wash-edge)"
          ></ellipse>
        </g>
      )}
      <ellipse
        cx="112"
        cy="188"
        rx="58"
        ry="9"
        fill="var(--shadow-warm)"
        filter="url(#lf-wash-edge)"
      ></ellipse>
      <g
        style={{
          transform: lean !== 'none' ? lean : undefined,
          transformOrigin: '50% 92%',
          transition: 'transform 400ms cubic-bezier(0.2, 0.7, 0.2, 1)',
        }}
      >
        <Art />
      </g>
    </svg>
  )
}
