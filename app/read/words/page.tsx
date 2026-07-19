'use client'

// My Words (v4 rebuild) — every star word the child has collected, plus the
// family "language wall" words, as clean cards. Tap a card to hear the word and
// what it means. On the clean .lf-home foundation.

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { loadWordBook, loadLanguageWall, removeWord, type LanguageWallEntry } from '@/lib/read/storage'
import { loadShelf } from '@/lib/read/packs'
import { speak, type SpeakHandle } from '@/lib/read/speech'
import type { Book, VocabWord } from '@/types/story'
import '../home/home.css'
import './words.css'

type CollectedWord = VocabWord & { learnedAt: number; from?: string }

const LANGUAGE_LABEL: Record<string, string> = {
  gu: 'Gujarati', hi: 'Hindi', es: 'Spanish', ht: 'Creole', en: 'English',
  gujarati: 'Gujarati', hindi: 'Hindi', spanish: 'Spanish', creole: 'Creole', english: 'English',
}
const languageName = (code: string) => LANGUAGE_LABEL[code.toLowerCase()] ?? code

function StarIcon() {
  return (
    <svg className="lfw-star" width="18" height="18" viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 4 L24 14 L34 15 L26 22 L29 32 L20 26 L11 32 L14 22 L6 15 L16 14 Z" fill="currentColor" />
    </svg>
  )
}

export default function MyWordsPage() {
  const [words, setWords] = useState<CollectedWord[]>([])
  const [shelf, setShelf] = useState<Book[]>([])
  const [wall, setWall] = useState<LanguageWallEntry[]>([])
  // Tidy-up mode: reveals a remove ✕ on each star word. Behind an explicit
  // toggle so a tapping child can't delete words by accident.
  const [tidy, setTidy] = useState(false)
  const speakRef = useRef<SpeakHandle | null>(null)

  useEffect(() => {
    setWords(loadWordBook().words as CollectedWord[])
    setShelf(loadShelf())
    setWall(loadLanguageWall().found)
    return () => speakRef.current?.cancel()
  }, [])

  const speakWord = (w: CollectedWord) => {
    speakRef.current?.cancel()
    speakRef.current = speak(`${w.word}. ${w.word} means ${w.meaning}.`, { allowSpeechSynthFallback: true })
  }
  const speakWall = (e: LanguageWallEntry) => {
    speakRef.current?.cancel()
    speakRef.current = speak(`${e.word}.${e.meaning ? ` ${e.meaning}.` : ''}`, { allowSpeechSynthFallback: true })
  }
  const bookFor = (w: CollectedWord): Book | undefined =>
    shelf.find((b) => b.id === w.from) ?? shelf.find((b) => b.vocab.some((v) => v.word === w.word))

  return (
    <div className="lf-home">
      <div className="lfh-page">
        <div className="lfh-head">
          <Link href="/read" aria-label="Back home" className="lfh-back">
            <svg width="26" height="26" viewBox="0 0 30 30" aria-hidden="true">
              <path d="M19 4 L7 15 L19 26" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <h1>My Words</h1>
            <p>{words.length} {words.length === 1 ? 'word' : 'words'} so far — they only ever grow</p>
          </div>
        </div>

        {wall.length > 0 && (
          <section className="lfw-section">
            <h2>Family words</h2>
            <p className="lfw-hint">Tap to hear it</p>
            <div className="lfw-grid">
              {wall.map((e, i) => (
                <button key={`${e.word}-${i}`} type="button" className="lfw-card" onClick={() => speakWall(e)}
                  aria-label={`${e.word}${e.meaning ? ` — ${e.meaning}` : ''}. Tap to hear.`}>
                  <span className="lfw-lang">{languageName(e.language)}</span>
                  <div className="lfw-word">{e.word}</div>
                  {e.meaning && <div className="lfw-mean">{e.meaning}</div>}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="lfw-section">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <h2 style={{ marginRight: 'auto' }}>Star words</h2>
            {words.length > 0 && (
              <button
                type="button"
                onClick={() => setTidy((t) => !t)}
                style={{
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  font: '600 13px var(--font-label)', color: 'var(--ink-faint)',
                  textDecoration: 'underline', padding: '4px 6px',
                }}
              >
                {tidy ? 'Done' : 'Tidy up'}
              </button>
            )}
          </div>
          <p className="lfw-hint">{tidy ? 'Tap ✕ to remove a word' : 'Tap a word to hear it and what it means'}</p>
          {words.length === 0 ? (
            <div className="lfw-empty">No star words yet — read a story and collect the ⭐ words!</div>
          ) : (
            <div className="lfw-grid">
              {words.map((w, i) => {
                const book = bookFor(w)
                return (
                  <button
                    key={`${w.word}-${i}`}
                    type="button"
                    className="lfw-card"
                    style={{ position: 'relative' }}
                    onClick={() => {
                      if (tidy) {
                        removeWord(w.word)
                        setWords((prev) => prev.filter((x) => x.word !== w.word))
                      } else {
                        speakWord(w)
                      }
                    }}
                    aria-label={tidy ? `Remove ${w.word}` : `${w.word} — ${w.meaning}. Tap to hear.`}
                  >
                    {tidy && (
                      <span
                        aria-hidden="true"
                        style={{
                          position: 'absolute', top: 6, right: 8,
                          font: '700 15px var(--font-label)', color: 'var(--terra-deep, #B4492A)',
                        }}
                      >
                        ✕
                      </span>
                    )}
                    <div className="lfw-word"><StarIcon />{w.word}</div>
                    <div className="lfw-mean">{w.meaning}</div>
                    {book && <div className="lfw-from">from {book.title}</div>}
                  </button>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
