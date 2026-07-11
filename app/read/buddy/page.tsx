'use client'

// Buddy carousel — pick a story buddy. Uses `pickBuddy()` to persist. When the
// route is `/read/buddy?arrive=rusty`, we render `BuddyArrival` instead (three
// beats: crate wiggles → cracks → the new buddy pops in).
//
// See design/handoff-v2/app/screens-a.jsx `BuddyCarousel` and `BuddyArrival`.

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  BuddyFace,
  Confetti,
  KidScreen,
  NatureTag,
  SpeechBubble,
} from '../components'
import { BUDDIES, cp, getBuddy } from '@/lib/read/buddies'
import { loadBuddy, pickBuddy as savePickBuddy, saveBuddy } from '@/lib/read/storage'
import type { BuddyDef } from '@/types/story'

export default function BuddyPage() {
  return (
    <Suspense fallback={null}>
      <BuddyPageInner />
    </Suspense>
  )
}

function BuddyPageInner() {
  const search = useSearchParams()
  const arrive = search?.get('arrive')
  return arrive ? <BuddyArrival newBuddyId={arrive} /> : <BuddyCarousel />
}

function BuddyCarousel() {
  const router = useRouter()
  const [idx, setIdx] = useState(0)
  const [energy, setEnergy] = useState<'bouncy' | 'calm'>('bouncy')

  useEffect(() => {
    const bs = loadBuddy()
    setEnergy(bs.energy)
    if (bs.activeId) {
      const i = BUDDIES.findIndex((b) => b.id === bs.activeId)
      if (i >= 0) setIdx(i)
    }
  }, [])

  const buddy = BUDDIES[idx]
  const total = BUDDIES.length

  const goPick = () => {
    savePickBuddy(buddy.id)
    router.push('/read')
  }

  const toggleEnergy = () => {
    const next: 'bouncy' | 'calm' = energy === 'bouncy' ? 'calm' : 'bouncy'
    setEnergy(next)
    const bs = loadBuddy()
    saveBuddy({ ...bs, energy: next })
  }

  return (
    <KidScreen label="Buddy carousel">
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 30,
          gap: 4,
        }}
      >
        <h1 style={{ margin: '6px 0 0', font: 'var(--text-greeting)', color: 'var(--lf-espresso)' }}>
          Pick your story buddy!
        </h1>
        <p style={{ margin: 0, font: '600 15px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
          <span aria-hidden="true">🔊</span> Tap a friend to hear them say hello.
        </p>
      </header>

      <div
        style={{
          position: 'relative',
          maxWidth: 520,
          margin: '32px auto 0',
          padding: '0 24px',
        }}
      >
        <div
          className="lf-screen-in"
          key={buddy.id}
          style={{
            background: 'var(--lf-cream-card)',
            border: '1.5px solid var(--lf-cream-line)',
            borderRadius: 'var(--radius-hero)',
            boxShadow: 'var(--shadow-warm-lg)',
            padding: '86px 26px 26px',
            position: 'relative',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <SpeechBubble
            tail="bottom"
            style={{
              position: 'absolute',
              top: -66,
              left: 18,
              right: 18,
              maxWidth: 'none',
              textAlign: 'left',
              font: '700 14.5px/1.4 var(--font-body)',
            }}
          >
            {cp(buddy.intro, energy)}
          </SpeechBubble>
          <BuddyFace buddy={buddy} size={128} />
          <h2 style={{ margin: '14px 0 2px', font: '700 26px var(--font-display)', color: 'var(--lf-espresso)' }}>
            {buddy.name}
          </h2>
          <p style={{ margin: '0 0 10px', font: '600 14px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
            {buddy.trait}
          </p>
          <NatureTag nature={buddy.nature} />
          <button
            type="button"
            className="lf-press"
            onClick={goPick}
            style={{
              marginTop: 16,
              width: 200,
              padding: '13px 20px',
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
            Pick me!
          </button>
        </div>

        {/* prev / next */}
        <button
          type="button"
          aria-label="Previous buddy"
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="lf-press"
          style={{
            position: 'absolute',
            left: -6,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: '1.5px solid var(--lf-cream-line)',
            background: 'var(--lf-cream-card)',
            fontSize: 22,
            cursor: idx === 0 ? 'default' : 'pointer',
            opacity: idx === 0 ? 0.5 : 1,
            boxShadow: 'var(--shadow-warm)',
          }}
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Next buddy"
          onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
          disabled={idx === total - 1}
          className="lf-press"
          style={{
            position: 'absolute',
            right: -6,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: '1.5px solid var(--lf-cream-line)',
            background: 'var(--lf-cream-card)',
            fontSize: 22,
            cursor: idx === total - 1 ? 'default' : 'pointer',
            opacity: idx === total - 1 ? 0.5 : 1,
            boxShadow: 'var(--shadow-warm)',
          }}
        >
          ›
        </button>
      </div>

      {/* dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 9, marginTop: 24 }}>
        {BUDDIES.map((b, i) => (
          <button
            key={b.id}
            type="button"
            aria-label={b.name}
            onClick={() => setIdx(i)}
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              background: i === idx ? 'var(--lf-espresso-soft)' : 'var(--lf-cream-line)',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
        <button
          type="button"
          onClick={toggleEnergy}
          className="lf-press"
          style={{
            background: 'var(--lf-cream-card)',
            border: '1.5px solid var(--lf-cream-line)',
            borderRadius: 'var(--radius-pill)',
            padding: '10px 18px',
            font: '700 14px var(--font-body)',
            color: 'var(--lf-espresso)',
            cursor: 'pointer',
            minHeight: 44,
          }}
        >
          Buddy energy: {energy === 'bouncy' ? 'bouncy' : 'calm'}
        </button>
        <Link
          href="/read"
          className="lf-press"
          style={{
            background: 'var(--lf-cream-card)',
            border: '1.5px solid var(--lf-cream-line)',
            borderRadius: 'var(--radius-pill)',
            padding: '10px 18px',
            font: '700 14px var(--font-body)',
            color: 'var(--lf-espresso-soft)',
            textDecoration: 'none',
            minHeight: 44,
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          Back home
        </Link>
      </div>
    </KidScreen>
  )
}

/* ================= BuddyArrival ================= */
function BuddyArrival({ newBuddyId }: { newBuddyId: string }) {
  const router = useRouter()
  const [beat, setBeat] = useState(0)
  const [energy, setEnergy] = useState<'bouncy' | 'calm'>('bouncy')
  const newBuddy: BuddyDef = getBuddy(newBuddyId)

  useEffect(() => {
    const bs = loadBuddy()
    setEnergy(bs.energy)
  }, [])

  const beats = [
    { bubble: 'Something is bumping around in there…', cta: "What's inside?" },
    { bubble: 'CRACK! One more reading day did it!', cta: 'Open it up!' },
    { bubble: cp(newBuddy.intro, energy), cta: `Say hi, ${newBuddy.name}!` },
  ]

  const onCta = () => {
    if (beat < 2) return setBeat(beat + 1)
    // Unlock + pick the new buddy.
    savePickBuddy(newBuddy.id)
    router.push('/read')
  }

  return (
    <KidScreen label={`Buddy arrival — beat ${beat + 1}`}>
      {beat === 2 && <Confetti n={16} />}
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
        <div style={{ display: 'flex', gap: 8 }} aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: i <= beat ? 'var(--lf-espresso-soft)' : 'var(--lf-cream-line)',
              }}
            />
          ))}
        </div>

        <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {beat < 2 ? (
            <div
              className={beat === 0 ? 'lf-wiggle' : 'lf-shudder'}
              style={{ fontSize: 190, lineHeight: 1, filter: 'var(--shadow-emoji)', position: 'relative' }}
              aria-hidden="true"
            >
              📦
              {beat === 1 && (
                <span style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', fontSize: 60 }}>
                  ⚡
                </span>
              )}
            </div>
          ) : (
            <div className="lf-pop-in">
              <BuddyFace buddy={newBuddy} size={200} tag />
            </div>
          )}
        </div>

        <SpeechBubble tail="bottom" big style={{ textAlign: 'center', maxWidth: 520 }}>
          {beat === 2 && (
            <strong style={{ display: 'block', font: '700 24px var(--font-display)', marginBottom: 4 }}>
              {newBuddy.name} is here!
            </strong>
          )}
          {beats[beat].bubble}
        </SpeechBubble>

        <button
          type="button"
          onClick={onCta}
          className="lf-press"
          style={{
            width: 280,
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
          {beats[beat].cta}
        </button>
      </div>
    </KidScreen>
  )
}
