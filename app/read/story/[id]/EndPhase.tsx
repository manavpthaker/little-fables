'use client'

// Chapter-end + book-complete celebrations (v2).
//
// - `ChapterEnd`: recap question (buddy asks), hook line, Next chapter / All
//   done. Wires `markChapterFinished` when the child taps Next (via the
//   reader parent's `onNextChapter`). Also runs `checkBadges()` before render.
// - `BookComplete`: confetti + vocab-stars (speak word + meaning on tap) +
//   Tell-it-back recording + badge handoff to /read/badges/earn/[id].
//
// Two components live in one file to keep the reader import short.

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Book, BuddyDef, VocabWord } from '@/types/story'
import { createRecorder, speak, type RecorderHandle, type SpeakHandle } from '@/lib/read/speech'
import { saveRetell, uid, markChapterFinished, loadBadges } from '@/lib/read/storage'
import { pushRetell } from '@/lib/read/sync'
import { checkBadges } from '@/lib/read/badges'
import { cp } from '@/lib/read/buddies'
import { BuddyFace, Confetti, KidScreen, Medallion, SpeechBubble, VocabStar } from '../../components'

function fmt(s: number): string {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

/* ================= ChapterEnd ================= */
export function ChapterEnd({
  book,
  chapterIdx,
  buddy,
  energy,
  onNextChapter,
  onAllDone,
}: {
  book: Book
  chapterIdx: number
  buddy: BuddyDef
  energy: 'bouncy' | 'calm'
  onNextChapter: () => void
  onAllDone: () => void
}) {
  const chapter = book.chapters[chapterIdx]
  const recapQ = chapter?.recapQuestion ?? 'What was your favorite part?'
  const hook =
    typeof chapter?.hook === 'string'
      ? chapter.hook
      : chapter?.hook
        ? cp(chapter.hook, energy)
        : 'Next time: more of the story!'

  // Fire the reading-day sun + badge check exactly once on mount.
  useEffect(() => {
    markChapterFinished(book.id, chapterIdx)
    void checkBadges().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [state, setState] = useState<'question' | 'listening' | 'praise'>('question')
  const speakRef = useRef<SpeakHandle | null>(null)
  useEffect(() => () => speakRef.current?.cancel(), [])
  const onMic = () => {
    if (state !== 'question') return
    setState('listening')
    // Kid-friendly: after a short listen-any, always praise. This is a wonder
    // moment, not an evaluation.
    setTimeout(() => {
      setState('praise')
      speakRef.current?.cancel()
      speakRef.current = speak('Nice! I love that.')
    }, 1500)
  }

  return (
    <KidScreen label={`Chapter end — ${chapter?.title ?? ''}`}>
      <Confetti n={10} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          padding: 32,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18 }}>
          <BuddyFace buddy={buddy} size={116} />
          <SpeechBubble big style={{ marginBottom: 18 }}>
            {cp(
              { b: `WOOHOO! Chapter ${chapterIdx + 1} — done!`, c: `Chapter ${chapterIdx + 1} — done. Lovely reading.` },
              energy,
            )}
          </SpeechBubble>
        </div>

        <div
          style={{
            width: 'min(620px, 92%)',
            background: 'var(--lf-cream-card)',
            border: '1.5px solid var(--lf-cream-line)',
            borderRadius: 'var(--radius-card)',
            padding: '20px 24px',
          }}
        >
          <div
            style={{
              font: '700 11px var(--font-body)',
              color: 'var(--lf-espresso-faint)',
              textTransform: 'uppercase',
              letterSpacing: '.07em',
              marginBottom: 8,
            }}
          >
            tell me back
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              type="button"
              onClick={onMic}
              disabled={state !== 'question'}
              className="lf-press lf-mic-pulse"
              aria-label="Answer out loud"
              style={{
                width: 62,
                height: 62,
                borderRadius: '50%',
                border: 'none',
                background: state === 'listening' ? 'var(--lf-coral-deep)' : 'var(--lf-coral)',
                color: '#fff',
                fontSize: 26,
                cursor: state === 'question' ? 'pointer' : 'default',
                flexShrink: 0,
              }}
            >
              🎤
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ font: '700 18px/1.4 var(--font-body)' }}>{recapQ}</div>
              {state === 'listening' && (
                <div style={{ marginTop: 6, font: '700 14px var(--font-body)', color: 'var(--lf-coral-deep)' }}>
                  Listening…
                </div>
              )}
              {state === 'praise' && (
                <div
                  className="lf-screen-in"
                  style={{
                    marginTop: 6,
                    background: 'var(--lf-pastel-mint)',
                    borderRadius: 12,
                    padding: '8px 12px',
                    font: '700 15px var(--font-body)',
                  }}
                >
                  🎉 I love that!
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ font: '600 15px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
          <span aria-hidden="true">🔊</span> {hook}
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
          <button
            type="button"
            onClick={onNextChapter}
            className="lf-press"
            disabled={state !== 'praise'}
            style={{
              minHeight: 56,
              padding: '14px 30px',
              borderRadius: 'var(--radius-pill)',
              cursor: state === 'praise' ? 'pointer' : 'default',
              background: state === 'praise' ? 'var(--lf-coral)' : 'var(--lf-cream-line)',
              color: state === 'praise' ? '#fff' : 'var(--lf-espresso-faint)',
              border: 'none',
              font: '700 18px var(--font-display)',
              boxShadow: state === 'praise' ? 'var(--shadow-coral-glow)' : 'none',
            }}
          >
            Next chapter ▶
          </button>
          <button
            type="button"
            onClick={onAllDone}
            className="lf-press"
            style={{
              minHeight: 56,
              padding: '14px 30px',
              borderRadius: 'var(--radius-pill)',
              cursor: 'pointer',
              background: 'var(--lf-cream-card)',
              border: '1.5px solid var(--lf-cream-line)',
              color: 'var(--lf-espresso-soft)',
              font: '700 18px var(--font-display)',
            }}
          >
            All done for now
          </button>
        </div>
      </div>
    </KidScreen>
  )
}

/* ================= BookComplete ================= */
export function BookComplete({
  book,
  buddy,
  energy,
  onDone,
}: {
  book: Book
  buddy: BuddyDef
  energy: 'bouncy' | 'calm'
  onDone: () => void
}) {
  const router = useRouter()
  const vocab: VocabWord[] = useMemo(() => book.vocab.filter((v) => v.word), [book.vocab])

  const [activeWord, setActiveWord] = useState<string | null>(null)
  const [recState, setRecState] = useState<'idle' | 'recording' | 'saving' | 'saved'>('idle')
  const [secs, setSecs] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<RecorderHandle | null>(null)
  const speakRef = useRef<SpeakHandle | null>(null)

  useEffect(() => {
    if (recState !== 'recording') return
    setSecs(0)
    const t = setInterval(() => setSecs((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [recState])

  useEffect(
    () => () => {
      speakRef.current?.cancel()
      recorderRef.current?.cancel()
    },
    [],
  )

  const meaning = vocab.find((v) => v.word === activeWord)

  const tapVocab = (word: string) => {
    speakRef.current?.cancel()
    if (activeWord === word) {
      setActiveWord(null)
      return
    }
    setActiveWord(word)
    const v = vocab.find((x) => x.word === word)
    const utterance = v?.meaning ? `${v.word}. ${v.word} means ${v.meaning}.` : v?.word ?? word
    speakRef.current = speak(utterance)
  }

  const startRec = useCallback(async () => {
    setError(null)
    try {
      recorderRef.current = await createRecorder()
      setRecState('recording')
    } catch {
      setError('I need the microphone to record. Ask a grown-up to allow it in Settings.')
    }
  }, [])

  const stopRec = useCallback(async () => {
    if (!recorderRef.current) return
    setRecState('saving')
    try {
      const blob = await recorderRef.current.stop()
      recorderRef.current = null
      const retell = {
        id: uid(),
        bookId: book.id,
        bookTitle: book.title,
        createdAt: Date.now(),
        mimeType: blob.type,
        blob,
      }
      await saveRetell(retell)
      // Fire-and-forget upload.
      void pushRetell(retell as unknown as Parameters<typeof pushRetell>[0], blob)
      setRecState('saved')
      // See if a badge was earned by this retell.
      try {
        const granted = await checkBadges({ bookCompletedId: book.id })
        if (granted.length > 0) {
          setTimeout(() => router.push(`/read/badges/earn/${granted[0]}`), 900)
        }
      } catch {
        /* ignore */
      }
    } catch {
      setRecState('idle')
      setError('The recording didn’t save. Try once more.')
    }
  }, [book, router])

  // If a badge was granted server-side when the chapter finished, the parent
  // navigated us here instead of to /badges/earn — but if there's still a
  // pendingEarn, honor it.
  useEffect(() => {
    const badges = loadBadges()
    if (badges.pendingEarn) {
      router.push(`/read/badges/earn/${badges.pendingEarn}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <KidScreen label={`Book complete — ${book.title}`}>
      <Confetti n={22} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '36px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          overflowY: 'auto',
        }}
      >
        <header style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <BuddyFace buddy={buddy} size={92} />
          <div>
            <h1 style={{ margin: 0, font: '700 30px var(--font-display)' }}>
              <span aria-hidden="true" style={{ marginRight: 8 }}>✨</span>
              {cp({ b: 'You read the WHOLE book!', c: 'You read the whole book.' }, energy)}
              <span aria-hidden="true" style={{ marginLeft: 8 }}>✨</span>
            </h1>
            <p style={{ margin: '4px 0 0', font: '600 16px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
              <span aria-hidden="true">🔊</span> {book.title} — every single page!
            </p>
          </div>
          <SpeechBubble style={{ marginLeft: 'auto', maxWidth: 300 }}>
            {cp(
              { b: 'WOOHOO! You read it ALL! I knew you could!', c: 'You read it all. I am so proud of you.' },
              energy,
            )}
          </SpeechBubble>
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 22,
            flex: 1,
            minHeight: 0,
          }}
        >
          {vocab.length > 0 && (
            <section
              style={{
                background: 'var(--lf-cream-card)',
                border: '1.5px solid var(--lf-cream-line)',
                borderRadius: 'var(--radius-card)',
                padding: 22,
              }}
            >
              <h2 style={{ margin: '0 0 4px', font: 'var(--text-section)' }}>Your star words</h2>
              <p style={{ margin: '0 0 14px', font: '600 13.5px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
                <span aria-hidden="true">🔊</span> Tap a star to hear its word.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {vocab.map((v) => (
                  <VocabStar
                    key={v.word}
                    word={v.word}
                    active={activeWord === v.word}
                    onTap={() => tapVocab(v.word)}
                  />
                ))}
              </div>
              {meaning && (
                <div
                  className="lf-screen-in"
                  style={{
                    marginTop: 16,
                    background: 'rgba(251,191,36,.14)',
                    borderRadius: 14,
                    padding: '12px 16px',
                    font: '600 16px/1.5 var(--font-body)',
                    color: 'var(--lf-espresso)',
                  }}
                >
                  <span aria-hidden="true">🔊</span> <strong>{meaning.word}</strong> — {meaning.meaning}
                </div>
              )}
            </section>
          )}

          <section
            style={{
              background: 'var(--lf-cream-card)',
              border: '1.5px solid var(--lf-cream-line)',
              borderRadius: 'var(--radius-card)',
              padding: 22,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <h2 style={{ margin: '0 0 4px', font: 'var(--text-section)' }}>Tell it back!</h2>
            <p style={{ margin: '0 0 10px', font: '600 13.5px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
              <span aria-hidden="true">🔊</span> Tell the story in YOUR words. Mom and Dad will listen tonight.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(book.retellPrompts.length > 0
                ? book.retellPrompts
                : ['Who was the story about?', 'What was your favorite part?']).map((p) => (
                <span
                  key={p}
                  style={{
                    background: 'var(--lf-pastel-lilac)',
                    borderRadius: 'var(--radius-scallop)',
                    padding: '6px 13px',
                    font: '700 13px var(--font-body)',
                    color: 'var(--lf-espresso)',
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, flex: 1 }}>
              {recState === 'saved' ? (
                <div
                  className="lf-pop-in"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: 'var(--lf-pastel-mint)',
                    borderRadius: 14,
                    padding: '16px 22px',
                    font: '700 18px var(--font-body)',
                    color: 'var(--lf-espresso)',
                  }}
                >
                  <span aria-hidden="true" style={{ fontSize: 26 }}>💌</span> Saved for Mom and Dad!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    className="lf-press"
                    disabled={recState === 'saving'}
                    onClick={() => {
                      if (recState === 'idle') void startRec()
                      else if (recState === 'recording') void stopRec()
                    }}
                    aria-label={recState === 'recording' ? 'Stop recording' : 'Start recording'}
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: '50%',
                      border: 'none',
                      cursor: 'pointer',
                      background: recState === 'recording' ? 'var(--lf-coral-deep)' : 'var(--lf-coral)',
                      color: '#fff',
                      fontSize: 38,
                      boxShadow: 'var(--shadow-coral-glow)',
                    }}
                  >
                    {recState === 'recording' ? '◼' : '🎙'}
                  </button>
                  <span
                    style={{
                      font: '700 15px var(--font-body)',
                      color: recState === 'recording' ? 'var(--lf-coral-deep)' : 'var(--lf-espresso-soft)',
                    }}
                  >
                    {recState === 'recording' ? `Recording… ${fmt(secs)}` : 'Tap to tell it!'}
                  </span>
                </div>
              )}
            </div>
            {error && (
              <div style={{ font: 'var(--text-meta)', color: 'var(--lf-espresso-soft)', textAlign: 'center' }}>
                {error}
              </div>
            )}
          </section>
        </div>

        <footer
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            justifyContent: 'center',
            minHeight: 64,
          }}
        >
          <button
            type="button"
            onClick={onDone}
            className="lf-press"
            style={{
              minHeight: 56,
              padding: '14px 30px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              background: 'var(--lf-coral)',
              color: '#fff',
              font: '700 18px var(--font-display)',
              boxShadow: 'var(--shadow-coral-glow)',
              cursor: 'pointer',
            }}
          >
            All done!
          </button>
        </footer>
      </div>
    </KidScreen>
  )
}

/* Kept for the reader import graph — the old EndPhase name still resolves. */
export function EndPhase({ story: _story }: { story: unknown }) {
  return (
    <KidScreen label="End">
      <div style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ font: 'var(--text-story-title)' }}>The end!</p>
        <Link href="/read" className="lf-press" style={{ color: 'var(--lf-coral)' }}>
          Back to the Bookshelf
        </Link>
      </div>
    </KidScreen>
  )
}
