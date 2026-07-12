'use client'

// Little Fables — first arrival.
// Ported from design/handoff-v4-hifi/project/app/arrival.jsx.
// After the endpaper open beat, the room is in morning light with no buddy
// on the rug yet. The six buddies are IN the room — peeking from behind the
// shelf, up on the windowsill, tucked by the puzzle. Tap = greet (spoken
// intro). Tap again OR pat the rug = the buddy walks to the rug and Home
// opens with them chosen.
//
// If a buddy is already picked, this page redirects to /read immediately.

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ROOM_ZONES, RoomScene } from '../room/RoomScene'
import { LightingProvider } from '../room/LightingProvider'
import { BookCoverArt, CreatureSprite, type BuddyKind } from '../art'
import { BUDDIES } from '@/lib/read/buddies'
import { loadBuddy, pickBuddy } from '@/lib/read/storage'
import { loadShelf } from '@/lib/read/packs'
import type { Book } from '@/types/story'

// The six spots in the room where buddies hide before you greet them.
// Coordinates in the 1180×820 stage.
const SPOTS: Record<
  BuddyKind,
  { x: number; y: number; size: number; label: string }
> = {
  bramble: {
    x: 706,
    y: 462,
    size: 150,
    label: 'the bear, peeking from behind the shelf',
  },
  otter: { x: 196, y: 336, size: 96, label: 'otter, up on the windowsill' },
  anky: { x: 306, y: 690, size: 96, label: 'little anky, beside the puzzle' },
  moto: { x: 548, y: 556, size: 84, label: 'moto, by the table leg' },
  rocky: { x: 98, y: 486, size: 104, label: 'rocky, next to the guitar' },
  rusty: { x: 594, y: 646, size: 96, label: 'rusty, at the edge of the rug' },
}

const STAGE = { w: 1180, h: 820 }
const RUG = { x: 356, y: 470, size: 258 }

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
  const [greeted, setGreeted] = useState<BuddyKind | null>(null)
  const [walking, setWalking] = useState<BuddyKind | null>(null)
  const [shelf, setShelf] = useState<Book[]>([])
  const walkTimer = useRef<number | null>(null)

  // If a buddy is already picked, bounce to Home before showing anything.
  useEffect(() => {
    const b = loadBuddy()
    if (b.activeId) {
      router.replace('/read')
      return
    }
    // v3.1 P2-10: pull the real shelf (Miko, Bramble, Papa Gets the Moon…)
    // so the shelf overlay reads as YOUR library, not stock covers baked
    // into the drawn background art.
    setShelf(loadShelf())
    setReady(true)
  }, [router])

  useEffect(() => () => {
    if (walkTimer.current) window.clearTimeout(walkTimer.current)
  }, [])

  const intro = useMemo(() => {
    if (!greeted) return null
    const b = BUDDIES.find((x) => x.id === greeted)
    if (!b) return null
    return typeof b.intro === 'string' ? b.intro : b.intro.b
  }, [greeted])

  const greet = (id: BuddyKind) => {
    if (walking) return
    setGreeted(id)
    const b = BUDDIES.find((x) => x.id === id)
    if (b) speakTTS(typeof b.intro === 'string' ? b.intro : b.intro.b)
  }

  const choose = (id: BuddyKind) => {
    if (walking) return
    setWalking(id)
    // The buddy walks to the rug (transform transition), then we persist +
    // navigate. Kept the 1.8s of the original arrival beat.
    walkTimer.current = window.setTimeout(() => {
      pickBuddy(id)
      router.push('/read')
    }, 1800)
  }

  // v3.2 P2-2e — root cause of the "2-3 taps to pick" bug: the handler was
  //   onClick={() => (isGreeted ? choose(id) : greet(id))}
  // First tap set `greeted` state but did NOT commit the buddy — the child
  // had to tap AGAIN once `isGreeted` had propagated to see `choose(id)` fire.
  // Kids missed the second tap window (the intro speech distracted them) and
  // tapped a different buddy, resetting the loop. Fix: on any first tap we
  // greet AND commit — the intro line plays over the walk-to-rug animation,
  // so the child never has to tap twice on the same buddy.
  const pickBuddyAtomic = (id: BuddyKind) => {
    if (walking) return
    if (greeted !== id) greet(id)
    choose(id)
  }

  if (!ready) return null

  const rugGlow = greeted && !walking

  // v3.1 P2-10 — cover the shelf area of the drawn art with the child's
  // REAL first ~4 books. The north-star SVG has stock titles baked in;
  // this overlay reads as YOUR library filling up.
  const shelfCovers = shelf.slice(0, 4)

  return (
    <LightingProvider className="lf-room" style={{ minHeight: '100dvh' }}>
      <RoomScene>
        {/* real-library shelf overlay — covers the stock titles in the SVG */}
        {shelfCovers.length > 0 && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: `${(ROOM_ZONES.shelfTop.x / STAGE.w) * 100}%`,
              top: `${(ROOM_ZONES.shelfTop.y / STAGE.h) * 100}%`,
              width: `${(ROOM_ZONES.shelfTop.w / STAGE.w) * 100}%`,
              height: `${((ROOM_ZONES.shelfBottom.y + ROOM_ZONES.shelfBottom.h - ROOM_ZONES.shelfTop.y) / STAGE.h) * 100}%`,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gridTemplateRows: 'repeat(2, 1fr)',
              gap: 8,
              padding: 4,
              zIndex: 2,
              pointerEvents: 'none',
            }}
          >
            {shelfCovers.map((b) => (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BookCoverArt book={b} width={72} height={96} />
              </div>
            ))}
          </div>
        )}

        {/* the six buddies */}
        {(Object.keys(SPOTS) as BuddyKind[]).map((id) => {
          const s = SPOTS[id]
          const isGreeted = greeted === id
          const isWalking = walking === id
          const hidden = walking && !isWalking
          const pos = isWalking
            ? { x: RUG.x + 40, y: RUG.y + 30, size: RUG.size * 0.9 }
            : s
          const leftPct = (pos.x / STAGE.w) * 100
          const topPct = (pos.y / STAGE.h) * 100
          const widthPct = (pos.size / STAGE.w) * 100
          return (
            <div
              key={id}
              style={{
                position: 'absolute',
                left: `${leftPct}%`,
                top: `${topPct}%`,
                width: `${widthPct}%`,
                opacity: hidden ? 0 : 1,
                zIndex: isWalking ? 8 : 3,
                transition:
                  'left 1700ms cubic-bezier(0.2, 0.7, 0.2, 1), top 1700ms cubic-bezier(0.2, 0.7, 0.2, 1), opacity 700ms ease',
              }}
            >
              {/* The interactive button WRAPS the sprite so the .lf-press
                * :active scale actually gives <100ms visible feedback on the
                * drawn buddy itself, not on a transparent hit-target above. */}
              <button
                type="button"
                onClick={() => pickBuddyAtomic(id)}
                aria-label={
                  isGreeted
                    ? `${BUDDIES.find((b) => b.id === id)?.name ?? id} — come to the rug`
                    : `say hello to ${s.label} and pick them`
                }
                className="lf-press"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: 0,
                  cursor: 'pointer',
                  borderRadius: 30,
                  background: 'transparent',
                  border: 'none',
                  touchAction: 'manipulation',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div
                  style={{
                    transform: isGreeted && !isWalking ? 'translateY(-4px)' : 'none',
                    transformOrigin: '50% 100%',
                    transition: 'transform 700ms cubic-bezier(0.2, 0.7, 0.2, 1)',
                    pointerEvents: 'none',
                  }}
                >
                  <CreatureSprite
                    kind={id}
                    pose={isGreeted && !isWalking ? 'celebrating' : 'idle'}
                    size={pos.size}
                  />
                </div>
              </button>
            </div>
          )
        })}

        {/* the intro line of whichever buddy was greeted */}
        {intro && !walking && (
          <div
            style={{
              position: 'absolute',
              left: `${(Math.min(Math.max(SPOTS[greeted!].x - 90, 24), 830) / STAGE.w) * 100}%`,
              top: `${(Math.max(SPOTS[greeted!].y - 116, 20) / STAGE.h) * 100}%`,
              maxWidth: '30%',
              zIndex: 9,
              background: 'var(--paper-bright, #F9F2E3)',
              border: `2px solid var(--ink, #46362A)`,
              borderRadius: 18,
              padding: '10px 14px',
              font: '700 17px/1.4 var(--font-body, serif)',
              color: 'var(--ink, #46362A)',
              boxShadow: '0 4px 0 rgba(70, 54, 42, 0.15)',
            }}
            role="status"
            aria-live="polite"
          >
            {intro}
          </div>
        )}

        {/* the rug invitation — the one glowing next thing once a buddy is greeted */}
        {rugGlow && (
          <button
            type="button"
            onClick={() => choose(greeted!)}
            aria-label="pat the rug — come sit with me"
            className="lf-press"
            style={{
              position: 'absolute',
              left: `${(358 / STAGE.w) * 100}%`,
              top: `${(650 / STAGE.h) * 100}%`,
              width: `${(210 / STAGE.w) * 100}%`,
              height: `${(70 / STAGE.h) * 100}%`,
              borderRadius: '50%',
              cursor: 'pointer',
              zIndex: 2,
              background:
                'radial-gradient(ellipse, color-mix(in oklab, var(--pigment-terracotta) 25%, transparent), transparent 65%)',
              border: '2.5px dashed var(--pigment-terracotta, #D95B43)',
              touchAction: 'manipulation',
            }}
          />
        )}
        {rugGlow && (
          <div
            style={{
              position: 'absolute',
              left: `${(380 / STAGE.w) * 100}%`,
              top: `${(748 / STAGE.h) * 100}%`,
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              fontSize: 20,
              color: 'var(--ink-soft, #6E5B49)',
              pointerEvents: 'none',
            }}
          >
            tap {BUDDIES.find((b) => b.id === greeted)?.name} again — or pat the rug
          </div>
        )}
      </RoomScene>
    </LightingProvider>
  )
}
