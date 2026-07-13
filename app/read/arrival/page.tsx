'use client'

// Little Fables — first arrival / buddy picker (v4 rebuild).
// A clean, legible "pick a friend to read with" grid. One tap greets the buddy
// (spoken intro) AND picks it, then Home opens with them chosen — no scattered
// creatures to hunt, no multi-tap. If a buddy is already picked, redirect Home.

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { CreatureSprite, type BuddyKind } from '../art'
import { BUDDIES } from '@/lib/read/buddies'
import { loadBuddy, pickBuddy } from '@/lib/read/storage'
import '../home/home.css'
import './arrival.css'

/** Speak via the Web Speech API — quiet if unavailable. */
function speakTTS(line: string) {
  if (typeof window === 'undefined') return
  const s = window.speechSynthesis
  if (!s) return
  try {
    s.cancel()
    const u = new SpeechSynthesisUtterance(line)
    u.rate = 1
    u.pitch = 1.05
    s.speak(u)
  } catch {
    /* noop */
  }
}

export default function ArrivalPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [chosen, setChosen] = useState<BuddyKind | null>(null)
  const goTimer = useRef<number | null>(null)

  useEffect(() => {
    if (loadBuddy().activeId) {
      router.replace('/read')
      return
    }
    setReady(true)
  }, [router])

  useEffect(() => () => {
    if (goTimer.current) window.clearTimeout(goTimer.current)
  }, [])

  const pick = (id: BuddyKind) => {
    if (chosen) return
    setChosen(id)
    const b = BUDDIES.find((x) => x.id === id)
    if (b) speakTTS(typeof b.intro === 'string' ? b.intro : b.intro.b)
    // Let the pick register (coral ring + spoken intro), then open Home.
    goTimer.current = window.setTimeout(() => {
      pickBuddy(id)
      router.push('/read')
    }, 1300)
  }

  if (!ready) return null

  return (
    <div className="lf-home">
      <div className="lfa-wrap">
        <h1 className="lfa-title">Pick a friend to read with</h1>
        <p className="lfa-sub">Tap one to start</p>
        <div className="lfa-grid">
          {BUDDIES.map((b) => {
            const isChosen = chosen === b.id
            return (
              <button
                key={b.id}
                type="button"
                className="lfa-card"
                data-chosen={isChosen}
                aria-label={`${b.name} — ${b.trait}`}
                aria-pressed={isChosen}
                onClick={() => pick(b.id as BuddyKind)}
              >
                <div className="lfa-face">
                  <CreatureSprite kind={b.id as BuddyKind} pose="idle" size={96} />
                </div>
                <div className="lfa-name">{b.name}</div>
                <div className="lfa-trait">{b.trait}</div>
                <div className="lfa-nature">{b.nature === 'living' ? 'alive' : 'a made thing'}</div>
                <div className="lfa-go">{isChosen ? "Let's read!" : ''}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
