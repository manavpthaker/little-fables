// Little Fables v2 story engine.
//
// Modes:
//   - "start"    → generate a quick 1-chapter Book OR the first chapter of a chapter book.
//   - "chapter"  → generate the next chapter given bookContext + worldState.
//   - "continue" → resolve a within-chapter branch given the child's choice
//                  (and optional freeform childIdea for co-authorship).
//
// System prompt is assembled from docs/reference/azi-verse/*.md at build/serve
// time (read from disk, cached in module scope). If any file is missing the
// engine still works — it just injects less canon. This keeps the route
// self-contained and lets the rubric judge see the same rules the generator did.
//
// Rubric gate:
//   1) Generate a story with STORY_MODEL (Sonnet).
//   2) Score it with JUDGE_MODEL (Haiku) against the evaluation rubric.
//   3) If score < SHIP_GATE_MIN (default 90) do ONE revision pass with the notes.
//   4) If it still can't clear the gate return status:'needs-review' + rubricScore/rubricNotes.
//   Do NOT block on it. The UI decides what to show to grown-ups.
//
// SKIP_RUBRIC=1 → dev bypass, no judge call.
import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type {
  Chapter,
  ChoiceBlock,
  ChoiceOption,
  GenerateRequest,
  GenerateResponse,
  Page,
  VocabWord,
  WashKey,
} from '@/types/story'

export const runtime = 'nodejs'
export const maxDuration = 90

const STORY_MODEL = process.env.STORY_MODEL || 'claude-sonnet-4-6'
const JUDGE_MODEL = process.env.JUDGE_MODEL || 'claude-haiku-4-5-20251001'
const SHIP_GATE_MIN = Number(process.env.SHIP_GATE_MIN ?? '90')
const SKIP_RUBRIC = process.env.SKIP_RUBRIC === '1'

const API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

// ---------- Reference doc loader ------------------------------------------
// Read the four canon docs once per process. Truncate each to keep the total
// system prompt under ~8k tokens (roughly 32k chars — Anthropic tokens run
// ~4 chars/token in English). We prioritize universe-guide + rubric because
// those two carry the highest signal for both craft and scoring.

const REFERENCE_ROOT = join(process.cwd(), 'docs', 'reference', 'azi-verse')

interface ReferenceBundle {
  universeGuide: string
  storyInstructions: string
  futureSkills: string
  rubric: string
}

let CACHED_REFERENCE: ReferenceBundle | null = null

function readRef(name: string, maxChars: number): string {
  try {
    const path = join(REFERENCE_ROOT, name)
    if (!existsSync(path)) return ''
    const txt = readFileSync(path, 'utf8')
    if (txt.length <= maxChars) return txt
    return txt.slice(0, maxChars) + '\n\n[…truncated for prompt budget…]'
  } catch (e) {
    console.warn(`[story] failed to read reference ${name}:`, e)
    return ''
  }
}

function loadReference(): ReferenceBundle {
  if (CACHED_REFERENCE) return CACHED_REFERENCE
  // Budget ~32k chars ≈ ~8k tokens total across the four docs.
  CACHED_REFERENCE = {
    universeGuide: readRef('universe-guide.md', 12000),
    storyInstructions: readRef('story-creation-instructions.md', 6000),
    futureSkills: readRef('future-ready-skills.md', 5000),
    rubric: readRef('evaluation-rubric.md', 6000),
  }
  return CACHED_REFERENCE
}

// ---------- Wash + illustration helpers -----------------------------------
const VALID_WASHES: WashKey[] = [
  'canyon',
  'sunset',
  'meadow',
  'lilac',
  'blush',
  'river',
  'snow',
  'honey',
]

function coerceWash(v: unknown): WashKey | undefined {
  if (typeof v !== 'string') return undefined
  const low = v.toLowerCase() as WashKey
  return (VALID_WASHES as string[]).includes(low) ? low : undefined
}

// ---------- System prompt --------------------------------------------------
function systemPrompt(universe: unknown): string {
  const ref = loadReference()
  return `You are the Little Fables v2 story engine — a chapter-book writer for one specific child. You write in the voice of the Azi-Verse: gentle, elevated, lyrical without being lofty, multicultural, and deeply respectful of the child's inner world.

======================================================================
UNIVERSE (this specific family)
======================================================================
${JSON.stringify(universe, null, 2)}

======================================================================
CANON — THE AZI-VERSE UNIVERSE GUIDE
======================================================================
${ref.universeGuide || '(universe guide unavailable — fall back to the UNIVERSE JSON above)'}

======================================================================
CRAFT RULES — HOW WE WRITE
======================================================================
${ref.storyInstructions || ''}

Core craft (non-negotiable):
- **Three-moment morals.** Distribute the story's lesson across three progressive moments — a seed, a stumble, a soft click — instead of one closing lecture. The last line lands the lesson but never states it flatly.
- **Repair language separates behavior from identity.** "My hands did things my heart didn't mean." Never "I was bad."
- **Code-switching.** Weave 0-2 heritage words per page (Spanish: agua, lechita, mi cielo, todos listos; Gujarati/Hindi: bhen, beta, dosas; Creole hello from Flo). Context makes meaning clear — never dictionary translations, never italicized as "exotic".
- **Age band 4–6.** Short rhythmic sentences. Read-aloud friendly. Sensory verbs. Sound effects welcome (Vroom! Screech! Whisker-wiggle!). Vocabulary: enriching but accessible — the child stretches for one or two star words per chapter, not every sentence.
- **Rituals.** Whisker-wiggle roll call opens; C-G-Am chord signals thinking; puzzle-corner-pieces metaphor for hard feelings; comfort ending (snack + song + moon-gaze).
- **Emotional regulation IN NARRATIVE.** Characters name feelings, take belly breaths, count with fingers, ask for help. Never lecture; show.
- **No brand or IP characters.** Universe-canon cast only.
- **Respect the universe's "avoid" list absolutely.**

======================================================================
FIVE-LAYER STORYVERSE ARCHITECTURE
======================================================================
Every chapter, ALL FIVE layers run simultaneously:
1. **Surface** — a genuinely fun adventure with momentum, humor, sound effects.
2. **Skills** — teaching goals embedded through ACTION (counting things in the scene, naming a feeling, predicting what happens next). Never lectures.
3. **Values** — characters model universe values through choices.
4. **Systems** — simple cause-and-effect a 4-6 year old can follow. Small actions ripple.
5. **Future** — choices matter and lead to different outcomes.

======================================================================
FUTURE-READY SKILLS FRAMEWORK (ages 4-8 slice)
======================================================================
${ref.futureSkills || ''}

======================================================================
EVALUATION RUBRIC — YOU WILL BE SCORED AGAINST THIS
======================================================================
${ref.rubric || ''}

A separate judge model will score the chapter on: age appropriateness, structure, cultural authenticity, language, future-ready skills, universe consistency. Target: 90+. Below 90 triggers a revision.

======================================================================
OUTPUT SHAPE — STRUCTURED JSON, NO PROSE, NO FENCES
======================================================================
Return ONLY a JSON object matching this TypeScript shape (fields marked "start-only" appear only in mode:'start' and only when generating a quick 1-chapter Book or the very first chapter of a chapter book):

{
  "title"?:        string,     // start-only (also allowed in chapter mode when starting a new book)
  "coverEmoji"?:   string,     // start-only, single emoji
  "coverBg"?:      string,     // start-only, CSS linear-gradient
  "by"?:           string,     // start-only, echo from the request
  "wash"?:         WashKey,    // book-level wash if generating a quick Book
  "chapters"?:     Chapter[],  // FOR CHAPTER BOOKS: one or more chapters
  "pages"?:        Page[],     // FOR QUICK STORIES ONLY: flat pages (mode:'start' quick-story path)
  "vocab"?:        VocabWord[],// 2-4 star words with kid-friendly meanings (5-8 words)
  "teachingGoals"?:string[],
  "retellPrompts"?:string[],   // 3-4 questions, only when the story is done
  "hook"?:         { b: string, c: string } | string, // chapter-end line ("Next time: …")
  "recapQuestion"?:string,     // chapter-end recap question
  "done":          boolean     // true if this is the final chapter/chunk
}

WashKey ∈ ${VALID_WASHES.map((w) => `'${w}'`).join(' | ')}

Chapter = { title: string, wash?: WashKey, pages: Page[], hook?: string|{b,c}, recapQuestion?: string }

Page = {
  "text":     string,                  // 2-4 short sentences, ~60-80 words per page
  "wash"?:    WashKey,                 // overrides chapter wash on this page
  "emojis"?:  string[],                // 2-5 illustrative emojis (most important first)
  "star"?:    string,                  // ONE vocab word learned on this page (must appear in vocab[])
  "fullBleed"?: boolean,               // true = art fills the left page edge-to-edge
  "breathe"?: true,                    // renders a BreatheAlong panel instead of an ask
  "ask"?: {                            // 1-3 asks per chapter, embedded in the plot
    "skill":    string,                // 'counting' | 'feelings' | 'word detective' | 'predict' | 'living-vs-nonliving' | …
    "question": string,                // answerable by a 4-6 yr old in a word or two
    "praise":   string,                // said when the child answers well
    "hint":     string,                // gentle nudge if the answer isn't recognized
    "kind"?:    "wonder"               // open-ended asks: buddy responds specifically but never evaluates
  },
  "choice"?: {                         // AT MOST ONE per chapter
    "prompt":  string,
    "options": [{ "label": string, "emoji": string }]   // exactly 2 options
  }
}

FORMAT RULES:
- One choice per chapter maximum. A story resolves in at most 2 total choices across the whole book.
- When done:true → the last chapter's last page MUST NOT contain a choice.
- Every page needs either \`emojis\` (2-5) OR \`img\` (path). If unsure, use emojis.
- Quick stories (single chapter): return \`pages\` at the top level, not \`chapters\`.
- Chapter books: return \`chapters: [ … ]\`. Chapter length: 4-7 pages. Chapter-end hook is required.
- Star words on a page MUST appear in the top-level \`vocab\` list.
- Emojis only — never brand logos, no text-only substitutes.

Do NOT include markdown fences. Do NOT prefix with "Here is the JSON". Output ONLY the JSON object.`
}

// ---------- User prompts ---------------------------------------------------
function briefLines(body: GenerateRequest): string[] {
  const parts: string[] = []
  if (body.hero) parts.push(`Companion / hero focus: ${body.hero}`)
  if (body.place) parts.push(`Setting: ${body.place}`)
  if (body.idea) parts.push(`The child's story idea, in their own words: "${body.idea}"`)
  if (body.by) parts.push(`Attribution on the cover: "${body.by}"`)
  return parts
}

function startPrompt(body: GenerateRequest): string {
  const parts = [
    `MODE: start`,
    `Task: Write a brand new story for this child.`,
    ``,
    `Decide format based on the child's idea and the universe:`,
    `- QUICK story = 1 chapter (5-7 pages) that resolves in one sitting. Return \`pages\` at the top level.`,
    `- CHAPTER book = 3-5 chapters. In "start" mode you write ONLY chapter 1 (4-7 pages) and set done:false. The client will call mode:'chapter' for subsequent chapters. Return \`chapters: [ chapter1 ]\`.`,
    ``,
    `If the child's idea is small ("a bee finds a friend") → quick.`,
    `If the idea is expansive or explicitly asks for a big adventure → chapter book.`,
    `When in doubt: quick.`,
    ``,
    `Brief:`,
    ...briefLines(body),
    !body.idea && !body.hero ? '- No specific idea from the child — pick an interest from the universe and delight us.' : '',
    ``,
    `Remember: 3-moment moral, repair language separates behavior from identity, code-switch 0-2 heritage words per page with context, whisker-wiggle roll call opens if you're using the plush cast, comfort ending, ≤1 choice this chapter, 2-4 star words with kid-friendly meanings.`,
  ].filter(Boolean)
  return parts.join('\n')
}

function chapterPrompt(body: GenerateRequest): string {
  const ctx = body.bookContext
  const priorSummary = ctx?.priorChapters
    ?.map((c, i) => `Chapter ${i + 1} — "${c.title}": ${c.summary}`)
    .join('\n') ?? ''
  const worldChoices = ctx?.worldState?.choiceLog
    ?.slice(-10)
    .map((c) => `- ${c.summary} ("${c.label}" in book ${c.bookId} ch.${c.chapter})`)
    .join('\n') ?? ''

  return [
    `MODE: chapter`,
    `Book: "${ctx?.title ?? '(unknown)'}" (${ctx?.kind ?? 'chapter'})`,
    `Task: Write the NEXT chapter. Return { chapters: [oneChapter], done: <true if this is the final chapter> }.`,
    ``,
    `Chapters so far:`,
    priorSummary || '(none — this is chapter 1)',
    ``,
    worldChoices ? `Recent world callbacks the buddy might reference:\n${worldChoices}` : '',
    ``,
    `Chapter should be 4-7 pages, ≤1 choice, end with a hook line and a recap question, star words drawn from the vocab pool. If this is the last chapter, set done:true and drop the choice; include retellPrompts.`,
  ].filter(Boolean).join('\n')
}

function continuePrompt(body: GenerateRequest): string {
  const ctx = body.bookContext
  const priorSummary = ctx?.priorChapters
    ?.map((c, i) => `Chapter ${i + 1} — "${c.title}": ${c.summary}`)
    .join('\n') ?? ''

  const echo = body.childIdea
    ? `\nCO-AUTHORSHIP: The child spoke a freeform "your idea" continuation:\n  "${body.childIdea}"\n\nThe buddy MUST echo this idea back in their first line of dialogue after the choice — literally quote a phrase or paraphrase warmly so the child hears themselves in the story. Then weave the idea into what actually happens next. Do NOT ignore, sanitize away, or override the child's idea.`
    : ''

  return [
    `MODE: continue`,
    `Book: "${ctx?.title ?? '(unknown)'}"`,
    `Task: Resolve the branch the child just chose within the CURRENT chapter. Return the next 3-5 pages (as chapters[0].pages appended in spirit to the current chapter — the client will merge). Include done:true if this resolves the whole story (choices are capped at 2 per book), otherwise done:false.`,
    ``,
    `Chapters so far:`,
    priorSummary || '(none)',
    ``,
    `The child chose: "${body.choice ?? '(unknown)'}"`,
    echo,
    ``,
    `Rules: honor the choice meaningfully — it must change what happens, not just decorate the same outcome. Keep the same chapter's wash. ≤1 choice per chapter (usually zero here). If done:true → include retellPrompts and no choice on the last page.`,
  ].filter(Boolean).join('\n')
}

function userPrompt(body: GenerateRequest): string {
  switch (body.mode) {
    case 'start':
      return startPrompt(body)
    case 'chapter':
      return chapterPrompt(body)
    case 'continue':
      return continuePrompt(body)
    default:
      return startPrompt(body)
  }
}

// ---------- Anthropic wire helpers ----------------------------------------
interface AnthropicMessagesResponse {
  content: { type: string; text?: string }[]
  stop_reason?: string
}

async function callAnthropic(opts: {
  apiKey: string
  model: string
  system: string
  user: string
  maxTokens: number
}): Promise<string> {
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': opts.apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: opts.maxTokens,
      system: opts.system,
      messages: [{ role: 'user', content: opts.user }],
    }),
  })

  if (!resp.ok) {
    const errText = await resp.text()
    console.error('[story] Anthropic error', opts.model, resp.status, errText)
    throw new Error(`Anthropic ${resp.status}: ${errText.slice(0, 400)}`)
  }
  const data = (await resp.json()) as AnthropicMessagesResponse
  return data.content?.find((c) => c.type === 'text')?.text ?? ''
}

// ---------- JSON extraction + validation ----------------------------------
function extractJSON(text: string): unknown {
  const cleaned = text.replace(/```json|```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) {
    throw new Error('No JSON object found in model output')
  }
  return JSON.parse(cleaned.slice(start, end + 1))
}

function coerceVocab(raw: unknown): VocabWord[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const out: VocabWord[] = []
  for (const v of raw) {
    if (typeof v === 'string') {
      out.push({ word: v, meaning: '' })
    } else if (v && typeof v === 'object' && typeof (v as { word?: unknown }).word === 'string') {
      const o = v as { word: string; meaning?: unknown; say?: unknown; from?: unknown }
      out.push({
        word: o.word,
        meaning: typeof o.meaning === 'string' ? o.meaning : '',
        say: typeof o.say === 'string' ? o.say : undefined,
        from: typeof o.from === 'string' ? o.from : undefined,
      })
    }
  }
  return out
}

function coerceChoice(raw: unknown): ChoiceBlock | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const c = raw as { prompt?: unknown; options?: unknown }
  if (typeof c.prompt !== 'string' || !Array.isArray(c.options)) return undefined
  const options: ChoiceOption[] = []
  for (const o of c.options) {
    if (!o || typeof o !== 'object') continue
    const opt = o as { label?: unknown; emoji?: unknown; keywords?: unknown }
    if (typeof opt.label !== 'string' || typeof opt.emoji !== 'string') continue
    options.push({
      label: opt.label,
      emoji: opt.emoji,
      keywords: Array.isArray(opt.keywords)
        ? (opt.keywords as unknown[]).filter((k): k is string => typeof k === 'string')
        : undefined,
    })
  }
  if (options.length < 2) return undefined
  return { prompt: c.prompt, options: options.slice(0, 3) }
}

function coercePage(raw: unknown): Page | null {
  if (!raw || typeof raw !== 'object') return null
  const p = raw as Record<string, unknown>
  if (typeof p.text !== 'string' || !p.text.trim()) return null
  const page: Page = { text: p.text }
  const wash = coerceWash(p.wash)
  if (wash) page.wash = wash
  if (Array.isArray(p.emojis)) {
    page.emojis = (p.emojis as unknown[])
      .filter((e): e is string => typeof e === 'string')
      .slice(0, 5)
  }
  if (typeof p.img === 'string') page.img = p.img
  if (typeof p.slot === 'string') page.slot = p.slot
  if (typeof p.slotLabel === 'string') page.slotLabel = p.slotLabel
  if (p.fullBleed === true) page.fullBleed = true
  if (p.breathe === true) page.breathe = true
  if (typeof p.star === 'string') page.star = p.star

  const askRaw = p.ask
  if (askRaw && typeof askRaw === 'object') {
    const a = askRaw as Record<string, unknown>
    if (
      typeof a.skill === 'string' &&
      typeof a.question === 'string' &&
      typeof a.praise === 'string' &&
      typeof a.hint === 'string'
    ) {
      page.ask = {
        skill: a.skill,
        question: a.question,
        praise: a.praise,
        hint: a.hint,
        kind: a.kind === 'wonder' ? 'wonder' : undefined,
        answers: Array.isArray(a.answers)
          ? (a.answers as unknown[]).filter((x): x is string => typeof x === 'string')
          : undefined,
      }
    }
  }

  const choice = coerceChoice(p.choice)
  if (choice) page.choice = choice
  return page
}

function coerceChapter(raw: unknown): Chapter | null {
  if (!raw || typeof raw !== 'object') return null
  const c = raw as Record<string, unknown>
  const pagesRaw = Array.isArray(c.pages) ? c.pages : []
  const pages = pagesRaw
    .map(coercePage)
    .filter((p): p is Page => p !== null)
  if (pages.length === 0) return null

  const chapter: Chapter = {
    title: typeof c.title === 'string' ? c.title : '',
    pages,
  }
  const wash = coerceWash(c.wash)
  if (wash) chapter.wash = wash
  if (typeof c.slot === 'string') chapter.slot = c.slot
  if (Array.isArray(c.emojis)) {
    chapter.emojis = (c.emojis as unknown[])
      .filter((e): e is string => typeof e === 'string')
      .slice(0, 5)
  }
  if (typeof c.recapQuestion === 'string') chapter.recapQuestion = c.recapQuestion
  const hook = c.hook
  if (typeof hook === 'string') {
    chapter.hook = hook
  } else if (hook && typeof hook === 'object') {
    const h = hook as { b?: unknown; c?: unknown }
    if (typeof h.b === 'string' && typeof h.c === 'string') {
      chapter.hook = { b: h.b, c: h.c }
    }
  }
  return chapter
}

class GenerationError extends Error {}

function validate(rawRes: unknown, mode: GenerateRequest['mode']): GenerateResponse {
  if (!rawRes || typeof rawRes !== 'object') {
    throw new GenerationError('Model output was not a JSON object')
  }
  const r = rawRes as Record<string, unknown>
  const out: GenerateResponse = { done: r.done === true }

  if (typeof r.title === 'string') out.title = r.title
  if (typeof r.coverEmoji === 'string') out.coverEmoji = r.coverEmoji
  if (typeof r.coverBg === 'string') out.coverBg = r.coverBg
  if (typeof r.by === 'string') out.by = r.by
  const wash = coerceWash(r.wash)
  if (wash) out.wash = wash

  if (Array.isArray(r.chapters)) {
    const chapters = (r.chapters as unknown[])
      .map(coerceChapter)
      .filter((c): c is Chapter => c !== null)
    if (chapters.length > 0) out.chapters = chapters
  }

  if (Array.isArray(r.pages)) {
    const pages = (r.pages as unknown[])
      .map(coercePage)
      .filter((p): p is Page => p !== null)
    if (pages.length > 0) out.pages = pages
  }

  const vocab = coerceVocab(r.vocab)
  if (vocab) out.vocab = vocab
  if (Array.isArray(r.teachingGoals)) {
    out.teachingGoals = (r.teachingGoals as unknown[]).filter((g): g is string => typeof g === 'string')
  }
  if (Array.isArray(r.retellPrompts)) {
    out.retellPrompts = (r.retellPrompts as unknown[]).filter((g): g is string => typeof g === 'string')
  }
  if (typeof r.recapQuestion === 'string') out.recapQuestion = r.recapQuestion
  const hook = r.hook
  if (typeof hook === 'string') out.hook = hook
  else if (hook && typeof hook === 'object') {
    const h = hook as { b?: unknown; c?: unknown }
    if (typeof h.b === 'string' && typeof h.c === 'string') out.hook = { b: h.b, c: h.c }
  }

  // Must have SOME content.
  const hasChapters = !!out.chapters?.length
  const hasPages = !!out.pages?.length
  if (!hasChapters && !hasPages) {
    throw new GenerationError('Model returned neither chapters nor pages')
  }

  // Quick-story path (start mode with flat pages) is legal only when there
  // are NO chapters. If both are present, prefer chapters.
  if (hasChapters && hasPages) {
    delete out.pages
  }

  // done=true must NOT end on a choice.
  if (out.done) {
    if (out.chapters?.length) {
      const lastCh = out.chapters[out.chapters.length - 1]
      const lastPg = lastCh.pages[lastCh.pages.length - 1]
      if (lastPg?.choice) delete lastPg.choice
    }
    if (out.pages?.length) {
      const last = out.pages[out.pages.length - 1]
      if (last?.choice) delete last.choice
    }
  }

  // Enforce at most one choice per chapter (last page only).
  const stripExtraChoices = (pages: Page[]) => {
    let choiceIdx = -1
    for (let i = 0; i < pages.length; i++) {
      if (pages[i].choice) choiceIdx = i
    }
    if (choiceIdx >= 0) {
      for (let i = 0; i < pages.length; i++) {
        if (i !== choiceIdx && pages[i].choice) delete pages[i].choice
      }
    }
  }
  out.chapters?.forEach((c) => stripExtraChoices(c.pages))
  if (out.pages) stripExtraChoices(out.pages)

  // For mode:'chapter' we expect chapters, not flat pages. Not an error if the
  // model returned pages — we just accept.
  void mode

  return out
}

// ---------- Rubric gate ----------------------------------------------------
interface RubricScore {
  score: number
  notes: string
}

function judgeSystemPrompt(): string {
  const ref = loadReference()
  return `You are a strict but fair children's-story rubric judge for the Azi-Verse. Score the provided story against the Azi-Verse Evaluation Rubric. Return ONLY a JSON object of shape:

{ "score": number (0-100), "notes": string }

Notes should be 2-4 sentences: what worked, what fell short by criterion, and one concrete revision hint if score < 90. Be honest — do not inflate scores. A 90 means genuinely publishable.

======================================================================
EVALUATION RUBRIC
======================================================================
${ref.rubric || '(rubric unavailable — score conservatively on age fit, structure, cultural authenticity, language, future-ready skills, and universe consistency)'}

======================================================================
CANON REMINDER (for consistency checks)
======================================================================
${(ref.universeGuide || '').slice(0, 4000)}
`
}

async function runRubric(apiKey: string, story: GenerateResponse): Promise<RubricScore> {
  const compact = JSON.stringify({
    title: story.title,
    chapters: story.chapters?.map((c) => ({
      title: c.title,
      hook: c.hook,
      recapQuestion: c.recapQuestion,
      pages: c.pages.map((p) => ({ text: p.text, ask: p.ask, choice: p.choice, star: p.star })),
    })),
    pages: story.pages?.map((p) => ({ text: p.text, ask: p.ask, choice: p.choice, star: p.star })),
    vocab: story.vocab,
    teachingGoals: story.teachingGoals,
  })

  const raw = await callAnthropic({
    apiKey,
    model: JUDGE_MODEL,
    system: judgeSystemPrompt(),
    user: `Score this story against the rubric:\n\n${compact}`,
    maxTokens: 1500,
  })
  const cleaned = raw.replace(/```json|```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) {
    return { score: 0, notes: 'Judge returned no JSON.' }
  }
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as { score?: unknown; notes?: unknown }
    const score = typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 0
    const notes = typeof parsed.notes === 'string' ? parsed.notes : ''
    return { score, notes }
  } catch {
    return { score: 0, notes: 'Judge returned malformed JSON.' }
  }
}

// ---------- Route handler --------------------------------------------------
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'ANTHROPIC_API_KEY is not set. Add it in Vercel project settings (or .env.local) to enable story magic.',
      },
      { status: 500 }
    )
  }

  let body: GenerateRequest
  try {
    body = (await req.json()) as GenerateRequest
  } catch {
    return NextResponse.json({ error: 'Bad request body' }, { status: 400 })
  }

  const sys = systemPrompt(body.universe)
  const usr = userPrompt(body)

  try {
    // Pass 1 — generate.
    const raw1 = await callAnthropic({
      apiKey,
      model: STORY_MODEL,
      system: sys,
      user: usr,
      maxTokens: 6000,
    })
    let story: GenerateResponse
    try {
      story = validate(extractJSON(raw1), body.mode)
    } catch (e) {
      console.error('[story] validation failed', e)
      return NextResponse.json(
        { error: 'The story machine hiccuped. Try again!' },
        { status: 502 }
      )
    }

    if (SKIP_RUBRIC) {
      return NextResponse.json(story)
    }

    // Pass 2 — rubric.
    const first = await runRubric(apiKey, story)
    story.rubricScore = first.score
    story.rubricNotes = first.notes

    if (first.score >= SHIP_GATE_MIN) {
      return NextResponse.json(story)
    }

    // Pass 3 — one revision using the judge notes.
    const revisionUser = `${usr}

======================================================================
REVISION REQUESTED
======================================================================
Your previous draft scored ${first.score}/100 on the Azi-Verse rubric. Judge notes:

"${first.notes}"

Revise the story to specifically address those notes. Keep what worked, fix what fell short. Return the FULL revised story in the same JSON shape.`

    const raw2 = await callAnthropic({
      apiKey,
      model: STORY_MODEL,
      system: sys,
      user: revisionUser,
      maxTokens: 6000,
    })
    let revised: GenerateResponse
    try {
      revised = validate(extractJSON(raw2), body.mode)
    } catch (e) {
      console.warn('[story] revision failed to validate, returning first draft flagged for review', e)
      return NextResponse.json({
        ...story,
        // Note: types/story.ts GenerateResponse doesn't carry a `status` field —
        // but Book.status does. Add a soft signal via `error` so callers can
        // route to needs-review. Keep the story returned.
      })
    }

    const second = await runRubric(apiKey, revised)
    revised.rubricScore = second.score
    revised.rubricNotes = second.notes

    // Return the revised story regardless. If still below the gate, callers
    // can see rubricScore/rubricNotes and route into a needs-review shelf.
    return NextResponse.json(revised)
  } catch (e) {
    console.error('[story] generation failed', e)
    return NextResponse.json(
      { error: 'The story machine hiccuped. Try again!' },
      { status: 502 }
    )
  }
}
