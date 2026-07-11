'use client'

// Badge shelf — earned badges (medallion) + locked badges (silhouette + how).
// See design/handoff-v2/app/screens-c.jsx `BadgeShelf`.

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CircleBtn, KidScreen, Medallion, PillNav } from '../components'
import { BADGES } from '@/lib/read/badges'
import { loadBadges } from '@/lib/read/storage'
import { cp } from '@/lib/read/buddies'

export default function BadgeShelfPage() {
  const [earned, setEarned] = useState<Set<string>>(new Set())
  const [energy] = useState<'bouncy' | 'calm'>('bouncy')
  useEffect(() => {
    setEarned(new Set(loadBadges().ids))
  }, [])
  return (
    <KidScreen label="Badge shelf" style={{ paddingBottom: 110 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '26px 32px 0' }}>
        <Link href="/read" aria-label="Back home" style={{ textDecoration: 'none' }}>
          <CircleBtn label="Back home" size={52}>
            ‹
          </CircleBtn>
        </Link>
        <div>
          <h1 style={{ margin: 0, font: '700 27px var(--font-display)' }}>My badges</h1>
          <p style={{ margin: '2px 0 0', font: '600 14px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
            <span aria-hidden="true">🔊</span> Every badge remembers something you did.
          </p>
        </div>
      </header>

      <div
        style={{
          padding: '32px 32px 96px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 22,
          alignItems: 'start',
        }}
      >
        {BADGES.map((b) => {
          const on = earned.has(b.id)
          return (
            <div
              key={b.id}
              style={{
                background: 'var(--lf-cream-card)',
                border: on ? '1.5px solid var(--lf-cream-line)' : '1.5px dashed var(--lf-cream-line)',
                borderRadius: 'var(--radius-card)',
                padding: '24px 18px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                boxShadow: on ? 'var(--shadow-warm)' : 'none',
              }}
            >
              <Medallion badge={b} size={116} silhouette={!on} />
              <div
                style={{
                  font: '700 18px var(--font-display)',
                  color: on ? 'var(--lf-espresso)' : 'var(--lf-espresso-faint)',
                }}
              >
                {b.name}
              </div>
              <div
                style={{
                  font: '600 13.5px/1.5 var(--font-body)',
                  color: 'var(--lf-espresso-soft)',
                  textWrap: 'balance',
                }}
              >
                {on ? cp(b.earnLine, energy) : b.how}
              </div>
            </div>
          )
        })}
      </div>

      <PillNav active="home" />
    </KidScreen>
  )
}
