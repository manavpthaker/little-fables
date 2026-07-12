'use client'

// A drawn progress ring — cream disc with a warm-brown ink outline, coral
// fill for the read arc. Replaces v2 ProgressRing.

import type { CSSProperties } from 'react'

const INK = 'var(--ink, #46362A)'

interface DrawnProgressRingProps {
  value?: number
  size?: number
  stroke?: number
  style?: CSSProperties
}

export function DrawnProgressRing({
  value = 0,
  size = 44,
  stroke = 5,
  style,
}: DrawnProgressRingProps) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', overflow: 'visible', ...style }}
      aria-hidden="true"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="var(--paper-bright, #F9F2E3)"
        stroke={INK}
        strokeOpacity="0.35"
        strokeWidth={stroke}
        filter="url(#lf-wobble)"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--pigment-terracotta, #D95B43)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${c * value} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        filter="url(#lf-wobble)"
      />
    </svg>
  )
}
