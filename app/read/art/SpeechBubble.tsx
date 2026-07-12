'use client'

// A drawn cream card that reads as a speech bubble. Warm-brown ink, drawn
// border via `lf-drawn-border`, gentle rotation for hand feel. Replaces the
// v2 SpeechBubble (which used a hard rotated tail square + emoji speaker).

import type { CSSProperties, ReactNode } from 'react'

interface SpeechBubbleProps {
  children: ReactNode
  big?: boolean
  style?: CSSProperties
}

export function SpeechBubble({ children, big = false, style }: SpeechBubbleProps) {
  return (
    <div
      className="lf-drawn-border"
      style={{
        position: 'relative',
        background: 'var(--paper-bright, #F9F2E3)',
        backgroundImage: 'var(--texture-paper)',
        border: 'none',
        borderRadius: big ? '20px 24px 21px 23px' : '16px 20px 17px 19px',
        padding: big ? '16px 20px' : '12px 16px',
        boxShadow: '0 8px 20px -10px rgba(70,54,42,.32)',
        font: big
          ? '700 21px/1.45 var(--font-body)'
          : '700 16px/1.45 var(--font-body)',
        color: 'var(--ink, #46362A)',
        maxWidth: 480,
        transform: 'rotate(-0.4deg)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
