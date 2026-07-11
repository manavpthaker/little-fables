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

// ============================================================
// v2 components (Dream Paper handoff-v2)
// ============================================================

import type { BuddyDef, BadgeDef, WashKey } from '@/types/story'

// ---- Wash background helper ----
export function washBg(key: WashKey | undefined): string {
  const k = key ?? 'canyon'
  // Three radial gradients composed over paper, matching design/handoff-v2/app/shared.jsx washBg().
  const stops: Record<WashKey, [string, string, string]> = {
    canyon: ['rgba(147,174,189,.55)', 'rgba(168,181,154,.45)', 'rgba(217,160,91,.30)'],
    sunset: ['rgba(217,160,91,.50)',  'rgba(251,225,228,.60)', 'rgba(168,181,154,.28)'],
    meadow: ['rgba(168,181,154,.55)', 'rgba(223,238,221,.65)', 'rgba(147,174,189,.28)'],
    lilac:  ['rgba(233,230,246,.75)', 'rgba(147,174,189,.35)', 'rgba(251,225,228,.45)'],
    blush:  ['rgba(251,225,228,.70)', 'rgba(217,160,91,.30)',  'rgba(233,230,246,.50)'],
    river:  ['rgba(147,174,189,.60)', 'rgba(223,238,221,.55)', 'rgba(233,230,246,.40)'],
    snow:   ['rgba(233,230,246,.65)', 'rgba(147,174,189,.40)', 'rgba(255,255,255,.60)'],
    honey:  ['rgba(217,160,91,.45)',  'rgba(255,232,207,.70)', 'rgba(168,181,154,.30)'],
  }
  const c = stops[k]
  return [
    `radial-gradient(90% 75% at 18% 12%, ${c[0]} 0%, rgba(0,0,0,0) 62%)`,
    `radial-gradient(85% 80% at 85% 30%, ${c[1]} 0%, rgba(0,0,0,0) 60%)`,
    `radial-gradient(110% 85% at 50% 105%, ${c[2]} 0%, rgba(0,0,0,0) 58%)`,
    'var(--lf-cream, #f7f1e3)',
  ].join(', ')
}

// ---- WashScene: painting placeholder tile ----
type WashSceneProps = {
  wash?: WashKey
  img?: string
  emojis?: string[]
  doodle?: boolean
  slotLabel?: string
  children?: ReactNode
  style?: CSSProperties
}
export function WashScene({ wash = 'canyon', img, emojis = [], doodle = true, children, style }: WashSceneProps) {
  const baseH = (style?.height as number | undefined) ?? 200
  const k = Math.min(1, (typeof baseH === 'number' ? baseH : 200) / 200)
  const sizes = [96, 60, 44, 34, 30].map((s) => Math.max(12, Math.round(s * k)))
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: img ? `center / cover no-repeat url("${img}")` : washBg(wash),
        ...style,
      }}
    >
      {!img && doodle && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            color: 'var(--lf-espresso)',
            opacity: 0.07,
            font: '700 20px var(--font-body)',
          }}
        >
          <span style={{ position: 'absolute', top: '12%', right: '14%' }}>✦</span>
          <span style={{ position: 'absolute', bottom: '16%', left: '10%' }}>〰</span>
          <span style={{ position: 'absolute', top: '30%', left: '22%', fontSize: 13 }}>✦</span>
        </div>
      )}
      {!img && emojis.length > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: Math.max(3, Math.round(14 * k)),
            filter: 'var(--shadow-emoji)',
          }}
        >
          {emojis.map((e, i) => (
            <span
              key={i}
              style={{
                fontSize: sizes[i] || sizes[sizes.length - 1],
                transform: `translateY(${(i % 2 ? -10 : 8) * k}px) rotate(${i % 2 ? 4 : -3}deg)`,
              }}
            >
              {e}
            </span>
          ))}
        </div>
      )}
      {children}
    </div>
  )
}

// ---- BuddyFace ----
export function BuddyFace({
  buddy,
  size = 88,
  tag = false,
  style,
}: {
  buddy: BuddyDef
  size?: number
  tag?: boolean
  style?: CSSProperties
}) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, ...style }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: washBg(buddy.wash),
          border: '3px solid var(--lf-cream-card)',
          boxShadow: 'var(--shadow-warm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.52,
        }}
      >
        <span style={{ filter: 'var(--shadow-emoji)' }}>{buddy.emoji}</span>
      </div>
      {tag && <NatureTag nature={buddy.nature} style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)' }} />}
    </div>
  )
}

export function NatureTag({ nature, style }: { nature: 'living' | 'nonliving'; style?: CSSProperties }) {
  const living = nature === 'living'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        whiteSpace: 'nowrap',
        background: living ? 'var(--lf-pastel-mint)' : 'var(--lf-pastel-peach)',
        color: 'var(--lf-espresso)',
        borderRadius: 'var(--radius-scallop)',
        padding: '4px 11px',
        font: 'var(--text-label)',
        ...style,
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 12 }}>{living ? '🌿' : '🪨'}</span>
      {living ? 'living' : 'nonliving'}
    </span>
  )
}

// ---- SpeechBubble ----
export function SpeechBubble({
  children,
  tail = 'left',
  big = false,
  style,
}: {
  children: ReactNode
  tail?: 'left' | 'bottom' | 'right'
  big?: boolean
  style?: CSSProperties
}) {
  const tailPos: Record<string, CSSProperties> = {
    left: { left: -7, top: 26 },
    bottom: { bottom: -7, left: 34 },
    right: { right: -7, top: 26 },
  }
  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--lf-cream-card)',
        border: '1.5px solid var(--lf-cream-line)',
        borderRadius: 18,
        padding: big ? '16px 20px' : '12px 16px',
        boxShadow: 'var(--shadow-warm)',
        font: big ? '700 21px/1.45 var(--font-body)' : '700 16px/1.45 var(--font-body)',
        color: 'var(--lf-espresso)',
        maxWidth: 480,
        ...style,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: 14,
          height: 14,
          background: 'var(--lf-cream-card)',
          borderLeft: '1.5px solid var(--lf-cream-line)',
          borderBottom: '1.5px solid var(--lf-cream-line)',
          transform:
            tail === 'bottom' ? 'rotate(-45deg)' : tail === 'right' ? 'rotate(135deg)' : 'rotate(45deg)',
          ...tailPos[tail],
        }}
      />
      <span aria-hidden="true" style={{ marginRight: 8, fontSize: big ? 18 : 14 }}>🔊</span>
      {children}
    </div>
  )
}

// ---- SunRow: weekly reading suns ----
export function SunRow({
  suns,
  size = 30,
  style,
}: {
  suns: Array<{ letter: string; lit: boolean; today: boolean }>
  size?: number
  style?: CSSProperties
}) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', ...style }}>
      {suns.map((s, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div
            className={s.today && s.lit ? 'lf-sun-today' : ''}
            style={{
              width: size,
              height: size,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: size * 0.62,
              background: s.lit ? 'rgba(251,191,36,.18)' : 'transparent',
              border: s.lit ? '1.5px solid rgba(251,191,36,.55)' : '1.5px solid var(--lf-cream-line)',
              boxShadow: s.lit ? '0 2px 8px rgba(251,191,36,.30)' : 'none',
            }}
          >
            <span style={{ opacity: s.lit ? 1 : 0.28, filter: s.lit ? 'none' : 'grayscale(1)' }}>☀️</span>
          </div>
          <span
            style={{
              font: '700 10.5px var(--font-body)',
              color: s.lit ? 'var(--lf-espresso-soft)' : 'var(--lf-espresso-faint)',
            }}
          >
            {s.letter}
          </span>
        </div>
      ))}
    </div>
  )
}

// ---- ProgressRing (used on chapter-book covers) ----
export function ProgressRing({
  value = 0,
  size = 44,
  stroke = 5,
  style,
}: {
  value?: number
  size?: number
  stroke?: number
  style?: CSSProperties
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={style} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="var(--lf-cream-card)" stroke="var(--lf-cream-line)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--lf-coral)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${c * value} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  )
}

// ---- ChapterDots: ● done / ▶ current / ○ future ----
export function ChapterDots({
  chapters,
  style,
}: {
  chapters: Array<{ status?: 'done' | 'current' | 'painting' }>
  style?: CSSProperties
}) {
  return (
    <span style={{ display: 'inline-flex', gap: 7, alignItems: 'center', ...style }}>
      {chapters
        .filter((c) => c.status !== 'painting')
        .map((ch, i) => (
          <span
            key={i}
            aria-hidden="true"
            style={{
              font: '700 13px var(--font-body)',
              color:
                ch.status === 'current'
                  ? 'var(--lf-coral)'
                  : ch.status === 'done'
                    ? 'var(--lf-espresso-soft)'
                    : 'var(--lf-espresso-faint)',
            }}
          >
            {ch.status === 'current' ? '▶' : ch.status === 'done' ? '●' : '○'}
          </span>
        ))}
    </span>
  )
}

// ---- MatCover: story cover in a cream mat ----
type MatCoverStory = {
  id: string
  title: string
  wash?: WashKey
  coverImage?: string
  coverEmoji?: string
  meta?: string
}
export function MatCover({
  story,
  size = 128,
  onClick,
  ring,
  badge,
}: {
  story: MatCoverStory
  size?: number
  onClick?: () => void
  ring?: number
  badge?: string
}) {
  return (
    <button
      type="button"
      className="lf-press"
      onClick={onClick}
      style={{
        border: '1.5px solid var(--lf-cream-line)',
        background: 'var(--lf-cream-card)',
        borderRadius: 'var(--radius-cover)',
        padding: 9,
        cursor: 'pointer',
        position: 'relative',
        boxShadow: 'var(--shadow-warm)',
        display: 'block',
        textAlign: 'left',
        flexShrink: 0,
      }}
    >
      <WashScene
        wash={story.wash}
        img={story.coverImage}
        emojis={story.coverEmoji ? [story.coverEmoji] : []}
        doodle={!story.coverImage}
        style={{ width: size, height: size, borderRadius: 12 }}
      />
      {ring !== undefined && (
        <span style={{ position: 'absolute', top: 2, right: 2 }}>
          <ProgressRing value={ring} size={36} stroke={4.5} />
        </span>
      )}
      {badge && (
        <span
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 44,
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            background: 'var(--lf-cream-card)',
            border: '1.5px solid var(--lf-cream-line)',
            borderRadius: 'var(--radius-pill)',
            padding: '3px 10px',
            font: '700 11px var(--font-body)',
            color: 'var(--lf-espresso-soft)',
          }}
        >
          {badge}
        </span>
      )}
      <div style={{ width: size, marginTop: 7 }}>
        <div style={{ font: '700 14px/1.25 var(--font-display)', color: 'var(--lf-espresso)' }}>{story.title}</div>
        {story.meta && (
          <div style={{ font: 'var(--text-meta)', color: 'var(--lf-espresso-soft)', marginTop: 2 }}>{story.meta}</div>
        )}
      </div>
    </button>
  )
}

// ---- Medallion: watercolor badge disc ----
export function Medallion({
  badge,
  size = 108,
  silhouette = false,
  style,
}: {
  badge: BadgeDef
  size?: number
  silhouette?: boolean
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        position: 'relative',
        flexShrink: 0,
        background: silhouette ? 'var(--lf-cream)' : washBg(badge.wash),
        border: silhouette ? '2px dashed var(--lf-cream-line)' : '3px solid var(--lf-cream-card)',
        boxShadow: silhouette ? 'none' : 'var(--shadow-warm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <span
        style={{
          fontSize: size * 0.42,
          filter: silhouette ? 'grayscale(1) opacity(.35)' : 'var(--shadow-emoji)',
        }}
      >
        {badge.emoji}
      </span>
      {!silhouette && (
        <span
          aria-hidden="true"
          style={{ position: 'absolute', inset: 5, borderRadius: '50%', border: '1.5px solid rgba(255,253,247,.8)' }}
        />
      )}
    </div>
  )
}

// ---- Confetti: cheap CSS-only celebration ----
export function Confetti({ n = 14 }: { n?: number }) {
  const bits = ['✦', '●', '▲', '✶']
  const colors = ['var(--lf-coral)', 'var(--lf-wc-sage)', 'var(--lf-wc-dustyblue)', 'var(--lf-wc-ochre)', '#fbbf24']
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {Array.from({ length: n }).map((_, i) => (
        <span
          key={i}
          className="lf-confetti-piece"
          style={{
            position: 'absolute',
            left: `${6 + (i * 89) % 90}%`,
            top: -20,
            color: colors[i % colors.length],
            fontSize: 12 + (i * 7) % 14,
            animationDelay: `${(i * 0.17) % 1.4}s`,
            animationDuration: `${2.6 + (i % 4) * 0.5}s`,
          }}
        >
          {bits[i % bits.length]}
        </span>
      ))}
    </div>
  )
}

// ---- Dots: three little bouncing pips ("listening…") ----
export function Dots({ color = 'var(--lf-coral)' }: { color?: string }) {
  return (
    <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="lf-dot"
          style={{ width: 8, height: 8, borderRadius: '50%', background: color, animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  )
}

// ---- KidScreen: full-bleed screen shell (paper doodles baked in) ----
export function KidScreen({
  label,
  children,
  style,
}: {
  label?: string
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div
      data-screen-label={label}
      className="lf-screen-in"
      style={{
        position: 'relative',
        minHeight: '100dvh',
        background: 'var(--lf-cream)',
        color: 'var(--lf-espresso)',
        fontFamily: 'var(--font-body)',
        ...style,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          color: 'var(--lf-espresso)',
          opacity: 0.05,
          pointerEvents: 'none',
          font: '700 22px var(--font-body)',
        }}
      >
        <span style={{ position: 'absolute', top: 26, right: 60 }}>✦</span>
        <span style={{ position: 'absolute', bottom: 90, left: 36 }}>〰</span>
        <span style={{ position: 'absolute', top: '44%', right: 24, fontSize: 14 }}>✦</span>
      </div>
      {children}
    </div>
  )
}

// ---- BuddyPicker: pill list, tap to pick ----
export function BuddyPicker({
  buddies,
  activeId,
  onPick,
}: {
  buddies: BuddyDef[]
  activeId: string | null
  onPick: (id: string) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
      {buddies.map((b) => {
        const active = b.id === activeId
        return (
          <button
            key={b.id}
            type="button"
            className="lf-press"
            onClick={() => onPick(b.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              background: active ? 'var(--lf-pastel-peach)' : 'var(--lf-cream-card)',
              border: active ? '2.5px solid var(--lf-coral)' : '1.5px solid var(--lf-cream-line)',
              borderRadius: 'var(--radius-card)',
              padding: '14px 18px',
              cursor: 'pointer',
              boxShadow: active ? 'var(--shadow-coral-glow)' : 'var(--shadow-warm)',
              minHeight: 56,
            }}
          >
            <BuddyFace buddy={b} size={72} />
            <span style={{ font: '700 15px var(--font-display)', color: 'var(--lf-espresso)' }}>{b.name}</span>
            <span style={{ font: '600 12px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>{b.trait}</span>
          </button>
        )
      })}
    </div>
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
