'use client'

// R20: the buddy interview — dual-mode per the touch-balance directive.
// Every buddy question renders 3-4 drawn suggestion chips (contextual —
// pulled from a small tag catalog per slot) AND the mic simultaneously.
// Tapping a chip → uses that answer immediately (no mic wait). Mic still
// works and is co-present.
//
// Read-back: a big-target confirm ("That's it!" / "Change it") with voice
// equivalent. The parent (page.tsx) still drives the readback turn — this
// component ends when the server returns { complete: true, recipe }.
//
// The server (/api/respond mode 'interview-next') owns the recipe assembly
// + the reason enforcement. This component drives the turn loop, speaks
// / listens, and offers chips.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { speak, listen, type SpeakHandle, type ListenHandle } from '@/lib/read/speech'
import type { BuddyDef, KidInterview, KidInterviewAnswer } from '@/types/story'
import { CreatureSprite, MicIcon, SpeechBubble } from '../art'
import type { BuddyKind } from '../art'

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
  | 'buddy-speaking'
  | 'listening'
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

// -------- Chip catalog per slot --------
// Contextual quick answers a 4yo can tap. Kept short + concrete. The mic is
// always present alongside — chips are an accelerant, not a cage. v3.2:
// chips are text-only (no decorative emoji), rendered as drawn cream cards.
const CHIP_CATALOG: Record<string, string[]> = {
  want: ['fly high', 'find a hidden place', 'make a friend', 'share a snack'],
  reason: ['to help someone', "'cause it's fun", 'to feel less alone', 'to see something new'],
  obstacle: ['a big storm', 'a lost thing', 'a grumpy someone', 'the way is blocked'],
  character: ['a brave bear', 'a clever fox', 'a slow turtle', 'a tiny bird'],
  setting: ['a deep forest', 'the seashore', 'a cozy town', 'up in the stars'],
  freeform: ['something magical', 'something silly', 'something kind'],
}

function chipsForSlot(slot: string): string[] {
  return CHIP_CATALOG[slot] ?? CHIP_CATALOG.freeform!
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
  const [currentSlot, setCurrentSlot] = useState<string>('freeform')
  const [answers, setAnswers] = useState<KidInterviewAnswer[]>([])

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

  const acceptAnswer = useCallback(
    (transcript: string, slot: string, question: string) => {
      const answer: KidInterviewAnswer = { question, answer: transcript, slot }
      const nextAnswers = [...answersRef.current, answer]
      answersRef.current = nextAnswers
      setAnswers(nextAnswers)
      if (!slotsRef.current.includes(slot)) slotsRef.current = [...slotsRef.current, slot]
      // Stop the mic if it happens to be open.
      listenRef.current?.stop()
      listenRef.current = null
      void driveNext()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const openMic = useCallback(
    (slot: string, question: string) => {
      if (cancelledRef.current) return
      setPhase('listening')
      let received = false
      listenRef.current = listen({
        timeoutMs: 10000,
        onResult: (transcript) => {
          received = true
          acceptAnswer(transcript, slot, question)
        },
        onEnd: () => {
          if (received || cancelledRef.current) return
          // Silence — record a blank answer so the server bridges past this
          // slot rather than re-ask it. Chips are still visible while the
          // mic is closed, so the child can still tap.
          acceptAnswer('', slot, question)
        },
        onError: () => {
          acceptAnswer('', slot, question)
        },
      })
    },
    [acceptAnswer],
  )

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

  // Kick off — the parent has already handled the seed / redirect turn.
  useEffect(() => {
    void driveNext()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onMicTap = () => {
    if (phase !== 'listening') return
    listenRef.current?.stop()
  }

  const chips = useMemo(() => chipsForSlot(currentSlot), [currentSlot])

  return (
    <section
      aria-label="Buddy interview"
      className="lf-room"
      style={{
        position: 'relative',
        minHeight: '100dvh',
        background: 'var(--paper, #F4EBD8)',
        backgroundImage: 'var(--texture-paper)',
        color: 'var(--ink, #46362A)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: '32px 24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 18,
          maxWidth: 720,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <div style={{ pointerEvents: 'none' }}>
          <CreatureSprite
            kind={((buddy.id as BuddyKind) ?? 'bramble') as BuddyKind}
            pose={phase === 'listening' ? 'listening' : phase === 'thinking' ? 'pointing' : 'idle'}
            size={140}
          />
        </div>
        <SpeechBubble big style={{ marginBottom: 12, maxWidth: 520 }}>
          {phase === 'thinking' ? '…thinking…' : line || currentQuestion}
        </SpeechBubble>
      </div>

      {/* Chips + mic co-present. Chips always render (unless we're thinking). */}
      {phase !== 'thinking' && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'center',
            maxWidth: 720,
          }}
        >
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => acceptAnswer(c, currentSlot, currentQuestion || 'Tell me more')}
              className="lf-press lf-drawn-border"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                minHeight: 56,
                padding: '10px 18px',
                borderRadius: '14px 18px 15px 17px',
                background: 'var(--paper-bright, #F9F2E3)',
                backgroundImage: 'var(--texture-paper)',
                color: 'var(--ink, #46362A)',
                border: 'none',
                font: '700 16px var(--font-body)',
                cursor: 'pointer',
                fontStyle: 'italic',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          aria-label={phase === 'listening' ? 'Tap when done' : 'Or say your answer'}
          onClick={onMicTap}
          disabled={phase !== 'listening'}
          className="lf-press lf-drawn-border lf-drawn-border--bold"
          style={{
            width: 104,
            height: 104,
            borderRadius: '50% 48% 52% 50%',
            border: 'none',
            background:
              phase === 'listening'
                ? 'var(--pigment-terracotta-deep, #C7452F)'
                : 'var(--pigment-terracotta, #D95B43)',
            backgroundImage: 'var(--texture-paper)',
            color: '#F9F2E3',
            fontSize: 42,
            boxShadow: '0 8px 20px rgba(217,91,67,.35)',
            cursor: phase === 'listening' ? 'pointer' : 'default',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'manipulation',
          }}
        >
          <MicIcon size={48} />
        </button>
        <div
          style={{
            font: '600 15px var(--font-body)',
            fontStyle: 'italic',
            color: phase === 'listening' ? 'var(--pigment-terracotta-deep, #C7452F)' : 'var(--ink-soft, #6E5B49)',
            minHeight: 22,
          }}
        >
          {phase === 'buddy-speaking' && 'or tap one above'}
          {phase === 'listening' && "I'm listening — or tap one above"}
          {phase === 'thinking' && '…thinking…'}
        </div>
      </div>

      {/* Answered-so-far quiet dots. */}
      {answers.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 6, opacity: 0.7 }} aria-hidden="true">
          {answers.map((_a, i) => (
            <span
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'var(--pigment-terracotta, #D95B43)',
              }}
            />
          ))}
        </div>
      )}

      {/* Slot marker kept for future analytics. */}
      <span aria-hidden="true" style={{ display: 'none' }}>{currentSlot}</span>
    </section>
  )
}
