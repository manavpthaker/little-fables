'use client'

// v3 Drawn Room — completion loop.
//
// - `ChapterEnd`: recap question (tap-answer chips AND mic co-present per the
//   touch-balance directive). Hook line. Two big buttons: Next chapter
//   (terracotta) + All done. Preserves `markChapterFinished` + `checkBadges`
//   on mount. `data-register="story"`.
// - `ComfortRitualBeat`: full-screen drawn quiet moment (moon in a window
//   frame, honey pot, songbook). Tap advances; auto-advance 4000ms.
// - `BookComplete`: `data-register="lantern"` celebration. Buddy in center
//   with speech line. Star words fly to word-pins on a drawn wall (animated
//   arc, reduced-motion snaps). Record-your-retelling ≥96px terracotta.
//   Retell save + /api/listen transcript + /api/respond mode:'retell' reply.
//   Envelope-to-shelf animation. On badge earn → nav to
//   `/read/badges/earn/[id]` after 2.4s.
//
// Two components live in one file to keep the reader import short.

import Link from 'next/link'
import * as React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Book, BuddyDef, ComfortRitual, VocabWord } from '@/types/story'
import { createRecorder, speak, type RecorderHandle, type SpeakHandle } from '@/lib/read/speech'
import { saveRetell, uid, markChapterFinished, loadBadges } from '@/lib/read/storage'
import { pushRetell } from '@/lib/read/sync'
import { checkBadges } from '@/lib/read/badges'
import { cp } from '@/lib/read/buddies'
import { CreatureSprite, KidScreen, SpeechBubble, SpeakerIcon, MicIcon } from '../../art'
import type { BuddyKind } from '../../art'

// v3 R19 / R27 — session-scoped "creation offered" ref.
let sessionCreationOffered = false

function fmt(s: number): string {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

/* Small helper — a drawn "endpaper" panel used in loading/soft states. */
function Endpaper({ label }: { label?: string }) {
  return (
    <div
      className="lf-endpaper"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--ink-soft, #6E5B49)',
        font: '600 15px var(--font-body)',
        fontStyle: 'italic',
        background: 'var(--paper-bright, #F9F2E3)',
        backgroundImage: 'var(--texture-paper)',
      }}
    >
      {label ?? ''}
    </div>
  )
}

/* Two-tap answer chips for the recap question. Contextual quick answers so a
   4-year-old can respond without opening the mic. v3.2: text-only. */
const RECAP_CHIPS = [
  'The fun part!',
  'The kind part',
  'The magic bit',
  'The silly bit',
]

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

  // Preserved: reading-day sun + badge check on mount.
  useEffect(() => {
    markChapterFinished(book.id, chapterIdx)
    void checkBadges().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [state, setState] = useState<'question' | 'listening' | 'praise'>('question')
  const speakRef = useRef<SpeakHandle | null>(null)
  useEffect(() => () => speakRef.current?.cancel(), [])

  // Speak the recap on mount so the child hears + reads it.
  useEffect(() => {
    speakRef.current = speak(recapQ)
    return () => speakRef.current?.cancel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const settle = useCallback(
    (praiseLine: string) => {
      setState('praise')
      speakRef.current?.cancel()
      speakRef.current = speak(praiseLine)
    },
    [],
  )

  const onMic = () => {
    if (state !== 'question') return
    setState('listening')
    setTimeout(() => settle('I love that too. Nice remembering.'), 1500)
  }

  const onChip = (label: string) => {
    if (state === 'praise') return
    settle(`${label} — mm, good pick.`)
  }

  return (
    <KidScreen label={`Chapter end — ${chapter?.title ?? ''}`} style={{ padding: 0 }}>
      <div
        className="lf-room"
        data-register="story"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 22,
          padding: 32,
          background: 'var(--paper, #F4EBD8)',
          backgroundImage: 'var(--texture-paper)',
        }}
      >
        {/* Buddy + hook */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, maxWidth: 720, flexWrap: 'wrap', justifyContent: 'center' }}>
          <CreatureSprite kind={((buddy.id as BuddyKind) ?? 'bramble')} pose="idle" size={116} />
          <SpeechBubble big style={{ marginBottom: 12 }}>
            {cp(
              { b: `WOOHOO! Chapter ${chapterIdx + 1} — done!`, c: `Chapter ${chapterIdx + 1} — done. Lovely reading.` },
              energy,
            )}
          </SpeechBubble>
        </div>

        {/* Recap panel — drawn card */}
        <div
          className="lf-drawn-border"
          style={{
            width: 'min(640px, 94%)',
            background: 'var(--paper-bright, #F9F2E3)',
            backgroundImage: 'var(--texture-paper)',
            color: 'var(--ink, #46362A)',
            borderRadius: '18px 22px 19px 21px',
            padding: '20px 24px',
          }}
        >
          <div
            style={{
              font: '700 11px var(--font-body)',
              color: 'var(--ink-faint, #97836B)',
              textTransform: 'uppercase',
              letterSpacing: '.09em',
              marginBottom: 8,
            }}
          >
            tell me back
          </div>
          <div style={{ font: '700 20px/1.4 var(--font-display)', marginBottom: 14 }}>{recapQ}</div>

          {/* Options + mic co-present per the touch-balance directive. */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            {RECAP_CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChip(c)}
                disabled={state === 'praise'}
                className="lf-press lf-drawn-border"
                style={{
                  minHeight: 56,
                  padding: '10px 16px',
                  borderRadius: '14px 18px 15px 17px',
                  background: 'var(--paper, #F4EBD8)',
                  backgroundImage: 'var(--texture-paper)',
                  color: 'var(--ink, #46362A)',
                  font: '700 15px var(--font-body)',
                  cursor: state === 'praise' ? 'default' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {c}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              type="button"
              onClick={onMic}
              disabled={state !== 'question'}
              className="lf-press"
              aria-label="Answer out loud"
              style={{
                width: 62,
                height: 62,
                borderRadius: '50% 48% 52% 50%',
                border: 'none',
                background: state === 'listening' ? 'var(--pigment-terracotta-deep, #C7452F)' : 'var(--pigment-terracotta, #D95B43)',
                color: '#FBF4E6',
                cursor: state === 'question' ? 'pointer' : 'default',
                flexShrink: 0,
                boxShadow: '0 6px 14px rgba(217,91,67,.35)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MicIcon size={30} />
            </button>
            <div
              style={{
                font: '600 14px var(--font-body)',
                color: state === 'listening' ? 'var(--pigment-terracotta-deep, #C7452F)' : 'var(--ink-soft, #6E5B49)',
                fontStyle: 'italic',
              }}
            >
              {state === 'question' && 'or say it out loud'}
              {state === 'listening' && 'listening…'}
              {state === 'praise' && 'lovely'}
            </div>
          </div>
        </div>

        {/* Hook line — a small note at the bottom */}
        <div
          style={{
            font: '600 16px var(--font-body)',
            fontStyle: 'italic',
            color: 'var(--ink-soft, #6E5B49)',
            maxWidth: 560,
            textAlign: 'center',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <SpeakerIcon size={18} color="var(--ink-soft, #6E5B49)" /> {hook}
        </div>

        {/* Big actions — Next chapter is the coral primary */}
        <div style={{ display: 'flex', gap: 16, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onNextChapter}
            className="lf-press lf-drawn-border lf-drawn-border--bold"
            style={{
              minHeight: 68,
              padding: '14px 36px',
              borderRadius: '22px 26px 23px 25px',
              cursor: 'pointer',
              background: 'var(--pigment-terracotta, #D95B43)',
              backgroundImage: 'var(--texture-paper)',
              color: '#F9F2E3',
              border: 'none',
              font: '700 22px var(--font-display)',
              boxShadow: '0 8px 18px rgba(217,91,67,.4)',
            }}
          >
            Next chapter ▶
          </button>
          <button
            type="button"
            onClick={onAllDone}
            className="lf-press lf-drawn-border"
            style={{
              minHeight: 68,
              padding: '14px 30px',
              borderRadius: '22px 26px 23px 25px',
              cursor: 'pointer',
              background: 'var(--paper-bright, #F9F2E3)',
              backgroundImage: 'var(--texture-paper)',
              border: 'none',
              color: 'var(--ink, #46362A)',
              font: '700 20px var(--font-display)',
            }}
          >
            All done for now
          </button>
        </div>
      </div>
    </KidScreen>
  )
}

/* ================= ComfortRitualBeat =================
 * Quiet closing beat rendered between ChapterEnd and BookComplete when the
 * book carries a `comfortRitual` and it isn't `alreadyClosed`. Full-screen
 * drawn moment — moon in a window frame, honey pot, songbook. Auto-advance
 * after 4s; tap anywhere to advance faster.
 */

/* Drawn motifs — SVG so they read as illustration, not emoji. */
function MoonInWindow() {
  return (
    <svg width={220} height={260} viewBox="0 0 220 260" aria-hidden="true" style={{ filter: 'url(#lf-wobble, none)' }}>
      {/* window frame */}
      <rect x="16" y="18" width="188" height="224" rx="8"
        fill="none" stroke="currentColor" strokeWidth="4" />
      <line x1="110" y1="18" x2="110" y2="242" stroke="currentColor" strokeWidth="3" />
      <line x1="16" y1="130" x2="204" y2="130" stroke="currentColor" strokeWidth="3" />
      {/* sky wash */}
      <rect x="22" y="24" width="176" height="212"
        fill="rgba(34,48,74,.25)" />
      {/* moon */}
      <circle cx="146" cy="82" r="30" fill="#F3C77A" opacity=".95" />
      <circle cx="140" cy="76" r="30" fill="#22304A" opacity="0" />
      {/* stars */}
      <circle cx="60" cy="60" r="2.5" fill="#F3C77A" />
      <circle cx="82" cy="98" r="2" fill="#F3C77A" />
      <circle cx="46" cy="180" r="2.2" fill="#F3C77A" />
      <circle cx="170" cy="200" r="2" fill="#F3C77A" />
    </svg>
  )
}

function HoneyPot() {
  return (
    <svg width={220} height={220} viewBox="0 0 220 220" aria-hidden="true">
      {/* pot */}
      <path d="M 50 80 Q 50 60 70 60 L 150 60 Q 170 60 170 80 L 165 180 Q 165 200 145 200 L 75 200 Q 55 200 55 180 Z"
        fill="#E2A93B" stroke="currentColor" strokeWidth="4" />
      {/* rim */}
      <ellipse cx="110" cy="60" rx="45" ry="8" fill="#EFC85C" stroke="currentColor" strokeWidth="3" />
      {/* dripper */}
      <path d="M 90 30 Q 110 20 130 30 L 130 55 L 90 55 Z" fill="#5B4637" stroke="currentColor" strokeWidth="3" />
      {/* drip */}
      <path d="M 108 55 Q 108 78 112 92" stroke="#E2A93B" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function Songbook() {
  return (
    <svg width={240} height={200} viewBox="0 0 240 200" aria-hidden="true">
      {/* two pages */}
      <path d="M 20 40 L 118 30 L 118 180 L 20 190 Z" fill="#F9F2E3" stroke="currentColor" strokeWidth="4" />
      <path d="M 220 40 L 122 30 L 122 180 L 220 190 Z" fill="#F9F2E3" stroke="currentColor" strokeWidth="4" />
      {/* lines */}
      {[60, 80, 100, 120, 140].map((y) => (
        <line key={y} x1="34" y1={y - (y - 60) * 0.08} x2="108" y2={y - (y - 60) * 0.08 - 5}
          stroke="currentColor" strokeWidth="2" opacity=".6" />
      ))}
      {/* notes */}
      <circle cx="60" cy="86" r="5" fill="#D95B43" />
      <circle cx="86" cy="82" r="5" fill="#D95B43" />
      <path d="M 65 86 L 65 62 M 91 82 L 91 58" stroke="#D95B43" strokeWidth="2.5" />
      {/* stars on right page */}
      <text x="150" y="90" fontSize="22" fill="currentColor" opacity=".7">♪</text>
      <text x="180" y="130" fontSize="18" fill="currentColor" opacity=".6">♫</text>
    </svg>
  )
}

function Lullaby() {
  return (
    <svg width={220} height={220} viewBox="0 0 220 220" aria-hidden="true">
      {/* cloud */}
      <path d="M 40 130 Q 30 100 60 100 Q 60 70 100 78 Q 120 60 150 78 Q 190 76 190 110 Q 205 130 180 145 L 55 145 Q 35 145 40 130 Z"
        fill="#F9F2E3" stroke="currentColor" strokeWidth="4" />
      {/* zzz */}
      <text x="90" y="180" fontSize="42" fill="currentColor" fontFamily="serif" opacity=".7">z</text>
      <text x="115" y="170" fontSize="32" fill="currentColor" fontFamily="serif" opacity=".55">z</text>
      <text x="135" y="160" fontSize="24" fill="currentColor" fontFamily="serif" opacity=".4">z</text>
    </svg>
  )
}

const RITUAL_MOTIF: Record<ComfortRitual['motif'], () => React.ReactElement> = {
  moon: MoonInWindow,
  snack: HoneyPot,
  song: Songbook,
  lullaby: Lullaby,
}

export function ComfortRitualBeat({
  ritual,
  onDone,
}: {
  ritual: ComfortRitual
  onDone: () => void
}) {
  const speakRef = useRef<SpeakHandle | null>(null)
  const doneRef = useRef(false)

  const finish = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    speakRef.current?.cancel()
    onDone()
  }, [onDone])

  useEffect(() => {
    speakRef.current = speak(ritual.line)
    const t = setTimeout(finish, 4000)
    return () => {
      clearTimeout(t)
      speakRef.current?.cancel()
    }
  }, [ritual.line, finish])

  const Motif = RITUAL_MOTIF[ritual.motif] ?? MoonInWindow
  const isLantern = ritual.motif === 'moon' || ritual.motif === 'lullaby'
  const register = isLantern ? 'lantern' : 'story'

  return (
    <KidScreen label="Closing beat" style={{ padding: 0 }}>
      <div
        className="lf-room"
        data-register={register}
        style={{
          position: 'absolute',
          inset: 0,
          height: '100dvh',
          background: isLantern ? 'var(--lantern-indigo, #22304A)' : 'var(--paper, #F4EBD8)',
          backgroundImage: 'var(--texture-paper)',
          color: isLantern ? 'var(--lantern-gold, #F3C77A)' : 'var(--ink, #46362A)',
        }}
      >
        <button
          type="button"
          onClick={finish}
          aria-label="Tap to continue"
          className="lf-press"
          style={{
            position: 'absolute',
            inset: 0,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 30,
            padding: 32,
            textAlign: 'center',
            color: 'inherit',
          }}
        >
          <div className="lf-breath" style={{ color: 'currentColor', filter: 'drop-shadow(0 0 30px rgba(243,199,122,.35))' }}>
            <Motif />
          </div>
          <p
            style={{
              margin: 0,
              font: '700 26px/1.35 var(--font-display)',
              color: 'inherit',
              maxWidth: 560,
            }}
          >
            {ritual.line}
          </p>
          <p style={{ margin: 0, font: '600 15px var(--font-body)', fontStyle: 'italic', color: 'inherit', opacity: 0.7 }}>
            tap anywhere to keep going
          </p>
        </button>
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

  const [flownWords, setFlownWords] = useState<string[]>([])
  const [recState, setRecState] = useState<'idle' | 'recording' | 'saving' | 'saved'>('idle')
  const [secs, setSecs] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [buddyReply, setBuddyReply] = useState<string | null>(null)
  const [creationOfferOpen, setCreationOfferOpen] = useState(false)

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

  const tapVocab = (word: string) => {
    if (flownWords.includes(word)) return
    speakRef.current?.cancel()
    const v = vocab.find((x) => x.word === word)
    const utterance = v?.meaning ? `${v.word}. ${v.word} means ${v.meaning}.` : v?.word ?? word
    speakRef.current = speak(utterance)
    setFlownWords((f) => [...f, word])
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
      setRecState('saved')

      // Preserved: transcription + buddy reply, fire-and-forget.
      ;(async () => {
        let transcript: string | undefined
        try {
          const form = new FormData()
          form.append('audio', blob, `retell.${blob.type.split('/')[1] || 'webm'}`)
          const res = await fetch('/api/listen', { method: 'POST', body: form })
          if (res.ok) {
            const data = (await res.json()) as { transcript?: string }
            if (data.transcript && data.transcript.trim().length > 0) transcript = data.transcript
          }
        } catch {
          /* offline / not configured */
        }

        const finalRetell = { ...retell, transcript }
        void pushRetell(finalRetell as unknown as Parameters<typeof pushRetell>[0], blob)

        let reply: string | null = null
        try {
          const context = {
            book: { id: book.id, title: book.title, vocab: book.vocab },
            chapterTitles: book.chapters.map((c) => c.title),
          }
          const res = await fetch('/api/respond', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              mode: 'retell',
              transcript: transcript ?? '(no transcript available)',
              context,
            }),
          })
          if (res.ok) {
            const data = (await res.json()) as { buddyReply?: string }
            if (data.buddyReply && data.buddyReply.trim().length > 0) reply = data.buddyReply
          }
        } catch {
          /* offline / not configured */
        }
        if (!reply) {
          reply = 'You told that back like a real storyteller. I heard every part.'
        }
        setBuddyReply(reply)
        speakRef.current?.cancel()
        speakRef.current = speak(reply)
      })()

      // Preserved: badge check after retell.
      try {
        const granted = await checkBadges({ bookCompletedId: book.id })
        if (granted.length > 0) {
          setTimeout(() => router.push(`/read/badges/earn/${granted[0]}`), 2400)
        }
      } catch {
        /* ignore */
      }
    } catch {
      setRecState('idle')
      setError('The recording didn\'t save. Try once more.')
    }
  }, [book, router])

  // Honor a pending earn from server-side chapter-end.
  useEffect(() => {
    const badges = loadBadges()
    if (badges.pendingEarn) {
      router.push(`/read/badges/earn/${badges.pendingEarn}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Creation offer — preserved API.
  useEffect(() => {
    if (book.author === 'azad') return
    if (sessionCreationOffered) return
    const t = setTimeout(() => {
      sessionCreationOffered = true
      setCreationOfferOpen(true)
    }, 2600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id])

  const allWordsFlown = vocab.length > 0 && flownWords.length >= vocab.length

  return (
    <KidScreen label={`Book complete — ${book.title}`} style={{ padding: 0 }}>
      <div
        className="lf-room"
        data-register="lantern"
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          background: 'var(--lantern-indigo, #22304A)',
          backgroundImage: 'var(--texture-paper)',
          color: 'var(--lantern-gold, #F3C77A)',
        }}
      >
        {/* lantern pools of light — the light does the celebrating */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '50%',
            top: '55%',
            width: 900,
            height: 620,
            transform: 'translate(-50%,-50%)',
            background: 'radial-gradient(ellipse at center, rgba(243,199,122,0.30), transparent 62%)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '15%',
            top: '18%',
            width: 380,
            height: 300,
            background: 'radial-gradient(ellipse at center, rgba(243,199,122,0.16), transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <DustMotes n={9} />

        {/* Drawn wall reference — the "wall you just came from" — a soft
            paper strip along the right with pins where flown words settle. */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: 24,
            top: 90,
            bottom: 140,
            width: 92,
            background: 'rgba(249,242,227,0.06)',
            border: '1.5px solid rgba(249,242,227,0.14)',
            borderRadius: '10px 14px 11px 13px',
            pointerEvents: 'none',
          }}
        />

        {/* Word pins along the wall — one per vocab word */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: 40,
            top: 110,
            display: 'flex',
            flexDirection: 'column',
            gap: 32,
            pointerEvents: 'none',
          }}
        >
          {vocab.map((v) => (
            <div
              key={`pin-${v.word}`}
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: flownWords.includes(v.word)
                  ? 'var(--pigment-butter, #EFC85C)'
                  : 'rgba(243,199,122,.2)',
                border: '2px solid rgba(243,199,122,.6)',
                boxShadow: flownWords.includes(v.word) ? '0 0 20px 4px rgba(243,199,122,.55)' : 'none',
                transition: 'background 400ms, box-shadow 400ms',
              }}
            />
          ))}
        </div>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            paddingRight: 140,
            padding: '32px 152px 32px 36px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            overflowY: 'auto',
          }}
        >
          <header style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <CreatureSprite kind={((buddy.id as BuddyKind) ?? 'bramble')} pose="idle" size={110} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1
                style={{
                  margin: 0,
                  font: '700 32px var(--font-display)',
                  color: 'var(--lantern-gold, #F3C77A)',
                }}
              >
                {cp({ b: 'You read the WHOLE book!', c: 'You read the whole book.' }, energy)}
              </h1>
              <p
                style={{
                  margin: '4px 0 0',
                  font: '600 16px var(--font-body)',
                  fontStyle: 'italic',
                  color: 'rgba(242,231,206,.75)',
                }}
              >
                {book.title} — every single page.
              </p>
            </div>
            <SpeechBubble style={{ marginLeft: 'auto', maxWidth: 320 }}>
              {cp(
                { b: 'WOOHOO! You read it ALL! I knew you could!', c: 'You read it all. I am so proud of you.' },
                energy,
              )}
            </SpeechBubble>
          </header>

          {/* Star words — tap to fly them to the wall */}
          {vocab.length > 0 && (
            <section
              data-register="story"
              className="lf-drawn-border"
              style={{
                background: 'rgba(249,242,227,.9)',
                backgroundImage: 'var(--texture-paper)',
                color: 'var(--ink, #46362A)',
                border: 'none',
                borderRadius: '18px 22px 19px 21px',
                padding: '22px 24px',
              }}
            >
              <h2 style={{ margin: '0 0 4px', font: '700 22px var(--font-display)' }}>Your star words</h2>
              <p
                style={{
                  margin: '0 0 14px',
                  font: '600 13.5px var(--font-body)',
                  fontStyle: 'italic',
                  color: 'var(--ink-soft, #6E5B49)',
                }}
              >
                Tap a star — it flies onto your wall.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {vocab.map((v) => (
                  <FlyingStarWord
                    key={v.word}
                    word={v.word}
                    flown={flownWords.includes(v.word)}
                    onTap={() => tapVocab(v.word)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Retell section — record button ≥96px terracotta */}
          <section
            className="lf-drawn-border"
            style={{
              background: 'rgba(249,242,227,.9)',
              backgroundImage: 'var(--texture-paper)',
              color: 'var(--ink, #46362A)',
              borderRadius: '18px 22px 19px 21px',
              padding: '22px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <h2 style={{ margin: 0, font: '700 22px var(--font-display)' }}>Tell it back</h2>
            <p
              style={{
                margin: 0,
                font: '600 13.5px var(--font-body)',
                fontStyle: 'italic',
                color: 'var(--ink-soft, #6E5B49)',
              }}
            >
              Tell the story in YOUR words. Mom and Dad will listen tonight.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(book.retellPrompts.length > 0
                ? book.retellPrompts
                : ['Who was the story about?', 'What was your favorite part?']).map((p) => (
                <span
                  key={p}
                  style={{
                    background: 'rgba(217,91,67,.14)',
                    borderRadius: '12px 16px 13px 15px',
                    padding: '6px 13px',
                    font: '700 13px var(--font-body)',
                    color: 'var(--ink, #46362A)',
                  }}
                >
                  {p}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, minHeight: 140 }}>
              {recState === 'saved' ? (
                <EnvelopeToShelf buddyReply={buddyReply} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    className="lf-press lf-drawn-border lf-drawn-border--bold"
                    disabled={recState === 'saving'}
                    onClick={() => {
                      if (recState === 'idle') void startRec()
                      else if (recState === 'recording') void stopRec()
                    }}
                    aria-label={recState === 'recording' ? 'Stop recording' : 'Start recording'}
                    style={{
                      width: 118,
                      height: 118,
                      borderRadius: '50% 48% 52% 50%',
                      border: 'none',
                      cursor: 'pointer',
                      background:
                        recState === 'recording'
                          ? 'color-mix(in srgb, var(--pigment-terracotta, #D95B43) 62%, #F9F2E3)'
                          : 'var(--pigment-terracotta, #D95B43)',
                      backgroundImage: 'var(--texture-paper)',
                      color: '#F9F2E3',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 20px rgba(217,91,67,.4)',
                    }}
                  >
                    {recState === 'recording' ? (
                      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
                        <rect x="8" y="8" width="20" height="20" rx="3" fill="currentColor" filter="url(#lf-wobble)" />
                      </svg>
                    ) : (
                      <MicIcon size={44} />
                    )}
                  </button>
                  <span
                    style={{
                      font: '700 15px var(--font-body)',
                      fontStyle: 'italic',
                      color:
                        recState === 'recording'
                          ? 'var(--pigment-terracotta-deep, #C7452F)'
                          : 'var(--ink-soft, #6E5B49)',
                    }}
                  >
                    {recState === 'recording' ? `Recording… ${fmt(secs)}` : 'Tap to tell it!'}
                  </span>
                </div>
              )}
            </div>
            {error && (
              <div style={{ font: '600 13px var(--font-body)', color: 'var(--ink-soft, #6E5B49)', textAlign: 'center' }}>
                {error}
              </div>
            )}
          </section>

          {creationOfferOpen && (
            <section
              className="lf-drawn-border"
              aria-label="Make your own story"
              style={{
                background: 'rgba(249,242,227,.9)',
                backgroundImage: 'var(--texture-paper)',
                color: 'var(--ink, #46362A)',
                borderRadius: '18px 22px 19px 21px',
                padding: '18px 22px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <CreatureSprite kind={((buddy.id as BuddyKind) ?? 'bramble')} pose="idle" size={64} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: '700 17px/1.35 var(--font-display)', color: 'var(--ink, #46362A)' }}>
                  You know how this story machine works? YOU can drive it.
                </div>
                <div style={{ font: '600 13.5px var(--font-body)', fontStyle: 'italic', color: 'var(--ink-soft, #6E5B49)', marginTop: 4 }}>
                  Want to make one of your own?
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  type="button"
                  className="lf-press lf-drawn-border"
                  onClick={() => {
                    setCreationOfferOpen(false)
                    router.push('/read/create-with-buddy')
                  }}
                  style={{
                    minHeight: 56,
                    padding: '12px 20px',
                    borderRadius: '14px 18px 15px 17px',
                    border: 'none',
                    background: 'var(--paper, #F4EBD8)',
                    backgroundImage: 'var(--texture-paper)',
                    color: 'var(--ink, #46362A)',
                    font: '700 16px var(--font-display)',
                    cursor: 'pointer',
                  }}
                >
                  Yes!
                </button>
                <button
                  type="button"
                  className="lf-press"
                  aria-label="Not now"
                  onClick={() => setCreationOfferOpen(false)}
                  style={{
                    minHeight: 56,
                    padding: '12px 16px',
                    borderRadius: '14px 18px 15px 17px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--ink-soft, #6E5B49)',
                    font: '700 15px var(--font-display)',
                    cursor: 'pointer',
                  }}
                >
                  Maybe later
                </button>
              </div>
            </section>
          )}

          <footer
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              justifyContent: 'center',
              paddingTop: 8,
              paddingBottom: 12,
            }}
          >
            <button
              type="button"
              onClick={onDone}
              className="lf-press lf-drawn-border"
              style={{
                minHeight: 64,
                padding: '14px 30px',
                borderRadius: '22px 26px 23px 25px',
                border: 'none',
                background: 'rgba(249,242,227,.15)',
                backgroundImage: 'var(--texture-paper)',
                color: 'var(--lantern-gold, #F3C77A)',
                font: '700 20px var(--font-display)',
                cursor: 'pointer',
              }}
            >
              All done — back to the room
            </button>
          </footer>
        </div>

        {allWordsFlown && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: 90,
              font: '600 15px var(--font-body)',
              fontStyle: 'italic',
              color: 'var(--lantern-gold, #F3C77A)',
              textShadow: '0 0 12px rgba(243,199,122,.7)',
            }}
          >
            every word is on your wall now
          </div>
        )}
      </div>
    </KidScreen>
  )
}

/* ================= Support pieces ================= */

function DustMotes({ n = 9 }: { n?: number }) {
  const motes = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => ({
        x: 8 + (i * 83) % 88,
        y: 20 + (i * 37) % 60,
        d: (i * 0.9) % 6,
        s: 2 + (i % 3),
      })),
    [n],
  )
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {motes.map((m, i) => (
        <span
          key={i}
          className="lf-breath"
          style={{
            position: 'absolute',
            left: m.x + '%',
            top: m.y + '%',
            width: m.s * 2,
            height: m.s * 2,
            borderRadius: '50%',
            background: 'rgba(243,199,122,.7)',
            boxShadow: '0 0 8px 2px rgba(243,199,122,0.5)',
            animationDelay: m.d + 's',
          }}
        />
      ))}
    </div>
  )
}

/* A drawn star-word tile that animates on tap: flies to the right toward the
   wall pins with a subtle arc + fade. Reduced-motion snaps to gone. */
function FlyingStarWord({
  word,
  flown,
  onTap,
}: {
  word: string
  flown: boolean
  onTap: () => void
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={flown}
      aria-label={`star word: ${word}`}
      className={'lf-press lf-drawn-border' + (flown ? ' lf-star-fly' : '')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: flown ? 'transparent' : 'var(--pigment-butter, #EFC85C)',
        backgroundImage: flown ? 'none' : 'var(--texture-paper)',
        color: 'var(--ink, #46362A)',
        border: 'none',
        borderRadius: '14px 18px 15px 17px',
        padding: '10px 18px',
        font: '700 18px var(--font-display)',
        cursor: flown ? 'default' : 'pointer',
        boxShadow: flown ? 'none' : '0 0 26px 6px rgba(243,199,122,.35)',
        opacity: flown ? 0 : 1,
        transform: flown ? 'translate(260px, -140px) scale(0.4) rotate(6deg)' : 'none',
        transition: 'transform 1000ms cubic-bezier(0.34, 0.05, 0.18, 1), opacity 900ms',
        minHeight: 56,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" style={{ flexShrink: 0 }}>
        <path
          d="M 10 2 L 12 8 L 18 9 L 13 13 L 15 19 L 10 15 L 5 19 L 7 13 L 2 9 L 8 8 Z"
          fill="var(--pigment-terracotta, #D95B43)"
          stroke="var(--ink, #46362A)"
          strokeWidth="1.2"
          filter="url(#lf-wobble)"
        />
      </svg>
      {word}
    </button>
  )
}

/* Drawn envelope that settles down toward the "shelf" (Parent Corner). */
function EnvelopeToShelf({ buddyReply }: { buddyReply: string | null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, maxWidth: 520 }}>
      <div
        aria-hidden="true"
        style={{
          width: 140,
          height: 96,
          position: 'relative',
          transform: 'translate(0, 0)',
          animation: 'lf-envelope-settle 1500ms cubic-bezier(0.34, 0.05, 0.18, 1) both',
        }}
      >
        <style>{`
          @keyframes lf-envelope-settle {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(180px, 120px) scale(.5); }
          }
          @media (prefers-reduced-motion: reduce) {
            .lf-envelope-settle-static { animation: none !important; transform: translate(180px, 120px) scale(.5) !important; }
          }
        `}</style>
        <svg width={140} height={96} viewBox="0 0 140 96">
          <rect x="4" y="8" width="132" height="80" rx="4" fill="#F9F2E3" stroke="#46362A" strokeWidth="3" />
          <path d="M 4 12 L 70 56 L 136 12" fill="none" stroke="#46362A" strokeWidth="3" />
          <circle cx="70" cy="52" r="10" fill="#D95B43" opacity=".85" />
        </svg>
      </div>
      <div
        style={{
          background: 'rgba(120,155,120,.22)',
          border: '1.5px solid rgba(120,155,120,.5)',
          borderRadius: '14px 18px 15px 17px',
          padding: '12px 18px',
          font: '700 16px var(--font-body)',
          color: 'var(--ink, #46362A)',
          textAlign: 'center',
        }}
      >
        Saved for Mom and Dad
      </div>
      {buddyReply && (
        <div
          style={{
            background: 'rgba(249,242,227,.9)',
            border: '1.5px solid rgba(70,54,42,.18)',
            borderRadius: '14px 18px 15px 17px',
            padding: '12px 16px',
            font: '700 15px/1.4 var(--font-body)',
            color: 'var(--ink, #46362A)',
            textAlign: 'center',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <SpeakerIcon size={18} />
          {buddyReply}
        </div>
      )}
    </div>
  )
}

/* Kept for the reader import graph — the old EndPhase name still resolves. */
export function EndPhase({ story: _story }: { story: unknown }) {
  return (
    <KidScreen label="End">
      <div style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ font: '700 26px var(--font-display)' }}>The end!</p>
        <Link href="/read" className="lf-press" style={{ color: 'var(--pigment-terracotta, #D95B43)' }}>
          Back to the Bookshelf
        </Link>
      </div>
    </KidScreen>
  )
}

/* Reference to keep tree-shaking honest — used by loading fallbacks. */
void Endpaper
