'use client'

// Grown-ups — math gate + Parent Corner. shadcn neutrals, Inter font, quiet and
// plain (no emoji, no exclamation points; separate from the kid world).
// Parents CREATE the library here: stories, recordings, and Azad's universe.

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronLeft,
  Pause,
  Pencil,
  Play,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { STARTER_STORIES } from '@/lib/read/starter-stories'
import {
  deleteRetell,
  listRetells,
  loadStories,
  type Retell,
} from '@/lib/read/storage'
import {
  loadUniverse,
  saveUniverse,
  type Universe,
} from '@/lib/universe/azad-verse'
import { useAuth } from '@/lib/auth/AuthProvider'
import {
  deleteRetellRemote,
  isSignedIn,
  pullAll,
  pushUniverse,
  sendMagicLink,
  signOut,
} from '@/lib/read/sync'
import type { Story } from '@/types/story'

const GATE_MIN_A = 3, GATE_MAX_A = 8
const GATE_MIN_B = 4, GATE_MAX_B = 8

function pickAB(): [number, number] {
  return [
    GATE_MIN_A + Math.floor(Math.random() * (GATE_MAX_A - GATE_MIN_A + 1)),
    GATE_MIN_B + Math.floor(Math.random() * (GATE_MAX_B - GATE_MIN_B + 1)),
  ]
}

function buildAnswers(product: number): number[] {
  // The right answer + two plausible near-misses (±2, ±3, or an off-by-a-column).
  const distractors = new Set<number>()
  const candidates = [product - 2, product - 3, product + 2, product + 3, product - 10, product + 10]
  for (const n of candidates) {
    if (n > 0 && n !== product) distractors.add(n)
    if (distractors.size >= 4) break
  }
  const picks = Array.from(distractors)
  const two = [picks[Math.floor(Math.random() * picks.length)]]
  do {
    const next = picks[Math.floor(Math.random() * picks.length)]
    if (!two.includes(next)) two.push(next)
  } while (two.length < 2)
  const all = [product, ...two.slice(0, 2)]
  // shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[all[i], all[j]] = [all[j], all[i]]
  }
  return all
}

const TEACHING_OPTIONS = [
  'counting to 10',
  'belly breaths',
  'being grateful',
  'trying again',
  'kindness',
  'letter sounds',
  'patterns',
  'family words',
]

const fmtDur = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`

const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  border: '1px solid var(--lf-p-border)',
  background: 'var(--lf-p-background)',
  borderRadius: 999,
  padding: '6px 12px',
  font: '500 13px var(--font-ui)',
  color: 'var(--lf-p-foreground)',
}

// ---------- Gate ----------
function Gate({ onPass }: { onPass: () => void }) {
  const [ab] = useState(pickAB)
  const [answers] = useState(() => buildAnswers(ab[0] * ab[1]))
  const [wrong, setWrong] = useState(false)
  const shakeKey = useRef(0)

  const pick = (n: number) => {
    if (n === ab[0] * ab[1]) {
      onPass()
      return
    }
    shakeKey.current += 1
    setWrong(true)
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
          <ChevronLeft size={16} /> Back to Story World
        </Link>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px 90px' }}>
        <div key={shakeKey.current} className={wrong ? 'sw-shake' : ''} style={{ width: 400, maxWidth: '100%' }}>
          <PCard title="Grown-ups only" description="Solve to open the parent corner.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ font: '600 32px/1.2 var(--font-ui)', letterSpacing: '-0.02em' }}>
                {ab[0]} × {ab[1]} =
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {answers.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => pick(n)}
                    className="lf-press"
                    style={{
                      background: 'var(--lf-p-background)',
                      border: '1px solid var(--lf-p-border)',
                      borderRadius: 'var(--radius-p-md)',
                      padding: '0 16px',
                      height: 48,
                      fontSize: 16,
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

// ---------- Reusable parent-surface primitives ----------
function PCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: 'var(--lf-p-card)',
        border: '1px solid var(--lf-p-border)',
        borderRadius: 'var(--radius-p-card)',
        padding: 24,
      }}
    >
      <div style={{ font: '600 16px/1.3 var(--font-ui)', color: 'var(--lf-p-foreground)' }}>{title}</div>
      {description && (
        <div style={{ font: '400 13.5px/1.5 var(--font-ui)', color: 'var(--lf-p-muted-foreground)', marginTop: 4 }}>
          {description}
        </div>
      )}
      <div style={{ marginTop: 18 }}>{children}</div>
    </div>
  )
}

function PButton({
  children,
  onClick,
  variant = 'primary',
  as,
  href,
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  as?: 'link'
  href?: string
  disabled?: boolean
}) {
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    height: 36,
    padding: '0 14px',
    borderRadius: 'var(--radius-p-md)',
    font: '500 14px var(--font-ui)',
    cursor: disabled ? 'default' : 'pointer',
    textDecoration: 'none',
    opacity: disabled ? 0.5 : 1,
    ...(variant === 'primary'
      ? { background: 'var(--lf-p-primary)', color: 'var(--lf-p-primary-foreground)', border: '1px solid var(--lf-p-primary)' }
      : variant === 'secondary'
        ? { background: 'var(--lf-p-background)', color: 'var(--lf-p-foreground)', border: '1px solid var(--lf-p-border)' }
        : { background: 'transparent', color: 'var(--lf-p-muted-foreground)', border: 'none', padding: '0 8px' }),
  }
  if (as === 'link' && href) return <Link href={href} style={style} className="lf-press">{children}</Link>
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={style} className="lf-press">
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

// ---------- Recording row (real audio) ----------
function RecordingRow({
  rec,
  onDelete,
}: {
  rec: Retell
  onDelete: () => void
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [pos, setPos] = useState(0)
  const [dur, setDur] = useState(0)

  useEffect(() => {
    urlRef.current = URL.createObjectURL(rec.blob)
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [rec.blob])

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) a.pause()
    else void a.play()
  }

  const progress = dur > 0 ? Math.min(100, (pos / dur) * 100) : 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0' }}>
      <audio
        ref={audioRef}
        src={urlRef.current ?? undefined}
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
        aria-label={playing ? `Pause ${rec.storyTitle}` : `Play ${rec.storyTitle}`}
        onClick={toggle}
        className="lf-press"
        style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
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
        <div style={{ font: '500 14px/1.4 var(--font-ui)' }}>{rec.storyTitle}</div>
        <div style={{ font: '400 12.5px/1.4 var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
          {new Date(rec.createdAt).toLocaleDateString()} · {dur > 0 ? fmtDur(dur) : '…'} · retell
        </div>
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
      <span style={{ font: '400 12.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)', flexShrink: 0, width: 40, textAlign: 'right' }}>
        {playing ? fmtDur(pos) : dur > 0 ? fmtDur(dur) : ''}
      </span>
      <button
        type="button"
        aria-label={`Delete recording of ${rec.storyTitle}`}
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

// ---------- Story row ----------
function StoryRow({ s, onDelete }: { s: Story; onDelete?: () => void }) {
  const draft = s.status === 'awaiting-choice'
  const hasCover = !!s.coverImage
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 0' }}>
      {hasCover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={s.coverImage}
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
            border: '1px dashed var(--lf-p-border)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--lf-p-muted-foreground)',
            flexShrink: 0,
          }}
        >
          <Pencil size={15} />
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: '500 14px/1.4 var(--font-ui)' }}>{s.title}</div>
        <div style={{ font: '400 12.5px/1.4 var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
          {s.by ?? (s.source === 'starter' ? 'Little Fables' : 'Made by you')} · {s.pages.length} pages · teaches {s.teachingGoals.join(', ') || '—'}
          {draft ? ' · art still painting' : ''}
        </div>
      </div>
      <span
        style={{
          font: '500 11.5px var(--font-ui)',
          color: draft ? 'var(--lf-p-muted-foreground)' : 'var(--lf-p-foreground)',
          border: '1px solid var(--lf-p-border)',
          background: draft ? 'var(--lf-p-muted)' : 'var(--lf-p-background)',
          borderRadius: 999,
          padding: '3px 10px',
          flexShrink: 0,
        }}
      >
        {draft ? 'Draft' : 'Published'}
      </span>
      {onDelete && (
        <button
          type="button"
          aria-label={`Delete ${s.title}`}
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

// ---------- Parent Corner ----------
function ParentCorner() {
  const { user } = useAuth()
  const [universe, setUniverse] = useState<Universe | null>(null)
  const [retells, setRetells] = useState<Retell[]>([])
  const [savedStories, setSavedStories] = useState<Story[]>([])
  const [newInterest, setNewInterest] = useState('')
  const [newWord, setNewWord] = useState('')
  const [newMeaning, setNewMeaning] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      // If signed in, pull cross-device state first so local reflects everything.
      if (user) await pullAll()
      if (cancelled) return
      setUniverse(loadUniverse())
      setSavedStories(loadStories())
      try {
        setRetells(await listRetells())
      } catch {
        /* ignore */
      }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  const persist = useCallback((next: Universe) => {
    setUniverse(next)
    saveUniverse(next)
    // Fire-and-forget: sync layer no-ops if not signed in.
    void pushUniverse(next)
  }, [])

  const readsThisMonth = useMemo(() => {
    const now = new Date()
    return retells.filter((r) => {
      const d = new Date(r.createdAt)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }).length
  }, [retells])

  const allStories: Story[] = useMemo(
    () => [...savedStories.slice().sort((a, b) => b.createdAt - a.createdAt), ...STARTER_STORIES],
    [savedStories]
  )

  if (!universe) return null

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
  const addWord = () => {
    const term = newWord.trim(), meaning = newMeaning.trim()
    if (!term || !meaning) return
    persist({
      ...universe,
      culture: {
        ...universe.culture,
        words: [...universe.culture.words, { term, language: 'Gujarati', meaning }],
      },
    })
    setNewWord('')
    setNewMeaning('')
  }

  return (
    <div
      className="sw-screen"
      style={{
        minHeight: '100dvh',
        background: 'var(--lf-p-muted)',
        color: 'var(--lf-p-foreground)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <div style={{ maxWidth: 1020, margin: '0 auto', padding: '22px 28px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <Link
              href="/read"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--lf-p-muted-foreground)',
                textDecoration: 'none',
                font: '500 14px var(--font-ui)',
                marginLeft: -10,
                padding: '4px 10px',
              }}
            >
              <ChevronLeft size={16} /> Back to Story World
            </Link>
            <h1 style={{ margin: '14px 0 4px', font: '700 26px/1.3 var(--font-ui)', letterSpacing: '-0.02em' }}>
              Parent corner
            </h1>
            <p style={{ margin: 0, font: '400 14px/1.5 var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
              {universe.childName} · {universe.age} years old · {allStories.length} stories in the library
              {readsThisMonth > 0 ? ` · ${readsThisMonth} retells this month` : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {user && (
              <>
                <span style={{ font: '400 12.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
                  Synced as {user.email}
                </span>
                <PButton variant="ghost" onClick={() => { void signOut() }}>
                  Sign out
                </PButton>
              </>
            )}
            <PButton as="link" href="/read/create">
              <Plus size={16} /> New story
            </PButton>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 20,
            marginTop: 22,
            alignItems: 'start',
          }}
        >
          <style>{`
            @media (min-width: 900px) {
              .parent-grid { grid-template-columns: 1fr 1fr !important; }
            }
          `}</style>
          <div className="parent-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, gridColumn: '1 / -1', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <PCard title="Stories" description="The library your family makes for Azad.">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {allStories.map((s, i) => (
                    <div key={s.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--lf-p-border)' }}>
                      <StoryRow s={s} />
                    </div>
                  ))}
                </div>
              </PCard>

              <PCard title="Retell recordings" description="Azad tells each story back in his own words.">
                {retells.length === 0 ? (
                  <div style={{ font: '400 14px/1.5 var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
                    No recordings yet. After finishing a story, Azad taps the coral mic and it lands here.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {retells.map((rec, i) => (
                      <div key={rec.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--lf-p-border)' }}>
                        <RecordingRow
                          rec={rec}
                          onDelete={async () => {
                            await deleteRetell(rec.id)
                            void deleteRetellRemote(rec.id)
                            setRetells(await listRetells())
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </PCard>
            </div>

            <PCard title={`${universe.childName}'s universe`} description="What new stories draw from. Changes apply to the next story.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <div style={{ font: '500 14px/1 var(--font-ui)', marginBottom: 10 }}>Interests</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {universe.interests.map((it) => (
                      <span key={it} style={chipStyle}>
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
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
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
                </div>

                <div>
                  <div style={{ font: '500 14px/1 var(--font-ui)', marginBottom: 10 }}>Teaching goals</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {TEACHING_OPTIONS.map((g) => {
                      const on = universe.teachingGoals.includes(g)
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => toggleGoal(g)}
                          className="lf-press"
                          style={{
                            ...chipStyle,
                            cursor: 'pointer',
                            background: on ? 'var(--lf-p-primary)' : 'var(--lf-p-background)',
                            color: on ? 'var(--lf-p-primary-foreground)' : 'var(--lf-p-muted-foreground)',
                            borderColor: on ? 'var(--lf-p-primary)' : 'var(--lf-p-border)',
                          }}
                        >
                          {on ? <Check size={13} /> : null}
                          {g}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <div style={{ font: '500 14px/1 var(--font-ui)', marginBottom: 4 }}>Family words</div>
                  <div style={{ font: '400 12.5px/1.4 var(--font-ui)', color: 'var(--lf-p-muted-foreground)', marginBottom: 10 }}>
                    Words woven into Azad&rsquo;s stories.
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {universe.culture.words.map((fw, i) => (
                      <div
                        key={`${fw.term}-${i}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 0',
                          borderTop: i === 0 ? 'none' : '1px solid var(--lf-p-border)',
                        }}
                      >
                        <span style={{ font: '500 14px var(--font-ui)', width: 110 }}>{fw.term}</span>
                        <span style={{ font: '400 13px var(--font-ui)', color: 'var(--lf-p-muted-foreground)', flex: 1 }}>
                          {fw.meaning}
                        </span>
                        <button
                          type="button"
                          aria-label={`Remove ${fw.term}`}
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
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <PInput placeholder="Word" value={newWord} onChange={(e) => setNewWord(e.target.value)} style={{ width: 120 }} />
                    <PInput
                      placeholder="Meaning"
                      value={newMeaning}
                      onChange={(e) => setNewMeaning(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addWord()}
                      style={{ flex: 1, minWidth: 140 }}
                    />
                    <PButton variant="secondary" onClick={addWord}>
                      <Plus size={14} /> Add
                    </PButton>
                  </div>
                </div>
              </div>
            </PCard>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            font: '400 12px var(--font-ui)',
            color: 'var(--lf-p-muted-foreground)',
            justifyContent: 'center',
            marginTop: 18,
          }}
        >
          <Check size={13} /> Auto-saved
        </div>
      </div>
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
          <ChevronLeft size={16} /> Back to Story World
        </Link>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px 90px' }}>
        <div style={{ width: 420, maxWidth: '100%' }}>
          <PCard
            title="Sign in to sync"
            description="Papa's laptop and Azad's iPad share one library when you sign in with the same email on both."
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
  // Not signed in and hasn't opted to skip → magic link flow.
  if (!user && !skippedAuth) return <SignIn onSkip={() => setSkippedAuth(true)} />
  // Signed in (or skipped) but hasn't passed the math gate this session.
  if (!passed) return <Gate onPass={() => setPassed(true)} />
  return <ParentCorner />
}
