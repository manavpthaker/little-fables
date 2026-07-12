'use client'

// Belly-breath moment — extracted from the previous reader inline component.
// - "bloom" circle swells on the in-breath, releases on the out-breath.
// - Auto-completes after 4 cycles (~10s) unless the child taps 'I did it'.
// - Reduced-motion: no bloom animation; the prompt still switches in/out.
//
// Behavior preserved verbatim from the pre-v3 reader.

import { useEffect, useState } from 'react'

export interface BreatheAlongProps {
  done: boolean
  onDone: () => void
}

export function BreatheAlong({ done, onDone }: BreatheAlongProps) {
  const [phase, setPhase] = useState<'in' | 'out'>('in')

  useEffect(() => {
    let n = 0
    const iv = setInterval(() => {
      n += 1
      setPhase((p) => (p === 'in' ? 'out' : 'in'))
      if (n >= 4) {
        clearInterval(iv)
        onDone()
      }
    }, 2600)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <div
        className={done ? '' : 'lf-breathe-slow'}
        aria-hidden="true"
        style={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          flexShrink: 0,
          background: 'var(--lf-pastel-mint)',
          border: '1.5px solid var(--lf-cream-line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 34,
          filter: 'var(--shadow-emoji)',
        }}
      >
        🫧
      </div>
      <div>
        <div
          style={{
            font: '700 11px var(--font-body)',
            color: 'var(--lf-espresso-faint)',
            textTransform: 'uppercase',
            letterSpacing: '.07em',
            marginBottom: 4,
          }}
        >
          breathe along
        </div>
        <div style={{ font: '700 21px var(--font-display)', color: 'var(--lf-espresso)' }}>
          {done ? 'Ahhh. All calm.' : phase === 'in' ? 'In…' : 'and out…'}
        </div>
        <div style={{ font: '600 13.5px var(--font-body)', color: 'var(--lf-espresso-soft)', marginTop: 3 }}>
          {done ? 'You will too.' : 'Follow the circle with your belly.'}
        </div>
      </div>
    </div>
  )
}
