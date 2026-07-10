'use client'

// The story's End screen — celebration + tell-it-back. Rendered inline by the
// Reader after the last page. THE coral action on this screen: the record
// button (mic recedes to butter under bedtime automatically via CSS vars).

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Story } from '@/types/story'
import { createRecorder, speak, type RecorderHandle, type SpeakHandle } from '@/lib/read/speech'
import { saveRetell, uid } from '@/lib/read/storage'
import { Doodles, VocabStar } from '../../components'

function fmt(s: number): string {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

export function EndPhase({ story }: { story: Story }) {
  const [activeVocab, setActiveVocab] = useState<string | null>(null)
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

  useEffect(() => () => {
    speakRef.current?.cancel()
    recorderRef.current?.cancel()
  }, [])

  const meaning = story.vocab.find((v) => v.word === activeVocab)

  const tapVocab = (word: string) => {
    speakRef.current?.cancel()
    if (activeVocab === word) {
      setActiveVocab(null)
      return
    }
    setActiveVocab(word)
    const v = story.vocab.find((x) => x.word === word)
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
      await saveRetell({
        id: uid(),
        storyId: story.id,
        storyTitle: story.title,
        createdAt: Date.now(),
        mimeType: blob.type,
        blob,
      })
      setRecState('saved')
    } catch {
      setRecState('idle')
      setError('The recording didn’t save. Try once more.')
    }
  }, [story])

  return (
    <div className="sw-screen end-screen" style={{ position: 'relative', minHeight: '100dvh', paddingBottom: 40 }}>
      <style>{`
        .end-spread {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
          padding: 24px 32px 40px;
          align-items: center;
        }
        @media (min-width: 1000px) {
          .end-spread {
            grid-template-columns: 1fr 1fr;
            gap: 48px;
            padding: 24px 64px 40px;
          }
        }
      `}</style>
      <Doodles />

      <div className="end-spread">
        {/* Left: celebration + star words */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <span aria-hidden="true" style={{ position: 'relative', fontSize: 92, filter: 'var(--shadow-emoji)' }}>
            🎉
            <span style={{ position: 'absolute', top: -6, left: -44, fontSize: 32 }}>✨</span>
            <span style={{ position: 'absolute', bottom: 2, right: -44, fontSize: 28 }}>⭐</span>
          </span>
          <h1 style={{ margin: 0, font: '700 34px/1.2 var(--font-display)', color: 'var(--lf-espresso)' }}>
            The end! Great reading!
          </h1>
          <div style={{ font: '600 17px var(--font-body)', color: 'var(--lf-espresso-soft)', marginTop: -6 }}>
            {story.title}
          </div>

          {story.vocab.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                {story.vocab.map((v) => (
                  <VocabStar
                    key={v.word}
                    word={v.word}
                    active={activeVocab === v.word}
                    onTap={() => tapVocab(v.word)}
                  />
                ))}
              </div>
              <div
                style={{
                  font: '600 18px/1.5 var(--font-body)',
                  color: 'var(--lf-espresso-soft)',
                  minHeight: 54,
                  marginTop: 12,
                }}
              >
                {meaning ? (
                  <span className="sw-fade-up" style={{ display: 'inline-block' }}>
                    &ldquo;{meaning.word}&rdquo; means {meaning.meaning}
                  </span>
                ) : (
                  'Tap a star word to hear it'
                )}
              </div>
            </div>
          )}

          <Link
            href="/read"
            className="lf-press"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--lf-cream-card)',
              border: '1.5px solid var(--lf-cream-line)',
              borderRadius: 'var(--radius-pill)',
              padding: '15px 30px',
              font: '700 20px var(--font-display)',
              color: 'var(--lf-espresso)',
              textDecoration: 'none',
              minHeight: 56,
            }}
          >
            <span aria-hidden="true">📚</span> Back to the Bookshelf
          </Link>
        </div>

        {/* Right: tell it back */}
        <div
          style={{
            background: 'var(--lf-cream-card)',
            border: '1.5px solid var(--lf-cream-line)',
            borderRadius: 'var(--radius-hero)',
            padding: '28px 36px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              font: '700 14px var(--font-body)',
              color: 'var(--lf-espresso-faint)',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              whiteSpace: 'nowrap',
            }}
          >
            Tell it back 🎤
          </div>
          <div style={{ textAlign: 'left', width: '100%' }}>
            {story.retellPrompts.map((r, i) => (
              <div key={i} style={{ font: '600 19px/1.6 var(--font-body)', color: 'var(--lf-espresso)' }}>
                {r}
              </div>
            ))}
          </div>

          <span style={{ position: 'relative', display: 'inline-flex', width: 96, height: 96, marginTop: 6, flexShrink: 0 }}>
            {recState === 'recording' && (
              <>
                <span className="sw-ring" />
                <span className="sw-ring sw-ring2" />
                <span className="sw-ring sw-ring3" />
              </>
            )}
            <button
              type="button"
              aria-label={recState === 'recording' ? 'Finish recording' : 'Record your story'}
              disabled={recState === 'saving' || recState === 'saved'}
              onClick={() => {
                if (recState === 'idle') startRec()
                else if (recState === 'recording') stopRec()
              }}
              className={'lf-press' + (recState === 'recording' ? '' : ' sw-breathe')}
              style={{
                position: 'relative',
                width: 96,
                height: 96,
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                background: recState === 'recording' ? 'var(--lf-coral-deep)' : 'var(--lf-coral)',
                boxShadow: 'var(--shadow-coral-glow)',
                fontSize: 38,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span aria-hidden="true">{recState === 'recording' ? '⏸' : '🎤'}</span>
            </button>
          </span>

          {recState === 'recording' ? (
            <div className="sw-fade-up" style={{ font: '700 20px var(--font-display)', color: 'var(--lf-espresso)' }}>
              I&rsquo;m listening… {fmt(secs)}
            </div>
          ) : recState === 'saved' ? (
            <div
              className="sw-fade-up"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                background: 'var(--lf-pastel-mint)',
                borderRadius: 'var(--radius-pill)',
                padding: '12px 22px',
                font: '700 19px var(--font-display)',
                color: 'var(--lf-espresso)',
              }}
            >
              <span aria-hidden="true">✓</span> Saved for Mom and Dad!
            </div>
          ) : recState === 'saving' ? (
            <div style={{ font: '600 17px/1.4 var(--font-body)', color: 'var(--lf-espresso-soft)' }}>Saving…</div>
          ) : (
            <div style={{ font: '600 17px/1.4 var(--font-body)', color: 'var(--lf-espresso-soft)', textAlign: 'center' }}>
              Tell the story back in your own words — press to record
            </div>
          )}

          {error && (
            <div style={{ font: 'var(--text-meta)', color: 'var(--lf-espresso-soft)', textAlign: 'center' }}>{error}</div>
          )}
        </div>
      </div>
    </div>
  )
}
