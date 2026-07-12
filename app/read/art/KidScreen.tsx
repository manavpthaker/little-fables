'use client'

// A thin room wrapper — sets up the `.lf-room` token scope + mounts the
// global filters. Replaces v2 KidScreen (which baked in ✦/〰 doodles).
// The Drawn Room itself provides atmosphere; this wrapper only owns the
// screen shell.

import type { CSSProperties, ReactNode } from 'react'

interface KidScreenProps {
  label?: string
  children: ReactNode
  style?: CSSProperties
}

export function KidScreen({ label, children, style }: KidScreenProps) {
  return (
    <div
      data-screen-label={label}
      className="lf-room lf-screen-in"
      style={{
        position: 'relative',
        minHeight: '100dvh',
        background: 'var(--paper, #F4EBD8)',
        color: 'var(--ink, #46362A)',
        fontFamily: 'var(--font-body)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
