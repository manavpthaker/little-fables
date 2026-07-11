'use client'

// My words — grid of collected star words. Tap a card to open a modal with the
// big pronunciation, a speaker (spoken via speak()), and the kid-friendly
// meaning. See design/handoff-v2/app/screens-c.jsx `MyWords`.

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { CircleBtn, KidScreen, PillNav, WashScene } from '../components'
import { loadWordBook, loadLanguageWall, type LanguageWallEntry } from '@/lib/read/storage'
import { loadShelf } from '@/lib/read/packs'
import { speak, type SpeakHandle } from '@/lib/read/speech'
import type { Book, VocabWord } from '@/types/story'

type CollectedWord = VocabWord & { learnedAt: number }

// Display names for the ISO-ish language codes stored on Language Wall entries.
// Anything unrecognized falls back to the raw code so it still renders.
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

const LANGUAGE_FLAG: Record<string, string> = {
  Gujarati: '🇮🇳',
  Hindi: '🇮🇳',
  Spanish: '🇪🇸',
  Creole: '🇭🇹',
  English: '🇬🇧',
}

function languageDisplayName(code: string): string {
  return LANGUAGE_LABEL[code.toLowerCase()] ?? code
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

  const bookTitleFor = (e: LanguageWallEntry): string | undefined =>
    shelf.find((b) => b.id === e.bookId)?.title

  const bookFor = (w: CollectedWord): Book | undefined =>
    shelf.find((b) => b.id === w.from) ?? shelf.find((b) => b.vocab.some((v) => v.word === w.word))

  return (
    <KidScreen label="My words" style={{ paddingBottom: 110 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '26px 32px 0' }}>
        <Link href="/read" aria-label="Back home" style={{ textDecoration: 'none' }}>
          <CircleBtn label="Back home" size={52}>
            ‹
          </CircleBtn>
        </Link>
        <div>
          <h1 style={{ margin: 0, font: '700 27px var(--font-display)' }}>My words</h1>
          <p style={{ margin: '2px 0 0', font: '600 14px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
            <span aria-hidden="true">🔊</span> {words.length} star words — tap one to hear it!
          </p>
        </div>
        <span aria-hidden="true" style={{ marginLeft: 'auto', fontSize: 34, filter: 'var(--shadow-emoji)' }}>
          ⭐
        </span>
      </header>

      {wallEntries.length > 0 && (
        <section
          style={{
            padding: '24px 32px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div>
            <h2 style={{ margin: 0, font: 'var(--text-section)', color: 'var(--lf-espresso)' }}>
              Language Wall
            </h2>
            <p
              style={{
                margin: '2px 0 0',
                font: '600 13.5px var(--font-body)',
                color: 'var(--lf-espresso-soft)',
              }}
            >
              <span aria-hidden="true">🔊</span> Heritage words you discovered in your stories.
            </p>
          </div>
          {wallLanguages.map((lang) => (
            <div key={lang}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 20 }}>
                  {LANGUAGE_FLAG[lang] ?? '✨'}
                </span>
                <span
                  style={{
                    font: '700 15px var(--font-display)',
                    color: 'var(--lf-espresso)',
                    textTransform: 'uppercase',
                    letterSpacing: '.06em',
                  }}
                >
                  {lang}
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 14,
                }}
              >
                {wallByLanguage[lang]!.map((e) => {
                  const bookTitle = bookTitleFor(e)
                  return (
                    <div
                      key={`${e.word}-${e.bookId}-${e.foundAt}`}
                      style={{
                        background: 'var(--lf-cream-card)',
                        border: '1.5px solid rgba(251,191,36,.5)',
                        borderRadius: 'var(--radius-card)',
                        padding: '16px 16px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        boxShadow: 'var(--shadow-warm)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            font: '700 26px/1.15 var(--font-display)',
                            color: 'var(--lf-espresso)',
                          }}
                        >
                          {e.word}
                        </span>
                        <span
                          style={{
                            background: 'rgba(251,191,36,.18)',
                            border: '1px solid rgba(251,191,36,.5)',
                            borderRadius: 'var(--radius-pill)',
                            padding: '2px 10px',
                            font: '700 10.5px var(--font-body)',
                            color: 'var(--lf-espresso)',
                            textTransform: 'uppercase',
                            letterSpacing: '.06em',
                            flexShrink: 0,
                          }}
                        >
                          {lang}
                        </span>
                      </div>
                      {e.meaning && (
                        <span
                          style={{
                            font: '600 14.5px/1.45 var(--font-body)',
                            color: 'var(--lf-espresso)',
                          }}
                        >
                          {e.meaning}
                        </span>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: 4,
                        }}
                      >
                        <span
                          style={{
                            font: '600 12px var(--font-body)',
                            color: 'var(--lf-espresso-soft)',
                          }}
                        >
                          {bookTitle ? `from ${bookTitle}` : 'from your reading'}
                        </span>
                        <button
                          type="button"
                          className="lf-press"
                          aria-label={`Hear ${e.word}`}
                          onClick={() => speakWallEntry(e)}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            border: 'none',
                            cursor: 'pointer',
                            background: 'var(--lf-coral)',
                            color: '#fff',
                            fontSize: 16,
                            boxShadow: 'var(--shadow-coral-glow)',
                          }}
                        >
                          🔊
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      <div
        style={{
          padding: '32px 32px 96px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 18,
        }}
      >
        {words.length === 0 && (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: 32,
              textAlign: 'center',
              border: '1.5px dashed var(--lf-cream-line)',
              borderRadius: 'var(--radius-card)',
            }}
          >
            <p style={{ font: '700 17px var(--font-display)' }}>No star words yet</p>
            <p style={{ font: '600 14px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
              Read a story to collect your first star word!
            </p>
          </div>
        )}
        {words.map((w, i) => {
          const book = bookFor(w)
          return (
            <button
              key={w.word}
              type="button"
              className="lf-press"
              onClick={() => setOpen(i)}
              style={{
                background: 'var(--lf-cream-card)',
                border: '1.5px solid var(--lf-cream-line)',
                borderRadius: 'var(--radius-card)',
                padding: '18px 16px 14px',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: 'var(--shadow-warm)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                minHeight: 56,
              }}
            >
              <span style={{ font: '700 23px var(--font-display)', color: 'var(--lf-espresso)' }}>
                <span aria-hidden="true" style={{ fontSize: 15, marginRight: 6 }}>⭐</span>
                {w.word}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                {book && (
                  <WashScene
                    wash={book.wash}
                    img={book.coverImage}
                    emojis={book.coverEmoji ? [book.coverEmoji] : []}
                    doodle={false}
                    style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0 }}
                  />
                )}
                <span style={{ font: '600 12px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
                  {book?.title ?? 'From your reading'}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {openWord && (
        <div
          role="dialog"
          onClick={() => setOpen(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'var(--surface-scrim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            className="lf-pop-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 480,
              maxWidth: '100%',
              background: 'var(--lf-cream)',
              borderRadius: 'var(--radius-hero)',
              padding: '30px 34px',
              boxShadow: 'var(--shadow-warm-lg)',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <button
                type="button"
                className="lf-press lf-mic-pulse"
                aria-label={`Hear ${openWord.word}`}
                onClick={() => speakWord(openWord)}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  background: 'var(--lf-coral)',
                  color: '#fff',
                  fontSize: 24,
                  boxShadow: 'var(--shadow-coral-glow)',
                }}
              >
                🔊
              </button>
            </div>
            <h2 style={{ margin: 0, font: '700 34px var(--font-display)', color: 'var(--lf-espresso)' }}>
              {openWord.word}
            </h2>
            {openWord.say && (
              <p style={{ margin: '2px 0 8px', font: '600 14px var(--font-body)', color: 'var(--lf-espresso-faint)' }}>
                say it: {openWord.say}
              </p>
            )}
            <p style={{ margin: 0, font: '600 19px/1.55 var(--font-body)', color: 'var(--lf-espresso)' }}>
              {openWord.meaning}
            </p>
            <p style={{ margin: '14px 0 0', font: '600 13px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
              {bookFor(openWord)?.title
                ? `from ${bookFor(openWord)!.title} · tap anywhere to close`
                : 'tap anywhere to close'}
            </p>
          </div>
        </div>
      )}

      <PillNav active="home" />
    </KidScreen>
  )
}
