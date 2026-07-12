// Little Fables v3.2 — Drawn endpaper placeholder for reader page art.
//
// Every reader page has a semantic scene key (e.g. 'bus', 'bear-hollow'). When
// no dedicated drawn scene exists yet for that key, we render this endpaper
// instead — a warm paper rectangle with a subtle wash tint and a few drawn
// corner motifs. This is the seam where art-generation will land later.
//
// Never emoji. Never gradient wash rectangles. Always paper + ink.
// Reduced-motion safe (no animation).

import type { CSSProperties } from 'react'
import type { WashKey } from '@/types/story'

const INK = 'var(--ink, #46362A)'

// Wash → tint used behind the paper. Kept intentionally soft so the paper reads
// as paper, not as a gradient.
const WASH_TINT: Record<WashKey, string> = {
  canyon: 'rgba(217, 91, 67, 0.10)',
  sunset: 'rgba(226, 148, 60, 0.11)',
  meadow: 'rgba(124, 154, 98, 0.10)',
  lilac: 'rgba(155, 74, 107, 0.09)',
  blush: 'rgba(241, 166, 154, 0.10)',
  river: 'rgba(78, 127, 163, 0.09)',
  snow: 'rgba(249, 242, 227, 0.6)',
  honey: 'rgba(239, 200, 92, 0.11)',
}

interface DrawnEndpaperArtProps {
  washKey?: WashKey
  style?: CSSProperties
}

/** Paper rectangle with a soft wash and small drawn corner flourishes.
 *  Full-bleed inside its container; consumer decides the box shape. */
export function DrawnEndpaperArt({ washKey = 'honey', style }: DrawnEndpaperArtProps) {
  const tint = WASH_TINT[washKey] ?? WASH_TINT.honey
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'relative',
        width: 'min(560px, 100%)',
        maxWidth: '100%',
        maxHeight: '100%',
        aspectRatio: '4 / 3',
        borderRadius: 22,
        background: 'var(--paper-bright, #F9F2E3)',
        backgroundImage: 'var(--texture-paper)',
        boxShadow: '0 8px 26px rgba(94,62,26,.18)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* soft wash tint over the paper — keeps the page recognizably tied to
          the story's mood without pretending to be scene art */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: tint,
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
        }}
      />

      {/* drawn ink flourishes — a leaf sprig in the top-left, a star cluster
          in the bottom-right. Ink is warm brown, never black. */}
      <svg
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid meet"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        {/* top-left: leaf sprig */}
        <g transform="translate(28 30)" fill="none" stroke={INK} strokeWidth="1.6" filter="url(#lf-wobble)">
          <path d="M 0 24 Q 8 6 30 4 Q 34 20 12 30 Z" fill={INK} opacity="0.14" />
          <path d="M 0 24 Q 8 6 30 4 Q 34 20 12 30 Z" />
          <path d="M 4 22 Q 12 14 26 8" opacity="0.75" />
          <path d="M 34 4 L 46 -2" strokeLinecap="round" />
        </g>

        {/* bottom-right: small star cluster */}
        <g transform="translate(340 232)" fill="none" stroke={INK} strokeWidth="1.4" filter="url(#lf-wobble)">
          <path
            d="M 6 0 L 8 6 L 14 7 L 9 11 L 11 17 L 6 13 L 1 17 L 3 11 L -2 7 L 4 6 Z"
            fill={INK}
            opacity="0.14"
          />
          <path
            d="M 6 0 L 8 6 L 14 7 L 9 11 L 11 17 L 6 13 L 1 17 L 3 11 L -2 7 L 4 6 Z"
          />
          <path d="M 26 22 l 1.4 3 l 3 .4 l -2.2 2 l .6 3 l -2.8 -1.6 l -2.8 1.6 l .6 -3 l -2.2 -2 l 3 -.4 z" />
        </g>

        {/* deckle border — a soft hand-drawn frame to remind the eye this is
            the paper, not scene art */}
        <rect
          x="12"
          y="12"
          width="376"
          height="276"
          rx="14"
          fill="none"
          stroke={INK}
          strokeWidth="1.2"
          strokeDasharray="1 6"
          opacity="0.35"
          filter="url(#lf-wobble)"
        />
      </svg>
    </div>
  )
}
