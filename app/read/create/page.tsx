'use client'

// Little Fables v2 — Story Maker wizard.
// Design source: design/handoff-v2/app/screens-parent.jsx (StoryMaker).
// Steps: Format → Intake (chip-based) → Review → Writing (per-chapter progress)
// → Success. Chapter books stream one /api/story call per chapter with
// `mode: 'chapter'` + `bookContext`; quick stories fire once with `mode: 'start'`.
// Every chapter response can come back with status `needs-review` — that marks
// the book Draft and shows a "Needs review" pill in the Parent Corner.

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Mic } from 'lucide-react'
import { loadUniverse, type Universe } from '@/lib/universe/azad-verse'
import { loadWorldState, saveStory, uid } from '@/lib/read/storage'
import { pushStory } from '@/lib/read/sync'
import { listen, recognitionAvailable, speak } from '@/lib/read/speech'
import type {
  Book,
  BookKind,
  Chapter,
  GenerateRequest,
  GenerateResponse,
  WorldState,
} from '@/types/story'

// ---------- Constants ----------
const CHAPTER_COUNT = 3 // chapter books default to 3 chapters (PRD R5: 3–5)
const EMOTIONAL_THEMES = [
  'trying again',
  'brave in a new place',
  'a small worry',
  'a lonely feeling',
  'sharing something dear',
  'a happy surprise',
  'saying goodbye',
  'a first time',
]

const HICCUP = 'The story machine hiccuped. Try again.'

// ---------- Primitives (shadcn neutrals, Inter) ----------
function PCard({
  title,
  description,
  children,
  padded = true,
}: {
  title?: string
  description?: string
  children: React.ReactNode
  padded?: boolean
}) {
  return (
    <div
      style={{
        background: 'var(--lf-p-card)',
        border: '1px solid var(--lf-p-border)',
        borderRadius: 'var(--radius-p-card)',
        padding: padded ? 22 : 0,
      }}
    >
      {title && (
        <div style={{ font: '600 15.5px/1.3 var(--font-ui)', color: 'var(--lf-p-foreground)' }}>{title}</div>
      )}
      {description && (
        <div style={{ font: '400 13.5px/1.5 var(--font-ui)', color: 'var(--lf-p-muted-foreground)', marginTop: 4 }}>
          {description}
        </div>
      )}
      {(title || description) ? <div style={{ marginTop: 16 }}>{children}</div> : children}
    </div>
  )
}

function PButton({
  children,
  onClick,
  variant = 'primary',
  size = 'default',
  disabled,
  type = 'button',
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'default' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  const h = size === 'lg' ? 42 : 36
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    height: h,
    padding: size === 'lg' ? '0 18px' : '0 14px',
    borderRadius: 'var(--radius-p-md)',
    font: `500 ${size === 'lg' ? 15 : 14}px var(--font-ui)`,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    ...(variant === 'primary'
      ? { background: 'var(--lf-p-primary)', color: 'var(--lf-p-primary-foreground)', border: '1px solid var(--lf-p-primary)' }
      : variant === 'secondary'
        ? { background: 'var(--lf-p-background)', color: 'var(--lf-p-foreground)', border: '1px solid var(--lf-p-border)' }
        : { background: 'transparent', color: 'var(--lf-p-muted-foreground)', border: 'none' }),
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={style} className="lf-press">
      {children}
    </button>
  )
}

function ChipToggle({
  label,
  on,
  onClick,
}: {
  label: string
  on: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="lf-press"
      style={{
        cursor: 'pointer',
        borderRadius: 999,
        padding: '5px 12px',
        font: '500 12.5px var(--font-ui)',
        color: on ? 'var(--lf-p-foreground)' : 'var(--lf-p-muted-foreground)',
        border: on ? '1.5px solid var(--lf-p-primary)' : '1px solid var(--lf-p-border)',
        background: on ? 'var(--lf-p-muted)' : 'var(--lf-p-background)',
      }}
    >
      {label}
    </button>
  )
}

// ---------- Wizard ----------

type Format = 'quick' | 'chapter'

interface Intake {
  hero: string | null
  setting: string | null
  teachingGoal: string | null
  cultureWords: string[]
  emotion: string | null
  idea: string
}

const EMPTY_INTAKE: Intake = {
  hero: null,
  setting: null,
  teachingGoal: null,
  cultureWords: [],
  emotion: null,
  idea: '',
}

// Progress state per chapter during writing.
type ChapterStatus = 'waiting' | 'writing' | 'written' | 'needs-review' | 'error'

// ---------- API helper: single /api/story call ----------
async function generate(body: GenerateRequest): Promise<GenerateResponse> {
  const res = await fetch('/api/story', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as GenerateResponse
  if (!res.ok || data.error) throw new Error(data.error || HICCUP)
  return data
}

// A chapter response can come back with `chapters: [Chapter]` (chapter mode)
// or `pages: Page[]` (quick-story / start mode). Normalize to a Chapter.
function responseToChapter(res: GenerateResponse, fallbackTitle: string): Chapter {
  if (res.chapters && res.chapters.length > 0) {
    const c = res.chapters[0]
    return {
      title: c.title || fallbackTitle,
      status: 'done',
      wash: c.wash,
      pages: c.pages ?? [],
      hook: c.hook ?? res.hook,
      recapQuestion: c.recapQuestion ?? res.recapQuestion,
    }
  }
  return {
    title: fallbackTitle,
    status: 'done',
    pages: res.pages ?? [],
    hook: res.hook,
    recapQuestion: res.recapQuestion,
  }
}

// Rubric gate: a "Checking" chapter that comes back below the bar returns
// with `rubricScore` low. We treat any explicit low score as needs-review.
function isNeedsReview(res: GenerateResponse): boolean {
  // Explicit signal from the /api/story server.
  const rec = res as unknown as { status?: string }
  if (rec.status === 'needs-review') return true
  if (typeof res.rubricScore === 'number' && res.rubricScore < 90) return true
  return false
}

function summarize(chapter: Chapter): string {
  // First two sentences of prose across pages — enough context for the model.
  const prose = chapter.pages.map((p) => p.text).join(' ')
  const sentences = prose.match(/[^.!?]+[.!?]+/g) ?? [prose]
  return sentences.slice(0, 2).join(' ').trim()
}

function ideaFromIntake(f: Intake, kind: BookKind): string {
  const bits: string[] = []
  if (f.hero) bits.push(`Hero: ${f.hero}.`)
  if (f.setting) bits.push(`Setting: ${f.setting}.`)
  if (f.teachingGoal) bits.push(`Gently teach: ${f.teachingGoal}.`)
  if (f.cultureWords.length) bits.push(`Weave in family words: ${f.cultureWords.join(', ')}.`)
  if (f.emotion) bits.push(`Emotional theme: ${f.emotion}.`)
  if (f.idea.trim()) bits.push(`Family idea: ${f.idea.trim()}`)
  bits.push(kind === 'chapter' ? `Shape: a ${CHAPTER_COUNT}-chapter book with one arc.` : 'Shape: one quick story in a single sitting.')
  return bits.join(' ')
}

export default function CreateStory() {
  const router = useRouter()

  // Universe loaded once on mount (deterministic — no need to re-load).
  const universe: Universe | null = useMemo(() => (typeof window === 'undefined' ? null : loadUniverse()), [])

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [format, setFormat] = useState<Format | null>(null)
  const [fields, setFields] = useState<Intake>(EMPTY_INTAKE)
  const [listening, setListening] = useState(false)

  // Writing state
  const [progress, setProgress] = useState<ChapterStatus[]>([])
  const [needsReview, setNeedsReview] = useState(false)
  const [writeError, setWriteError] = useState<string | null>(null)
  const [book, setBook] = useState<Book | null>(null)

  const kind: BookKind = format === 'chapter' ? 'chapter' : 'quick'
  const chapterTarget = kind === 'chapter' ? CHAPTER_COUNT : 1
  const ready2 = !!(fields.hero && fields.setting && fields.teachingGoal && fields.emotion)

  const captureIdea = () => {
    if (!recognitionAvailable()) return
    setListening(true)
    speak('Tell me the story idea.', {
      onEnd: () => {
        listen({
          onResult: (t) => setFields((f) => ({ ...f, idea: t })),
          onEnd: () => setListening(false),
          timeoutMs: 12000,
        })
      },
    })
  }

  const toggleCultureWord = (term: string) => {
    setFields((f) =>
      f.cultureWords.includes(term)
        ? { ...f, cultureWords: f.cultureWords.filter((x) => x !== term) }
        : { ...f, cultureWords: [...f.cultureWords, term] }
    )
  }

  // ---------- Writing driver ----------
  const startWriting = async () => {
    if (!universe) return
    setStep(4)
    setWriteError(null)
    setNeedsReview(false)
    const initial: ChapterStatus[] = Array.from({ length: chapterTarget }, (_, i) => (i === 0 ? 'writing' : 'waiting'))
    setProgress(initial)

    const bookId = uid()
    const premise = ideaFromIntake(fields, kind)
    const worldState: WorldState = loadWorldState()
    const chapters: Chapter[] = []
    let title = 'A new story'
    let coverEmoji = '✨'
    let coverBg: string | undefined
    let vocab: Book['vocab'] = []
    const teachingGoals: string[] = fields.teachingGoal ? [fields.teachingGoal] : []
    let retellPrompts: string[] = []
    let sawNeedsReview = false

    try {
      for (let i = 0; i < chapterTarget; i++) {
        // Mark this chapter as writing.
        setProgress((prev) => prev.map((s, idx) => (idx === i ? 'writing' : s)))

        const req: GenerateRequest =
          i === 0
            ? {
                mode: kind === 'chapter' ? 'chapter' : 'start',
                idea: premise,
                hero: fields.hero ?? undefined,
                place: fields.setting ?? undefined,
                // For chapter mode we still send bookContext (empty priorChapters).
                ...(kind === 'chapter' && {
                  bookContext: {
                    id: bookId,
                    title: 'A new story',
                    kind,
                    priorChapters: [],
                    worldState,
                  },
                }),
                universe,
              }
            : {
                mode: 'chapter',
                idea: premise,
                hero: fields.hero ?? undefined,
                place: fields.setting ?? undefined,
                bookContext: {
                  id: bookId,
                  title,
                  kind,
                  priorChapters: chapters.map((c) => ({ title: c.title, summary: summarize(c) })),
                  worldState,
                },
                universe,
              }

        const res = await generate(req)

        // Capture book-level metadata from the first response.
        if (i === 0) {
          if (res.title) title = res.title
          if (res.coverEmoji) coverEmoji = res.coverEmoji
          if (res.coverBg) coverBg = res.coverBg
          if (res.vocab?.length) vocab = res.vocab
          if (res.retellPrompts?.length) retellPrompts = res.retellPrompts
          if (res.teachingGoals?.length) {
            for (const g of res.teachingGoals) if (!teachingGoals.includes(g)) teachingGoals.push(g)
          }
        } else {
          // Merge additional vocab / prompts from later chapters.
          if (res.vocab?.length) {
            const known = new Set(vocab.map((v) => v.word))
            for (const v of res.vocab) if (!known.has(v.word)) vocab.push(v)
          }
          if (res.retellPrompts?.length && retellPrompts.length === 0) retellPrompts = res.retellPrompts
        }

        const chapterTitle = res.chapters?.[0]?.title || (kind === 'chapter' ? `Chapter ${i + 1}` : title)
        const chapter = responseToChapter(res, chapterTitle)
        const flagged = isNeedsReview(res)
        if (flagged) sawNeedsReview = true

        chapters.push(chapter)

        // Persist after every chapter so a mid-run failure still leaves a Draft.
        const partial: Book = {
          id: bookId,
          title,
          by: 'Made by you',
          kind,
          status: sawNeedsReview
            ? 'needs-review'
            : i + 1 < chapterTarget
              ? 'draft'
              : 'complete',
          source: 'generated',
          coverEmoji,
          coverBg,
          chapters,
          vocab,
          teachingGoals,
          retellPrompts:
            retellPrompts.length > 0
              ? retellPrompts
              : ['Who was in the story?', 'What was the problem?', 'How did it end?'],
          createdAt: Date.now(),
          idea: premise,
        }
        saveStory(partial)
        void pushStory(partial)
        setBook(partial)

        setProgress((prev) => prev.map((s, idx) => (idx === i ? (flagged ? 'needs-review' : 'written') : s)))
      }

      setNeedsReview(sawNeedsReview)
      setStep(5)
    } catch (e) {
      setWriteError(e instanceof Error ? e.message : HICCUP)
      setProgress((prev) => prev.map((s) => (s === 'writing' ? 'error' : s)))
    }
  }

  // ---------- UI ----------
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--lf-p-muted)',
        color: 'var(--lf-p-foreground)',
        fontFamily: 'var(--font-ui)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          background: 'var(--lf-p-background)',
          borderBottom: '1px solid var(--lf-p-border)',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Link
          href="/read/parent"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            border: 'none',
            background: 'none',
            font: '500 14px var(--font-ui)',
            color: 'var(--lf-p-muted-foreground)',
            textDecoration: 'none',
          }}
        >
          <ChevronLeft size={16} /> Parent corner
        </Link>
        <h1 style={{ margin: 0, font: '700 18px var(--font-ui)' }}>New story</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }} aria-label={`Step ${step} of 3`}>
          {[1, 2, 3].map((s) => {
            const active = (step === 1 && s === 1) || (step === 2 && s === 2) || (step >= 3 && s === 3)
            const filled = (step === 1 && s <= 1) || (step === 2 && s <= 2) || (step >= 3 && s <= 3)
            return (
              <span
                key={s}
                style={{
                  width: active ? 20 : 7,
                  height: 7,
                  borderRadius: 99,
                  background: filled ? 'var(--lf-p-primary)' : 'var(--lf-p-border)',
                  transition: 'width 200ms',
                }}
              />
            )
          })}
        </div>
      </header>

      <main style={{ flex: 1, padding: '26px 28px', display: 'flex', justifyContent: 'center' }}>
        {step === 1 && (
          <div style={{ width: 640, maxWidth: '100%' }}>
            <p style={{ margin: '0 0 14px', font: '400 14px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
              What shape of story?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { id: 'quick' as const, t: 'Quick story', d: 'One sitting, 10–14 pages. Good for car rides.' },
                { id: 'chapter' as const, t: 'Chapter book', d: '3–5 chapters, a week of reading. One big arc.' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id)}
                  className="lf-press"
                  style={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: 12,
                    padding: '18px 18px 16px',
                    color: 'var(--lf-p-foreground)',
                    border: format === f.id ? '2px solid var(--lf-p-primary)' : '1px solid var(--lf-p-border)',
                    background: 'var(--lf-p-background)',
                  }}
                >
                  <div style={{ font: '600 15px var(--font-ui)' }}>{f.t}</div>
                  <div style={{ font: '400 13px/1.5 var(--font-ui)', color: 'var(--lf-p-muted-foreground)', marginTop: 4 }}>
                    {f.d}
                  </div>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
              <PButton size="lg" disabled={!format} onClick={() => format && setStep(2)}>
                Continue
              </PButton>
            </div>
          </div>
        )}

        {step === 2 && universe && (
          <div style={{ width: 780, maxWidth: '100%' }}>
            <p style={{ margin: '0 0 14px', font: '400 14px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
              One question at a time. Suggestions come from {universe.childName}&rsquo;s universe.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <PCard title="Who is the hero?">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {universe.companions.map((c) => (
                    <ChipToggle
                      key={c.name}
                      label={c.name}
                      on={fields.hero === c.name}
                      onClick={() => setFields((f) => ({ ...f, hero: f.hero === c.name ? null : c.name }))}
                    />
                  ))}
                </div>
              </PCard>

              <PCard title="Where does it happen?">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {universe.settings.map((s) => (
                    <ChipToggle
                      key={s.name}
                      label={s.name}
                      on={fields.setting === s.name}
                      onClick={() => setFields((f) => ({ ...f, setting: f.setting === s.name ? null : s.name }))}
                    />
                  ))}
                </div>
              </PCard>

              <PCard title="What does it gently teach?">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {universe.teachingGoals.map((g) => (
                    <ChipToggle
                      key={g}
                      label={g}
                      on={fields.teachingGoal === g}
                      onClick={() =>
                        setFields((f) => ({ ...f, teachingGoal: f.teachingGoal === g ? null : g }))
                      }
                    />
                  ))}
                </div>
              </PCard>

              <PCard title="Emotional theme">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {EMOTIONAL_THEMES.map((e) => (
                    <ChipToggle
                      key={e}
                      label={e}
                      on={fields.emotion === e}
                      onClick={() => setFields((f) => ({ ...f, emotion: f.emotion === e ? null : e }))}
                    />
                  ))}
                </div>
              </PCard>

              {universe.culture.words.length > 0 && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <PCard title="Cultural elements" description="Family words to weave into the dialogue.">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {universe.culture.words.map((w) => (
                        <ChipToggle
                          key={w.term}
                          label={`${w.term} (${w.language})`}
                          on={fields.cultureWords.includes(w.term)}
                          onClick={() => toggleCultureWord(w.term)}
                        />
                      ))}
                    </div>
                  </PCard>
                </div>
              )}

              <div style={{ gridColumn: '1 / -1' }}>
                <PCard title="A family idea (optional)" description="Anything you want the story to include.">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={fields.idea}
                      onChange={(e) => setFields((f) => ({ ...f, idea: e.target.value }))}
                      placeholder="Type a sentence, or tap the mic"
                      style={{
                        flex: 1,
                        height: 36,
                        padding: '0 12px',
                        border: '1px solid var(--lf-p-border)',
                        borderRadius: 'var(--radius-p-md)',
                        background: 'var(--lf-p-background)',
                        color: 'var(--lf-p-foreground)',
                        font: '400 14px var(--font-ui)',
                        outline: 'none',
                      }}
                    />
                    {recognitionAvailable() && (
                      <PButton variant="secondary" onClick={captureIdea} disabled={listening}>
                        <Mic size={14} /> {listening ? 'Listening…' : 'Speak'}
                      </PButton>
                    )}
                  </div>
                </PCard>
              </div>
            </div>
            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between' }}>
              <PButton variant="ghost" onClick={() => setStep(1)}>
                Back
              </PButton>
              <PButton size="lg" disabled={!ready2} onClick={() => ready2 && setStep(3)}>
                Review
              </PButton>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ width: 560, maxWidth: '100%' }}>
            <PCard title="Ready to write" description="Check the ingredients, then let it write.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ['Format', kind === 'chapter' ? `Chapter book · ${CHAPTER_COUNT} chapters` : 'Quick story'],
                  ['Hero', fields.hero ?? '—'],
                  ['Setting', fields.setting ?? '—'],
                  ['Teaches', fields.teachingGoal ?? '—'],
                  ['Theme', fields.emotion ?? '—'],
                  fields.cultureWords.length ? ['Family words', fields.cultureWords.join(', ')] : null,
                  fields.idea.trim() ? ['Idea', fields.idea.trim()] : null,
                ]
                  .filter((r): r is [string, string] => !!r)
                  .map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        display: 'flex',
                        gap: 12,
                        borderBottom: '1px solid var(--lf-p-border)',
                        paddingBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          font: '500 13px var(--font-ui)',
                          color: 'var(--lf-p-muted-foreground)',
                          width: 90,
                          flexShrink: 0,
                        }}
                      >
                        {k}
                      </span>
                      <span style={{ font: '500 13.5px var(--font-ui)' }}>{v}</span>
                    </div>
                  ))}
              </div>
            </PCard>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
              <PButton variant="ghost" onClick={() => setStep(2)}>
                Back
              </PButton>
              <PButton size="lg" onClick={() => void startWriting()}>
                Start writing
              </PButton>
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ width: 560, maxWidth: '100%' }}>
            <PCard title="Writing…" description="This takes about a minute per chapter.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {progress.map((s, i) => {
                  const label = kind === 'chapter' ? `Chapter ${i + 1}` : 'Story'
                  const total = chapterTarget
                  const pct =
                    s === 'written' || s === 'needs-review'
                      ? 100
                      : s === 'writing'
                        ? Math.round(((i + 0.5) / total) * 100)
                        : s === 'error'
                          ? 0
                          : 0
                  return (
                    <div key={i}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          font: '500 13.5px var(--font-ui)',
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            width: 18,
                            textAlign: 'center',
                            color: 'var(--lf-p-muted-foreground)',
                          }}
                        >
                          {s === 'written' ? '✓' : s === 'writing' ? '·' : s === 'needs-review' ? '!' : s === 'error' ? '×' : '·'}
                        </span>
                        <span
                          style={{
                            color:
                              s === 'waiting' ? 'var(--lf-p-muted-foreground)' : 'var(--lf-p-foreground)',
                            flex: 1,
                          }}
                        >
                          {label} —{' '}
                          {s === 'written'
                            ? 'written'
                            : s === 'writing'
                              ? 'writing…'
                              : s === 'needs-review'
                                ? 'needs review'
                                : s === 'error'
                                  ? 'try again'
                                  : 'waiting'}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 4,
                          borderRadius: 999,
                          background: 'var(--lf-p-muted)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background:
                              s === 'needs-review'
                                ? '#b45309'
                                : s === 'error'
                                  ? '#dc2626'
                                  : 'var(--lf-p-primary)',
                            transition: 'width 300ms ease-out',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              {writeError && (
                <div
                  style={{
                    marginTop: 14,
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-p-md)',
                    background: 'var(--lf-p-muted)',
                    font: '400 13px var(--font-ui)',
                    color: 'var(--lf-p-foreground)',
                  }}
                >
                  {writeError}
                </div>
              )}
            </PCard>
            {writeError && (
              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                <PButton onClick={() => void startWriting()}>Try again</PButton>
              </div>
            )}
          </div>
        )}

        {step === 5 && book && (
          <div style={{ width: 520, maxWidth: '100%' }}>
            <PCard
              title={needsReview ? 'One chapter needs review' : 'Story is ready'}
              description={
                needsReview
                  ? 'It saved as a draft. Check the parent corner to review before publishing.'
                  : 'It saved to the library.'
              }
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 0',
                }}
              >
                <span
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    border: '1px solid var(--lf-p-border)',
                    background: book.coverBg ?? 'var(--lf-p-muted)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                  }}
                  aria-hidden
                >
                  {book.coverEmoji}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ font: '600 14px var(--font-ui)' }}>{book.title}</div>
                  <div style={{ font: '400 12.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
                    {book.kind === 'chapter'
                      ? `${book.chapters.length} chapters`
                      : `${book.chapters[0]?.pages.length ?? 0} pages`}
                  </div>
                </div>
              </div>
            </PCard>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <PButton size="lg" onClick={() => router.push('/read/parent')}>
                Back to parent corner
              </PButton>
            </div>
          </div>
        )}
      </main>

      <footer
        style={{
          padding: '10px 28px',
          borderTop: '1px solid var(--lf-p-border)',
          background: 'var(--lf-p-background)',
          font: '400 12.5px var(--font-ui)',
          color: 'var(--lf-p-muted-foreground)',
        }}
      >
        Auto-saved · Drafts never appear on the shelf until published
      </footer>
    </div>
  )
}
