'use client'

// Reader — landscape picture-book spread: art on the left page, words + the
// teacher's voice (asks, choices) on the right. Word-by-word highlight,
// ask → listening → praise/hint (unblocks after 2 misses so a 4-year-old is
// never hard-stuck), choice → "changing the story…" → branch page.

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { STARTER_STORIES } from '@/lib/read/starter-stories'
import { getStory, saveStory } from '@/lib/read/storage'
import { loadUniverse } from '@/lib/universe/azad-verse'
import {
  listen,
  matchesAny,
  recognitionAvailable,
  speak,
  type SpeakHandle,
} from '@/lib/read/speech'
import type { ChoiceOption, GenerateResponse, Story, StoryPage } from '@/types/story'
import { AskBubble, CircleBtn, ProgressBar } from '../../components'
import { EndPhase } from './EndPhase'

type AskUiState = 'idle' | 'listening' | 'praise' | 'hint'

export default function Reader() {
  const { id } = useParams<{ id: string }>()

  const [story, setStory] = useState<Story | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const s = getStory(id) ?? STARTER_STORIES.find((s) => s.id === id) ?? null
    if (!s) setNotFound(true)
    else setStory(s)
  }, [id])

  if (notFound) {
    return (
      <main
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          textAlign: 'center',
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 64 }}>📚</span>
        <p style={{ font: 'var(--text-story-title)' }}>Hmm, that book isn’t on the shelf.</p>
        <Link
          href="/read"
          className="lf-press"
          style={{
            background: 'var(--lf-cream-card)',
            border: '1.5px solid var(--lf-cream-line)',
            borderRadius: 'var(--radius-pill)',
            padding: '12px 24px',
            font: 'var(--text-cta)',
            color: 'var(--lf-espresso)',
            textDecoration: 'none',
          }}
        >
          Back to the Bookshelf
        </Link>
      </main>
    )
  }

  if (!story) return null

  return <ReaderStory story={story} onStoryUpdate={setStory} />
}

function ReaderStory({ story, onStoryUpdate }: { story: Story; onStoryUpdate: (s: Story) => void }) {
  const [pageIdx, setPageIdx] = useState(0)
  const [phase, setPhase] = useState<'reading' | 'end'>('reading')

  // Per-page state (reset on nav)
  const [wordIdx, setWordIdx] = useState(-1)
  const [reading, setReading] = useState(true)
  const [askState, setAskState] = useState<AskUiState>('idle')
  const [tries, setTries] = useState(0)
  const [fallbackUnlocked, setFallbackUnlocked] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [choiceGen, setChoiceGen] = useState(false)
  const [choiceError, setChoiceError] = useState<string | null>(null)

  const speakRef = useRef<SpeakHandle | null>(null)
  const listenStopRef = useRef<(() => void) | null>(null)

  const page: StoryPage | undefined = story.pages[pageIdx]
  const words = useMemo(() => (page ? page.text.split(/\s+/).filter(Boolean) : []), [page])
  const total = story.pages.length
  const isLastPage = pageIdx === total - 1

  const micOk = recognitionAvailable()

  // ---- narration ----
  const stopAll = useCallback(() => {
    speakRef.current?.cancel()
    speakRef.current = null
    listenStopRef.current?.()
    listenStopRef.current = null
    setWordIdx(-1)
  }, [])

  const narrate = useCallback(
    (text: string, onEnd?: () => void) => {
      speakRef.current?.cancel()
      setWordIdx(-1)
      speakRef.current = speak(text, {
        onWord: (i) => setWordIdx(i),
        onEnd: () => {
          setWordIdx(-1)
          onEnd?.()
        },
      })
    },
    []
  )

  // Auto-read each page on arrival (and when toggle turns reading on).
  useEffect(() => {
    if (!page) return
    if (!reading) {
      speakRef.current?.cancel()
      setWordIdx(-1)
      return
    }
    const t = setTimeout(() => narrate(page.text), 350)
    return () => {
      clearTimeout(t)
      speakRef.current?.cancel()
    }
    // page identity + reading toggle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, reading])

  // Reset per-page state whenever pageIdx changes.
  useEffect(() => {
    setAskState('idle')
    setTries(0)
    setFallbackUnlocked(false)
    setChosen(null)
    setChoiceGen(false)
    setChoiceError(null)
  }, [pageIdx])

  useEffect(() => () => stopAll(), [stopAll])

  // ---- ask ----
  const evaluate = useCallback(
    (transcript: string) => {
      const ask = page?.ask
      if (!ask) return
      const ok = ask.answers.length === 0 || matchesAny(transcript, ask.answers)
      if (ok) {
        setAskState('praise')
        narrate(ask.praise)
        return
      }
      setTries((prevTries) => {
        const next = prevTries + 1
        if (next >= 2) {
          // 2 unmatched attempts — accept anything so the child is never hard-stuck.
          setFallbackUnlocked(true)
          setAskState('hint')
          narrate(ask.hint)
        } else {
          setAskState('hint')
          narrate(ask.hint, () => setAskState('idle'))
        }
        return next
      })
    },
    [page, narrate]
  )

  const handleMic = useCallback(() => {
    if (!page?.ask) return
    stopAll()
    if (!micOk) {
      // No speech recognition available (design fallback): unlock manual affordance.
      setFallbackUnlocked(true)
      return
    }
    setAskState('listening')
    listenStopRef.current =
      listen({
        onResult: (t) => evaluate(t),
        onEnd: () => {
          listenStopRef.current = null
          setAskState((s) => (s === 'listening' ? 'idle' : s))
        },
      }).stop
  }, [page, micOk, stopAll, evaluate])

  // "I said it!" fallback: accept the answer, echo praise (real speech is
  // unavailable OR the child failed twice), and unblock Next.
  const handleSayIt = useCallback(() => {
    if (!page?.ask) return
    stopAll()
    setAskState('praise')
    narrate(page.ask.praise)
  }, [page, stopAll, narrate])

  // ---- choices ----
  const applyBranchStarter = useCallback(
    (opt: ChoiceOption) => {
      // Splice pre-baked branch pages after the current page (in-memory only).
      const currentIdx = pageIdx
      const branchPages = opt.pages ?? []
      const cleaned = story.pages.map((p, i) =>
        i === currentIdx ? ({ ...p, choice: undefined } as StoryPage) : p
      )
      const newPages = [...cleaned]
      newPages.splice(currentIdx + 1, 0, ...branchPages)
      onStoryUpdate({ ...story, pages: newPages })
      setPageIdx(currentIdx + 1)
    },
    [pageIdx, story, onStoryUpdate]
  )

  const applyBranchGenerated = useCallback(
    async (opt: ChoiceOption) => {
      try {
        const res = await fetch('/api/story', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            mode: 'continue',
            story,
            choice: opt.label,
            universe: loadUniverse(),
          }),
        })
        const data = (await res.json()) as GenerateResponse
        if (!res.ok || data.error) throw new Error(data.error || 'story engine error')

        const cleaned = story.pages.map((p, i) =>
          i === pageIdx ? ({ ...p, choice: undefined } as StoryPage) : p
        )
        const dedupedVocab = new Map<string, string>()
        for (const v of story.vocab) dedupedVocab.set(v.word, v.meaning)
        for (const v of data.vocab ?? []) dedupedVocab.set(v.word, v.meaning)

        const updated: Story = {
          ...story,
          pages: [...cleaned, ...data.pages],
          status: data.done ? 'complete' : 'awaiting-choice',
          vocab: Array.from(dedupedVocab.entries()).map(([word, meaning]) => ({ word, meaning })),
          retellPrompts:
            data.done && data.retellPrompts?.length ? data.retellPrompts : story.retellPrompts,
        }
        saveStory(updated)
        onStoryUpdate(updated)
        setPageIdx(pageIdx + 1)
      } catch {
        // Kid-facing copy — no error jargon.
        setChoiceError('The story machine hiccuped. Try again!')
        setChoiceGen(false)
        setChosen(null)
      }
    },
    [story, pageIdx, onStoryUpdate]
  )

  const handleChoose = useCallback(
    (opt: ChoiceOption) => {
      if (chosen) return
      stopAll()
      setChosen(opt.label)
      // Design timing: dim non-chosen 650ms → "changing the story…"
      setTimeout(() => {
        setChoiceGen(true)
        if (opt.pages && opt.pages.length > 0) {
          // Pre-baked branch — brief pause so the transition reads, then advance.
          setTimeout(() => {
            setChoiceGen(false)
            applyBranchStarter(opt)
          }, 1500)
        } else {
          applyBranchGenerated(opt)
        }
      }, 650)
    },
    [chosen, stopAll, applyBranchStarter, applyBranchGenerated]
  )

  // ---- navigation ----
  const askAnswered = askState === 'praise' || (askState === 'hint' && fallbackUnlocked)
  const askBlocked = !!page?.ask && !askAnswered
  const choiceBlocked = !!page?.choice && !chosen
  const blocked = askBlocked || choiceBlocked || choiceGen

  const goNext = useCallback(() => {
    if (blocked) return
    stopAll()
    if (isLastPage) {
      setPhase('end')
      return
    }
    setPageIdx((i) => i + 1)
  }, [blocked, isLastPage, stopAll])

  const goPrev = useCallback(() => {
    if (pageIdx === 0) return
    stopAll()
    setPageIdx((i) => i - 1)
  }, [pageIdx, stopAll])

  const replayPage = useCallback(() => {
    if (!page) return
    stopAll()
    setReading(true)
    narrate(page.text)
  }, [page, stopAll, narrate])

  // ---- render ----
  if (phase === 'end') return <EndPhase story={story} />
  if (!page) return null

  const glow =
    askState === 'praise'
      ? '0 0 0 3px rgba(52, 211, 153, .55), 0 12px 30px rgba(52, 211, 153, .22)'
      : askState === 'hint'
        ? '0 0 0 3px rgba(251, 191, 36, .55), 0 12px 30px rgba(251, 191, 36, .22)'
        : 'none'

  const progress = (pageIdx + (page.ask && askAnswered ? 0.5 : 0)) / total
  const bleed = !!page.bleed

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .reader-spread { display: grid; grid-template-columns: 1fr; flex: 1; min-height: 0; }
        @media (min-width: 1000px) { .reader-spread { grid-template-columns: 46% 1fr; } }
        .art-slot { padding: 4px 16px 18px; display: flex; align-items: center; justify-content: center; }
        @media (min-width: 1000px) { .art-slot { padding: 4px 8px 18px 36px; } }
        .art-slot.bleed { padding: 0; }
      `}</style>

      {/* Top bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '52px 1fr 52px',
          alignItems: 'center',
          padding: '18px 24px 8px',
          gap: 12,
        }}
      >
        <Link href="/read" onClick={stopAll} style={{ textDecoration: 'none' }}>
          <CircleBtn label="Back to bookshelf">‹</CircleBtn>
        </Link>
        <span style={{ font: '700 21px var(--font-display)', textAlign: 'center' }}>Story time</span>
        <CircleBtn
          label={reading ? 'Pause read-aloud' : 'Read aloud'}
          onClick={() => setReading((r) => !r)}
          style={{ color: reading ? 'var(--lf-espresso-soft)' : 'var(--lf-espresso-faint)' }}
        >
          <span aria-hidden="true">{reading ? '🔊' : '🔇'}</span>
        </CircleBtn>
      </div>

      <div className="reader-spread">
        {/* Left: the art */}
        <div className={'art-slot' + (bleed ? ' bleed' : '')} style={{ position: 'relative', minHeight: 0 }}>
          {page.scene.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={page.scene.image}
              alt=""
              style={
                bleed
                  ? {
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '0 var(--radius-hero) var(--radius-hero) 0',
                      boxShadow: 'var(--shadow-warm-lg)',
                    }
                  : {
                      width: '100%',
                      maxHeight: 500,
                      objectFit: 'contain',
                      borderRadius: 'var(--radius-hero)',
                      display: 'block',
                      boxShadow: 'var(--shadow-warm-lg)',
                      border: '1.5px solid var(--lf-cream-line)',
                      boxSizing: 'border-box',
                      background: '#f7f1e3',
                    }
              }
            />
          ) : (
            // Fallback: emoji-on-gradient scene (generated stories, no art yet)
            <div
              aria-hidden="true"
              style={{
                width: '100%',
                aspectRatio: '4 / 3',
                borderRadius: 'var(--radius-hero)',
                background: page.scene.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                boxShadow: 'var(--shadow-warm-lg)',
                border: '1.5px solid var(--lf-cream-line)',
                filter: 'var(--shadow-emoji)',
              }}
            >
              {page.scene.emojis.map((e, i) => (
                <span key={i} style={{ fontSize: i === 0 ? 120 : 72 }}>
                  {e}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: words + teaching */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, padding: '4px 24px 0 24px' }}>
          <div className="sw-screen" style={{ flex: 1, minHeight: 0 }}>
            <div
              style={{
                background: 'var(--lf-cream-card)',
                border: '1.5px solid var(--lf-cream-line)',
                borderRadius: 'var(--radius-card)',
                padding: '26px 30px',
                boxShadow: glow,
                transition: 'box-shadow 300ms var(--ease-out)',
              }}
            >
              <p style={{ margin: 0, font: 'var(--text-story-page)', color: 'var(--lf-espresso)' }}>
                {words.map((w, i) => (
                  <span
                    key={i}
                    style={
                      i === wordIdx
                        ? {
                            background: 'var(--lf-pastel-peach)',
                            borderBottom: '3px solid var(--lf-coral)',
                            borderRadius: 4,
                            padding: '0 3px',
                          }
                        : undefined
                    }
                  >
                    {w}{' '}
                  </span>
                ))}
              </p>

              {/* Ask */}
              {page.ask && (
                <div
                  style={{
                    marginTop: 18,
                    borderTop: '1.5px dashed var(--lf-cream-line)',
                    paddingTop: 18,
                  }}
                >
                  <AskBubble
                    question={page.ask.question}
                    praise={page.ask.praise}
                    hint={page.ask.hint}
                    skill={page.ask.skill}
                    state={askState === 'idle' ? 'question' : askState}
                    onMicTap={handleMic}
                    onSayIt={!micOk || fallbackUnlocked ? handleSayIt : undefined}
                    fallbackUnlocked={fallbackUnlocked}
                  />
                </div>
              )}

              {/* Choice */}
              {page.choice && !choiceGen && (
                <div
                  style={{
                    marginTop: 18,
                    borderTop: '1.5px dashed var(--lf-cream-line)',
                    paddingTop: 18,
                  }}
                >
                  <ChoiceGrid
                    prompt={page.choice.prompt}
                    options={page.choice.options}
                    chosen={chosen}
                    onChoose={handleChoose}
                  />
                  <div
                    style={{
                      font: '600 14px var(--font-body)',
                      color: 'var(--lf-espresso-soft)',
                      textAlign: 'center',
                      marginTop: 10,
                    }}
                  >
                    Say it out loud — or tap it!
                  </div>
                  {choiceError && (
                    <div
                      role="alert"
                      style={{
                        marginTop: 12,
                        background: 'var(--lf-pastel-peach)',
                        borderRadius: 14,
                        padding: '10px 14px',
                        font: '700 15px var(--font-body)',
                        color: 'var(--lf-espresso)',
                        textAlign: 'center',
                      }}
                    >
                      {choiceError}
                    </div>
                  )}
                </div>
              )}

              {/* Choice generating */}
              {choiceGen && (
                <div
                  className="sw-fade-up"
                  style={{
                    marginTop: 18,
                    borderTop: '1.5px dashed var(--lf-cream-line)',
                    paddingTop: 22,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                    textAlign: 'center',
                  }}
                >
                  <span aria-hidden="true" style={{ fontSize: 42, filter: 'var(--shadow-emoji)' }}>✨</span>
                  <span style={{ font: '700 21px var(--font-display)' }}>Your choice is changing the story…</span>
                  <div style={{ display: 'flex', gap: 8 }} aria-hidden="true">
                    <span className="sw-dot" style={{ width: 10, height: 10 }} />
                    <span className="sw-dot" style={{ width: 10, height: 10, animationDelay: '.18s' }} />
                    <span className="sw-dot" style={{ width: 10, height: 10, animationDelay: '.36s' }} />
                  </div>
                </div>
              )}
            </div>
            <div style={{ height: 14 }} />
          </div>

          {/* Progress */}
          <div style={{ padding: '4px 10px 0', flexShrink: 0 }}>
            <ProgressBar value={progress} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                font: '600 14px var(--font-body)',
                color: 'var(--lf-espresso-soft)',
                marginTop: 7,
              }}
            >
              <span>{`page ${pageIdx + 1} of ${total}`}</span>
              <span>{story.title}</span>
            </div>
          </div>

          {/* Controls — Next is THE coral action; grays out while blocked */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 26,
              padding: '10px 0 26px',
              flexShrink: 0,
            }}
          >
            <CircleBtn label="Previous page" onClick={goPrev} size={56} disabled={pageIdx === 0}>
              ‹
            </CircleBtn>
            <button
              type="button"
              aria-label="Next page"
              onClick={goNext}
              disabled={blocked}
              className="lf-press"
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                border: 'none',
                background: blocked ? 'var(--lf-cream-line)' : 'var(--lf-coral)',
                boxShadow: blocked ? 'none' : 'var(--shadow-coral-glow)',
                color: blocked ? 'var(--lf-espresso-faint)' : 'var(--sw-on-action)',
                fontSize: 27,
                cursor: blocked ? 'default' : 'pointer',
                paddingLeft: 5,
                boxSizing: 'border-box',
                transition: 'background 200ms, box-shadow 200ms',
              }}
            >
              ▶
            </button>
            <CircleBtn label="Read this page again" onClick={replayPage} size={56}>
              ↺
            </CircleBtn>
          </div>
        </div>
      </div>
    </div>
  )
}

// Local wrapper so the reader can pass richer options to ChoiceCards without
// polluting the shared component's shape.
function ChoiceGrid({
  prompt,
  options,
  chosen,
  onChoose,
}: {
  prompt: string
  options: ChoiceOption[]
  chosen: string | null
  onChoose: (o: ChoiceOption) => void
}) {
  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-display)' }}>
      {prompt && (
        <div
          style={{
            font: '700 20px/1.3 var(--font-display)',
            color: 'var(--lf-espresso)',
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          {prompt}
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(options.length, 3)}, 1fr)`,
          gap: 10,
        }}
      >
        {options.map((o) => {
          const isChosen = chosen === o.label
          const dim = chosen != null && !isChosen
          return (
            <button
              key={o.label}
              type="button"
              className="lf-press"
              onClick={() => onChoose(o)}
              disabled={chosen != null}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                border: isChosen ? '2.5px solid var(--lf-coral)' : '2px solid var(--lf-cream-line)',
                background: isChosen ? 'var(--lf-pastel-peach)' : 'var(--lf-cream-card)',
                borderRadius: 'var(--radius-cover)',
                padding: '16px 12px',
                color: 'var(--lf-espresso)',
                opacity: dim ? 0.45 : 1,
                minHeight: 'var(--touch-target)',
                cursor: chosen ? 'default' : 'pointer',
                boxShadow: isChosen ? 'var(--shadow-coral-glow)' : 'none',
                transition:
                  'opacity 650ms var(--ease-out), box-shadow 300ms var(--ease-out), background 300ms var(--ease-out)',
                fontFamily: 'var(--font-display)',
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 44, lineHeight: 1.1, filter: 'var(--shadow-emoji)' }}>{o.emoji}</span>
              <span style={{ font: '600 15px/1.25 var(--font-display)', textAlign: 'center' }}>{o.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
