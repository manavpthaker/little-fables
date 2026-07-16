// Little Fables v3.2 P2-2a — deferred soft-scoring endpoint.
//
// The /api/story route now returns the Book AS SOON AS hard gates pass
// (Option B — surgical separation). The kid's story lands on the shelf
// immediately, so a 4-year-old never watches a spinner tick down. The
// client fires this route in the background to fill in the soft score.
//
// If this route times out or errors, the Book stays at `status:
// 'needs-review'` until it's retried. Nothing user-visible breaks.
//
// Contract:
//   POST { book: Book, universe: unknown }
//   →    { softScore, breakdown, revisionsUsed, notes?, status }

import { NextRequest, NextResponse } from 'next/server'
import { dailyLimit, sameOriginOk, underDailyBudget } from '@/lib/server/guard'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type {
  Book,
  Page,
  QaSoftBreakdown,
} from '@/types/story'

export const runtime = 'nodejs'
export const maxDuration = 30

const JUDGE_MODEL = process.env.JUDGE_MODEL || 'claude-haiku-4-5-20251001'
const SHIP_GATE_MIN = Number(process.env.SHIP_GATE_MIN ?? '90')
const SKIP_RUBRIC = process.env.SKIP_RUBRIC === '1'

const API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

const REFERENCE_ROOT = join(process.cwd(), 'docs', 'reference', 'azi-verse')

function readRubric(): string {
  try {
    const p = join(REFERENCE_ROOT, 'evaluation-rubric.md')
    if (!existsSync(p)) return ''
    const txt = readFileSync(p, 'utf8')
    return txt.length <= 6000 ? txt : txt.slice(0, 6000)
  } catch {
    return ''
  }
}

// Same weights + normalizer as /api/story. Duplicated to keep the routes
// decoupled — this endpoint must run standalone.
const DEFAULT_WEIGHTS: Record<keyof QaSoftBreakdown, number> = {
  structure: 0.2,
  skills: 0.2,
  cultural: 0.15,
  language: 0.15,
  age: 0.2,
  universe: 0.1,
}

interface UniverseWeights {
  scoringWeights?: Partial<Record<keyof QaSoftBreakdown, number>>
}

function resolveWeights(raw: unknown): Record<keyof QaSoftBreakdown, number> {
  const u = raw && typeof raw === 'object' ? (raw as UniverseWeights) : {}
  const sw = u.scoringWeights
  if (!sw) return DEFAULT_WEIGHTS
  const out = { ...DEFAULT_WEIGHTS }
  for (const k of Object.keys(DEFAULT_WEIGHTS) as (keyof QaSoftBreakdown)[]) {
    const v = sw[k]
    if (typeof v === 'number' && v >= 0) out[k] = v
  }
  return out
}

function allPages(book: Book): Page[] {
  return book.chapters.flatMap((c) => c.pages)
}

function softScoreSystemPrompt(): string {
  const rubric = readRubric()
  return `You are a soft-scoring judge for the Azi-Verse story pipeline. Return a per-criterion 0-10 breakdown. The pipeline computes the weighted score itself.

Return ONLY a JSON object:

{
  "breakdown": {
    "structure": number (0-10),
    "skills":    number (0-10),
    "cultural":  number (0-10),
    "language":  number (0-10),
    "age":       number (0-10),
    "universe":  number (0-10)
  },
  "notes": string
}

Notes: 2-4 sentences of concrete revision guidance if any criterion is below 8/10. Be honest — do not inflate.

Criteria:
- structure — arc, pacing, three-moment moral distribution
- skills — SS-taxonomy skill(s) embedded through action, not preached
- cultural — heritage integration is authentic and functional
- language — sentence rhythm, vocabulary stretch, read-aloud quality
- age — developmental fit for the stated band
- universe — companion voice, ritual usage, canon consistency

======================================================================
RUBRIC REFERENCE
======================================================================
${rubric || '(rubric unavailable — score conservatively)'}
`
}

interface AnthropicMessagesResponse {
  content: { type: string; text?: string }[]
  stop_reason?: string
}

async function callAnthropic(opts: {
  apiKey: string
  system: string
  user: string
}): Promise<string> {
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': opts.apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: JUDGE_MODEL,
      max_tokens: 900,
      system: [{ type: 'text', text: opts.system, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: opts.user }],
    }),
  })
  if (!resp.ok) {
    const errText = await resp.text()
    throw new Error(`Anthropic ${resp.status}: ${errText.slice(0, 400)}`)
  }
  const data = (await resp.json()) as AnthropicMessagesResponse
  return data.content?.find((c) => c.type === 'text')?.text ?? ''
}

function computeSoftScore(
  breakdown: QaSoftBreakdown,
  weights: Record<keyof QaSoftBreakdown, number>,
): number {
  const sum =
    (breakdown.structure / 10) * weights.structure +
    (breakdown.skills / 10) * weights.skills +
    (breakdown.cultural / 10) * weights.cultural +
    (breakdown.language / 10) * weights.language +
    (breakdown.age / 10) * weights.age +
    (breakdown.universe / 10) * weights.universe
  const weightTotal =
    weights.structure + weights.skills + weights.cultural + weights.language + weights.age + weights.universe
  const normalized = weightTotal > 0 ? sum / weightTotal : sum
  return Math.round(100 * normalized)
}

interface ScoreRequestBody {
  book: Book
  universe?: unknown
  band?: string
}

export async function POST(req: NextRequest) {
  if (!sameOriginOk(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  if (!(await underDailyBudget('score', dailyLimit('score', 60)))) {
    return NextResponse.json({ error: 'daily limit reached' }, { status: 429 })
  }
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY missing' }, { status: 500 })
  }

  if (SKIP_RUBRIC) {
    // Dev bypass — return a perfect score so the client can commit qaRecord.
    return NextResponse.json({
      softScore: 100,
      breakdown: { structure: 10, skills: 10, cultural: 10, language: 10, age: 10, universe: 10 },
      revisionsUsed: 0,
      notes: 'SKIP_RUBRIC=1',
      status: 'complete',
    })
  }

  let body: ScoreRequestBody
  try {
    body = (await req.json()) as ScoreRequestBody
  } catch {
    return NextResponse.json({ error: 'Bad request body' }, { status: 400 })
  }

  const { book, universe } = body
  if (!book || !Array.isArray(book.chapters)) {
    return NextResponse.json({ error: 'Book payload required' }, { status: 400 })
  }

  const weights = resolveWeights(universe)
  const band = typeof body.band === 'string' ? body.band : '4-8'

  const compact = {
    band,
    title: book.title,
    chapters: book.chapters.map((c) => ({
      title: c.title,
      hook: c.hook,
      recapQuestion: c.recapQuestion,
      pages: c.pages.map((p) => ({
        text: p.text,
        ask: p.ask,
        choice: p.choice,
        star: p.star,
      })),
    })),
    vocab: book.vocab,
    skillTags: book.skillTags,
    teachingGoals: book.teachingGoals,
  }

  try {
    const raw = await callAnthropic({
      apiKey,
      system: softScoreSystemPrompt(),
      user: `Score this story:\n\n${JSON.stringify(compact)}`,
    })
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start === -1 || end === -1) throw new Error('soft-score judge returned no JSON')
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>
    const b = parsed.breakdown as Record<string, unknown> | undefined
    const clamp = (n: unknown) => (typeof n === 'number' ? Math.max(0, Math.min(10, n)) : 0)
    const breakdown: QaSoftBreakdown = {
      structure: clamp(b?.structure),
      skills: clamp(b?.skills),
      cultural: clamp(b?.cultural),
      language: clamp(b?.language),
      age: clamp(b?.age),
      universe: clamp(b?.universe),
    }
    const notes = typeof parsed.notes === 'string' ? parsed.notes : ''
    const softScore = computeSoftScore(breakdown, weights)
    // Note: Option B keeps revisions in the deferred path light — we don't
    // spend a second regeneration budget here. If the score is low the Book
    // stays at needs-review; the parent can see it in the Corner and either
    // accept as-is or ask for a redraft via /api/story.
    void allPages
    return NextResponse.json({
      softScore,
      breakdown,
      revisionsUsed: 0,
      notes,
      status: softScore < SHIP_GATE_MIN ? 'needs-review' : 'complete',
    })
  } catch (e) {
    console.warn('[story-score] failed:', e)
    return NextResponse.json(
      { error: (e as Error).message || 'soft-score failed', status: 'needs-review' },
      { status: 502 },
    )
  }
}
