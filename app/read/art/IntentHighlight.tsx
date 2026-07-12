'use client'

// A coral pulse wrapper that fires when an intent lands on a specific
// element. Wrap Continue cards / book covers / nav zones. The `active`
// prop is set true by the caller for ~1.4s (matches HIGHLIGHT_MS in
// lib/read/intents.ts) — the CSS `.lf-intent-highlight` keyframe runs
// 2-3 coral pulses and ends.

import type { CSSProperties, ReactNode } from 'react'

interface IntentHighlightProps {
  active: boolean
  children: ReactNode
  style?: CSSProperties
  /** Extra class (e.g. small-screen room overrides). Composes with `active`. */
  className?: string
}

export function IntentHighlight({ active, children, style, className }: IntentHighlightProps) {
  return (
    <span
      className={[active ? 'lf-intent-highlight' : '', className ?? ''].filter(Boolean).join(' ') || undefined}
      style={{
        display: 'inline-block',
        borderRadius: 'var(--radius-card, 18px)',
        ...style,
      }}
    >
      {children}
    </span>
  )
}
