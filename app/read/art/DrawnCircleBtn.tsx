'use client'

// A small drawn circle button with `lf-drawn-border`. Replaces v2 CircleBtn.
// The caller passes the glyph child (typically a drawn arrow or icon).

import type { CSSProperties, ReactNode } from 'react'

interface DrawnCircleBtnProps {
  label: string
  onClick?: () => void
  children: ReactNode
  size?: number
  disabled?: boolean
  style?: CSSProperties
}

export function DrawnCircleBtn({
  label,
  onClick,
  children,
  size = 52,
  disabled,
  style,
}: DrawnCircleBtnProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="lf-press lf-drawn-border"
      style={{
        width: size,
        height: size,
        borderRadius: '50% 48% 52% 50%',
        background: 'var(--paper-bright, #F9F2E3)',
        backgroundImage: 'var(--texture-paper)',
        border: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--ink-soft, #6E5B49)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        flexShrink: 0,
        fontFamily: 'var(--font-display)',
        touchAction: 'manipulation',
        ...style,
      }}
    >
      {children}
    </button>
  )
}
