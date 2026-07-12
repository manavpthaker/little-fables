'use client'

// Little Fables v3 Drawn Room — shared SVG filter defs.
// Ported from design/handoff-v4-hifi/assets/lf-filters.js as a React component
// so the SVG defs mount once per SPA session and every drawn surface can
// reference them by id (`filter: url(#lf-wobble)` etc.).
//
// Filters:
//   #lf-wobble        — hand-drawn wobble for borders/lines (static)
//   #lf-wobble-bold   — heavier wobble for big edges
//   #lf-wash-edge     — watercolor bleed for pigment fields
//   #lf-dry           — dry-brush breakup for rules/accents
//   #lf-boil          — 2s / 3-frame line boil (skipped under reduced-motion)

import { useEffect, useState } from 'react'

export function LfFilters() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    setReduced(mq.matches)
    const on = () => setReduced(mq.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])

  return (
    <svg
      id="lf-filter-defs"
      width="0"
      height="0"
      style={{ position: 'absolute', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <defs>
        <filter id="lf-wobble" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves={2} seed={3} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={4.5} />
        </filter>
        <filter id="lf-wobble-bold" x="-12%" y="-12%" width="124%" height="124%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={2} seed={7} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={8} />
        </filter>
        <filter id="lf-wash-edge" x="-15%" y="-15%" width="130%" height="130%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" result="b" />
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={3} seed={9} result="n" />
          <feDisplacementMap in="b" in2="n" scale={13} />
        </filter>
        <filter id="lf-dry" x="-15%" y="-40%" width="130%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.3 0.05" numOctaves={2} seed={8} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={5} result="d" />
          <feTurbulence type="fractalNoise" baseFrequency="0.14 0.4" numOctaves={2} seed={5} result="m" />
          <feColorMatrix
            in="m"
            type="matrix"
            values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1.7 -0.3"
            result="mask"
          />
          <feComposite in="d" in2="mask" operator="in" />
        </filter>
        <filter id="lf-boil" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves={2} seed={3} result="n">
            {!reduced && (
              <animate
                attributeName="seed"
                values="3;7;12"
                dur="2s"
                calcMode="discrete"
                repeatCount="indefinite"
              />
            )}
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale={4.5} />
        </filter>
      </defs>
    </svg>
  )
}
