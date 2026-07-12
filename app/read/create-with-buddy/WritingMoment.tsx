'use client'

// R22a: the "writing moment" — a diegetic loading state that replaces the
// spinner while /api/story generates the child's story.
//
// v3 Drawn Room: the writing moment lands on a drawn desk. Fable's inkpot
// sits alongside the buddy; the child's transcribed words appear in Caveat
// handwriting on an open book. Fable narrates the recipe softly.
// Reduced-motion safe — words fade in without keyframes.

import { useEffect, useMemo, useRef, useState } from 'react'
import { speak, type SpeakHandle } from '@/lib/read/speech'
import type { BuddyDef, KidInterview } from '@/types/story'
import { BuddyFace, KidScreen } from '../components'

interface WritingMomentProps {
  buddy: BuddyDef
  recipe: KidInterview['recipe']
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
      l.push({ label: e.slot.charAt(0).toUpperCase() + e.slot.slice(1), value: e.value })
    }
  }
  return l
}

export function WritingMoment({ buddy, recipe, spokenLine }: WritingMomentProps) {
  const lines = useMemo(() => linesFromRecipe(recipe), [recipe])
  const [visibleCount, setVisibleCount] = useState(0)
  const speakRef = useRef<SpeakHandle | null>(null)

  useEffect(() => {
    if (lines.length === 0) return
    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 0; i < lines.length; i++) {
      timers.push(setTimeout(() => setVisibleCount((c) => Math.max(c, i + 1)), 900 + i * 1400))
    }
    return () => timers.forEach(clearTimeout)
  }, [lines.length])

  useEffect(() => {
    const text =
      spokenLine ??
      [
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
        className="lf-room"
        style={{
          position: 'relative',
          minHeight: '100dvh',
          background: 'var(--paper, #F4EBD8)',
          backgroundImage: 'var(--texture-paper)',
          color: 'var(--ink, #46362A)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 40px',
        }}
      >
        {/* Desk plank beneath */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '32%',
            background: 'linear-gradient(180deg, rgba(91,70,55,.15), rgba(91,70,55,.30))',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 44,
            maxWidth: 1080,
            width: '100%',
            flexWrap: 'wrap',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          {/* Buddy + inkpot column */}
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
            <div
              style={{
                font: '600 15px var(--font-body)',
                fontStyle: 'italic',
                color: 'var(--ink-soft, #6E5B49)',
                maxWidth: 200,
                textAlign: 'center',
              }}
            >
              …writing your story…
            </div>
            {/* Fable's inkpot */}
            <svg width={100} height={100} viewBox="0 0 130 130" aria-hidden="true" style={{ marginTop: 6 }}>
              <path
                d="M 34 55 Q 34 42 50 42 L 90 42 Q 106 42 106 55 L 100 110 Q 100 122 88 122 L 52 122 Q 40 122 40 110 Z"
                fill="#2E8B8B"
                stroke="#46362A"
                strokeWidth="3"
              />
              <ellipse cx="70" cy="42" rx="30" ry="6" fill="#4E7FA3" stroke="#46362A" strokeWidth="2.4" />
              <path d="M 20 12 L 96 76 L 92 88 L 16 22 Z" fill="#5B4637" stroke="#46362A" strokeWidth="2.4" />
            </svg>
          </div>

          {/* The open book */}
          <div
            aria-label="Fable's book"
            className="lf-drawn-border"
            style={{
              position: 'relative',
              width: 'min(580px, 92vw)',
              minHeight: 380,
              background: 'var(--paper-bright, #F9F2E3)',
              backgroundImage: 'var(--texture-paper)',
              borderRadius: '18px 22px 19px 21px',
              boxShadow: '0 18px 40px -18px rgba(70,54,42,.35)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              overflow: 'hidden',
              border: 'none',
              color: 'var(--ink, #46362A)',
              transform: 'rotate(-0.6deg)',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: '50%',
                width: 2,
                background: 'linear-gradient(180deg, rgba(70,54,42,.08), rgba(70,54,42,.22), rgba(70,54,42,.08))',
                pointerEvents: 'none',
              }}
            />

            <div style={{ padding: '32px 26px 32px 30px' }}>
              {lines[0] && visibleCount >= 1 && <BookLine label={lines[0].label} value={lines[0].value} />}
              {lines[1] && visibleCount >= 2 && (
                <div style={{ marginTop: 22 }}>
                  <BookLine label={lines[1].label} value={lines[1].value} />
                </div>
              )}
            </div>

            <div style={{ padding: '32px 30px 32px 26px' }}>
              {lines[2] && visibleCount >= 3 && <BookLine label={lines[2].label} value={lines[2].value} />}
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

        {/* Baking indicator */}
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
            fontStyle: 'italic',
            color: 'var(--ink-soft, #6E5B49)',
          }}
        >
          <span
            className="lf-breath"
            style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--pigment-terracotta, #D95B43)' }}
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
          color: 'var(--ink-faint, #97836B)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        className="lf-writing-ink lf-child-hand"
        style={{
          // Caveat handwriting for the CHILD's words — the whole reason for
          // this moment. `--font-child-hand` is set in the .lf-room token
          // scope; we set an inline fallback to be safe.
          fontFamily: "var(--font-child-hand, 'Caveat'), cursive",
          fontSize: 30,
          lineHeight: 1.25,
          color: 'var(--pigment-berry, #9B4A6B)',
          transform: 'rotate(-0.6deg)',
          transformOrigin: '0 50%',
          letterSpacing: '.005em',
        }}
      >
        {value}
      </div>
    </div>
  )
}
