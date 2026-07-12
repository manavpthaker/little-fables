'use client'

// Badge shelf — earned badges as drawn medallions on a shelf; locked as
// silhouettes. Day register (the shelf is part of the room).

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { DrawnCircleBtn, KidScreen, BackArrowIcon } from '../art'
import { BADGES } from '@/lib/read/badges'
import { loadBadges } from '@/lib/read/storage'
import { cp } from '@/lib/read/buddies'
import type { BadgeDef } from '@/types/story'

const PIGMENT_BY_WASH: Record<string, string> = {
  canyon: '#7C9A62',
  sunset: '#D95B43',
  meadow: '#7C9A62',
  lilac: '#5B4B7A',
  blush: '#D95B43',
  river: '#4E7FA3',
  snow: '#5D6A8A',
  honey: '#E2A93B',
}

function DrawnMedallion({
  badge,
  size = 116,
  silhouette,
}: {
  badge: BadgeDef
  size?: number
  silhouette?: boolean
}) {
  const pigment = PIGMENT_BY_WASH[badge.wash ?? 'honey'] ?? '#E2A93B'
  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {/* wobbly disc */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        style={{ position: 'absolute', inset: 0 }}
      >
        <path
          d="M 60 6 Q 96 8 112 42 Q 118 74 92 106 Q 58 118 24 100 Q 4 68 12 38 Q 30 8 60 6 Z"
          fill={silhouette ? 'transparent' : pigment}
          stroke={silhouette ? '#97836B' : '#46362A'}
          strokeWidth={silhouette ? '2.4' : '3'}
          strokeDasharray={silhouette ? '4 5' : undefined}
          opacity={silhouette ? 0.55 : 0.95}
        />
        {!silhouette && (
          <path
            d="M 60 12 Q 92 14 106 44 Q 110 74 88 100 Q 58 110 30 96 Q 12 68 20 40 Q 34 14 60 12 Z"
            fill="none"
            stroke="rgba(249,242,227,.55)"
            strokeWidth="2"
          />
        )}
      </svg>
      <span
        style={{
          position: 'relative',
          fontSize: size * 0.42,
          filter: silhouette ? 'grayscale(1) opacity(.35)' : 'drop-shadow(0 1px 2px rgba(0,0,0,.15))',
        }}
      >
        {badge.emoji}
      </span>
    </div>
  )
}

export default function BadgeShelfPage() {
  const [earned, setEarned] = useState<Set<string>>(new Set())
  const [energy] = useState<'bouncy' | 'calm'>('bouncy')
  useEffect(() => {
    setEarned(new Set(loadBadges().ids))
  }, [])

  return (
    <KidScreen label="Badge shelf" style={{ padding: 0, paddingBottom: 110 }}>
      <div
        className="lf-room"
        style={{
          position: 'relative',
          minHeight: '100dvh',
          background: 'var(--paper, #F4EBD8)',
          backgroundImage: 'var(--texture-paper)',
          color: 'var(--ink, #46362A)',
          paddingBottom: 110,
        }}
      >
        <header style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '24px 32px 0' }}>
          <Link href="/read" aria-label="Back home" style={{ textDecoration: 'none' }}>
            <DrawnCircleBtn label="Back home" size={52}>
              <BackArrowIcon size={26} />
            </DrawnCircleBtn>
          </Link>
          <div>
            <h1 style={{ margin: 0, font: '700 32px var(--font-display)' }}>My badges</h1>
            <p style={{ margin: '2px 0 0', font: '600 14px var(--font-body)', fontStyle: 'italic', color: 'var(--ink-soft, #6E5B49)' }}>
              Every medallion remembers something you did.
            </p>
          </div>
        </header>

        {/* The shelf itself — a drawn plank behind the medallions */}
        <div
          style={{
            position: 'relative',
            padding: '36px 32px 96px',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 24,
              right: 24,
              top: 138,
              height: 14,
              background: '#5B4637',
              backgroundImage: 'var(--texture-paper)',
              borderRadius: '4px 8px 5px 7px',
              boxShadow: '0 8px 18px -6px rgba(70,54,42,.45)',
              zIndex: 0,
            }}
          />

          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 26,
              alignItems: 'start',
            }}
          >
            {BADGES.map((b) => {
              const on = earned.has(b.id)
              return (
                <div
                  key={b.id}
                  className={on ? undefined : undefined}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                    textAlign: 'center',
                    opacity: on ? 1 : 0.75,
                  }}
                >
                  <DrawnMedallion badge={b} size={116} silhouette={!on} />
                  <div
                    style={{
                      font: '700 18px var(--font-display)',
                      color: on ? 'var(--ink, #46362A)' : 'var(--ink-faint, #97836B)',
                    }}
                  >
                    {b.name}
                  </div>
                  <div
                    style={{
                      font: '600 13.5px/1.5 var(--font-body)',
                      fontStyle: 'italic',
                      color: 'var(--ink-soft, #6E5B49)',
                      textWrap: 'balance',
                      maxWidth: 200,
                    }}
                  >
                    {on ? cp(b.earnLine, energy) : b.how}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </KidScreen>
  )
}
