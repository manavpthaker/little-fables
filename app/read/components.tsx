'use client'

// Shared kid-facing components (Dream Paper system).
// Ported from design/handoff/app/shared.jsx (Doodles, CircleBtn, BigMic,
// PillNav, OfflineBanner) and design/handoff/_ds/.../_ds_bundle.js
// (AskBubble, ChoiceCards, VocabStar). No iOS StatusBar — the real PWA has
// a real status bar.

import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'

// ---- Faint paper doodles (Home / End only) ----
export function Doodles() {
  const marks: Array<{
    ch: string
    size: number
    top?: number
    bottom?: number
    left?: number
    right?: number
  }> = [
    { ch: '✦', top: 130, left: 30, size: 30 },
    { ch: '✦', top: 90, right: 260, size: 22 },
    { ch: '〰', bottom: 120, left: 380, size: 28 },
    { ch: '✦', bottom: 160, right: 40, size: 26 },
  ]
  return (
    <>
      {marks.map((m, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            position: 'absolute',
            color: 'var(--sw-doodle)',
            opacity: 0.07,
            fontSize: m.size,
            top: m.top,
            bottom: m.bottom,
            left: m.left,
            right: m.right,
            pointerEvents: 'none',
          }}
        >
          {m.ch}
        </span>
      ))}
    </>
  )
}

// ---- Circle icon button ----
type CircleBtnProps = {
  label: string
  onClick?: () => void
  children: ReactNode
  size?: number
  disabled?: boolean
  style?: CSSProperties
}
export function CircleBtn({ label, onClick, children, size = 52, disabled, style }: CircleBtnProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="lf-press"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--lf-cream-card)',
        border: '1.5px solid var(--lf-cream-line)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.42),
        color: 'var(--lf-espresso-soft)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        flexShrink: 0,
        fontFamily: 'var(--font-display)',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

// ---- THE coral mic (breathes; pulsing rings while listening) ----
type BigMicProps = {
  size?: number
  listening?: boolean
  onTap?: () => void
  label?: string
  disabled?: boolean
}
export function BigMic({ size = 104, listening = false, onTap, label = 'Say it out loud', disabled }: BigMicProps) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: size, height: size, flexShrink: 0 }}>
      {listening && (
        <>
          <span className="sw-ring" />
          <span className="sw-ring sw-ring2" />
          <span className="sw-ring sw-ring3" />
        </>
      )}
      <button
        type="button"
        aria-label={label}
        onClick={onTap}
        disabled={disabled}
        className={'lf-press' + (listening ? '' : ' sw-breathe')}
        style={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: '50%',
          border: 'none',
          cursor: disabled ? 'default' : 'pointer',
          background: listening ? 'var(--lf-coral-deep)' : 'var(--lf-coral)',
          boxShadow: 'var(--shadow-coral-glow)',
          fontSize: Math.round(size * 0.42),
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span aria-hidden="true">🎤</span>
      </button>
    </span>
  )
}

// ---- Offline banner (edge state) ----
export function OfflineBanner() {
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        background: 'var(--lf-pastel-peach)',
        padding: '12px 24px',
        font: 'var(--text-label)',
        color: 'var(--lf-espresso)',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 20 }}>☁️</span>
      <span>No internet — your saved stories still work!</span>
    </div>
  )
}

// ---- Floating pill nav (Home / Grown-ups) ----
export function PillNav({ active }: { active: 'home' | 'grownups' }) {
  const items = [
    { id: 'home' as const, emoji: '⌂', label: 'Home', href: '/read' },
    { id: 'grownups' as const, emoji: '⚙', label: 'Grown-ups', href: '/read/parent' },
  ]
  return (
    <nav
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 18,
        background: 'var(--lf-cream-card)',
        border: '1.5px solid var(--lf-cream-line)',
        borderRadius: 'var(--radius-pill)',
        boxShadow: 'var(--shadow-warm)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 10px',
        zIndex: 10,
      }}
    >
      {items.map((it) => {
        const isActive = active === it.id
        return (
          <Link
            key={it.id}
            href={it.href}
            className="lf-press"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 9,
              textDecoration: 'none',
              background: isActive ? 'var(--lf-espresso)' : 'transparent',
              color: isActive ? 'var(--lf-cream)' : 'var(--lf-espresso-faint)',
              borderRadius: 'var(--radius-pill)',
              padding: isActive ? '12px 26px' : '12px 20px',
              font: 'var(--text-label)',
              fontFamily: 'var(--font-display)',
              minHeight: 'var(--touch-target)',
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 19 }}>{it.emoji}</span>
            {it.label}
          </Link>
        )
      })}
    </nav>
  )
}

// ---- AskBubble: teaching moment ("ask" block, Dream Paper) ----
// States: question (coral mic), praise (mint), hint (peach).
export type AskState = 'question' | 'listening' | 'praise' | 'hint'

type AskBubbleProps = {
  question: string
  praise: string
  hint: string
  skill: string
  state: AskState
  onMicTap?: () => void
  /** Fallback affordance when speech recognition is unavailable. */
  onSayIt?: () => void
  /** True after 2 unmatched attempts — surfaces the hint alongside a "count me in" retry. */
  fallbackUnlocked?: boolean
}
export function AskBubble({
  question,
  praise,
  hint,
  skill,
  state,
  onMicTap,
  onSayIt,
  fallbackUnlocked,
}: AskBubbleProps) {
  const listening = state === 'listening'
  const settled = state === 'praise' || state === 'hint'

  if (settled) {
    const isPraise = state === 'praise'
    return (
      <div className="sw-fade-up" style={{ display: 'flex', alignItems: 'center', gap: 12, background: isPraise ? 'var(--lf-pastel-mint)' : 'var(--lf-pastel-peach)', borderRadius: 14, padding: '12px 14px' }}>
        <span aria-hidden="true" style={{ fontSize: 22, flexShrink: 0 }}>{isPraise ? '🎉' : '💡'}</span>
        <div style={{ font: '700 15.5px/1.4 var(--font-body)', color: 'var(--lf-espresso)' }}>
          {isPraise ? praise : hint}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button
        type="button"
        aria-label={listening ? 'I’m listening' : 'Answer out loud'}
        onClick={onMicTap}
        className="lf-press lf-ask-mic"
        style={{
          width: 46,
          height: 46,
          flexShrink: 0,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          background: listening ? 'var(--lf-coral-deep)' : 'var(--lf-coral)',
          fontSize: 19,
          color: 'var(--sw-on-action)',
        }}
      >
        🎤
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        {skill && (
          <div style={{ font: '700 10px var(--font-body)', color: 'var(--lf-espresso-faint)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
            {skill}
          </div>
        )}
        <div style={{ font: '700 15.5px/1.4 var(--font-body)', color: 'var(--lf-espresso)' }}>
          {listening ? 'I’m listening…' : question}
        </div>
        {onSayIt && (
          <button
            type="button"
            onClick={onSayIt}
            className="lf-press"
            style={{
              marginTop: 8,
              background: 'var(--lf-pastel-lilac)',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              padding: '9px 16px',
              font: '700 14px var(--font-body)',
              color: 'var(--lf-espresso)',
              cursor: 'pointer',
              minHeight: 40,
            }}
          >
            {fallbackUnlocked ? 'I said it!' : 'Tap here when you said it'}
          </button>
        )}
      </div>
    </div>
  )
}

// ---- ChoiceCards: 2-3 tappable cream cards ----
type ChoiceOptionUI = { label: string; emoji: string }
type ChoiceCardsProps = {
  prompt: string
  options: ChoiceOptionUI[]
  chosen: string | null
  onChoose: (o: ChoiceOptionUI) => void
}
export function ChoiceCards({ prompt, options, chosen, onChoose }: ChoiceCardsProps) {
  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-display)' }}>
      {prompt && (
        <div style={{ font: '700 20px/1.3 var(--font-display)', color: 'var(--lf-espresso)', textAlign: 'center', marginBottom: 12 }}>
          {prompt}
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(options.length, 3)}, 1fr)`,
          gap: 10,
        }}
      >
        {options.map((o) => {
          const isChosen = chosen === o.label
          const dim = chosen != null && !isChosen
          return (
            <button
              key={o.label}
              type="button"
              className="lf-press"
              onClick={() => onChoose(o)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                border: isChosen ? '2.5px solid var(--lf-coral)' : '2px solid var(--lf-cream-line)',
                background: isChosen ? 'var(--lf-pastel-peach)' : 'var(--lf-cream-card)',
                borderRadius: 'var(--radius-cover)',
                padding: '16px 12px',
                color: 'var(--lf-espresso)',
                opacity: dim ? 0.45 : 1,
                minHeight: 'var(--touch-target)',
                cursor: 'pointer',
                boxShadow: isChosen ? 'var(--shadow-coral-glow)' : 'none',
                transition: 'opacity 650ms var(--ease-out), box-shadow 300ms var(--ease-out), background 300ms var(--ease-out)',
                fontFamily: 'var(--font-display)',
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 44, lineHeight: 1.1, filter: 'var(--shadow-emoji)' }}>{o.emoji}</span>
              <span style={{ font: '600 15px/1.25 var(--font-display)', textAlign: 'center' }}>{o.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---- VocabStar: peach vocabulary pill; lights coral while active ----
type VocabStarProps = { word: string; active: boolean; onTap: () => void }
export function VocabStar({ word, active, onTap }: VocabStarProps) {
  return (
    <button
      type="button"
      className="lf-press"
      onClick={onTap}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        border: 'none',
        background: active ? 'var(--lf-coral)' : 'var(--lf-pastel-peach)',
        color: active ? 'var(--sw-on-action)' : 'var(--lf-espresso)',
        borderRadius: 'var(--radius-pill)',
        padding: '11px 18px',
        font: '700 16px var(--font-body)',
        minHeight: 'var(--touch-target)',
        cursor: 'pointer',
        boxShadow: active ? 'var(--shadow-coral-glow)' : 'none',
        transition: 'background 200ms, color 200ms, box-shadow 200ms',
      }}
    >
      <span aria-hidden="true">⭐</span>
      {word}
    </button>
  )
}

// ---- Progress bar with a knob (Reader footer) ----
export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div style={{ height: 7, borderRadius: 999, background: 'var(--lf-cream-line)', position: 'relative' }}>
      <span
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: pct + '%',
          borderRadius: 999,
          background: 'var(--lf-coral)',
          transition: 'width 300ms var(--ease-out)',
        }}
      />
      <span
        style={{
          position: 'absolute',
          left: pct + '%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: 'var(--lf-coral)',
          boxShadow: '0 0 0 4px var(--lf-cream)',
          transition: 'left 300ms var(--ease-out)',
        }}
      />
    </div>
  )
}
