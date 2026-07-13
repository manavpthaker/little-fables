'use client'

// Badge shelf (v4 rebuild) — every badge as a clean card: a colored medallion
// (earned) or a grey silhouette (locked), with its name + description. Badges
// recognize, never gate. On the clean .lf-home foundation.

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BADGES } from '@/lib/read/badges'
import { loadBadges } from '@/lib/read/storage'
import { cp } from '@/lib/read/buddies'
import '../home/home.css'
import './badges.css'

/** Earned-medallion color, keyed off the badge's wash. */
const MEDAL_HEX: Record<string, string> = {
  meadow: '#4E7A54',
  honey: '#CE9236',
  sunset: '#B14D31',
  blush: '#C06A45',
  lilac: '#7C4B6C',
  river: '#3B7A80',
  snow: '#5E6E82',
  canyon: '#C06A45',
}

export default function BadgeShelfPage() {
  const [earned, setEarned] = useState<Set<string>>(new Set())
  const [energy] = useState<'bouncy' | 'calm'>('bouncy')

  useEffect(() => {
    setEarned(new Set(loadBadges().ids))
  }, [])

  return (
    <div className="lf-home">
      <div className="lfh-page">
        <div className="lfh-head">
          <Link href="/read" aria-label="Back home" className="lfh-back">
            <svg width="26" height="26" viewBox="0 0 30 30" aria-hidden="true">
              <path
                d="M19 4 L7 15 L19 26"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <div>
            <h1>My badges</h1>
            <p>Every medallion remembers something you did.</p>
          </div>
        </div>

        <div className="lfb-grid">
          {BADGES.map((b) => {
            const on = earned.has(b.id)
            return (
              <div key={b.id} className="lfb-card" data-earned={on}>
                <div
                  className="lfb-medal"
                  data-earned={on}
                  style={{ ['--medal' as string]: MEDAL_HEX[b.wash ?? 'honey'] ?? '#CE9236' }}
                  aria-hidden="true"
                >
                  {b.emoji}
                </div>
                <div className="lfb-name">{b.name}</div>
                <div className="lfb-how">{on ? cp(b.earnLine, energy) : b.how}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
