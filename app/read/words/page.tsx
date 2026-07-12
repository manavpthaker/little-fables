'use client'

// My Words — the Language Wall.
//
// v3 Drawn Room: the Language Wall renders first (grouped by language),
// as a drawn paper sheet with pinned word-cards; each pin is a drawn small
// object holding the word (each still has a tap-to-hear button). The
// general star-word grid follows. Tap-and-hold on any word → speak the
// word + its meaning. `data-register="day"` default (quiet mood).
// Reduced-motion safe.

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { DrawnCircleBtn, KidScreen, BackArrowIcon, SpeakerIcon, BookCoverArt } from '../art'
import { loadWordBook, loadLanguageWall, type LanguageWallEntry } from '@/lib/read/storage'
import { loadShelf } from '@/lib/read/packs'
import { speak, type SpeakHandle } from '@/lib/read/speech'
import type { Book, VocabWord } from '@/types/story'

type CollectedWord = VocabWord & { learnedAt: number }

const LANGUAGE_LABEL: Record<string, string> = {
  gu: 'Gujarati',
  hi: 'Hindi',
  es: 'Spanish',
  ht: 'Creole',
  en: 'English',
  gujarati: 'Gujarati',
  hindi: 'Hindi',
  spanish: 'Spanish',
  creole: 'Creole',
  english: 'English',
}

// A drawn pin motif per language — a small object holding the word to the
// wall (each pigment quietly signals the language).
const LANGUAGE_PIN: Record<string, { pigment: string; motif: 'flower' | 'leaf' | 'sun' | 'shell' | 'star' }> = {
  Gujarati: { pigment: '#E2A93B', motif: 'sun' },
  Hindi: { pigment: '#D95B43', motif: 'flower' },
  Spanish: { pigment: '#9B4A6B', motif: 'star' },
  Creole: { pigment: '#4E7FA3', motif: 'shell' },
  English: { pigment: '#7C9A62', motif: 'leaf' },
}

function languageDisplayName(code: string): string {
  return LANGUAGE_LABEL[code.toLowerCase()] ?? code
}

/** A small drawn ink star used inline next to star words. */
function StarInk({ size = 16, color = '#E2A93B' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" style={{ display: 'inline-block' }}>
      <path
        d="M 10 2 L 12 8 L 18 9 L 13 13 L 15 19 L 10 15 L 5 19 L 7 13 L 2 9 L 8 8 Z"
        fill={color}
        stroke="#46362A"
        strokeWidth="1.2"
        filter="url(#lf-wobble)"
      />
    </svg>
  )
}

function PinMotif({ kind, color = '#46362A' }: { kind: 'flower' | 'leaf' | 'sun' | 'shell' | 'star'; color?: string }) {
  const size = 36
  const s = { width: size, height: size, display: 'block' as const }
  switch (kind) {
    case 'flower':
      return (
        <svg style={s} viewBox="0 0 40 40" aria-hidden="true">
          {[0, 72, 144, 216, 288].map((r) => (
            <ellipse
              key={r}
              cx="20"
              cy="8"
              rx="5"
              ry="8"
              fill={color}
              transform={`rotate(${r} 20 20)`}
              opacity="0.85"
            />
          ))}
          <circle cx="20" cy="20" r="4" fill="#EFC85C" stroke="#46362A" strokeWidth="1.4" />
        </svg>
      )
    case 'leaf':
      return (
        <svg style={s} viewBox="0 0 40 40" aria-hidden="true">
          <path d="M 8 32 Q 10 12 30 8 Q 34 24 14 34 Z" fill={color} stroke="#46362A" strokeWidth="1.5" />
          <path d="M 12 30 Q 18 20 28 12" stroke="#46362A" strokeWidth="1.2" fill="none" />
        </svg>
      )
    case 'sun':
      return (
        <svg style={s} viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="8" fill={color} stroke="#46362A" strokeWidth="1.5" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((r) => (
            <line
              key={r}
              x1="20"
              y1="6"
              x2="20"
              y2="10"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              transform={`rotate(${r} 20 20)`}
            />
          ))}
        </svg>
      )
    case 'shell':
      return (
        <svg style={s} viewBox="0 0 40 40" aria-hidden="true">
          <path d="M 8 30 Q 20 4 32 30 Z" fill={color} stroke="#46362A" strokeWidth="1.5" />
          {[12, 16, 20, 24, 28].map((x) => (
            <line key={x} x1="20" y1="8" x2={x} y2="28" stroke="#46362A" strokeWidth="0.9" opacity=".6" />
          ))}
        </svg>
      )
    case 'star':
    default:
      return (
        <svg style={s} viewBox="0 0 40 40" aria-hidden="true">
          <path
            d="M 20 4 L 24 14 L 34 15 L 26 22 L 29 32 L 20 26 L 11 32 L 14 22 L 6 15 L 16 14 Z"
            fill={color}
            stroke="#46362A"
            strokeWidth="1.5"
          />
        </svg>
      )
  }
}

/* A drawn "word pin" — the small object + a scrap of paper with the word. */
function WordPin({
  entry,
  onSpeak,
}: {
  entry: LanguageWallEntry
  onSpeak: () => void
}) {
  const lang = languageDisplayName(entry.language)
  const pin = LANGUAGE_PIN[lang] ?? { pigment: '#9B4A6B', motif: 'star' as const }
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pressed = useRef(false)

  const startHold = () => {
    pressed.current = true
    holdRef.current = setTimeout(() => {
      if (pressed.current) onSpeak()
    }, 350)
  }
  const endHold = () => {
    pressed.current = false
    if (holdRef.current) {
      clearTimeout(holdRef.current)
      holdRef.current = null
    }
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        minWidth: 140,
      }}
    >
      {/* the pin (drawn small object) — v3.2 #3: scaled to 60% and
           pointer-events: none so it reads as a decorative pin ON the
           scrap without ever covering the word letters underneath.
           The previous marginBottom: -10 pulled the pin's SVG box into
           the top of the scrap and, with drop-shadow bleed + wobble
           filter, half-covered short words like "moon". We now leave a
           small positive gap (marginBottom: 2) so nothing overlaps the
           letters below. z-index: 0 keeps the pin behind any child
           elements on the scrap. */}
      <div
        style={{
          color: pin.pigment,
          filter: 'drop-shadow(0 3px 6px rgba(70,54,42,.25))',
          transform: 'scale(0.6)',
          marginBottom: 2,
          pointerEvents: 'none',
          position: 'relative',
          zIndex: 0,
        }}
      >
        <PinMotif kind={pin.motif} color={pin.pigment} />
      </div>
      {/* the paper scrap held by the pin */}
      <button
        type="button"
        onPointerDown={startHold}
        onPointerUp={endHold}
        onPointerLeave={endHold}
        onPointerCancel={endHold}
        onClick={onSpeak}
        aria-label={`${entry.word}${entry.meaning ? ` — ${entry.meaning}` : ''}. Hold to hear.`}
        className="lf-press lf-drawn-border"
        style={{
          background: 'var(--paper-bright, #F9F2E3)',
          backgroundImage: 'var(--texture-paper)',
          border: 'none',
          borderRadius: '10px 14px 11px 13px',
          padding: '10px 14px 12px',
          transform: 'rotate(-1.4deg)',
          minWidth: 130,
          minHeight: 56,
          cursor: 'pointer',
          textAlign: 'center',
          color: 'var(--ink, #46362A)',
        }}
      >
        <div style={{ font: '700 20px/1.15 var(--font-display)', position: 'relative', zIndex: 2 }}>{entry.word}</div>
        {entry.meaning && (
          <div style={{ font: '600 12px var(--font-body)', fontStyle: 'italic', color: 'var(--ink-soft, #6E5B49)', marginTop: 2 }}>
            {entry.meaning}
          </div>
        )}
        <div
          style={{
            marginTop: 6,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            font: '600 10.5px var(--font-body)',
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            color: pin.pigment,
          }}
        >
          <SpeakerIcon size={14} color={pin.pigment} /> tap or hold
        </div>
      </button>
    </div>
  )
}

export default function MyWordsPage() {
  const [words, setWords] = useState<CollectedWord[]>([])
  const [shelf, setShelf] = useState<Book[]>([])
  const [open, setOpen] = useState<number | null>(null)
  const [wallEntries, setWallEntries] = useState<LanguageWallEntry[]>([])
  const speakRef = useRef<SpeakHandle | null>(null)

  useEffect(() => {
    setWords(loadWordBook().words)
    setShelf(loadShelf())
    setWallEntries(loadLanguageWall().found)
    return () => speakRef.current?.cancel()
  }, [])

  const openWord = open != null ? words[open] : null

  const speakWord = (w: CollectedWord) => {
    speakRef.current?.cancel()
    speakRef.current = speak(`${w.word}. ${w.word} means ${w.meaning}.`)
  }

  const speakWallEntry = (e: LanguageWallEntry) => {
    speakRef.current?.cancel()
    const meaningPart = e.meaning ? ` It means ${e.meaning}.` : ''
    speakRef.current = speak(`${e.word}.${meaningPart}`)
  }

  const wallByLanguage = wallEntries.reduce<Record<string, LanguageWallEntry[]>>((acc, e) => {
    const name = languageDisplayName(e.language)
    ;(acc[name] ??= []).push(e)
    return acc
  }, {})
  const wallLanguages = Object.keys(wallByLanguage).sort()

  const bookFor = (w: CollectedWord): Book | undefined =>
    shelf.find((b) => b.id === w.from) ?? shelf.find((b) => b.vocab.some((v) => v.word === w.word))

  return (
    <KidScreen label="My words — the Language Wall" style={{ padding: 0, paddingBottom: 110 }}>
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
            <h1 style={{ margin: 0, font: '700 32px var(--font-display)', color: 'var(--ink, #46362A)' }}>
              My Words
            </h1>
            <p style={{ margin: '2px 0 0', font: '600 14px var(--font-body)', fontStyle: 'italic', color: 'var(--ink-soft, #6E5B49)' }}>
              {wallEntries.length + words.length} words so far — they only ever grow
            </p>
          </div>
        </header>

        {/* --- Language Wall — the drawn paper sheet with pinned words --- */}
        {wallEntries.length > 0 && (
          <section style={{ padding: '20px 32px 8px' }}>
            <div
              className="lf-drawn-border"
              style={{
                background: 'var(--paper-bright, #F9F2E3)',
                backgroundImage: 'var(--texture-paper)',
                borderRadius: '18px 22px 20px 22px',
                padding: '30px 34px 34px',
                boxShadow: '0 18px 40px -20px rgba(70,54,42,.28)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap', marginBottom: 22 }}>
                <h2 style={{ margin: 0, font: '700 26px var(--font-display)', color: 'var(--ink, #46362A)' }}>
                  Language Wall
                </h2>
                <span
                  style={{
                    font: '600 15px var(--font-body)',
                    fontStyle: 'italic',
                    color: 'var(--ink-soft, #6E5B49)',
                  }}
                >
                  Heritage words you discovered in your stories
                </span>
              </div>

              <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
                {wallLanguages.map((lang) => (
                  <div key={lang} style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 160 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ font: '700 20px var(--font-display)', color: 'var(--ink-soft, #6E5B49)' }}>
                        {lang}
                      </span>
                    </div>
                    <hr className="lf-rule" style={{ margin: 0, width: 120, color: 'var(--ink-faint, #97836B)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                      {wallByLanguage[lang]!.map((e) => (
                        <WordPin key={`${e.word}-${e.bookId}-${e.foundAt}`} entry={e} onSpeak={() => speakWallEntry(e)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* --- Star-word grid (general) --- */}
        <section style={{ padding: '24px 32px 96px' }}>
          <h2 style={{ margin: '0 0 4px', font: '700 22px var(--font-display)', color: 'var(--ink, #46362A)' }}>
            Star words
          </h2>
          <p style={{ margin: '0 0 18px', font: '600 13.5px var(--font-body)', fontStyle: 'italic', color: 'var(--ink-soft, #6E5B49)' }}>
            Tap a star to open — hold to hear it.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 18,
            }}
          >
            {words.length === 0 && (
              <div
                className="lf-drawn-border"
                style={{
                  gridColumn: '1 / -1',
                  padding: 32,
                  textAlign: 'center',
                  border: 'none',
                  background: 'var(--paper-bright, #F9F2E3)',
                  backgroundImage: 'var(--texture-paper)',
                  borderRadius: '14px 18px 15px 17px',
                }}
              >
                <p style={{ font: '700 17px var(--font-display)', margin: 0 }}>No star words yet</p>
                <p style={{ font: '600 14px var(--font-body)', fontStyle: 'italic', color: 'var(--ink-soft, #6E5B49)' }}>
                  Read a story to collect your first star word.
                </p>
              </div>
            )}
            {words.map((w, i) => {
              const book = bookFor(w)
              return (
                <button
                  key={w.word}
                  type="button"
                  className="lf-press lf-drawn-border"
                  onClick={() => setOpen(i)}
                  onPointerDown={(e) => {
                    // Press-and-hold speaks the word (300ms).
                    const t = setTimeout(() => speakWord(w), 350)
                    const cancel = () => clearTimeout(t)
                    ;(e.currentTarget as HTMLButtonElement).addEventListener('pointerup', cancel, { once: true })
                    ;(e.currentTarget as HTMLButtonElement).addEventListener('pointerleave', cancel, { once: true })
                    ;(e.currentTarget as HTMLButtonElement).addEventListener('pointercancel', cancel, { once: true })
                  }}
                  style={{
                    background: 'var(--paper-bright, #F9F2E3)',
                    backgroundImage: 'var(--texture-paper)',
                    border: 'none',
                    borderRadius: '14px 18px 15px 17px',
                    padding: '18px 16px 14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    minHeight: 56,
                    color: 'var(--ink, #46362A)',
                  }}
                >
                  <span style={{ font: '700 23px var(--font-display)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <StarInk />
                    {w.word}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                    {book && (
                      <span style={{ width: 24, height: 32, display: 'inline-block', flexShrink: 0 }}>
                        <BookCoverArt book={book} width={24} height={32} />
                      </span>
                    )}
                    <span style={{ font: '600 12px var(--font-body)', fontStyle: 'italic', color: 'var(--ink-soft, #6E5B49)' }}>
                      {book?.title ?? 'From your reading'}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {openWord && (
          <div
            role="dialog"
            onClick={() => setOpen(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              background: 'rgba(34,48,74,.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <div
              className="lf-drawn-border lf-drawn-border--bold"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 480,
                maxWidth: '100%',
                background: 'var(--paper-bright, #F9F2E3)',
                backgroundImage: 'var(--texture-paper)',
                borderRadius: '20px 26px 22px 24px',
                padding: '30px 34px',
                textAlign: 'center',
                color: 'var(--ink, #46362A)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                <button
                  type="button"
                  className="lf-press"
                  aria-label={`Hear ${openWord.word}`}
                  onClick={() => speakWord(openWord)}
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: '50% 48% 52% 50%',
                    border: 'none',
                    cursor: 'pointer',
                    background: 'var(--pigment-terracotta, #D95B43)',
                    color: '#F9F2E3',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 14px rgba(217,91,67,.35)',
                  }}
                >
                  <SpeakerIcon size={28} color="#F9F2E3" />
                </button>
              </div>
              <h2 style={{ margin: 0, font: '700 34px var(--font-display)' }}>{openWord.word}</h2>
              {openWord.say && (
                <p style={{ margin: '2px 0 8px', font: '600 14px var(--font-body)', fontStyle: 'italic', color: 'var(--ink-faint, #97836B)' }}>
                  say it: {openWord.say}
                </p>
              )}
              <p style={{ margin: 0, font: '600 19px/1.55 var(--font-body)' }}>{openWord.meaning}</p>
              <p style={{ margin: '14px 0 0', font: '600 13px var(--font-body)', fontStyle: 'italic', color: 'var(--ink-soft, #6E5B49)' }}>
                {bookFor(openWord)?.title
                  ? `from ${bookFor(openWord)!.title} · tap anywhere to close`
                  : 'tap anywhere to close'}
              </p>
            </div>
          </div>
        )}

      </div>
    </KidScreen>
  )
}
