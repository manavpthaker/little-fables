'use client'

// R20: the buddy interview. ≤3 questions, with a mandatory "why" question
// before the interview can be marked complete. The server (/api/respond mode
// 'interview-next') owns the recipe assembly + the reason enforcement; this
// component drives the turn loop and speaks / listens.
//
// The parent (page.tsx) hands us the initial seed transcript + guardrails.
// We POST /api/respond mode:'interview-next' with the prior turn history
// after each answer and speak whatever comes back. When the server returns
// { complete: true, recipe, readBack, buddyLine } we bubble that up via
// onComplete so the parent can drive the read-back turn.

import { useCallback, useEffect, useRef, useState } from 'react'
import { speak, listen, type SpeakHandle, type ListenHandle } from '@/lib/read/speech'
import type { BuddyDef, KidInterview, KidInterviewAnswer } from '@/types/story'
import { BigMic, BuddyFace, SpeechBubble } from '../components'

interface InterviewPhaseProps {
  buddy: BuddyDef
  seed: string
  guardrails: Record<string, unknown>
  /** Fires when the interview is fully complete with a recipe. */
  onComplete: (payload: {
    answers: KidInterviewAnswer[]
    recipe: KidInterview['recipe']
    readBack: string
    buddyLine: string
  }) => void
  /** Fires if the network is down and we need to bail out gracefully. */
  onFailure: (message: string) => void
}

type Phase =
  // Reading the buddy's line + waiting for it to finish.
  | 'buddy-speaking'
  // Mic is open — the child is answering.
  | 'listening'
  // Sending answer + fetching next question.
  | 'thinking'

interface NextResponse {
  complete?: boolean
  nextQuestion?: string
  slot?: string
  ackFromPrior?: string
  buddyLine?: string
  recipe?: KidInterview['recipe']
  readBack?: string
}

async function askNext(
  prior: KidInterviewAnswer[],
  seed: string,
  slotsAsked: string[],
  guardrails: Record<string, unknown>,
): Promise<NextResponse> {
  const res = await fetch('/api/respond', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      mode: 'interview-next',
      prior: prior.map((p) => ({ question: p.question, answer: p.answer, slot: p.slot })),
      seed,
      slotsAsked,
      guardrails,
    }),
  })
  if (!res.ok) throw new Error(`interview-next http ${res.status}`)
  return (await res.json()) as NextResponse
}

export function InterviewPhase({ buddy, seed, guardrails, onComplete, onFailure }: InterviewPhaseProps) {
  const [phase, setPhase] = useState<Phase>('buddy-speaking')
  const [line, setLine] = useState<string>('')
  const [currentQuestion, setCurrentQuestion] = useState<string>('')
  const [currentSlot, setCurrentSlot] = useState<string>('')
  const [answers, setAnswers] = useState<KidInterviewAnswer[]>([])

  // Refs for cleanup + avoiding stale closures inside async chains.
  const speakRef = useRef<SpeakHandle | null>(null)
  const listenRef = useRef<ListenHandle | null>(null)
  const answersRef = useRef<KidInterviewAnswer[]>([])
  const slotsRef = useRef<string[]>([])
  const cancelledRef = useRef(false)

  useEffect(() => {
    return () => {
      cancelledRef.current = true
      speakRef.current?.cancel()
      listenRef.current?.stop()
    }
  }, [])

  const openMic = useCallback((slot: string, question: string) => {
    if (cancelledRef.current) return
    setPhase('listening')
    setLine('')
    // Keep the mic open for a generous window — child pauses are real.
    let received = false
    listenRef.current = listen({
      timeoutMs: 10000,
      onResult: (transcript) => {
        received = true
        const answer: KidInterviewAnswer = {
          question,
          answer: transcript,
          slot,
        }
        const nextAnswers = [...answersRef.current, answer]
        answersRef.current = nextAnswers
        setAnswers(nextAnswers)
        if (!slotsRef.current.includes(slot)) slotsRef.current = [...slotsRef.current, slot]
        void driveNext()
      },
      onEnd: () => {
        if (received || cancelledRef.current) return
        // Silence — record a blank answer so the server's fallback path kicks
        // in (it'll bridge past this slot rather than re-ask it).
        const answer: KidInterviewAnswer = {
          question,
          answer: '',
          slot,
        }
        const nextAnswers = [...answersRef.current, answer]
        answersRef.current = nextAnswers
        setAnswers(nextAnswers)
        if (!slotsRef.current.includes(slot)) slotsRef.current = [...slotsRef.current, slot]
        void driveNext()
      },
      onError: () => {
        // Treat mic error like silence — server will bridge us forward.
        const answer: KidInterviewAnswer = {
          question,
          answer: '',
          slot,
        }
        const nextAnswers = [...answersRef.current, answer]
        answersRef.current = nextAnswers
        setAnswers(nextAnswers)
        if (!slotsRef.current.includes(slot)) slotsRef.current = [...slotsRef.current, slot]
        void driveNext()
      },
    })
    // driveNext ref is stable via useCallback below; disable is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const speakThen = useCallback((text: string, then: () => void) => {
    if (cancelledRef.current) return
    setPhase('buddy-speaking')
    setLine(text)
    speakRef.current?.cancel()
    let advanced = false
    const advance = () => {
      if (advanced || cancelledRef.current) return
      advanced = true
      then()
    }
    speakRef.current = speak(text, { onEnd: advance })
    // Safety timeout in case TTS never fires onEnd (offline, edge).
    setTimeout(advance, Math.max(2500, text.length * 60))
  }, [])

  const driveNext = useCallback(async () => {
    if (cancelledRef.current) return
    setPhase('thinking')
    try {
      const res = await askNext(answersRef.current, seed, slotsRef.current, guardrails)
      if (cancelledRef.current) return
      if (res.complete && res.recipe) {
        const readBack = res.readBack ?? "Here's what I heard."
        const buddyLine = res.buddyLine ?? `${readBack} Did I get it right?`
        onComplete({
          answers: answersRef.current,
          recipe: res.recipe,
          readBack,
          buddyLine,
        })
        return
      }
      const q = res.nextQuestion ?? 'Tell me a little more.'
      const slot = res.slot ?? 'freeform'
      const spoken = res.buddyLine ?? q
      setCurrentQuestion(q)
      setCurrentSlot(slot)
      speakThen(spoken, () => openMic(slot, q))
    } catch (e) {
      const msg = (e as Error).message
      onFailure(`Interview upstream failed: ${msg}`)
    }
  }, [seed, guardrails, onComplete, onFailure, speakThen, openMic])

  // Kick off — the parent has already handled the seed / redirect turn. Ask
  // the first question.
  useEffect(() => {
    void driveNext()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onMicTap = () => {
    if (phase !== 'listening') return
    listenRef.current?.stop()
  }

  return (
    <section
      aria-label="Buddy interview"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: '32px 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, maxWidth: 720, flexWrap: 'wrap', justifyContent: 'center' }}>
        <BuddyFace buddy={buddy} size={116} />
        <SpeechBubble big style={{ marginBottom: 12, maxWidth: 520 }}>
          {phase === 'thinking' ? '…thinking…' : line || currentQuestion}
        </SpeechBubble>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <BigMic
          size={104}
          listening={phase === 'listening'}
          onTap={onMicTap}
          label={phase === 'listening' ? 'Tap when done' : 'Say your answer'}
          disabled={phase !== 'listening'}
        />
        <div
          style={{
            font: '600 15px var(--font-body)',
            color: phase === 'listening' ? 'var(--lf-coral-deep)' : 'var(--lf-espresso-soft)',
            minHeight: 22,
          }}
        >
          {phase === 'buddy-speaking' && 'Listen…'}
          {phase === 'listening' && 'I\'m listening!'}
          {phase === 'thinking' && '…thinking…'}
        </div>
      </div>

      {/* Small answered-so-far strip — quiet, no numbers. */}
      {answers.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginTop: 6,
            opacity: 0.7,
          }}
          aria-hidden="true"
        >
          {answers.map((_a, i) => (
            <span
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'var(--lf-coral)',
              }}
            />
          ))}
        </div>
      )}

      {/* Placeholder to satisfy the currentSlot ref (used server-side for
          bookkeeping — kept in state for future UI). */}
      <span aria-hidden="true" style={{ display: 'none' }}>{currentSlot}</span>
    </section>
  )
}
