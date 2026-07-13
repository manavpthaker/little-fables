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
  archiveBook,
  deleteRetell,
  deleteStory,
  listRetells,
  loadArchived,
  loadStories,
  loadWildcards,
  unarchiveBook,
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
import type { Book, KidInterviewAnswer, SkillTag, WildcardCharacter } from '@/types/story'
import {
  DEFAULT_PROFILE,
  defaultCreativeGuardrails,
  loadProfile,
  saveProfile,
  type ChildProfile,
  type ContentPreferences,
  type CreativeGuardrails,
  type CurrentBand,
} from '@/lib/read/profile'

// Defensive skill-label lookup. Agent A creates `lib/read/skills.ts` with a
// `SKILL_TAXONOMY` export; while it's absent (or during type-only tsc runs)
// this falls back to the raw id string so the UI keeps rendering.
type SkillLookupModule = {
  SKILL_TAXONOMY?: Record<string, { label?: string }>
}
let SKILL_TAXONOMY: Record<string, { label?: string }> | undefined
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@/lib/read/skills') as SkillLookupModule
  SKILL_TAXONOMY = mod?.SKILL_TAXONOMY
} catch {
  SKILL_TAXONOMY = undefined
}
function skillLabel(id: SkillTag): string {
  return SKILL_TAXONOMY?.[id]?.label ?? id
}

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

// ---------- QA badge (v2.2 — visible on books with a qaRecord) ----------
function QaBadge({
  book,
  open,
  onToggle,
}: {
  book: Book
  open: boolean
  onToggle: () => void
}) {
  if (!book.qaRecord) return null
  const { softScore, revisions } = book.qaRecord
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={`QA breakdown for ${book.title}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 9px',
        borderRadius: 999,
        font: '500 11.5px var(--font-ui)',
        background: softScore >= 90 ? '#eff6ff' : '#fef3c7',
        color: softScore >= 90 ? '#1d4ed8' : '#92400e',
        border: `1px solid ${softScore >= 90 ? '#bfdbfe' : '#fde68a'}`,
        cursor: 'pointer',
      }}
    >
      QA {softScore}/100 · {revisions} revision{revisions === 1 ? '' : 's'}
    </button>
  )
}

// ---------- Story row ----------
function StoryRow({ book, onDelete }: { book: Book; onDelete?: () => void }) {
  const [qaOpen, setQaOpen] = useState(false)
  const hasCover = !!book.coverImage
  const meta =
    book.kind === 'chapter'
      ? `${book.chapters.length} chapter${book.chapters.length === 1 ? '' : 's'}`
      : `${book.chapters[0]?.pages.length ?? 0} pages`
  const by = book.by ?? (book.source === 'starter' ? 'Little Fables' : 'Made by you')
  const teaches = book.teachingGoals.length ? book.teachingGoals.slice(0, 2).join(', ') : '—'
  const skillTags = (book.skillTags ?? []).slice(0, 3)

  return (
    <div style={{ padding: '11px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
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
          {(skillTags.length > 0 || book.qaRecord) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, alignItems: 'center' }}>
              {skillTags.map((id) => (
                <span
                  key={id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: 999,
                    font: '500 11px var(--font-ui)',
                    background: 'var(--lf-p-muted)',
                    color: 'var(--lf-p-foreground)',
                    border: '1px solid var(--lf-p-border)',
                  }}
                >
                  {skillLabel(id)}
                </span>
              ))}
            </div>
          )}
        </div>
        <QaBadge book={book} open={qaOpen} onToggle={() => setQaOpen((v) => !v)} />
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
      {qaOpen && book.qaRecord && (
        <div
          style={{
            marginTop: 10,
            marginLeft: 58,
            padding: 12,
            background: 'var(--lf-p-muted)',
            border: '1px solid var(--lf-p-border)',
            borderRadius: 'var(--radius-p-md)',
            font: '400 12.5px/1.5 var(--font-ui)',
            color: 'var(--lf-p-foreground)',
          }}
        >
          <div style={{ font: '600 12.5px var(--font-ui)', marginBottom: 6 }}>
            QA breakdown
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 12px' }}>
            <span>Hard gates</span>
            <span style={{ color: book.qaRecord.hardGates.passed ? '#15803d' : '#b91c1c' }}>
              {book.qaRecord.hardGates.passed ? 'passed' : 'failed'}
            </span>
            <span>Soft score</span>
            <span>{book.qaRecord.softScore}/100</span>
            <span>Revisions</span>
            <span>{book.qaRecord.revisions}</span>
          </div>
          {book.qaRecord.breakdown && (
            <div style={{ marginTop: 8 }}>
              <div style={{ font: '600 12px var(--font-ui)', marginBottom: 4 }}>Weighted breakdown</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 12px' }}>
                {Object.entries(book.qaRecord.breakdown).map(([k, v]) => (
                  <div key={k} style={{ display: 'contents' }}>
                    <span style={{ textTransform: 'capitalize' }}>{k}</span>
                    <span>{v}/10</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {book.qaRecord.hardGates.violations && book.qaRecord.hardGates.violations.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ font: '600 12px var(--font-ui)', marginBottom: 4, color: '#b91c1c' }}>
                Violations
              </div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {book.qaRecord.hardGates.violations.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>
          )}
          {book.qaRecord.notes && (
            <div style={{ marginTop: 8, color: 'var(--lf-p-muted-foreground)' }}>
              {book.qaRecord.notes}
            </div>
          )}
        </div>
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

// ---------- Profile tab (v2.2 item #4) ----------
const BAND_OPTIONS: Array<{ id: CurrentBand; label: string }> = [
  { id: '0-3', label: '0–3' },
  { id: '4-8-early', label: '4–8 (early)' },
  { id: '4-8-late', label: '4–8 (late)' },
  { id: '7-10', label: '7–10' },
]

const TONE_OPTIONS: Array<{ id: NonNullable<ContentPreferences['toneCalibration']>; label: string }> = [
  { id: 'lighter-playful', label: 'Lighter, playful' },
  { id: 'gentle-serious', label: 'Gentle, serious' },
  { id: 'balanced', label: 'Balanced' },
]

function ChipList({
  values,
  onRemove,
  emptyHint,
}: {
  values: string[]
  onRemove: (v: string) => void
  emptyHint?: string
}) {
  if (!values.length && emptyHint) {
    return (
      <div style={{ font: '400 12.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
        {emptyHint}
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {values.map((v) => (
        <span
          key={v}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 999,
            border: '1px solid var(--lf-p-border)',
            font: '500 13px var(--font-ui)',
            color: 'var(--lf-p-foreground)',
            background: 'var(--lf-p-background)',
          }}
        >
          {v}
          <button
            type="button"
            aria-label={`Remove ${v}`}
            onClick={() => onRemove(v)}
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
  )
}

function ChipAdder({
  placeholder,
  onAdd,
}: {
  placeholder: string
  onAdd: (v: string) => void
}) {
  const [val, setVal] = useState('')
  const submit = () => {
    const v = val.trim()
    if (v) onAdd(v)
    setVal('')
  }
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
      <PInput
        placeholder={placeholder}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        style={{ flex: 1 }}
      />
      <PButton variant="secondary" onClick={submit}>
        <Plus size={14} /> Add
      </PButton>
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 34,
          height: 20,
          borderRadius: 999,
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          flexShrink: 0,
          background: checked ? 'var(--lf-p-primary)' : 'var(--lf-p-border)',
          transition: 'background 150ms',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 16 : 2,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 150ms',
          }}
        />
      </button>
      <span style={{ font: '400 13.5px var(--font-ui)' }}>{label}</span>
    </label>
  )
}

function ProfileTab({
  profile,
  persist,
}: {
  profile: ChildProfile
  persist: (p: ChildProfile) => void
}) {
  const patch = (p: Partial<ChildProfile>) => persist({ ...profile, ...p })
  const patchLangs = (langs: Partial<ChildProfile['languages']>) =>
    persist({ ...profile, languages: { ...profile.languages, ...langs } })
  const patchPrefs = (prefs: Partial<ContentPreferences>) =>
    persist({ ...profile, contentPreferences: { ...profile.contentPreferences, ...prefs } })

  const addTo = (key: 'home' | 'heritage', v: string) => {
    if (profile.languages[key].includes(v)) return
    patchLangs({ [key]: [...profile.languages[key], v] })
  }
  const removeFrom = (key: 'home' | 'heritage', v: string) => {
    patchLangs({
      [key]: profile.languages[key].filter((x) => x !== v),
      // Also drop from exposure goals if we lost it from heritage entirely.
      ...(key === 'heritage' && { exposureGoals: profile.languages.exposureGoals.filter((g) => g !== v || profile.languages.heritage.filter((h) => h !== v).includes(g)) }),
    })
  }
  const toggleExposureGoal = (lang: string) => {
    const has = profile.languages.exposureGoals.includes(lang)
    patchLangs({
      exposureGoals: has
        ? profile.languages.exposureGoals.filter((x) => x !== lang)
        : [...profile.languages.exposureGoals, lang],
    })
  }

  const addChallenge = (v: string) => {
    if (!profile.currentChallenges.includes(v)) {
      patch({ currentChallenges: [...profile.currentChallenges, v] })
    }
  }
  const removeChallenge = (v: string) =>
    patch({ currentChallenges: profile.currentChallenges.filter((x) => x !== v) })

  const addComfort = (v: string) => {
    if (!profile.comfortObjects.includes(v)) {
      patch({ comfortObjects: [...profile.comfortObjects, v] })
    }
  }
  const removeComfort = (v: string) =>
    patch({ comfortObjects: profile.comfortObjects.filter((x) => x !== v) })

  const addExclude = (v: string) => {
    if (!profile.contentPreferences.excludeTerms.includes(v)) {
      patchPrefs({ excludeTerms: [...profile.contentPreferences.excludeTerms, v] })
    }
  }
  const removeExclude = (v: string) =>
    patchPrefs({
      excludeTerms: profile.contentPreferences.excludeTerms.filter((x) => x !== v),
    })

  const radioBtn = (active: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: 'var(--radius-p-md)',
    border: '1px solid var(--lf-p-border)',
    font: '500 13px var(--font-ui)',
    cursor: 'pointer',
    background: active ? 'var(--lf-p-primary)' : 'var(--lf-p-background)',
    color: active ? 'var(--lf-p-primary-foreground)' : 'var(--lf-p-foreground)',
  })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, maxWidth: 1060 }}>
      <style>{`
        @media (min-width: 900px) {
          .profile-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
      <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, alignItems: 'start' }}>
        <PCard title="Current band" description="Stories are shaped for this developmental range.">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {BAND_OPTIONS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => patch({ currentBand: b.id })}
                style={radioBtn(profile.currentBand === b.id)}
              >
                {b.label}
              </button>
            ))}
          </div>
        </PCard>

        <PCard title="Tone calibration" description="How the narrator feels overall.">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TONE_OPTIONS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => patchPrefs({ toneCalibration: t.id })}
                style={radioBtn(profile.contentPreferences.toneCalibration === t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </PCard>

        <PCard title="Home languages" description="What is spoken at home day to day.">
          <ChipList
            values={profile.languages.home}
            onRemove={(v) => removeFrom('home', v)}
            emptyHint="No home languages yet."
          />
          <ChipAdder placeholder="e.g. en, es" onAdd={(v) => addTo('home', v)} />
        </PCard>

        <PCard title="Heritage languages" description="Family languages the story engine leans into.">
          <ChipList
            values={profile.languages.heritage}
            onRemove={(v) => removeFrom('heritage', v)}
            emptyHint="No heritage languages yet."
          />
          <ChipAdder placeholder="e.g. hi, gu" onAdd={(v) => addTo('heritage', v)} />
          {profile.languages.heritage.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ font: '500 12.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)', marginBottom: 6 }}>
                Exposure goals — turn on the ones you want more of this month.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {profile.languages.heritage.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleExposureGoal(lang)}
                    style={radioBtn(profile.languages.exposureGoals.includes(lang))}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          )}
        </PCard>

        <PCard title="Current challenges" description="What stories quietly help with.">
          <ChipList
            values={profile.currentChallenges}
            onRemove={removeChallenge}
            emptyHint="No challenges tracked."
          />
          <ChipAdder placeholder="e.g. sleep transitions" onAdd={addChallenge} />
        </PCard>

        <PCard title="Comfort objects" description="Plush friends stories can lean on.">
          <ChipList
            values={profile.comfortObjects}
            onRemove={removeComfort}
            emptyHint="No comfort objects yet."
          />
          <ChipAdder placeholder="e.g. Slothie, Jujy" onAdd={addComfort} />
        </PCard>

        <PCard
          title="Exclude terms"
          description="Words the story engine will avoid — e.g. 'agua' if you want stories in English only."
        >
          <ChipList
            values={profile.contentPreferences.excludeTerms}
            onRemove={removeExclude}
            emptyHint="No excluded terms."
          />
          <ChipAdder placeholder="add a term to skip" onAdd={addExclude} />
        </PCard>

        <PCard title="Framing devices" description="Turn on to allow 'this is a story about…' openings.">
          <ToggleRow
            label={profile.contentPreferences.framingDevices ? 'Framing devices allowed' : 'No framing devices'}
            checked={!!profile.contentPreferences.framingDevices}
            onChange={(v) => patchPrefs({ framingDevices: v })}
          />
        </PCard>
      </div>

      <CreativeGuardrailsSection profile={profile} persist={persist} />

      <div style={{ font: '400 12.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <Check size={13} /> Auto-saved
      </div>
    </div>
  )
}

// ---------- Creative guardrails section (PRD R21) ----------
// Renders under ProfileTab. Everything is saved through the same persist()
// callback so a single "auto-saved" indicator covers all fields.

function CreativeGuardrailsSection({
  profile,
  persist,
}: {
  profile: ChildProfile
  persist: (p: ChildProfile) => void
}) {
  const universe = useMemo(() => loadUniverse(), [])
  const [wildcards, setWildcards] = useState<WildcardCharacter[]>([])

  useEffect(() => {
    setWildcards(loadWildcards())
  }, [])

  // Hydrate guardrails on first mount so the section is never empty for
  // pre-v3 profiles.
  useEffect(() => {
    if (!profile.creativeGuardrails) {
      persist({
        ...profile,
        creativeGuardrails: defaultCreativeGuardrails(profile.interests),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const g: CreativeGuardrails =
    profile.creativeGuardrails ?? defaultCreativeGuardrails(profile.interests)

  const patchG = (next: Partial<CreativeGuardrails>) =>
    persist({ ...profile, creativeGuardrails: { ...g, ...next } })

  const addTheme = (v: string) => {
    if (!g.themes.includes(v)) patchG({ themes: [...g.themes, v] })
  }
  const removeTheme = (v: string) => patchG({ themes: g.themes.filter((t) => t !== v) })

  const toggleCanonCast = (id: string) => {
    const has = g.allowedCast.canonIds.includes(id)
    patchG({
      allowedCast: {
        ...g.allowedCast,
        canonIds: has
          ? g.allowedCast.canonIds.filter((x) => x !== id)
          : [...g.allowedCast.canonIds, id],
      },
    })
  }

  const setWildcardSlots = (n: number) => {
    const clamped = Math.max(0, Math.min(3, Math.floor(n)))
    patchG({ allowedCast: { ...g.allowedCast, wildcardSlots: clamped } })
  }

  const toggleCanonSetting = (name: string) => {
    const has = g.allowedSettings.canon.includes(name)
    patchG({
      allowedSettings: {
        ...g.allowedSettings,
        canon: has
          ? g.allowedSettings.canon.filter((x) => x !== name)
          : [...g.allowedSettings.canon, name],
      },
    })
  }

  const setAnywhere = (v: boolean) =>
    patchG({ allowedSettings: { ...g.allowedSettings, anywhereImaginary: v } })

  const setMaxPerDay = (n: number) => {
    const clamped = Math.max(1, Math.min(5, Math.floor(n)))
    patchG({ maxCreationsPerDay: clamped })
  }

  const setFormat = (which: 'quick' | 'chapter', v: boolean) => {
    patchG({ formats: { ...g.formats, [which]: v } })
  }

  return (
    <PCard
      title="Creative guardrails"
      description="Shape what Azad can ask for when he uses “Make a story with me.”"
    >
      <div style={{ font: '400 13px/1.55 var(--font-ui)', color: 'var(--lf-p-muted-foreground)', marginBottom: 20 }}>
        Little Fables asks Azad about his story idea before making anything. These settings shape what he can request. Anything outside the sandbox is redirected in-fiction — never refused — so the flow stays warm.
      </div>

      <div style={{ display: 'grid', gap: 20 }}>
        {/* Themes */}
        <div>
          <div style={{ font: '600 13.5px var(--font-ui)', marginBottom: 8 }}>Themes</div>
          <ChipList
            values={g.themes}
            onRemove={removeTheme}
            emptyHint="No themes yet — add a few he loves."
          />
          <ChipAdder placeholder="e.g. bees, brave together" onAdd={addTheme} />
        </div>

        {/* Cast — canon */}
        <div>
          <div style={{ font: '600 13.5px var(--font-ui)', marginBottom: 8 }}>Cast — canon</div>
          <div style={{ font: '400 12.5px/1.5 var(--font-ui)', color: 'var(--lf-p-muted-foreground)', marginBottom: 8 }}>
            Toggle a friend off to keep Azad from requesting them for a while.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {universe.characters.map((c) => {
              const on = g.allowedCast.canonIds.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCanonCast(c.id)}
                  aria-pressed={on}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 999,
                    font: '500 13px var(--font-ui)',
                    cursor: 'pointer',
                    border: '1px solid var(--lf-p-border)',
                    background: on ? 'var(--lf-p-background)' : 'var(--lf-p-muted)',
                    color: on ? 'var(--lf-p-foreground)' : 'var(--lf-p-muted-foreground)',
                    textDecoration: on ? 'none' : 'line-through',
                  }}
                >
                  <span aria-hidden>{c.emoji}</span>
                  {c.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Wildcard slots */}
        <div>
          <div style={{ font: '600 13.5px var(--font-ui)', marginBottom: 4 }}>Wildcard slots</div>
          <div style={{ font: '400 12.5px/1.5 var(--font-ui)', color: 'var(--lf-p-muted-foreground)', marginBottom: 8 }}>
            How many new characters can Azad invent per story? (0–3)
          </div>
          <PInput
            type="number"
            min={0}
            max={3}
            value={g.allowedCast.wildcardSlots}
            onChange={(e) => setWildcardSlots(Number(e.target.value))}
            style={{ width: 90 }}
          />
        </div>

        {/* Settings */}
        <div>
          <div style={{ font: '600 13.5px var(--font-ui)', marginBottom: 8 }}>Settings</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {universe.settings.map((s) => {
              const on = g.allowedSettings.canon.includes(s.name)
              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => toggleCanonSetting(s.name)}
                  aria-pressed={on}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 999,
                    font: '500 13px var(--font-ui)',
                    cursor: 'pointer',
                    border: '1px solid var(--lf-p-border)',
                    background: on ? 'var(--lf-p-background)' : 'var(--lf-p-muted)',
                    color: on ? 'var(--lf-p-foreground)' : 'var(--lf-p-muted-foreground)',
                    textDecoration: on ? 'none' : 'line-through',
                  }}
                >
                  {s.name}
                </button>
              )
            })}
          </div>
          <ToggleRow
            label="Anywhere imaginary — Azad can invent a brand-new place"
            checked={g.allowedSettings.anywhereImaginary}
            onChange={setAnywhere}
          />
        </div>

        {/* Max creations per day */}
        <div>
          <div style={{ font: '600 13.5px var(--font-ui)', marginBottom: 4 }}>Max creations per day</div>
          <div style={{ font: '400 12.5px/1.5 var(--font-ui)', color: 'var(--lf-p-muted-foreground)', marginBottom: 8 }}>
            After this many, the buddy suggests a favorite already on the shelf. (1–5)
          </div>
          <PInput
            type="number"
            min={1}
            max={5}
            value={g.maxCreationsPerDay}
            onChange={(e) => setMaxPerDay(Number(e.target.value))}
            style={{ width: 90 }}
          />
        </div>

        {/* Formats */}
        <div>
          <div style={{ font: '600 13.5px var(--font-ui)', marginBottom: 8 }}>Formats</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <ToggleRow
              label="Quick stories"
              checked={g.formats.quick}
              onChange={(v) => setFormat('quick', v)}
            />
            <ToggleRow
              label="Chapter books"
              checked={g.formats.chapter}
              onChange={(v) => setFormat('chapter', v)}
            />
          </div>
        </div>

        {/* Unlocked wildcards — read-only */}
        <div>
          <div style={{ font: '600 13.5px var(--font-ui)', marginBottom: 8 }}>Unlocked wildcards</div>
          {wildcards.length === 0 ? (
            <div style={{ font: '400 12.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
              No wildcards yet — they appear here once Azad invents a new character in a story that ships.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {wildcards.map((w) => (
                <div
                  key={w.id}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 8,
                    font: '400 13px var(--font-ui)',
                    color: 'var(--lf-p-foreground)',
                  }}
                >
                  <span style={{ font: '600 13px var(--font-ui)' }}>{w.name}</span>
                  {w.species && (
                    <span style={{ color: 'var(--lf-p-muted-foreground)' }}>({w.species})</span>
                  )}
                  <span style={{ color: 'var(--lf-p-muted-foreground)', marginLeft: 'auto' }}>
                    from book {w.originBookId.slice(0, 8)} · {new Date(w.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PCard>
  )
}

// ---------- Made by Azad tab (PRD R24) ----------
// Kid-created books, newest first, with recipe expander + interview transcript.
// Archive is soft — books stay in loadStories() but drop off the shelf.

async function fetchInterviewAudioURL(audioRef: string): Promise<string | null> {
  // Best-effort: kid-interview audio blobs (if any) are stored in a separate
  // IndexedDB by the story kitchen agent. We try a few likely store names —
  // if none exist we return null and the UI hides the play button.
  if (typeof window === 'undefined' || !audioRef) return null
  const candidates = [
    { db: 'azad-read', store: 'interview-audio' },
    { db: 'azad-read', store: 'kid-interview-audio' },
    { db: 'lf-interview', store: 'audio' },
  ]
  for (const { db, store } of candidates) {
    try {
      const url = await new Promise<string | null>((resolve) => {
        const req = indexedDB.open(db)
        req.onsuccess = () => {
          const database = req.result
          if (!database.objectStoreNames.contains(store)) {
            database.close()
            resolve(null)
            return
          }
          try {
            const tx = database.transaction(store, 'readonly')
            const get = tx.objectStore(store).get(audioRef)
            get.onsuccess = () => {
              const result = get.result as { blob?: Blob } | Blob | undefined
              const blob = result instanceof Blob ? result : result?.blob
              database.close()
              resolve(blob ? URL.createObjectURL(blob) : null)
            }
            get.onerror = () => {
              database.close()
              resolve(null)
            }
          } catch {
            database.close()
            resolve(null)
          }
        }
        req.onerror = () => resolve(null)
      })
      if (url) return url
    } catch {
      /* keep trying */
    }
  }
  return null
}

function InterviewAnswerRow({ qa }: { qa: KidInterviewAnswer }) {
  const [url, setUrl] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const audioEl = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    let cancelled = false
    let created: string | null = null
    if (qa.audioRef) {
      void fetchInterviewAudioURL(qa.audioRef).then((u) => {
        if (cancelled) return
        created = u
        setUrl(u)
      })
    }
    return () => {
      cancelled = true
      if (created) URL.revokeObjectURL(created)
    }
  }, [qa.audioRef])

  const toggle = () => {
    const a = audioEl.current
    if (!a) return
    if (playing) a.pause()
    else void a.play()
  }

  return (
    <div
      style={{
        padding: '10px 0',
        borderTop: '1px solid var(--lf-p-border)',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: '500 13px/1.4 var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
          {qa.question}
        </div>
        <div style={{ font: '400 13.5px/1.5 var(--font-ui)', color: 'var(--lf-p-foreground)', marginTop: 4 }}>
          {qa.answer || <span style={{ color: 'var(--lf-p-muted-foreground)' }}>(no answer captured)</span>}
        </div>
      </div>
      {url && (
        <>
          <audio
            ref={audioEl}
            src={url}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          />
          <button
            type="button"
            aria-label={playing ? 'Pause answer audio' : 'Play answer audio'}
            onClick={toggle}
            className="lf-press"
            style={{
              width: 30,
              height: 30,
              borderRadius: 999,
              border: '1px solid var(--lf-p-border)',
              background: playing ? 'var(--lf-p-primary)' : 'var(--lf-p-background)',
              color: playing ? 'var(--lf-p-primary-foreground)' : 'var(--lf-p-foreground)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {playing ? <Pause size={12} /> : <Play size={12} style={{ marginLeft: 1 }} />}
          </button>
        </>
      )}
    </div>
  )
}

function MadeByAzadRow({
  book,
  archived,
  onArchive,
  onUnarchive,
}: {
  book: Book
  archived: boolean
  onArchive: () => void
  onUnarchive: () => void
}) {
  const [open, setOpen] = useState(false)
  const [qaOpen, setQaOpen] = useState(false)
  const [kept, setKept] = useState(false)

  const hasCover = !!book.coverImage
  const created = new Date(book.createdAt).toLocaleDateString()

  return (
    <div style={{ padding: '11px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
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
            <span aria-hidden>✦</span> Made by Azad · created {created}
          </div>
        </div>
        <QaBadge book={book} open={qaOpen} onToggle={() => setQaOpen((v) => !v)} />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="lf-press"
          style={{
            font: '500 12.5px var(--font-ui)',
            color: 'var(--lf-p-foreground)',
            background: 'var(--lf-p-background)',
            border: '1px solid var(--lf-p-border)',
            borderRadius: 'var(--radius-p-md)',
            padding: '5px 10px',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {open ? 'Hide recipe' : 'View recipe'}
        </button>
        {archived ? (
          <button
            type="button"
            onClick={onUnarchive}
            className="lf-press"
            style={{
              font: '500 12.5px var(--font-ui)',
              color: 'var(--lf-p-muted-foreground)',
              background: 'transparent',
              border: '1px solid var(--lf-p-border)',
              borderRadius: 'var(--radius-p-md)',
              padding: '5px 10px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Unarchive
          </button>
        ) : (
          <button
            type="button"
            onClick={onArchive}
            className="lf-press"
            style={{
              font: '500 12.5px var(--font-ui)',
              color: 'var(--lf-p-muted-foreground)',
              background: 'transparent',
              border: '1px solid var(--lf-p-border)',
              borderRadius: 'var(--radius-p-md)',
              padding: '5px 10px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Archive
          </button>
        )}
        {!archived && (
          <button
            type="button"
            onClick={() => setKept(true)}
            className="lf-press"
            aria-pressed={kept}
            style={{
              font: '500 12.5px var(--font-ui)',
              color: kept ? 'var(--lf-p-foreground)' : 'var(--lf-p-muted-foreground)',
              background: kept ? '#fefce8' : 'transparent',
              border: kept ? '1px solid #fde68a' : '1px solid var(--lf-p-border)',
              borderRadius: 'var(--radius-p-md)',
              padding: '5px 10px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {kept ? 'Kept forever' : 'Keep forever'}
          </button>
        )}
      </div>

      {qaOpen && book.qaRecord && (
        <div
          style={{
            marginTop: 10,
            marginLeft: 58,
            padding: 12,
            background: 'var(--lf-p-muted)',
            border: '1px solid var(--lf-p-border)',
            borderRadius: 'var(--radius-p-md)',
            font: '400 12.5px/1.5 var(--font-ui)',
            color: 'var(--lf-p-foreground)',
          }}
        >
          <div style={{ font: '600 12.5px var(--font-ui)', marginBottom: 6 }}>QA breakdown</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 12px' }}>
            <span>Hard gates</span>
            <span style={{ color: book.qaRecord.hardGates.passed ? '#15803d' : '#b91c1c' }}>
              {book.qaRecord.hardGates.passed ? 'passed' : 'failed'}
            </span>
            <span>Soft score</span>
            <span>{book.qaRecord.softScore}/100</span>
            <span>Revisions</span>
            <span>{book.qaRecord.revisions}</span>
          </div>
        </div>
      )}

      {open && (
        <div
          style={{
            marginTop: 12,
            marginLeft: 58,
            padding: 14,
            background: 'var(--lf-p-muted)',
            border: '1px solid var(--lf-p-border)',
            borderRadius: 'var(--radius-p-md)',
          }}
        >
          <div style={{ font: '600 13px var(--font-ui)', marginBottom: 8 }}>Recipe</div>
          {book.interview?.recipe ? (
            <ul style={{ margin: '0 0 12px', paddingLeft: 18, font: '400 13px/1.55 var(--font-ui)' }}>
              {book.interview.recipe.want && <li><strong>Want:</strong> {book.interview.recipe.want}</li>}
              {book.interview.recipe.reason && <li><strong>Reason:</strong> {book.interview.recipe.reason}</li>}
              {book.interview.recipe.obstacle && <li><strong>Obstacle:</strong> {book.interview.recipe.obstacle}</li>}
              {book.interview.recipe.extras?.map((x, i) => (
                <li key={i}>
                  <strong style={{ textTransform: 'capitalize' }}>{x.slot}:</strong> {x.value}
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ font: '400 13px var(--font-ui)', color: 'var(--lf-p-muted-foreground)', marginBottom: 12 }}>
              No recipe was captured for this story.
            </div>
          )}

          <div style={{ font: '600 13px var(--font-ui)', marginBottom: 4 }}>Interview</div>
          {book.interview?.answers?.length ? (
            <div>
              {book.interview.answers.map((qa, i) => (
                <InterviewAnswerRow key={i} qa={qa} />
              ))}
            </div>
          ) : (
            <div style={{ font: '400 13px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
              No interview transcript recorded.
            </div>
          )}
          {book.interview?.readBack && (
            <div
              style={{
                marginTop: 12,
                padding: 10,
                borderRadius: 'var(--radius-p-md)',
                background: 'var(--lf-p-background)',
                border: '1px solid var(--lf-p-border)',
                font: '400 13px/1.5 var(--font-ui)',
                color: 'var(--lf-p-foreground)',
              }}
            >
              <span style={{ color: 'var(--lf-p-muted-foreground)' }}>Read-back:</span> {book.interview.readBack}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MadeByAzadTab({
  books,
  childName,
  refresh,
}: {
  books: Book[]
  childName: string
  refresh: () => void
}) {
  const [archivedIds, setArchivedIds] = useState<string[]>([])

  useEffect(() => {
    setArchivedIds(loadArchived())
  }, [books])

  const kidBooks = useMemo(
    () => books.filter((b) => b.author === 'azad').sort((a, b) => b.createdAt - a.createdAt),
    [books],
  )

  const active = kidBooks.filter((b) => !archivedIds.includes(b.id))
  const archived = kidBooks.filter((b) => archivedIds.includes(b.id))

  const handleArchive = (id: string) => {
    archiveBook(id)
    setArchivedIds(loadArchived())
    refresh()
  }
  const handleUnarchive = (id: string) => {
    unarchiveBook(id)
    setArchivedIds(loadArchived())
    refresh()
  }

  return (
    <div>
      <p style={{ margin: '0 0 14px', font: '400 13.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
        Books {childName} drove himself in the story kitchen. The recipe and interview live here so you can read what he was reaching for.
      </p>
      <PCard padded={false}>
        {kidBooks.length === 0 ? (
          <div
            style={{
              padding: 24,
              font: '400 14px/1.5 var(--font-ui)',
              color: 'var(--lf-p-muted-foreground)',
            }}
          >
            No stories yet from {childName}. When he uses &ldquo;Make a story with me&rdquo; the recipe and interview show up here.
          </div>
        ) : (
          <div style={{ padding: '0 18px' }}>
            {active.map((b, i) => (
              <div key={b.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--lf-p-border)' }}>
                <MadeByAzadRow
                  book={b}
                  archived={false}
                  onArchive={() => handleArchive(b.id)}
                  onUnarchive={() => handleUnarchive(b.id)}
                />
              </div>
            ))}
          </div>
        )}
      </PCard>

      {archived.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <div style={{ font: '600 13.5px var(--font-ui)', marginBottom: 8, color: 'var(--lf-p-muted-foreground)' }}>
            Archived
          </div>
          <PCard padded={false}>
            <div style={{ padding: '0 18px' }}>
              {archived.map((b, i) => (
                <div key={b.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--lf-p-border)' }}>
                  <MadeByAzadRow
                    book={b}
                    archived={true}
                    onArchive={() => handleArchive(b.id)}
                    onUnarchive={() => handleUnarchive(b.id)}
                  />
                </div>
              ))}
            </div>
          </PCard>
        </div>
      )}
    </div>
  )
}

// ---------- Art tab (v3.3 art pipeline review surface) ----------
// The three art scripts (art-characters / art-director / art-generate) drop
// pending candidates into public/art-preview/. Parents approve or reject
// each candidate here; approvals move the file into approved/ and (for
// scenes) patch the pack JSON so the reader picks up the new img.

import charactersJson from '@/content/art/characters.json'
import { PACK_BOOKS } from '@/lib/read/packs'

type ArtCharacterMeta = {
  id: string
  name: string
  emoji?: string
  role?: string
}

type SheetManifestRow = {
  characterId: string
  name: string
  role: string
  pending: string[]
  approved: string[]
}

type ScenePageRow = {
  chapterIdx: number
  pageIdx: number
  pending: string[]
  approved: string[]
}

type SceneManifest = {
  bookId: string
  pages: ScenePageRow[]
}

const ART_CHARACTERS: ArtCharacterMeta[] =
  ((charactersJson as { characters?: ArtCharacterMeta[] }).characters ?? [])

function ArtThumb({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      style={{
        width: '100%',
        aspectRatio: '1 / 1',
        objectFit: 'cover',
        borderRadius: 'var(--radius-p-md)',
        border: '1px solid var(--lf-p-border)',
        background: 'var(--lf-p-muted)',
        display: 'block',
      }}
    />
  )
}

function CandidateGrid({
  urls,
  actions,
}: {
  urls: string[]
  actions?: (url: string) => React.ReactNode
}) {
  if (!urls.length) return null
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 12,
      }}
    >
      {urls.map((u) => (
        <div key={u} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <ArtThumb src={u} alt="" />
          {actions ? (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{actions(u)}</div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

// Convert an /art-preview/... URL back to the relative path the approve/reject
// endpoints expect ("sheets/char_azi/pending/candidate-XYZ.png").
function urlToTargetPath(url: string): string {
  const prefix = '/art-preview/'
  return url.startsWith(prefix) ? url.slice(prefix.length) : url
}

function CharacterDrawer({
  row,
  onClose,
  onChanged,
}: {
  row: SheetManifestRow
  onClose: () => void
  onChanged: () => void
}) {
  const [busy, setBusy] = useState<string | null>(null)
  const character = ART_CHARACTERS.find((c) => c.id === row.characterId)

  const approve = async (url: string) => {
    setBusy(url)
    try {
      const res = await fetch('/api/art/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'sheet', targetPath: urlToTargetPath(url) }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        alert(`Approve failed: ${j.error ?? res.statusText}`)
      } else {
        onChanged()
      }
    } finally {
      setBusy(null)
    }
  }

  const reject = async (url: string) => {
    setBusy(url)
    try {
      const res = await fetch('/api/art/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPath: urlToTargetPath(url) }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        alert(`Reject failed: ${j.error ?? res.statusText}`)
      } else {
        onChanged()
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 15, 15, 0.4)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(560px, 100%)',
          background: 'var(--lf-p-background)',
          borderLeft: '1px solid var(--lf-p-border)',
          padding: '24px 22px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ font: '600 17px var(--font-ui)' }}>
              {character?.emoji ? <span aria-hidden style={{ marginRight: 6 }}>{character.emoji}</span> : null}
              {row.name}
            </div>
            {row.role && (
              <div style={{ font: '400 13px/1.4 var(--font-ui)', color: 'var(--lf-p-muted-foreground)', marginTop: 3 }}>
                {row.role}
              </div>
            )}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              border: '1px solid var(--lf-p-border)',
              background: 'transparent',
              borderRadius: 'var(--radius-p-md)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--lf-p-muted-foreground)',
            }}
          >
            <X size={14} />
          </button>
        </div>

        <div>
          <div style={{ font: '600 13.5px var(--font-ui)', marginBottom: 8 }}>
            Approved references ({row.approved.length})
          </div>
          {row.approved.length ? (
            <CandidateGrid urls={row.approved} />
          ) : (
            <div style={{ font: '400 13px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
              No approved reference sheets yet.
            </div>
          )}
        </div>

        <div>
          <div style={{ font: '600 13.5px var(--font-ui)', marginBottom: 8 }}>
            Pending candidates ({row.pending.length})
          </div>
          {row.pending.length ? (
            <CandidateGrid
              urls={row.pending}
              actions={(u) => (
                <>
                  <PButton size="sm" onClick={() => void approve(u)} disabled={busy === u}>
                    <Check size={12} /> Approve
                  </PButton>
                  <PButton size="sm" variant="secondary" onClick={() => void reject(u)} disabled={busy === u}>
                    <X size={12} /> Reject
                  </PButton>
                </>
              )}
            />
          ) : (
            <div
              style={{
                font: '400 13px/1.5 var(--font-ui)',
                color: 'var(--lf-p-muted-foreground)',
                padding: 12,
                background: 'var(--lf-p-muted)',
                borderRadius: 'var(--radius-p-md)',
                border: '1px dashed var(--lf-p-border)',
              }}
            >
              No candidates queued. Run <code>npm run art:characters -- --char {row.characterId}</code> locally to generate some.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SceneDrawer({
  book,
  manifest,
  onClose,
  onChanged,
}: {
  book: Book
  manifest: SceneManifest | null
  onClose: () => void
  onChanged: () => void
}) {
  const [busy, setBusy] = useState<string | null>(null)

  // Build the full page list from the book so we show "no art yet" rows too.
  const rows = useMemo(() => {
    const byKey = new Map<string, ScenePageRow>()
    for (const r of manifest?.pages ?? []) {
      byKey.set(`${r.chapterIdx}-${r.pageIdx}`, r)
    }
    const out: ScenePageRow[] = []
    book.chapters.forEach((ch, ci) => {
      ch.pages.forEach((_p, pi) => {
        const key = `${ci}-${pi}`
        out.push(byKey.get(key) ?? { chapterIdx: ci, pageIdx: pi, pending: [], approved: [] })
      })
    })
    return out
  }, [book, manifest])

  const approve = async (row: ScenePageRow, url: string) => {
    setBusy(url)
    try {
      const res = await fetch('/api/art/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'scene',
          targetPath: urlToTargetPath(url),
          bookId: book.id,
          chapterIdx: row.chapterIdx,
          pageIdx: row.pageIdx,
        }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        alert(`Approve failed: ${j.error ?? res.statusText}`)
      } else {
        onChanged()
      }
    } finally {
      setBusy(null)
    }
  }

  const reject = async (url: string) => {
    setBusy(url)
    try {
      const res = await fetch('/api/art/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPath: urlToTargetPath(url) }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        alert(`Reject failed: ${j.error ?? res.statusText}`)
      } else {
        onChanged()
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 15, 15, 0.4)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(680px, 100%)',
          background: 'var(--lf-p-background)',
          borderLeft: '1px solid var(--lf-p-border)',
          padding: '24px 22px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ font: '600 17px var(--font-ui)' }}>{book.title}</div>
            <div style={{ font: '400 13px/1.4 var(--font-ui)', color: 'var(--lf-p-muted-foreground)', marginTop: 3 }}>
              {rows.filter((r) => r.approved.length).length} of {rows.length} pages illustrated
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              border: '1px solid var(--lf-p-border)',
              background: 'transparent',
              borderRadius: 'var(--radius-p-md)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--lf-p-muted-foreground)',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {manifest === null ? (
          <div style={{ font: '400 13px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
            Loading…
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {rows.map((r) => {
              const key = `${r.chapterIdx}-${r.pageIdx}`
              const label = book.kind === 'chapter'
                ? `Ch ${r.chapterIdx + 1} · page ${r.pageIdx + 1}`
                : `Page ${r.pageIdx + 1}`
              return (
                <div
                  key={key}
                  style={{
                    padding: 12,
                    border: '1px solid var(--lf-p-border)',
                    borderRadius: 'var(--radius-p-md)',
                    background: 'var(--lf-p-background)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ font: '600 13px var(--font-ui)' }}>{label}</div>
                    <div style={{ marginLeft: 'auto', font: '400 12px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
                      {r.approved.length
                        ? 'approved'
                        : r.pending.length
                          ? `pending: ${r.pending.length}`
                          : 'no art yet'}
                    </div>
                  </div>
                  {r.approved.length > 0 && (
                    <div style={{ width: 120 }}>
                      <ArtThumb src={r.approved[0]} alt="" />
                    </div>
                  )}
                  {r.pending.length > 0 && (
                    <CandidateGrid
                      urls={r.pending}
                      actions={(u) => (
                        <>
                          <PButton size="sm" onClick={() => void approve(r, u)} disabled={busy === u}>
                            <Check size={12} /> Approve
                          </PButton>
                          <PButton size="sm" variant="secondary" onClick={() => void reject(u)} disabled={busy === u}>
                            <X size={12} /> Reject
                          </PButton>
                        </>
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function ArtCharactersSubTab() {
  const [rows, setRows] = useState<SheetManifestRow[] | null>(null)
  const [open, setOpen] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      const res = await fetch('/api/art/list?kind=sheets', { cache: 'no-store' })
      if (!res.ok) throw new Error(res.statusText)
      const data = (await res.json()) as SheetManifestRow[]
      setRows(data)
    } catch {
      setRows([])
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  if (rows === null) {
    return (
      <div style={{ font: '400 13.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
        Loading characters…
      </div>
    )
  }

  const activeRow = open ? rows.find((r) => r.characterId === open) ?? null : null

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        {rows.map((r) => {
          const character = ART_CHARACTERS.find((c) => c.id === r.characterId)
          const approvedCount = r.approved.length
          const pendingCount = r.pending.length
          return (
            <button
              key={r.characterId}
              type="button"
              onClick={() => setOpen(r.characterId)}
              className="lf-press"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 6,
                textAlign: 'left',
                padding: 16,
                background: 'var(--lf-p-card)',
                border: '1px solid var(--lf-p-border)',
                borderRadius: 'var(--radius-p-card)',
                cursor: 'pointer',
                color: 'var(--lf-p-foreground)',
                font: 'inherit',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {character?.emoji && <span aria-hidden style={{ fontSize: 20 }}>{character.emoji}</span>}
                <div style={{ font: '600 14.5px var(--font-ui)' }}>{r.name}</div>
              </div>
              {r.role && (
                <div
                  style={{
                    font: '400 12.5px/1.4 var(--font-ui)',
                    color: 'var(--lf-p-muted-foreground)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {r.role}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: 999,
                    font: '500 11.5px var(--font-ui)',
                    background: approvedCount > 0 ? '#f0fdf4' : 'var(--lf-p-muted)',
                    color: approvedCount > 0 ? '#15803d' : 'var(--lf-p-muted-foreground)',
                    border: `1px solid ${approvedCount > 0 ? '#bbf7d0' : 'var(--lf-p-border)'}`,
                  }}
                >
                  {approvedCount} approved
                </span>
                {pendingCount > 0 && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 8px',
                      borderRadius: 999,
                      font: '500 11.5px var(--font-ui)',
                      background: '#fef3c7',
                      color: '#92400e',
                      border: '1px solid #fde68a',
                    }}
                  >
                    {pendingCount} pending
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
      {activeRow && (
        <CharacterDrawer
          row={activeRow}
          onClose={() => setOpen(null)}
          onChanged={() => {
            void reload()
          }}
        />
      )}
    </div>
  )
}

function ArtScenesSubTab() {
  const books = useMemo(() => PACK_BOOKS.slice(), [])
  const [manifests, setManifests] = useState<Record<string, SceneManifest>>({})
  const [open, setOpen] = useState<string | null>(null)
  const [loadingBook, setLoadingBook] = useState<string | null>(null)

  const totals = useMemo(() => {
    const t: Record<string, number> = {}
    for (const b of books) {
      let n = 0
      for (const ch of b.chapters) n += ch.pages.length
      t[b.id] = n
    }
    return t
  }, [books])

  const reloadAll = useCallback(async () => {
    // Fan out — one manifest per book, tolerated failures.
    const results = await Promise.all(
      books.map(async (b) => {
        try {
          const res = await fetch(`/api/art/list?kind=scenes&book=${encodeURIComponent(b.id)}`, {
            cache: 'no-store',
          })
          if (!res.ok) return [b.id, null] as const
          const data = (await res.json()) as SceneManifest
          return [b.id, data] as const
        } catch {
          return [b.id, null] as const
        }
      }),
    )
    const next: Record<string, SceneManifest> = {}
    for (const [id, m] of results) {
      if (m) next[id] = m
    }
    setManifests(next)
  }, [books])

  useEffect(() => {
    void reloadAll()
  }, [reloadAll])

  const reloadOne = async (bookId: string) => {
    setLoadingBook(bookId)
    try {
      const res = await fetch(`/api/art/list?kind=scenes&book=${encodeURIComponent(bookId)}`, {
        cache: 'no-store',
      })
      if (res.ok) {
        const data = (await res.json()) as SceneManifest
        setManifests((prev) => ({ ...prev, [bookId]: data }))
      }
    } finally {
      setLoadingBook(null)
    }
  }

  const activeBook = open ? books.find((b) => b.id === open) ?? null : null

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 12,
        }}
      >
        {books.map((b) => {
          const m = manifests[b.id]
          const approved = m?.pages.filter((p) => p.approved.length).length ?? 0
          const pending = m?.pages.reduce((sum, p) => sum + p.pending.length, 0) ?? 0
          const total = totals[b.id] ?? 0
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setOpen(b.id)}
              className="lf-press"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 6,
                textAlign: 'left',
                padding: 16,
                background: 'var(--lf-p-card)',
                border: '1px solid var(--lf-p-border)',
                borderRadius: 'var(--radius-p-card)',
                cursor: 'pointer',
                color: 'var(--lf-p-foreground)',
                font: 'inherit',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {b.coverEmoji && <span aria-hidden style={{ fontSize: 20 }}>{b.coverEmoji}</span>}
                <div style={{ font: '600 14.5px var(--font-ui)' }}>{b.title}</div>
              </div>
              {b.by && (
                <div style={{ font: '400 12.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
                  {b.by}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: 999,
                    font: '500 11.5px var(--font-ui)',
                    background: approved === total && total > 0 ? '#f0fdf4' : 'var(--lf-p-muted)',
                    color: approved === total && total > 0 ? '#15803d' : 'var(--lf-p-muted-foreground)',
                    border: `1px solid ${approved === total && total > 0 ? '#bbf7d0' : 'var(--lf-p-border)'}`,
                  }}
                >
                  {approved}/{total} illustrated
                </span>
                {pending > 0 && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 8px',
                      borderRadius: 999,
                      font: '500 11.5px var(--font-ui)',
                      background: '#fef3c7',
                      color: '#92400e',
                      border: '1px solid #fde68a',
                    }}
                  >
                    {pending} pending
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
      {activeBook && (
        <SceneDrawer
          book={activeBook}
          manifest={manifests[activeBook.id] ?? null}
          onClose={() => setOpen(null)}
          onChanged={() => {
            void reloadOne(activeBook.id)
          }}
        />
      )}
      {loadingBook && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, font: '400 12px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
          Refreshing {loadingBook}…
        </div>
      )}
    </div>
  )
}

function ArtTab() {
  const [sub, setSub] = useState<'characters' | 'scenes'>('characters')
  const subs: Array<[typeof sub, string]> = [
    ['characters', 'Characters'],
    ['scenes', 'Scenes'],
  ]
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <p style={{ margin: 0, font: '400 13.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
          Review the art queue. Approve to publish; reject to skip. Dev-only — production builds cannot write.
        </p>
        <div
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            padding: 3,
            background: 'var(--lf-p-background)',
            border: '1px solid var(--lf-p-border)',
            borderRadius: 999,
            gap: 2,
          }}
        >
          {subs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSub(id)}
              style={{
                border: 'none',
                cursor: 'pointer',
                padding: '6px 14px',
                borderRadius: 999,
                background: sub === id ? 'var(--lf-p-muted)' : 'transparent',
                font: '500 13px var(--font-ui)',
                color: sub === id ? 'var(--lf-p-foreground)' : 'var(--lf-p-muted-foreground)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {sub === 'characters' ? <ArtCharactersSubTab /> : <ArtScenesSubTab />}
    </div>
  )
}

// ---------- Parent Corner ----------
function ParentCorner() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'profile' | 'stories' | 'made-by-azad' | 'art' | 'retells' | 'universe'>('profile')
  const [universe, setUniverse] = useState<Universe | null>(null)
  const [profile, setProfile] = useState<ChildProfile>(DEFAULT_PROFILE)
  const [retells, setRetells] = useState<Retell[]>([])
  const [books, setBooks] = useState<Book[]>([])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (user) await pullAll()
      if (cancelled) return
      setUniverse(loadUniverse())
      setProfile(loadProfile())
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

  const persistProfile = useCallback((next: ChildProfile) => {
    setProfile(next)
    saveProfile(next)
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
    ['profile', 'Profile'],
    ['stories', 'Stories'],
    ['made-by-azad', `Made by ${universe.childName}`],
    ['art', 'Art'],
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

        {tab === 'made-by-azad' && (
          <MadeByAzadTab
            books={books}
            childName={universe.childName}
            refresh={() => setBooks(loadStories())}
          />
        )}

        {tab === 'art' && <ArtTab />}

        {tab === 'universe' && <UniverseTab universe={universe} persist={persistUniverse} />}

        {tab === 'profile' && <ProfileTab profile={profile} persist={persistProfile} />}
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
