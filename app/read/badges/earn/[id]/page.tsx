'use client'

// Badge earning — full lantern register: big drawn medallion + spoken
// earnLine + confetti; primary "Home" is the terracotta CTA once.

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { BuddyFace, Confetti, KidScreen, SpeechBubble } from '../../../components'
import { BADGES } from '@/lib/read/badges'
import { clearPendingBadge, loadBuddy } from '@/lib/read/storage'
import { getBuddy, cp } from '@/lib/read/buddies'
import { speak, type SpeakHandle } from '@/lib/read/speech'
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

function BigMedallion({ badge, size = 220 }: { badge: BadgeDef; size?: number }) {
  const pigment = PIGMENT_BY_WASH[badge.wash ?? 'honey'] ?? '#E2A93B'
  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
        filter: 'drop-shadow(0 0 34px rgba(243,199,122,0.6))',
      }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox="0 0 120 120" style={{ position: 'absolute', inset: 0 }}>
        <path
          d="M 60 4 Q 98 6 114 42 Q 120 76 92 108 Q 58 120 22 100 Q 2 68 12 36 Q 30 6 60 4 Z"
          fill={pigment}
          stroke="#46362A"
          strokeWidth="3.5"
        />
        <path
          d="M 60 12 Q 92 14 106 44 Q 110 74 88 100 Q 58 110 30 96 Q 12 68 20 40 Q 34 14 60 12 Z"
          fill="none"
          stroke="rgba(249,242,227,.65)"
          strokeWidth="2.4"
        />
      </svg>
      <span
        style={{
          position: 'relative',
          fontSize: size * 0.42,
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.18))',
        }}
      >
        {badge.emoji}
      </span>
    </div>
  )
}

export default function BadgeEarnPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''
  const router = useRouter()
  const badge = BADGES.find((b) => b.id === id) ?? BADGES[0]
  const bs = typeof window !== 'undefined' ? loadBuddy() : { activeId: null, energy: 'bouncy' as const }
  const buddy = getBuddy(bs.activeId)
  const energy = bs.energy as 'bouncy' | 'calm'
  const [settled, setSettled] = useState(false)

  const speakRef = useRef<SpeakHandle | null>(null)
  useEffect(() => {
    speakRef.current = speak(cp(badge.earnLine, energy))
    clearPendingBadge()
    const t = setTimeout(() => setSettled(true), 2400)
    return () => {
      clearTimeout(t)
      speakRef.current?.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return (
    <KidScreen label={`Badge earning — ${badge.name}`} style={{ padding: 0 }}>
      <div
        className="lf-room"
        data-register="lantern"
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          background: 'var(--lantern-indigo, #22304A)',
          backgroundImage: 'var(--texture-paper)',
          color: 'var(--lantern-gold, #F3C77A)',
        }}
      >
        {/* light bloom */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '50%',
            top: '48%',
            width: 780,
            height: 560,
            transform: 'translate(-50%,-50%)',
            background: 'radial-gradient(ellipse at center, rgba(243,199,122,0.35), transparent 62%)',
            pointerEvents: 'none',
          }}
        />
        <Confetti n={16} />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 22,
            padding: 32,
          }}
        >
          <div className="lf-breath">
            <BigMedallion badge={badge} size={220} />
          </div>
          <h1 style={{ margin: 0, font: '700 40px var(--font-display)', color: 'var(--lantern-gold, #F3C77A)' }}>
            {badge.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, maxWidth: 560, flexWrap: 'wrap', justifyContent: 'center' }}>
            <BuddyFace buddy={buddy} size={72} />
            <SpeechBubble>{cp(badge.earnLine, energy)}</SpeechBubble>
          </div>
          {settled && (
            <button
              type="button"
              onClick={() => router.push('/read')}
              className="lf-press lf-drawn-border lf-drawn-border--bold"
              style={{
                minHeight: 68,
                padding: '14px 36px',
                borderRadius: '22px 26px 23px 25px',
                background: 'var(--pigment-terracotta, #D95B43)',
                backgroundImage: 'var(--texture-paper)',
                color: '#F9F2E3',
                border: 'none',
                font: '700 22px var(--font-display)',
                boxShadow: '0 8px 18px rgba(217,91,67,.4)',
                cursor: 'pointer',
              }}
            >
              Home ⌂
            </button>
          )}
        </div>
      </div>
    </KidScreen>
  )
}
