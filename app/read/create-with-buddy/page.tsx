'use client'

// R19–R22: the STORY KITCHEN, kid-facing.
//
// End-to-end flow:
//   1. Cap check — read the parent-set maxCreationsPerDay guardrail (from
//      lib/read/profile.ts, if Agent B has landed it). If exhausted, buddy
//      speaks an in-fiction "kitchen is resting" line and bounces to Home.
//   2. Prompt for the seed. Buddy asks "What's YOUR story about?" and the
//      mic opens. On transcript we check /api/respond mode:'interview-redirect'
//      to keep the seed in-bounds.
//   3. Interview — delegated to <InterviewPhase />. It drives the turn loop
//      and hands back a KidInterview recipe.
//   4. Read-back — the buddy speaks the returned readBack; on "no" we run
//      a single correction turn via /api/respond mode:'interview-correction'.
//   5. Writing moment — <WritingMoment /> while /api/story mode:'kid-story'
//      generates the story.
//   6. Landing — save + push, grant Storyteller badges, persist wildcards,
//      redirect to /read/story/{id}. On failure the buddy offers a shelf book
//      instead — NEVER a dead screen.

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { speak, listen, type SpeakHandle, type ListenHandle } from '@/lib/read/speech'
import { loadUniverse } from '@/lib/universe/azad-verse'
import {
  addWildcards,
  loadBadges,
  loadBooks,
  saveStory,
  uid,
} from '@/lib/read/storage'
import { pushStory } from '@/lib/read/sync'
import { checkBadges } from '@/lib/read/badges'
import { recordCreation, remaining } from '@/lib/read/kid-creations'
import { getBuddy, cp } from '@/lib/read/buddies'
import { loadBuddy } from '@/lib/read/storage'
import type {
  Book,
  BuddyDef,
  KidInterview,
  KidInterviewAnswer,
} from '@/types/story'
import { KidScreen, SpeechBubble } from '../components'
import { CreatureSprite, KitchenBack, MicIcon } from '../art'
import type { BuddyKind } from '../art'
import { loadProfile } from '@/lib/read/profile'
import { loadShelf } from '@/lib/read/packs'
import { loadProgress } from '@/lib/read/storage'
import { InterviewPhase } from './InterviewPhase'
import { WritingMoment } from './WritingMoment'

// ---------- Guardrails helper (Agent B owns the module) ----------
// Best-effort: dynamic import so a missing module doesn't break the flow.
interface KidGuardrails {
  themes?: unknown
  allowedCast?: string[]
  allowedSettings?: string[]
  excludeTerms?: string[]
  maxCreationsPerDay?: number
}
async function safeCallGuardrails(): Promise<KidGuardrails> {
  try {
    const specifier = ['@', 'lib', 'read', 'guardrails'].join('/').replace('@/', '@/')
    const mod: unknown = await import(/* webpackIgnore: true */ specifier).catch(() => null)
    if (!mod || typeof mod !== 'object') return {}
    const m = mod as { getGuardrails?: () => KidGuardrails | Promise<KidGuardrails>; loadGuardrails?: () => KidGuardrails | Promise<KidGuardrails> }
    const fn = m.getGuardrails ?? m.loadGuardrails
    if (typeof fn !== 'function') return {}
    const g = await fn()
    return g && typeof g === 'object' ? g : {}
  } catch {
    return {}
  }
}

// Best-effort profile probe for creativeGuardrails.maxCreationsPerDay.
async function loadCap(fallback: number): Promise<number> {
  try {
    const specifier = ['@', 'lib', 'read', 'profile'].join('/').replace('@/', '@/')
    const mod: unknown = await import(/* webpackIgnore: true */ specifier).catch(() => null)
    if (!mod || typeof mod !== 'object') return fallback
    const m = mod as { loadProfile?: () => { creativeGuardrails?: { maxCreationsPerDay?: number } } | Promise<{ creativeGuardrails?: { maxCreationsPerDay?: number } }> }
    if (typeof m.loadProfile !== 'function') return fallback
    const p = await m.loadProfile()
    const cap = p?.creativeGuardrails?.maxCreationsPerDay
    return typeof cap === 'number' && cap > 0 ? cap : fallback
  } catch {
    return fallback
  }
}

// ---------- Phase enum ----------
type Phase =
  // Loading + cap check.
  | 'loading'
  // Buddy speaks the cap message + offers a shelf book.
  | 'capped'
  // Ask "what's your story about?" and open the mic.
  | 'seed'
  // Show the seed-redirect result (in bounds → continue; out-of-bounds → offer alt).
  | 'redirect-offer'
  // Interview loop — delegated to InterviewPhase.
  | 'interview'
  // Buddy speaks the read-back; mic opens for yes/no confirmation.
  | 'readback'
  // Single correction turn.
  | 'correction'
  // WritingMoment while /api/story is generating.
  | 'writing'
  // Fatal failure — buddy speaks the "needs more baking" line + shelf offer.
  | 'failed'

// ---------- Component ----------

export default function CreateWithBuddy() {
  const router = useRouter()

  const [phase, setPhase] = useState<Phase>('loading')
  const [buddy, setBuddy] = useState<BuddyDef | null>(null)
  const [energy, setEnergy] = useState<'bouncy' | 'calm'>('bouncy')
  const [guardrails, setGuardrails] = useState<KidGuardrails>({})
  const [seed, setSeed] = useState<string>('')
  const [redirectSuggestion, setRedirectSuggestion] = useState<string | undefined>()
  const [redirectAttempts, setRedirectAttempts] = useState(0)
  const [interviewAnswers, setInterviewAnswers] = useState<KidInterviewAnswer[]>([])
  const [recipe, setRecipe] = useState<KidInterview['recipe']>({})
  const [readBackLine, setReadBackLine] = useState<string>('')
  const [micListening, setMicListening] = useState(false)
  const [buddyLine, setBuddyLine] = useState<string>('')

  const speakRef = useRef<SpeakHandle | null>(null)
  const listenRef = useRef<ListenHandle | null>(null)
  const cancelledRef = useRef(false)

  const featuredShelfBook = useMemo(() => {
    const shelf = loadBooks()
    return shelf[0]
  }, [])

  // Cleanup on unmount — always cancel any in-flight speech/listen.
  useEffect(() => {
    return () => {
      cancelledRef.current = true
      speakRef.current?.cancel()
      listenRef.current?.stop()
    }
  }, [])

  // Boot: pick buddy + guardrails + cap check.
  useEffect(() => {
    ;(async () => {
      const bs = loadBuddy()
      if (!bs.activeId) {
        router.replace('/read/arrival')
        return
      }
      setBuddy(getBuddy(bs.activeId))
      setEnergy(bs.energy)

      const g = await safeCallGuardrails()
      setGuardrails(g)
      const cap = await loadCap(typeof g.maxCreationsPerDay === 'number' ? g.maxCreationsPerDay : 2)
      const left = remaining(cap)
      if (left <= 0) {
        setPhase('capped')
        return
      }
      setPhase('seed')
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Phase: capped ----
  useEffect(() => {
    if (phase !== 'capped' || !buddy) return
    const line = "The story kitchen needs to rest — how about we read one first? We can make another one soon."
    setBuddyLine(line)
    speakRef.current?.cancel()
    speakRef.current = speak(line)
     
  }, [phase, buddy])

  // ---- Phase: seed ----
  useEffect(() => {
    if (phase !== 'seed' || !buddy) return
    const q = "What's YOUR story about? Tell me anything!"
    setBuddyLine(q)
    speakRef.current?.cancel()
    speakRef.current = speak(q, {
      onEnd: () => {
        if (cancelledRef.current || phase !== 'seed') return
        openSeedMic()
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, buddy])

  const openSeedMic = useCallback(() => {
    if (cancelledRef.current) return
    setMicListening(true)
    let got = false
    listenRef.current = listen({
      timeoutMs: 10000,
      onResult: (t) => {
        got = true
        setSeed(t)
        void handleSeedTranscript(t)
      },
      onEnd: () => {
        if (got || cancelledRef.current) return
        setMicListening(false)
        // Empty seed → repeat the invitation gently.
        const line = 'Take your time. Tell me anything at all.'
        setBuddyLine(line)
        speakRef.current = speak(line, { onEnd: () => {
          if (!cancelledRef.current && phase === 'seed') openSeedMic()
        }})
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const handleSeedTranscript = useCallback(async (transcript: string) => {
    setMicListening(false)
    setBuddyLine('…thinking…')
    try {
      const res = await fetch('/api/respond', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode: 'interview-redirect',
          transcript,
          guardrails,
        }),
      })
      const data = (await res.json()) as {
        inBounds?: boolean
        redirectSuggestion?: string
        buddyLine?: string
      }
      if (data.inBounds === false) {
        setRedirectSuggestion(data.redirectSuggestion)
        setBuddyLine(data.buddyLine ?? 'Let\'s try something else together.')
        speakRef.current = speak(data.buddyLine ?? 'Let\'s try something else together.')
        setPhase('redirect-offer')
        return
      }
      // In bounds — echo delight then start the interview.
      const line = data.buddyLine ?? "I LOVE that. Let's build it."
      setBuddyLine(line)
      speakRef.current?.cancel()
      speakRef.current = speak(line, {
        onEnd: () => {
          if (cancelledRef.current) return
          setPhase('interview')
        },
      })
      // Belt: even if speak's onEnd never fires, move on after a beat.
      setTimeout(() => {
        if (!cancelledRef.current && phase !== 'interview') setPhase('interview')
      }, Math.max(1800, (data.buddyLine?.length ?? 0) * 60))
    } catch {
      // Degrade: proceed to interview with the raw seed.
      const line = "Let's build it together."
      setBuddyLine(line)
      speakRef.current = speak(line)
      setPhase('interview')
    }
     
  }, [guardrails, phase])

  // ---- Phase: redirect-offer ----
  // The buddy has proposed an in-fiction alternative. Kid can accept (yes →
  // adjust seed) or decline (no → try once more, then proceed with original).
  const openRedirectMic = useCallback(() => {
    if (cancelledRef.current) return
    setMicListening(true)
    let got = false
    listenRef.current = listen({
      timeoutMs: 7000,
      onResult: (t) => {
        got = true
        setMicListening(false)
        const said = t.toLowerCase()
        // Simple yes/no heuristic — the child is 4 years old.
        const accepted = /(yes|yeah|yah|okay|ok|sure|yep|do it|let's|lets)/.test(said)
        const declined = /(no|nope|nah|not that)/.test(said)
        if (accepted) {
          // Accept: fold the suggestion into the seed and start the interview.
          const nextSeed = redirectSuggestion
            ? `${seed}\n(Reframed with buddy: ${redirectSuggestion})`
            : seed
          setSeed(nextSeed)
          const line = 'Perfect. Let\'s build it.'
          setBuddyLine(line)
          speakRef.current = speak(line, {
            onEnd: () => {
              if (!cancelledRef.current) setPhase('interview')
            },
          })
          setTimeout(() => {
            if (!cancelledRef.current && phase !== 'interview') setPhase('interview')
          }, 2200)
          return
        }
        if (declined && redirectAttempts < 1) {
          setRedirectAttempts((n) => n + 1)
          const line = 'Okay — what should we do instead?'
          setBuddyLine(line)
          speakRef.current = speak(line, {
            onEnd: () => {
              if (!cancelledRef.current && phase === 'redirect-offer') openRedirectMic()
            },
          })
          return
        }
        // Ambiguous or second decline: proceed with the original seed. R19
        // etiquette — no scolding, no dead screens.
        const line = "Okay. Let's build YOUR way."
        setBuddyLine(line)
        speakRef.current = speak(line, {
          onEnd: () => {
            if (!cancelledRef.current) setPhase('interview')
          },
        })
        setTimeout(() => {
          if (!cancelledRef.current && phase !== 'interview') setPhase('interview')
        }, 2000)
      },
      onEnd: () => {
        if (got || cancelledRef.current) return
        // Silence — treat as decline; proceed with the child's original idea.
        setMicListening(false)
        setPhase('interview')
      },
    })
     
  }, [seed, redirectSuggestion, redirectAttempts, phase])

  useEffect(() => {
    if (phase !== 'redirect-offer' || !buddy) return
    // Give the child a beat to hear the redirect line before opening the mic.
    const t = setTimeout(() => {
      if (!cancelledRef.current && phase === 'redirect-offer') openRedirectMic()
    }, Math.max(2000, buddyLine.length * 50))
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, buddy])

  // ---- Phase: interview → readback handoff ----
  const handleInterviewComplete = useCallback(
    (payload: {
      answers: KidInterviewAnswer[]
      recipe: KidInterview['recipe']
      readBack: string
      buddyLine: string
    }) => {
      setInterviewAnswers(payload.answers)
      setRecipe(payload.recipe)
      setReadBackLine(payload.readBack)
      setBuddyLine(payload.buddyLine)
      setPhase('readback')
    },
    [],
  )

  const handleInterviewFailure = useCallback((msg: string) => {
    console.warn('[create-with-buddy] interview failed:', msg)
    setPhase('failed')
  }, [])

  // ---- Phase: readback ----
  const openReadbackMic = useCallback(() => {
    if (cancelledRef.current) return
    setMicListening(true)
    let got = false
    listenRef.current = listen({
      timeoutMs: 7000,
      onResult: (t) => {
        got = true
        setMicListening(false)
        const said = t.trim().toLowerCase()
        const declined = /(no|nope|nah|not right|wrong|not that)/.test(said)
        if (declined) {
          setPhase('correction')
        } else {
          // Yes / silence / anything positive → go to writing moment.
          void kickOffGeneration()
        }
      },
      onEnd: () => {
        if (got || cancelledRef.current) return
        setMicListening(false)
        void kickOffGeneration()
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (phase !== 'readback' || !buddy) return
    // Speak the buddyLine (which already ends in "Did I get it right?")
    speakRef.current?.cancel()
    speakRef.current = speak(buddyLine || readBackLine, {
      onEnd: () => {
        if (!cancelledRef.current && phase === 'readback') openReadbackMic()
      },
    })
    setTimeout(() => {
      if (!cancelledRef.current && phase === 'readback' && !micListening) openReadbackMic()
    }, Math.max(3000, (buddyLine || readBackLine).length * 60))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, buddy])

  // ---- Phase: correction ----
  useEffect(() => {
    if (phase !== 'correction') return
    const line = 'Oh! Tell me what to fix.'
    setBuddyLine(line)
    speakRef.current?.cancel()
    speakRef.current = speak(line, {
      onEnd: () => {
        if (cancelledRef.current) return
        setMicListening(true)
        let got = false
        listenRef.current = listen({
          timeoutMs: 10000,
          onResult: (t) => {
            got = true
            setMicListening(false)
            void applyCorrection(t)
          },
          onEnd: () => {
            if (got || cancelledRef.current) return
            setMicListening(false)
            // Silent — proceed to generation with the current recipe.
            void kickOffGeneration()
          },
        })
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const applyCorrection = useCallback(async (corrections: string) => {
    setBuddyLine('…let me fix that…')
    try {
      const res = await fetch('/api/respond', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode: 'interview-correction',
          seed,
          prevRecipe: recipe,
          corrections,
        }),
      })
      const data = (await res.json()) as {
        updatedRecipe?: KidInterview['recipe']
        newReadBack?: string
        buddyLine?: string
      }
      if (data.updatedRecipe) setRecipe(data.updatedRecipe)
      const newReadBack = data.newReadBack ?? readBackLine
      setReadBackLine(newReadBack)
      const spoken = data.buddyLine ?? `${newReadBack} Did I get it now?`
      setBuddyLine(spoken)
      speakRef.current?.cancel()
      speakRef.current = speak(spoken, {
        onEnd: () => {
          if (!cancelledRef.current) void kickOffGeneration()
        },
      })
      setTimeout(() => {
        if (!cancelledRef.current && phase !== 'writing') void kickOffGeneration()
      }, Math.max(3200, spoken.length * 60))
    } catch {
      // Degrade — go straight to generation with the current recipe.
      void kickOffGeneration()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, recipe, readBackLine, phase])

  // ---- Phase: writing (fires /api/story) ----
  const kickOffGeneration = useCallback(async () => {
    if (cancelledRef.current) return
    setPhase('writing')
    try {
      const interview: KidInterview = {
        answers: interviewAnswers,
        recipe,
        readBack: readBackLine,
        finishedAt: Date.now(),
      }
      const res = await fetch('/api/story', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode: 'kid-story',
          interview,
          originalSeed: seed,
          idea: seed, // fallback for legacy prompt paths
          universe: loadUniverse(),
          by: 'Made by Azad',
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? `http ${res.status}`)
      }
      const data = (await res.json()) as Partial<Book> & {
        pages?: Book['chapters'][number]['pages']
        interview?: KidInterview
        wildcards?: Book['wildcards']
        author?: 'azad' | 'family'
        status?: string
      }
      if (data.status === 'needs-review') {
        // R19 failure path — surface the "needs more baking" line, not a
        // dead screen. Parents will see the draft in Parent Corner.
        setPhase('failed')
        return
      }

      // Assemble the Book. The API returns pages/chapters — we normalize to
      // a 1-chapter Book so the reader can play it as a quick story.
      const bookId = uid()
      const pages = Array.isArray(data.pages) ? data.pages : []
      const chapters = Array.isArray(data.chapters) && data.chapters.length > 0
        ? data.chapters
        : [{ title: data.title ?? 'A story by Azad', pages, status: 'current' as const }]
      const book: Book = {
        id: bookId,
        title: data.title ?? 'A story by Azad',
        by: data.by ?? 'Made by Azad',
        kind: 'quick',
        status: 'complete',
        source: 'generated',
        coverEmoji: data.coverEmoji ?? '✨',
        coverBg: data.coverBg,
        wash: data.wash,
        chapters,
        vocab: data.vocab ?? [],
        teachingGoals: data.teachingGoals ?? [],
        retellPrompts: data.retellPrompts ?? [
          'Who was in your story?',
          'What was the uh-oh?',
        ],
        qaRecord: data.qaRecord,
        skillTags: data.skillTags,
        charactersUsed: data.charactersUsed,
        mysteryWord: data.mysteryWord,
        interview,
        wildcards: (data as Book).wildcards,
        author: 'azad',
        createdAt: Date.now(),
        idea: seed,
      }
      saveStory(book)
      void pushStory(book)

      // Bump the daily counter.
      recordCreation()

      // Persist wildcards to the universe cast.
      if (book.wildcards && book.wildcards.length > 0) {
        addWildcards(book.wildcards)
      }

      // Storyteller badges. Count kid-authored books in local storage as the
      // creation count — the persisted `author: 'azad'` on Books is the truth.
      try {
        const kidCount = loadBooks().filter((b) => b.author === 'azad').length
        // Was the storyteller badge already earned? checkBadges is idempotent.
        const before = new Set(loadBadges().ids)
        await checkBadges({ kidCreationsCount: kidCount })
        void before // (unused — kept for future analytics)
      } catch {
        /* ignore — badge grants are best-effort */
      }

      router.push(`/read/story/${book.id}`)
    } catch {
      setPhase('failed')
    }
     
  }, [seed, recipe, readBackLine, interviewAnswers, router])

  // ---- Phase: failed ----
  useEffect(() => {
    if (phase !== 'failed' || !buddy) return
    const line = "This story needs more baking — let's check the oven after we read one!"
    setBuddyLine(line)
    speakRef.current?.cancel()
    speakRef.current = speak(line)
     
  }, [phase, buddy])

  // ---- Seed suggestion chips (touch-balance) ----
  // Interests from profile + up to two recently-read shelf titles + wildcards.
  // Rendered co-present with the mic on the seed phase so the child can tap
  // instead of talking. Handler routes through the same seed transcript path
  // so the redirect check still runs.
  const seedSuggestions = useMemo(() => {
    const out: string[] = []
    try {
      const p = loadProfile()
      const interests = (p.interests ?? []).slice(0, 3)
      for (const i of interests) if (i) out.push(i)
    } catch {
      /* profile is best-effort */
    }
    try {
      const shelf = loadShelf()
      const prog = loadProgress()
      const touched = shelf
        .map((b) => ({ b, u: prog[b.id]?.updatedAt ?? 0 }))
        .filter((x) => x.u > 0)
        .sort((a, b) => b.u - a.u)
        .slice(0, 2)
      for (const t of touched) out.push(`another ${t.b.title}-like`)
    } catch {
      /* shelf is best-effort */
    }
    // Wildcards — always at least these so we hit 4-6 chips.
    for (const w of ['a hero', 'a helper', 'something silly']) out.push(w)
    // De-dupe, cap 6.
    const seen = new Set<string>()
    const dedup: string[] = []
    for (const s of out) {
      const k = s.toLowerCase()
      if (seen.has(k)) continue
      seen.add(k)
      dedup.push(s)
      if (dedup.length >= 6) break
    }
    return dedup
  }, [])

  const pickSeedChip = useCallback(
    (chipText: string) => {
      // Stop any live listener / speech; route through the same seed path.
      listenRef.current?.stop()
      listenRef.current = null
      speakRef.current?.cancel()
      setSeed(chipText)
      void handleSeedTranscript(chipText)
    },
    [handleSeedTranscript],
  )

  const acceptRedirect = useCallback(() => {
    listenRef.current?.stop()
    listenRef.current = null
    speakRef.current?.cancel()
    const nextSeed = redirectSuggestion
      ? `${seed}\n(Reframed with buddy: ${redirectSuggestion})`
      : seed
    setSeed(nextSeed)
    const line = "Perfect. Let's build it."
    setBuddyLine(line)
    speakRef.current = speak(line, {
      onEnd: () => {
        if (!cancelledRef.current) setPhase('interview')
      },
    })
    setTimeout(() => {
      if (!cancelledRef.current && phase !== 'interview') setPhase('interview')
    }, 2200)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, redirectSuggestion, phase])

  const declineRedirect = useCallback(() => {
    listenRef.current?.stop()
    listenRef.current = null
    speakRef.current?.cancel()
    const line = "Okay. Let's build YOUR way."
    setBuddyLine(line)
    speakRef.current = speak(line, {
      onEnd: () => {
        if (!cancelledRef.current) setPhase('interview')
      },
    })
    setTimeout(() => {
      if (!cancelledRef.current && phase !== 'interview') setPhase('interview')
    }, 2000)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const pickCorrectionChip = useCallback(
    (chipText: string) => {
      listenRef.current?.stop()
      listenRef.current = null
      speakRef.current?.cancel()
      void applyCorrection(chipText)
    },
    [applyCorrection],
  )

  const skipCorrection = useCallback(() => {
    listenRef.current?.stop()
    listenRef.current = null
    speakRef.current?.cancel()
    void kickOffGeneration()
  }, [kickOffGeneration])

  const goBack = useCallback(() => {
    // Kitchen back: phase → previous phase (or /read at seed).
    listenRef.current?.stop()
    listenRef.current = null
    speakRef.current?.cancel()
    if (phase === 'seed' || phase === 'capped' || phase === 'failed') {
      router.push('/read')
      return
    }
    if (phase === 'redirect-offer' || phase === 'interview') {
      setPhase('seed')
      return
    }
    if (phase === 'correction') {
      setPhase('readback')
      return
    }
    if (phase === 'readback') {
      setPhase('interview')
      return
    }
    router.push('/read')
  }, [phase, router])

  // ---- Readback tap-confirm handlers (touch-balance directive) ----
  // The mic still opens (voice equivalent) — chips just make it decidable
  // without waiting.
  const confirmReadback = useCallback(() => {
    listenRef.current?.stop()
    listenRef.current = null
    void kickOffGeneration()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kickOffGeneration])

  const rejectReadback = useCallback(() => {
    listenRef.current?.stop()
    listenRef.current = null
    setPhase('correction')
  }, [])

  // ---- Render ----
  if (!buddy) {
    return (
      <KidScreen label="Story kitchen">
        <div className="lf-room" style={{ padding: 48, textAlign: 'center', color: 'var(--ink-soft, #6E5B49)' }}>
          Loading…
        </div>
      </KidScreen>
    )
  }

  // Writing moment is a totally different layout.
  if (phase === 'writing') {
    return <WritingMoment buddy={buddy} recipe={recipe} />
  }

  // Interview drives its own layout.
  if (phase === 'interview') {
    return (
      <KidScreen label="Story kitchen" style={{ padding: 0 }}>
        <div className="lf-room" style={{ position: 'absolute', inset: 0 }}>
          <DeskChrome />
          <KitchenBackButton onTap={goBack} />
          <InterviewPhase
            buddy={buddy}
            seed={seed}
            guardrails={guardrails as Record<string, unknown>}
            onComplete={handleInterviewComplete}
            onFailure={handleInterviewFailure}
          />
        </div>
      </KidScreen>
    )
  }

  const showReadbackControls = phase === 'readback'
  const showMic = phase === 'seed' || phase === 'redirect-offer' || phase === 'correction' || phase === 'readback'
  const buddyKind: BuddyKind = (buddy.id as BuddyKind) ?? 'bramble'
  const spritePose = phase === 'redirect-offer' ? 'pointing' : micListening ? 'listening' : 'idle'

  // All the buddy-speak phases share a common layout — the writing desk.
  return (
    <KidScreen label="Story kitchen" style={{ padding: 0 }}>
      <div
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
          gap: 22,
          padding: '32px 24px',
        }}
      >
        <DeskChrome />
        <KitchenBackButton onTap={goBack} />

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, maxWidth: 720, flexWrap: 'wrap', justifyContent: 'center', zIndex: 2 }}>
          <div style={{ pointerEvents: 'none' }}>
            <CreatureSprite kind={buddyKind} pose={spritePose} size={140} />
          </div>
          <SpeechBubble big style={{ marginBottom: 12, maxWidth: 520 }}>
            {buddyLine || cp(buddy.greet, energy)}
          </SpeechBubble>
        </div>

        {/* Seed phase: drawn suggestion chips co-present with the mic. */}
        {phase === 'seed' && seedSuggestions.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              justifyContent: 'center',
              maxWidth: 720,
              zIndex: 2,
            }}
          >
            {seedSuggestions.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => pickSeedChip(chip)}
                className="lf-press lf-drawn-border"
                style={{
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
                  touchAction: 'manipulation',
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Redirect-offer phase: two big tap answers + voice still active. */}
        {phase === 'redirect-offer' && (
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', zIndex: 2 }}>
            <button
              type="button"
              onClick={acceptRedirect}
              className="lf-press lf-drawn-border lf-drawn-border--bold"
              style={{
                minHeight: 68,
                padding: '14px 28px',
                borderRadius: '22px 26px 23px 25px',
                background: 'var(--pigment-terracotta, #D95B43)',
                backgroundImage: 'var(--texture-paper)',
                color: '#F9F2E3',
                border: 'none',
                font: '700 20px var(--font-display)',
                boxShadow: '0 8px 18px rgba(217,91,67,.4)',
                cursor: 'pointer',
                touchAction: 'manipulation',
              }}
            >
              {redirectSuggestion ? `Yes, ${redirectSuggestion.split(/\s+/).slice(0, 3).join(' ')}!` : 'Yes, let’s!'}
            </button>
            <button
              type="button"
              onClick={declineRedirect}
              className="lf-press lf-drawn-border"
              style={{
                minHeight: 68,
                padding: '14px 26px',
                borderRadius: '22px 26px 23px 25px',
                background: 'var(--paper-bright, #F9F2E3)',
                backgroundImage: 'var(--texture-paper)',
                color: 'var(--ink, #46362A)',
                border: 'none',
                font: '700 19px var(--font-display)',
                cursor: 'pointer',
                touchAction: 'manipulation',
              }}
            >
              Nah, keep my idea
            </button>
          </div>
        )}

        {/* Correction phase: 3 chips + a "never mind" affordance. */}
        {phase === 'correction' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', zIndex: 2 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 640 }}>
              {[
                { label: 'The character', text: 'change the character' },
                { label: 'The place', text: 'change the place' },
                { label: 'The problem', text: 'change the problem' },
              ].map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => pickCorrectionChip(c.text)}
                  className="lf-press lf-drawn-border"
                  style={{
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
                    touchAction: 'manipulation',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={skipCorrection}
              className="lf-press"
              style={{
                background: 'transparent',
                border: 'none',
                font: '700 14px var(--font-body)',
                color: 'var(--ink-soft, #6E5B49)',
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: '6px 10px',
                touchAction: 'manipulation',
              }}
            >
              Never mind, generate it as-is
            </button>
          </div>
        )}

        {/* Readback: big tap-confirm dialog + voice equivalent (mic still visible). */}
        {showReadbackControls && (
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', zIndex: 2 }}>
            <button
              type="button"
              onClick={confirmReadback}
              className="lf-press lf-drawn-border lf-drawn-border--bold"
              style={{
                minHeight: 68,
                padding: '14px 34px',
                borderRadius: '22px 26px 23px 25px',
                background: 'var(--pigment-terracotta, #D95B43)',
                backgroundImage: 'var(--texture-paper)',
                color: '#F9F2E3',
                border: 'none',
                font: '700 22px var(--font-display)',
                boxShadow: '0 8px 18px rgba(217,91,67,.4)',
                cursor: 'pointer',
              }}
            >
              That&rsquo;s it!
            </button>
            <button
              type="button"
              onClick={rejectReadback}
              className="lf-press lf-drawn-border"
              style={{
                minHeight: 68,
                padding: '14px 30px',
                borderRadius: '22px 26px 23px 25px',
                background: 'var(--paper-bright, #F9F2E3)',
                backgroundImage: 'var(--texture-paper)',
                color: 'var(--ink, #46362A)',
                border: 'none',
                font: '700 20px var(--font-display)',
                cursor: 'pointer',
              }}
            >
              Change it
            </button>
          </div>
        )}

        {showMic && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, zIndex: 2 }}>
            <button
              type="button"
              aria-label={micListening ? 'Tap when done' : 'Say it out loud'}
              onClick={() => {
                if (micListening) listenRef.current?.stop()
              }}
              disabled={!micListening}
              className="lf-press lf-drawn-border lf-drawn-border--bold"
              style={{
                width: 104,
                height: 104,
                borderRadius: '50% 48% 52% 50%',
                border: 'none',
                background: micListening
                  ? 'var(--pigment-terracotta-deep, #C7452F)'
                  : 'var(--pigment-terracotta, #D95B43)',
                backgroundImage: 'var(--texture-paper)',
                color: '#F9F2E3',
                boxShadow: '0 8px 20px rgba(217,91,67,.4)',
                cursor: micListening ? 'pointer' : 'default',
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
                color: micListening ? 'var(--pigment-terracotta-deep, #C7452F)' : 'var(--ink-soft, #6E5B49)',
                minHeight: 22,
              }}
            >
              {micListening ? "I'm listening!" : showReadbackControls ? 'or say yes / no' : 'Listen…'}
            </div>
          </div>
        )}

        {(phase === 'capped' || phase === 'failed') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', zIndex: 2 }}>
            {featuredShelfBook ? (
              <button
                type="button"
                className="lf-press lf-drawn-border lf-drawn-border--bold"
                onClick={() => router.push(`/read/story/${featuredShelfBook.id}`)}
                style={{
                  minHeight: 68,
                  padding: '14px 34px',
                  borderRadius: '22px 26px 23px 25px',
                  border: 'none',
                  background: 'var(--pigment-terracotta, #D95B43)',
                  backgroundImage: 'var(--texture-paper)',
                  color: '#F9F2E3',
                  font: '700 20px var(--font-display)',
                  boxShadow: '0 8px 18px rgba(217,91,67,.4)',
                  cursor: 'pointer',
                }}
              >
                Read {featuredShelfBook.title} instead ▶
              </button>
            ) : (
              <button
                type="button"
                className="lf-press lf-drawn-border lf-drawn-border--bold"
                onClick={() => router.push('/read')}
                style={{
                  minHeight: 68,
                  padding: '14px 34px',
                  borderRadius: '22px 26px 23px 25px',
                  border: 'none',
                  background: 'var(--pigment-terracotta, #D95B43)',
                  backgroundImage: 'var(--texture-paper)',
                  color: '#F9F2E3',
                  font: '700 20px var(--font-display)',
                  boxShadow: '0 8px 18px rgba(217,91,67,.4)',
                  cursor: 'pointer',
                }}
              >
                Back to my shelf
              </button>
            )}
          </div>
        )}
      </div>
    </KidScreen>
  )
}

/* ================= KitchenBackButton =================
 * The drawn door-edge in the top-left corner of every kitchen screen. Tap
 * = phase-aware back (owned by the caller). Positioned absolutely so it
 * never fights the flex-centered content.
 */
function KitchenBackButton({ onTap }: { onTap: () => void }) {
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label="Back"
      className="lf-press"
      style={{
        position: 'absolute',
        top: 18,
        left: 18,
        width: 56,
        height: 56,
        padding: 0,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        zIndex: 5,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <KitchenBack size={56} />
    </button>
  )
}

/* ================= DeskChrome =================
 * A soft drawn writing-desk backdrop: the cover of an open book, an inkpot,
 * a couple of pens. Decorative — never blocks controls. Reduced motion safe.
 */
function DeskChrome() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      {/* wood desk plank along the bottom */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '30%',
          background: 'linear-gradient(180deg, rgba(91,70,55,.16), rgba(91,70,55,.28))',
        }}
      />
      <svg
        style={{ position: 'absolute', left: 20, bottom: 24, opacity: 0.75 }}
        width={200}
        height={140}
        viewBox="0 0 200 140"
      >
        {/* open book */}
        <path d="M 10 40 L 100 24 L 100 118 L 10 130 Z" fill="#F9F2E3" stroke="#46362A" strokeWidth="3" />
        <path d="M 190 40 L 100 24 L 100 118 L 190 130 Z" fill="#F9F2E3" stroke="#46362A" strokeWidth="3" />
        {/* lines */}
        {[54, 68, 82, 96].map((y) => (
          <line key={`l-${y}`} x1="24" y1={y - (y - 54) * 0.06} x2="92" y2={y - (y - 54) * 0.06 - 3}
            stroke="#97836B" strokeWidth="1.4" opacity=".55" />
        ))}
        {[54, 68, 82, 96].map((y) => (
          <line key={`r-${y}`} x1="108" y1={y - (y - 54) * 0.06 - 3} x2="176" y2={y - (y - 54) * 0.06}
            stroke="#97836B" strokeWidth="1.4" opacity=".55" />
        ))}
      </svg>
      <svg
        style={{ position: 'absolute', right: 40, bottom: 30, opacity: 0.8 }}
        width={130}
        height={140}
        viewBox="0 0 130 140"
      >
        {/* inkpot */}
        <path
          d="M 34 60 Q 34 46 50 46 L 90 46 Q 106 46 106 60 L 100 118 Q 100 130 88 130 L 52 130 Q 40 130 40 118 Z"
          fill="#2E8B8B"
          stroke="#46362A"
          strokeWidth="3"
        />
        <ellipse cx="70" cy="46" rx="30" ry="6" fill="#4E7FA3" stroke="#46362A" strokeWidth="2.4" />
        {/* pen */}
        <path d="M 26 20 L 100 78 L 96 88 L 22 30 Z" fill="#5B4637" stroke="#46362A" strokeWidth="2.4" />
        <path d="M 96 88 L 108 96" stroke="#46362A" strokeWidth="2" />
      </svg>
    </div>
  )
}
