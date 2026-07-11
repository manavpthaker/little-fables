'use client'

// Little Fables v2 — parent surfaces.
// Auth flow: SignIn (magic link) → Gate (3-answer math) → ParentCorner.
// ParentCorner is a tabbed workspace: Stories, Retellings, Universe.
// Design source: design/handoff-v2/app/screens-parent.jsx. shadcn neutrals,
// Inter, sentence-case copy, no emoji, no exclamation points.

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronLeft,
  Mic,
  Pause,
  Pencil,
  Play,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import {
  deleteRetell,
  deleteStory,
  listRetells,
  loadStories,
  type Retell,
} from '@/lib/read/storage'
import {
  loadUniverse,
  saveUniverse,
  type CultureWord,
  type Universe,
} from '@/lib/universe/azad-verse'
import { useAuth } from '@/lib/auth/AuthProvider'
import {
  deleteRetellRemote,
  pullAll,
  pushUniverse,
  sendMagicLink,
  signOut,
} from '@/lib/read/sync'
import type { Book } from '@/types/story'

// ---------- Gate math ----------
const GATE_MIN_A = 3, GATE_MAX_A = 8
const GATE_MIN_B = 4, GATE_MAX_B = 8

function pickAB(): [number, number] {
  return [
    GATE_MIN_A + Math.floor(Math.random() * (GATE_MAX_A - GATE_MIN_A + 1)),
    GATE_MIN_B + Math.floor(Math.random() * (GATE_MAX_B - GATE_MIN_B + 1)),
  ]
}

function buildAnswers(product: number): number[] {
  // Right answer + two plausible near-misses.
  const distractors = new Set<number>()
  const candidates = [product - 2, product - 3, product + 2, product + 3, product - 10, product + 10]
  for (const n of candidates) {
    if (n > 0 && n !== product) distractors.add(n)
  }
  const picks = Array.from(distractors)
  const two: number[] = []
  while (two.length < 2 && picks.length) {
    const idx = Math.floor(Math.random() * picks.length)
    two.push(picks.splice(idx, 1)[0])
  }
  const all = [product, ...two]
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[all[i], all[j]] = [all[j], all[i]]
  }
  return all
}

// Canonical teaching goals for the toggle chips (per PRD).
const TEACHING_OPTIONS = [
  'counting',
  'star words',
  'naming feelings',
  'belly breaths',
  'flexible thinking',
  'living vs nonliving',
  'family words (Gujarati)',
  'family words (Spanish)',
  'family words (Hindi)',
]

const LANGUAGES: CultureWord['language'][] = ['Gujarati', 'Spanish', 'Hindi', 'Creole', 'English']

const fmtDur = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`

// ---------- Reusable parent-surface primitives ----------
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
        padding: padded ? 24 : 0,
      }}
    >
      {title && (
        <div style={{ font: '600 16px/1.3 var(--font-ui)', color: 'var(--lf-p-foreground)' }}>{title}</div>
      )}
      {description && (
        <div style={{ font: '400 13.5px/1.5 var(--font-ui)', color: 'var(--lf-p-muted-foreground)', marginTop: 4 }}>
          {description}
        </div>
      )}
      {title || description ? <div style={{ marginTop: 18 }}>{children}</div> : children}
    </div>
  )
}

function PButton({
  children,
  onClick,
  variant = 'primary',
  size = 'default',
  as,
  href,
  disabled,
  ariaLabel,
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'default' | 'sm'
  as?: 'link'
  href?: string
  disabled?: boolean
  ariaLabel?: string
}) {
  const h = size === 'sm' ? 30 : 36
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    height: h,
    padding: '0 14px',
    borderRadius: 'var(--radius-p-md)',
    font: `500 ${size === 'sm' ? 13 : 14}px var(--font-ui)`,
    cursor: disabled ? 'default' : 'pointer',
    textDecoration: 'none',
    opacity: disabled ? 0.5 : 1,
    ...(variant === 'primary'
      ? { background: 'var(--lf-p-primary)', color: 'var(--lf-p-primary-foreground)', border: '1px solid var(--lf-p-primary)' }
      : variant === 'secondary'
        ? { background: 'var(--lf-p-background)', color: 'var(--lf-p-foreground)', border: '1px solid var(--lf-p-border)' }
        : { background: 'transparent', color: 'var(--lf-p-muted-foreground)', border: 'none', padding: '0 8px' }),
  }
  if (as === 'link' && href) return <Link href={href} style={style} className="lf-press" aria-label={ariaLabel}>{children}</Link>
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={style} className="lf-press" aria-label={ariaLabel}>
      {children}
    </button>
  )
}

function PInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { style, ...rest } = props
  return (
    <input
      {...rest}
      style={{
        height: 36,
        padding: '0 12px',
        border: '1px solid var(--lf-p-border)',
        borderRadius: 'var(--radius-p-md)',
        background: 'var(--lf-p-background)',
        color: 'var(--lf-p-foreground)',
        font: '400 14px var(--font-ui)',
        outline: 'none',
        ...style,
      }}
    />
  )
}

// ---------- Gate ----------
function Gate({ onPass }: { onPass: () => void }) {
  const [ab, setAB] = useState<[number, number]>(pickAB)
  const [answers, setAnswers] = useState<number[]>(() => buildAnswers(ab[0] * ab[1]))
  const [wrong, setWrong] = useState(false)
  const shakeKey = useRef(0)

  const pick = (n: number) => {
    if (n === ab[0] * ab[1]) {
      onPass()
      return
    }
    shakeKey.current += 1
    setWrong(true)
    // Reroll on wrong so it stays fresh.
    const next = pickAB()
    setAB(next)
    setAnswers(buildAnswers(next[0] * next[1]))
  }

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
      <div style={{ padding: '22px 28px' }}>
        <Link
          href="/read"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--lf-p-muted-foreground)',
            textDecoration: 'none',
            font: '500 14px var(--font-ui)',
            padding: '8px 10px',
            marginLeft: -10,
          }}
        >
          <ChevronLeft size={16} /> Back to Azad&rsquo;s world
        </Link>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px 90px' }}>
        <div key={shakeKey.current} className={wrong ? 'sw-shake' : ''} style={{ width: 400, maxWidth: '100%' }}>
          <PCard title="For grown-ups" description="Answer to open the parent corner.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ font: '600 32px/1.2 var(--font-ui)', letterSpacing: '-0.02em' }}>
                {ab[0]} × {ab[1]} = ?
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {answers.map((n, i) => (
                  <button
                    key={`${n}-${i}`}
                    type="button"
                    onClick={() => pick(n)}
                    className="lf-press"
                    style={{
                      background: 'var(--lf-p-background)',
                      border: '1px solid var(--lf-p-border)',
                      borderRadius: 'var(--radius-p-md)',
                      padding: '0 16px',
                      height: 48,
                      font: '500 16px var(--font-ui)',
                      color: 'var(--lf-p-foreground)',
                      cursor: 'pointer',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div style={{ font: '400 13px/1.4 var(--font-ui)', color: 'var(--lf-p-muted-foreground)', minHeight: 18 }}>
                {wrong ? 'Not quite — try once more.' : 'This keeps little fingers in the story world.'}
              </div>
            </div>
          </PCard>
        </div>
      </div>
    </div>
  )
}

// ---------- Status pill (Draft / Checking / Published / Needs review) ----------
function bookLifecycle(b: Book): { label: string; tone: 'draft' | 'checking' | 'published' | 'review' } {
  if (b.status === 'needs-review') return { label: 'Needs review', tone: 'review' }
  if (b.status === 'draft') return { label: 'Checking', tone: 'checking' }
  if (b.status === 'awaiting-choice') return { label: 'Draft', tone: 'draft' }
  return { label: 'Published', tone: 'published' }
}

function LifecyclePill({ book }: { book: Book }) {
  const { label, tone } = bookLifecycle(book)
  const palette = {
    published: { bg: '#f0fdf4', fg: '#15803d', border: '#bbf7d0' },
    checking:  { bg: 'var(--lf-p-muted)', fg: 'var(--lf-p-muted-foreground)', border: 'var(--lf-p-border)' },
    draft:     { bg: 'var(--lf-p-muted)', fg: 'var(--lf-p-muted-foreground)', border: 'var(--lf-p-border)' },
    review:    { bg: '#fef3c7', fg: '#92400e', border: '#fde68a' },
  }[tone]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 9px',
        borderRadius: 999,
        font: '500 11.5px var(--font-ui)',
        background: palette.bg,
        color: palette.fg,
        border: `1px solid ${palette.border}`,
      }}
    >
      {label}
    </span>
  )
}

// ---------- Story row ----------
function StoryRow({ book, onDelete }: { book: Book; onDelete?: () => void }) {
  const hasCover = !!book.coverImage
  const meta =
    book.kind === 'chapter'
      ? `${book.chapters.length} chapter${book.chapters.length === 1 ? '' : 's'}`
      : `${book.chapters[0]?.pages.length ?? 0} pages`
  const by = book.by ?? (book.source === 'starter' ? 'Little Fables' : 'Made by you')
  const teaches = book.teachingGoals.length ? book.teachingGoals.slice(0, 2).join(', ') : '—'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 0' }}>
      {hasCover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={book.coverImage}
          alt=""
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            objectFit: 'cover',
            border: '1px solid var(--lf-p-border)',
            flexShrink: 0,
          }}
        />
      ) : (
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
            flexShrink: 0,
          }}
          aria-hidden
        >
          {book.coverEmoji || <Pencil size={15} />}
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: '500 14px/1.4 var(--font-ui)' }}>{book.title}</div>
        <div style={{ font: '400 12.5px/1.4 var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
          by {by} · {meta} · teaches {teaches}
        </div>
      </div>
      <LifecyclePill book={book} />
      {onDelete && (
        <button
          type="button"
          aria-label={`Delete ${book.title}`}
          onClick={onDelete}
          className="lf-press"
          style={{
            width: 30,
            height: 30,
            border: 'none',
            background: 'transparent',
            color: 'var(--lf-p-muted-foreground)',
            cursor: 'pointer',
            borderRadius: 'var(--radius-p-md)',
            flexShrink: 0,
          }}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}

// ---------- Recording row ----------
function RecordingRow({
  rec,
  onDelete,
}: {
  rec: Retell
  onDelete: () => void
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [pos, setPos] = useState(0)
  const [dur, setDur] = useState(0)

  useEffect(() => {
    const u = URL.createObjectURL(rec.blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [rec.blob])

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) a.pause()
    else void a.play()
  }

  const progress = dur > 0 ? Math.min(100, (pos / dur) * 100) : 0
  const transcriptPreview = rec.transcript ? rec.transcript.slice(0, 100) : ''
  const chapterLabel = rec.chapter != null ? ` · Chapter ${rec.chapter + 1}` : ''

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
      <audio
        ref={audioRef}
        src={url ?? undefined}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration
          if (isFinite(d)) setDur(d)
        }}
        onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
        preload="metadata"
      />
      <button
        type="button"
        aria-label={playing ? `Pause ${rec.bookTitle}` : `Play ${rec.bookTitle}`}
        onClick={toggle}
        className="lf-press"
        style={{
          width: 38,
          height: 38,
          borderRadius: 999,
          border: '1px solid var(--lf-p-border)',
          background: playing ? 'var(--lf-p-primary)' : 'var(--lf-p-background)',
          color: playing ? 'var(--lf-p-primary-foreground)' : 'var(--lf-p-foreground)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {playing ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 2 }} />}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: '500 14px/1.4 var(--font-ui)' }}>
          {rec.bookTitle}{chapterLabel}
        </div>
        <div style={{ font: '400 12.5px/1.4 var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
          {new Date(rec.createdAt).toLocaleDateString()} · {dur > 0 ? fmtDur(dur) : '…'}
        </div>
        {transcriptPreview && (
          <div
            style={{
              font: '400 12.5px/1.5 var(--font-ui)',
              color: 'var(--lf-p-foreground)',
              marginTop: 6,
              padding: '6px 10px',
              background: 'var(--lf-p-muted)',
              borderRadius: 'var(--radius-p-md)',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {transcriptPreview}{rec.transcript && rec.transcript.length > 100 ? '…' : ''}
          </div>
        )}
        <div style={{ height: 4, borderRadius: 999, background: 'var(--lf-p-muted)', marginTop: 8, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'var(--lf-p-primary)',
              borderRadius: 999,
              transition: 'width 200ms linear',
            }}
          />
        </div>
      </div>
      <Mic size={15} style={{ color: 'var(--lf-p-muted-foreground)', flexShrink: 0 }} />
      <button
        type="button"
        aria-label={`Delete recording of ${rec.bookTitle}`}
        onClick={onDelete}
        className="lf-press"
        style={{
          width: 32,
          height: 32,
          border: 'none',
          background: 'transparent',
          color: 'var(--lf-p-muted-foreground)',
          cursor: 'pointer',
          borderRadius: 'var(--radius-p-md)',
          flexShrink: 0,
        }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

// ---------- Universe tab ----------
function UniverseTab({
  universe,
  persist,
}: {
  universe: Universe
  persist: (u: Universe) => void
}) {
  const [newInterest, setNewInterest] = useState('')
  const [wTerm, setWTerm] = useState('')
  const [wLang, setWLang] = useState<CultureWord['language']>('Gujarati')
  const [wMeaning, setWMeaning] = useState('')

  const removeInterest = (v: string) =>
    persist({ ...universe, interests: universe.interests.filter((x) => x !== v) })

  const addInterest = () => {
    const v = newInterest.trim()
    if (v && !universe.interests.includes(v)) {
      persist({ ...universe, interests: [...universe.interests, v] })
    }
    setNewInterest('')
  }

  const toggleGoal = (g: string) => {
    const has = universe.teachingGoals.includes(g)
    persist({
      ...universe,
      teachingGoals: has ? universe.teachingGoals.filter((x) => x !== g) : [...universe.teachingGoals, g],
    })
  }

  const removeWord = (idx: number) =>
    persist({
      ...universe,
      culture: {
        ...universe.culture,
        words: universe.culture.words.filter((_, i) => i !== idx),
      },
    })

  const updateWordLang = (idx: number, language: CultureWord['language']) =>
    persist({
      ...universe,
      culture: {
        ...universe.culture,
        words: universe.culture.words.map((w, i) => (i === idx ? { ...w, language } : w)),
      },
    })

  const addWord = () => {
    const term = wTerm.trim()
    const meaning = wMeaning.trim()
    if (!term || !meaning) return
    persist({
      ...universe,
      culture: {
        ...universe.culture,
        words: [...universe.culture.words, { term, language: wLang, meaning }],
      },
    })
    setWTerm('')
    setWMeaning('')
  }

  const chipBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 999,
    border: '1px solid var(--lf-p-border)',
    font: '500 13px var(--font-ui)',
    color: 'var(--lf-p-foreground)',
    background: 'var(--lf-p-background)',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, maxWidth: 1060 }}>
      <style>{`
        @media (min-width: 900px) {
          .universe-grid { grid-template-columns: 1fr 1fr 1fr !important; }
        }
      `}</style>
      <div className="universe-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, alignItems: 'start' }}>
        <PCard title="Interests" description="Woven into new stories.">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {universe.interests.map((it) => (
              <span key={it} style={chipBase}>
                {it}
                <button
                  type="button"
                  aria-label={`Remove ${it}`}
                  onClick={() => removeInterest(it)}
                  style={{
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'var(--lf-p-muted-foreground)',
                    display: 'inline-flex',
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <PInput
              placeholder="Add an interest"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addInterest()}
              style={{ flex: 1 }}
            />
            <PButton variant="secondary" onClick={addInterest}>
              <Plus size={14} /> Add
            </PButton>
          </div>
        </PCard>

        <PCard title="Teaching goals" description="What stories gently practice.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {TEACHING_OPTIONS.map((g) => {
              const on = universe.teachingGoals.includes(g)
              return (
                <label key={g} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    onClick={() => toggleGoal(g)}
                    style={{
                      width: 34,
                      height: 20,
                      borderRadius: 999,
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                      flexShrink: 0,
                      background: on ? 'var(--lf-p-primary)' : 'var(--lf-p-border)',
                      transition: 'background 150ms',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: 2,
                        left: on ? 16 : 2,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: '#fff',
                        transition: 'left 150ms',
                      }}
                    />
                  </button>
                  <span style={{ font: '400 13.5px var(--font-ui)' }}>{g}</span>
                </label>
              )
            })}
          </div>
        </PCard>

        <PCard title="Family words" description="Real words from home.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {universe.culture.words.map((w, i) => (
              <div
                key={`${w.term}-${i}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(80px, 1fr) 96px minmax(100px, 1.5fr) auto',
                  gap: 8,
                  alignItems: 'center',
                  borderBottom: '1px solid var(--lf-p-border)',
                  paddingBottom: 8,
                }}
              >
                <span style={{ font: '600 13.5px var(--font-ui)' }}>{w.term}</span>
                <select
                  value={w.language}
                  onChange={(e) => updateWordLang(i, e.target.value as CultureWord['language'])}
                  style={{
                    height: 30,
                    padding: '0 8px',
                    border: '1px solid var(--lf-p-border)',
                    borderRadius: 'var(--radius-p-md)',
                    background: 'var(--lf-p-background)',
                    color: 'var(--lf-p-foreground)',
                    font: '400 12.5px var(--font-ui)',
                  }}
                  aria-label={`Language for ${w.term}`}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <span style={{ font: '400 12.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
                  {w.meaning}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${w.term}`}
                  onClick={() => removeWord(i)}
                  style={{
                    border: 'none',
                    background: 'none',
                    padding: 4,
                    cursor: 'pointer',
                    color: 'var(--lf-p-muted-foreground)',
                    display: 'inline-flex',
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 96px', gap: 8, marginBottom: 8 }}>
            <PInput
              placeholder="Word"
              value={wTerm}
              onChange={(e) => setWTerm(e.target.value)}
            />
            <select
              value={wLang}
              onChange={(e) => setWLang(e.target.value as CultureWord['language'])}
              style={{
                height: 36,
                padding: '0 10px',
                border: '1px solid var(--lf-p-border)',
                borderRadius: 'var(--radius-p-md)',
                background: 'var(--lf-p-background)',
                color: 'var(--lf-p-foreground)',
                font: '400 13px var(--font-ui)',
              }}
              aria-label="Language for the new word"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <PInput
              placeholder="Meaning"
              value={wMeaning}
              onChange={(e) => setWMeaning(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addWord()}
              style={{ flex: 1 }}
            />
            <PButton variant="secondary" onClick={addWord}>
              <Plus size={14} /> Add
            </PButton>
          </div>
        </PCard>
      </div>
    </div>
  )
}

// ---------- Parent Corner ----------
function ParentCorner() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'stories' | 'retells' | 'universe'>('stories')
  const [universe, setUniverse] = useState<Universe | null>(null)
  const [retells, setRetells] = useState<Retell[]>([])
  const [books, setBooks] = useState<Book[]>([])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (user) await pullAll()
      if (cancelled) return
      setUniverse(loadUniverse())
      setBooks(loadStories())
      try {
        setRetells(await listRetells())
      } catch {
        /* ignore */
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [user])

  const persistUniverse = useCallback((next: Universe) => {
    setUniverse(next)
    saveUniverse(next)
    void pushUniverse(next)
  }, [])

  const sortedBooks = useMemo(
    () => books.slice().sort((a, b) => b.createdAt - a.createdAt),
    [books]
  )

  if (!universe) return null

  const removeBook = (id: string) => {
    deleteStory(id)
    setBooks(loadStories())
  }

  const tabs: Array<[typeof tab, string]> = [
    ['stories', 'Stories'],
    ['retells', 'Retellings'],
    ['universe', `${universe.childName}’s universe`],
  ]

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
          gap: 18,
          flexWrap: 'wrap',
        }}
      >
        <Link
          href="/read"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            font: '500 14px var(--font-ui)',
            color: 'var(--lf-p-muted-foreground)',
            textDecoration: 'none',
          }}
        >
          <ChevronLeft size={16} /> {universe.childName}&rsquo;s world
        </Link>
        <h1 style={{ margin: 0, font: '700 18px var(--font-ui)' }}>Parent corner</h1>
        <nav style={{ marginLeft: 8, display: 'flex', gap: 4 }}>
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              style={{
                border: 'none',
                cursor: 'pointer',
                padding: '7px 14px',
                borderRadius: 6,
                background: tab === id ? 'var(--lf-p-muted)' : 'transparent',
                font: '500 14px var(--font-ui)',
                color: tab === id ? 'var(--lf-p-foreground)' : 'var(--lf-p-muted-foreground)',
              }}
            >
              {label}
            </button>
          ))}
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {user && (
            <>
              <span style={{ font: '400 12.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
                Synced as {user.email}
              </span>
              <PButton variant="ghost" size="sm" onClick={() => { void signOut() }}>
                Sign out
              </PButton>
            </>
          )}
          <span style={{ font: '400 12.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
            Auto-saved
          </span>
        </div>
      </header>

      <main style={{ flex: 1, padding: '22px 28px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {tab === 'stories' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, gap: 12 }}>
              <p style={{ margin: 0, font: '400 13.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
                Stories the family has made. Published stories appear on {universe.childName}&rsquo;s shelf.
              </p>
              <span style={{ marginLeft: 'auto' }}>
                <PButton as="link" href="/read/create">
                  <Plus size={15} /> New story
                </PButton>
              </span>
            </div>
            <PCard padded={false}>
              {sortedBooks.length === 0 ? (
                <div
                  style={{
                    padding: 24,
                    font: '400 14px/1.5 var(--font-ui)',
                    color: 'var(--lf-p-muted-foreground)',
                  }}
                >
                  No stories yet. Tap &ldquo;New story&rdquo; to write the first one.
                </div>
              ) : (
                <div style={{ padding: '0 18px' }}>
                  {sortedBooks.map((b, i) => (
                    <div
                      key={b.id}
                      style={{ borderTop: i === 0 ? 'none' : '1px solid var(--lf-p-border)' }}
                    >
                      <StoryRow book={b} onDelete={() => removeBook(b.id)} />
                    </div>
                  ))}
                </div>
              )}
            </PCard>
          </div>
        )}

        {tab === 'retells' && (
          <div style={{ maxWidth: 720 }}>
            <p style={{ margin: '0 0 14px', font: '400 13.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
              {universe.childName}&rsquo;s story retellings, in their own words.
            </p>
            <PCard padded={false}>
              {retells.length === 0 ? (
                <div
                  style={{
                    padding: 24,
                    font: '400 14px/1.5 var(--font-ui)',
                    color: 'var(--lf-p-muted-foreground)',
                  }}
                >
                  No recordings yet. They&rsquo;ll appear here after {universe.childName} retells a story.
                </div>
              ) : (
                retells.map((rec, i) => (
                  <div
                    key={rec.id}
                    style={{ borderTop: i === 0 ? 'none' : '1px solid var(--lf-p-border)' }}
                  >
                    <RecordingRow
                      rec={rec}
                      onDelete={async () => {
                        await deleteRetell(rec.id)
                        void deleteRetellRemote(rec.id)
                        setRetells(await listRetells())
                      }}
                    />
                  </div>
                ))
              )}
            </PCard>
          </div>
        )}

        {tab === 'universe' && <UniverseTab universe={universe} persist={persistUniverse} />}
      </main>

      <footer
        style={{
          padding: '10px 28px',
          borderTop: '1px solid var(--lf-p-border)',
          background: 'var(--lf-p-background)',
          font: '400 12.5px var(--font-ui)',
          color: 'var(--lf-p-muted-foreground)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Check size={13} /> Auto-saved — changes appear in {universe.childName}&rsquo;s app right away
      </footer>
    </div>
  )
}

// ---------- Sign-in (magic link) ----------
function SignIn({ onSkip }: { onSkip: () => void }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const send = async () => {
    const v = email.trim()
    if (!v) return
    setState('sending')
    setError(null)
    try {
      const redirectTo = window.location.origin + '/read/parent'
      await sendMagicLink(v, redirectTo)
      setState('sent')
    } catch (e) {
      setState('error')
      setError(e instanceof Error ? e.message : 'Could not send the link.')
    }
  }

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
      <div style={{ padding: '22px 28px' }}>
        <Link
          href="/read"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--lf-p-muted-foreground)',
            textDecoration: 'none',
            font: '500 14px var(--font-ui)',
            padding: '8px 10px',
            marginLeft: -10,
          }}
        >
          <ChevronLeft size={16} /> Back to the story world
        </Link>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px 90px' }}>
        <div style={{ width: 420, maxWidth: '100%' }}>
          <PCard
            title="Sign in to sync"
            description="Sign in with the same email on every device to share one library."
          >
            {state === 'sent' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ font: '500 15px/1.4 var(--font-ui)', color: 'var(--lf-p-foreground)' }}>
                  Check {email} for a sign-in link.
                </div>
                <div style={{ font: '400 13px/1.5 var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
                  Open the link on this device — it will finish signing you in and bring you back here.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ font: '500 13px var(--font-ui)', marginBottom: 6 }}>Email</div>
                  <PInput
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && send()}
                    style={{ width: '100%' }}
                  />
                </div>
                <PButton onClick={send} disabled={state === 'sending' || !email.trim()}>
                  {state === 'sending' ? 'Sending…' : 'Send magic link'}
                </PButton>
                {error && (
                  <div style={{ font: '400 13px var(--font-ui)', color: 'var(--lf-danger, #ef4444)' }}>{error}</div>
                )}
                <button
                  type="button"
                  onClick={onSkip}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    font: '400 13px var(--font-ui)',
                    color: 'var(--lf-p-muted-foreground)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                  }}
                >
                  Use without syncing on this device
                </button>
              </div>
            )}
          </PCard>
        </div>
      </div>
    </div>
  )
}

export default function Parent() {
  const { user, loading } = useAuth()
  const [passed, setPassed] = useState(false)
  const [skippedAuth, setSkippedAuth] = useState(false)

  if (loading) return null
  if (!user && !skippedAuth) return <SignIn onSkip={() => setSkippedAuth(true)} />
  if (!passed) return <Gate onPass={() => setPassed(true)} />
  return <ParentCorner />
}
