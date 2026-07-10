'use client'

// Home / Library — landscape iPad spread, portrait-friendly stack.
// THE coral action on this screen: play tonight's story.

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { STARTER_STORIES } from '@/lib/read/starter-stories'
import { loadStories } from '@/lib/read/storage'
import { listRetells } from '@/lib/read/storage'
import { loadUniverse } from '@/lib/universe/azad-verse'
import type { Story } from '@/types/story'
import { CircleBtn, Doodles, OfflineBanner, PillNav } from './components'
import { useSwApp } from './SwApp'

// A few emoji hints for known interests. Anything unmatched shows a sparkle.
const INTEREST_ICONS: Record<string, string> = {
  motos: '🏍️', motorcycles: '🏍️', moto: '🏍️', 'motorcycles ("motos")': '🏍️',
  soccer: '⚽',
  space: '🚀', rockets: '🚀', 'space and rockets': '🚀',
  dinos: '🦕', dinosaurs: '🦕',
  hockey: '🏒',
  trucks: '🚚', 'trucks and construction': '🚚',
  animals: '🐾', 'animals and nature': '🐾',
  music: '🎵', art: '🎨',
  building: '🔨', 'music, art, and building/inventing things': '🎵',
  'spider-heroes and web-swinging rescues': '🕷️',
  'living vs nonliving things': '🌱',
}
const CHIP_TINTS = ['var(--lf-pastel-peach)', 'var(--lf-pastel-mint)', 'var(--lf-pastel-lilac)', 'var(--lf-pastel-blush)']

function iconFor(interest: string): string {
  const key = interest.trim().toLowerCase()
  if (INTEREST_ICONS[key]) return INTEREST_ICONS[key]
  for (const [k, v] of Object.entries(INTEREST_ICONS)) {
    if (key.includes(k)) return v
  }
  return '✨'
}

function chipLabelFor(interest: string): string {
  const key = interest.toLowerCase()
  if (key.includes('moto')) return 'Motos'
  if (key.includes('soccer')) return 'Soccer'
  if (key.includes('space') || key.includes('rocket')) return 'Space'
  if (key.includes('dino')) return 'Dinos'
  if (key.includes('hockey')) return 'Hockey'
  if (key.includes('truck') || key.includes('construction')) return 'Trucks'
  if (key.includes('animal') || key.includes('nature')) return 'Animals'
  if (key.includes('music')) return 'Music'
  if (key.includes('art')) return 'Art'
  if (key.includes('build') || key.includes('invent')) return 'Building'
  if (key.includes('spider')) return 'Spider-heroes'
  // fallback: first two words, capitalized
  const first = interest.split(/[\s(]/)[0]
  return first.charAt(0).toUpperCase() + first.slice(1)
}

function ShelfCover({ story }: { story: Story }) {
  return (
    <Link
      href={`/read/story/${story.id}`}
      className="lf-press"
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        fontFamily: 'var(--font-display)',
      }}
    >
      <span
        style={{
          display: 'block',
          background: 'var(--lf-cream-card)',
          border: '1.5px solid var(--lf-cream-line)',
          borderRadius: 'var(--radius-cover)',
          padding: 9,
          boxShadow: 'var(--shadow-warm)',
        }}
      >
        {story.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={story.coverImage}
            alt=""
            style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 11, display: 'block' }}
          />
        ) : (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              aspectRatio: '1 / 1',
              borderRadius: 11,
              background: story.coverBg,
              fontSize: 64,
              filter: 'var(--shadow-emoji)',
            }}
            aria-hidden="true"
          >
            {story.coverEmoji}
          </span>
        )}
      </span>
      <span style={{ display: 'block', font: 'var(--text-cover-title)', marginTop: 9 }}>{story.title}</span>
      {story.by && (
        <span style={{ display: 'block', font: 'var(--text-meta)', color: 'var(--lf-espresso-soft)', marginTop: 2 }}>
          {story.by}
        </span>
      )}
    </Link>
  )
}

export default function Home() {
  const { bedtime, toggleBedtime, online } = useSwApp()
  const [saved, setSaved] = useState<Story[]>([])
  const [starCount, setStarCount] = useState(0)
  const [interests, setInterests] = useState<string[]>([])
  const [childInitial, setChildInitial] = useState('A')

  useEffect(() => {
    setSaved(loadStories())
    const u = loadUniverse()
    setInterests(u.interests.slice(0, 4))
    setChildInitial((u.childName || 'A').charAt(0).toUpperCase())
    listRetells().then((rs) => setStarCount(rs.length)).catch(() => {})
  }, [])

  const shelf = useMemo<Story[]>(
    () => [...saved.slice().sort((a, b) => b.createdAt - a.createdAt), ...STARTER_STORIES],
    [saved]
  )
  const tonight = shelf[0] ?? STARTER_STORIES[0]

  const logoSrc = bedtime ? '/logo-tree-white.png' : '/logo-tree-ink.png'

  return (
    <div className="sw-screen" style={{ minHeight: '100dvh', paddingBottom: 110 }}>
      <Doodles />
      {!online && <OfflineBanner />}

      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 32px 0',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src={logoSrc} alt="Little Fables" width={44} height={44} priority />
          <span style={{ font: '700 22px var(--font-display)' }}>Little Fables</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              background: 'var(--lf-pastel-peach)',
              borderRadius: 'var(--radius-pill)',
              padding: '9px 16px',
              font: 'var(--text-label)',
              fontFamily: 'var(--font-display)',
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
            }}
            aria-label={`${starCount} stars`}
          >
            ⭐ {starCount}
          </span>
          <CircleBtn
            label={bedtime ? 'Lights on' : 'Bedtime mode'}
            onClick={toggleBedtime}
            size={46}
            style={{ fontSize: 20 }}
          >
            <span aria-hidden="true">{bedtime ? '☀️' : '🌙'}</span>
          </CircleBtn>
          <span
            aria-hidden="true"
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--lf-pastel-lilac)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              font: '700 18px var(--font-display)',
              color: 'var(--lf-espresso)',
            }}
          >
            {childInitial}
          </span>
        </div>
      </header>

      {/* Two-page spread */}
      <div className="home-spread" style={{ padding: '18px 32px 0' }}>
        <style>{`
          .home-spread {
            display: grid;
            grid-template-columns: 1fr;
            gap: 28px;
            align-items: start;
          }
          @media (min-width: 1000px) {
            .home-spread {
              grid-template-columns: 480px 1fr;
              gap: 44px;
              padding-inline: 44px !important;
            }
          }
        `}</style>

        {/* Left: greeting + arch hero */}
        <div>
          <div style={{ font: '600 16px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>Welcome back,</div>
          <div style={{ font: 'var(--text-greeting)', marginTop: 2, marginBottom: 18 }}>
            Azad! What&rsquo;s tonight&rsquo;s story?
          </div>
          <div style={{ font: 'var(--text-section)', marginBottom: 12 }}>Tonight&rsquo;s story</div>
          <Link
            href={`/read/story/${tonight.id}`}
            className="lf-press"
            style={{ position: 'relative', display: 'block', textDecoration: 'none', color: 'inherit' }}
          >
            {tonight.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tonight.coverImage}
                alt=""
                style={{
                  width: '100%',
                  height: 380,
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-arch)',
                  display: 'block',
                  boxShadow: 'var(--shadow-warm-lg)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: 380,
                  borderRadius: 'var(--radius-arch)',
                  background: tonight.coverBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 120,
                  boxShadow: 'var(--shadow-warm-lg)',
                  filter: 'var(--shadow-emoji)',
                }}
                aria-hidden="true"
              >
                {tonight.coverEmoji}
              </div>
            )}
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                right: 20,
                bottom: -16,
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: 'var(--lf-coral)',
                boxShadow: 'var(--shadow-coral-glow)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--sw-on-action)',
                fontSize: 26,
                paddingLeft: 5,
                boxSizing: 'border-box',
              }}
            >
              ▶
            </span>
          </Link>
          <div style={{ font: '700 23px var(--font-display)', marginTop: 26 }}>{tonight.title}</div>
          {tonight.by && (
            <div style={{ font: 'var(--text-meta)', color: 'var(--lf-espresso-soft)', marginTop: 2 }}>{tonight.by}</div>
          )}
        </div>

        {/* Right: chips + bookshelf */}
        <div>
          {interests.length > 0 && (
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {interests.map((interest, i) => (
                <div
                  key={interest}
                  className="lf-press"
                  style={{ flex: '1 1 100px', minWidth: 100, textAlign: 'center', cursor: 'default' }}
                >
                  <span aria-hidden="true" style={{ fontSize: 30, filter: 'var(--shadow-emoji)' }}>{iconFor(interest)}</span>
                  <div
                    style={{
                      background: CHIP_TINTS[i % CHIP_TINTS.length],
                      borderRadius: 'var(--radius-scallop)',
                      padding: '8px 12px 10px',
                      font: 'var(--text-label)',
                      marginTop: 5,
                      color: 'var(--lf-espresso)',
                    }}
                  >
                    {chipLabelFor(interest)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              margin: '26px 0 13px',
            }}
          >
            <span style={{ font: 'var(--text-section)' }}>Bookshelf</span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 16,
            }}
          >
            {shelf.map((s) => (
              <ShelfCover key={s.id} story={s} />
            ))}
          </div>
          <div style={{ font: 'var(--text-meta)', color: 'var(--lf-espresso-faint)', marginTop: 16 }}>
            New stories appear here when Mom and Dad finish making them ✦
          </div>
        </div>
      </div>

      <PillNav active="home" />
    </div>
  )
}
