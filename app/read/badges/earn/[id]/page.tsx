'use client'

// Badge earning — confetti + big medallion + spoken earnLine + Keep going CTA.
// See design/handoff-v2/app/screens-c.jsx `BadgeEarn`.

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { BuddyFace, Confetti, KidScreen, Medallion, SpeechBubble } from '../../../components'
import { BADGES } from '@/lib/read/badges'
import { clearPendingBadge, loadBuddy } from '@/lib/read/storage'
import { getBuddy, cp } from '@/lib/read/buddies'
import { speak, type SpeakHandle } from '@/lib/read/speech'

export default function BadgeEarnPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''
  const router = useRouter()
  const badge = BADGES.find((b) => b.id === id) ?? BADGES[0]
  const bs = typeof window !== 'undefined' ? loadBuddy() : { activeId: null, energy: 'bouncy' as const }
  const buddy = getBuddy(bs.activeId)
  const energy = bs.energy as 'bouncy' | 'calm'

  const speakRef = useRef<SpeakHandle | null>(null)
  useEffect(() => {
    speakRef.current = speak(cp(badge.earnLine, energy))
    clearPendingBadge()
    return () => speakRef.current?.cancel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return (
    <KidScreen label={`Badge earning — ${badge.name}`}>
      <Confetti n={20} />
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
        <div className="lf-pop-in">
          <Medallion badge={badge} size={220} />
        </div>
        <h1 style={{ margin: 0, font: '700 36px var(--font-display)', color: 'var(--lf-espresso)' }}>{badge.name}!</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <BuddyFace buddy={buddy} size={68} />
          <SpeechBubble>{cp(badge.earnLine, energy)}</SpeechBubble>
        </div>
        <button
          type="button"
          onClick={() => router.push('/read/badges')}
          className="lf-press"
          style={{
            width: 260,
            padding: '14px 20px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--lf-coral)',
            color: '#fff',
            border: 'none',
            font: '700 18px var(--font-display)',
            boxShadow: 'var(--shadow-coral-glow)',
            cursor: 'pointer',
            minHeight: 56,
          }}
        >
          Keep going!
        </button>
      </div>
    </KidScreen>
  )
}
