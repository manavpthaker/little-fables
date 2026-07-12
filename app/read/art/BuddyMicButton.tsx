'use client'

// The buddy IS the mic (PRD R16 / R17). A tap-to-talk button that wraps
// a `<CreatureSprite />` and adds a tiny drawn mic dot on the buddy's
// bottom-right corner. Listening rings pulse when `listening` is true.

import type { CSSProperties } from 'react'
import { CreatureSprite, type BuddyKind } from './buddies'
import { MicIcon } from './props'

interface BuddyMicButtonProps {
  kind: BuddyKind
  size?: number
  listening?: boolean
  onTap?: () => void
  disabled?: boolean
  label?: string
  style?: CSSProperties
}

export function BuddyMicButton({
  kind,
  size = 92,
  listening = false,
  onTap,
  disabled = false,
  label = 'Tap and talk to your buddy',
  style,
}: BuddyMicButtonProps) {
  const dot = Math.round(size * 0.28)
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={listening}
      onClick={onTap}
      disabled={disabled}
      className={
        'lf-press lf-drawn-border ' +
        (listening ? 'lf-buddy-listening' : 'sw-breathe')
      }
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '50%',
        border: 'none',
        padding: 0,
        background: 'transparent',
        cursor: disabled ? 'default' : 'pointer',
        flexShrink: 0,
        transform: listening ? 'scale(1.02)' : 'scale(1)',
        transition: 'transform 260ms cubic-bezier(0.22,1,0.36,1)',
        ...style,
      }}
    >
      {listening && (
        <>
          <span className="sw-ring" />
          <span className="sw-ring sw-ring2" />
          <span className="sw-ring sw-ring3" />
        </>
      )}
      <CreatureSprite kind={kind} pose={listening ? 'listening' : 'idle'} size={size} />
      {/* Tiny drawn mic dot — signals the tap affordance without stealing
          the character. Coral fill + drawn ink ring. */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: 2,
          bottom: 2,
          width: dot,
          height: dot,
          borderRadius: '50%',
          background: listening
            ? 'var(--pigment-terracotta-deep, #C7452F)'
            : 'var(--pigment-terracotta, #D95B43)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid var(--paper-bright, #F9F2E3)',
          boxShadow: 'var(--shadow-coral-glow, 0 0 12px rgba(217,91,67,.5))',
        }}
      >
        <MicIcon size={Math.round(dot * 0.55)} color="#F9F2E3" />
      </span>
    </button>
  )
}
