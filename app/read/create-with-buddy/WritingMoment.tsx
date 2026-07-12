'use client'

// R22a: the "writing moment" — a diegetic loading state that replaces the
// spinner while /api/story generates the child's story. Design: buddy face at
// left; open book beside her; the recipe's want / reason / obstacle appear in
// sequence on the book's pages in a handwritten watercolor style. A small pip
// pulses at the bottom while the network is still working; there is NO wheel,
// NO percentage bar, and the buddy speaks softly in the background.
//
// Reduced-motion safe: the write-in animation collapses to a fade-in (see
// read.css @media prefers-reduced-motion:reduce block).

import { useEffect, useMemo, useRef, useState } from 'react'
import { speak, type SpeakHandle } from '@/lib/read/speech'
import type { BuddyDef, KidInterview } from '@/types/story'
import { BuddyFace, KidScreen } from '../components'

interface WritingMomentProps {
  buddy: BuddyDef
  recipe: KidInterview['recipe']
  /**
   * Buddy voice line spoken while the page is showing. If omitted a default
   * is composed from the recipe.
   */
  spokenLine?: string
}

interface Line {
  label: string
  value: string
}

function linesFromRecipe(recipe: KidInterview['recipe']): Line[] {
  const l: Line[] = []
  if (recipe.want) l.push({ label: 'Want', value: recipe.want })
  if (recipe.reason) l.push({ label: 'Because', value: recipe.reason })
  if (recipe.obstacle) l.push({ label: 'Uh oh', value: recipe.obstacle })
  if (recipe.extras) {
    for (const e of recipe.extras) {
      // Keep the extras label lowercase-ish and friendly.
      l.push({ label: e.slot.charAt(0).toUpperCase() + e.slot.slice(1), value: e.value })
    }
  }
  return l
}

export function WritingMoment({ buddy, recipe, spokenLine }: WritingMomentProps) {
  const lines = useMemo(() => linesFromRecipe(recipe), [recipe])
  const [visibleCount, setVisibleCount] = useState(0)
  const speakRef = useRef<SpeakHandle | null>(null)

  // Stagger each line's appearance so the child sees his words being written.
  useEffect(() => {
    if (lines.length === 0) return
    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 0; i < lines.length; i++) {
      timers.push(setTimeout(() => setVisibleCount((c) => Math.max(c, i + 1)), 900 + i * 1400))
    }
    return () => timers.forEach(clearTimeout)
  }, [lines.length])

  // Buddy speaks once on mount — soft, one line.
  useEffect(() => {
    const text = spokenLine
      ?? [
        recipe.want ? `${recipe.want.replace(/[.!?]$/, '')}.` : '',
        recipe.reason ? `Because ${recipe.reason.replace(/^because\s+/i, '').replace(/[.!?]$/, '')}.` : '',
        recipe.obstacle ? `And uh oh: ${recipe.obstacle.replace(/[.!?]$/, '')}.` : '',
        `Let's find out how it turns out.`,
      ]
        .filter(Boolean)
        .join(' ')
    if (text) speakRef.current = speak(text)
    return () => {
      speakRef.current?.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <KidScreen label="Writing your story" style={{ padding: 0 }}>
      <div
        className="lf-writing-moment"
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 44,
            maxWidth: 1000,
            width: '100%',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              flexShrink: 0,
            }}
          >
            <BuddyFace buddy={buddy} size={140} />
            <div style={{ font: '600 15px var(--font-body)', color: 'var(--lf-espresso-soft)', maxWidth: 200, textAlign: 'center' }}>
              …writing your story…
            </div>
          </div>

          {/* The open book — two-page spread rendered in cream on cream. */}
          <div
            aria-label="Buddy's book"
            style={{
              position: 'relative',
              width: 'min(560px, 90vw)',
              minHeight: 360,
              background: 'var(--lf-cream-card)',
              border: '2px solid var(--lf-cream-line)',
              borderRadius: 12,
              boxShadow: 'var(--shadow-warm-lg)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              overflow: 'hidden',
            }}
          >
            {/* Book spine — a vertical seam down the middle. */}
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: '50%',
                width: 2,
                background: 'linear-gradient(180deg, rgba(59,50,39,.06), rgba(59,50,39,.14), rgba(59,50,39,.06))',
                pointerEvents: 'none',
              }}
            />

            <div style={{ padding: '32px 26px 32px 30px' }}>
              {/* Left page — Want */}
              {lines[0] && visibleCount >= 1 && (
                <BookLine label={lines[0].label} value={lines[0].value} />
              )}
              {/* Second entry can live on the left too if there are ≥2 lines. */}
              {lines[1] && visibleCount >= 2 && (
                <div style={{ marginTop: 22 }}>
                  <BookLine label={lines[1].label} value={lines[1].value} />
                </div>
              )}
            </div>

            <div style={{ padding: '32px 30px 32px 26px' }}>
              {/* Right page — Uh oh + extras */}
              {lines[2] && visibleCount >= 3 && (
                <BookLine label={lines[2].label} value={lines[2].value} />
              )}
              {lines.slice(3).map((l, i) =>
                visibleCount >= 4 + i ? (
                  <div key={i} style={{ marginTop: i === 0 ? 0 : 22 }}>
                    <BookLine label={l.label} value={l.value} />
                  </div>
                ) : null,
              )}
            </div>
          </div>
        </div>

        {/* Small quiet pulsing dot at the bottom — the only motion cue that
            work is still happening. */}
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 40,
            display: 'inline-flex',
            gap: 8,
            alignItems: 'center',
            font: '600 13px var(--font-body)',
            color: 'var(--lf-espresso-faint)',
          }}
        >
          <span
            className="lf-writing-dot"
            style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--lf-coral)' }}
          />
          <span>Baking your story</span>
        </div>
      </div>
    </KidScreen>
  )
}

function BookLine({ label, value }: Line) {
  return (
    <div className="lf-writing-line">
      <div
        style={{
          font: '700 11px var(--font-body)',
          textTransform: 'uppercase',
          letterSpacing: '.09em',
          color: 'var(--lf-espresso-faint)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        className="lf-writing-ink"
        style={{
          font: '700 21px/1.35 var(--font-display)',
          color: 'var(--lf-espresso)',
          // hint of handwritten look — a very small skew and letter-spacing
          transform: 'rotate(-0.4deg)',
          transformOrigin: '0 50%',
          letterSpacing: '.005em',
        }}
      >
        {value}
      </div>
    </div>
  )
}
