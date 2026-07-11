/**
 * Little Fables — batch story-pack generator.
 *
 * Reads env directly, talks to Anthropic directly (NOT via localhost / the
 * Next API), and emits `content/packs/pack-NNN.json` in the same schema as
 * `content/packs/pack-000-family-originals.json`.
 *
 * Usage:
 *   npx tsx scripts/generate-story-pack.ts --dry-run --pack 001 --count 3
 *   npx tsx scripts/generate-story-pack.ts --pack 001 --count 12
 *
 * Cost note: a pack of 12 quick stories ≈ ~24 Sonnet calls (gen + judge, plus
 * an occasional revision) ≈ ~$1–3 total. Rerun whenever the shelf thins.
 */
import 'dotenv/config'
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type {
  Book,
  Chapter,
  ChoiceBlock,
  ChoiceOption,
  Page,
  VocabWord,
  WashKey,
} from '../types/story'
import { DEFAULT_UNIVERSE } from '../lib/universe/azad-verse'

// ---------- Paths ---------------------------------------------------------
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const REPO_ROOT = join(__dirname, '..')
const REFERENCE_ROOT = join(REPO_ROOT, 'docs', 'reference', 'azi-verse')
const PACKS_DIR = join(REPO_ROOT, 'content', 'packs')

// ---------- Args ----------------------------------------------------------
interface Args {
  pack: string
  count: number
  dryRun: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Args = { pack: '001', count: 12, dryRun: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--pack') args.pack = argv[++i] ?? args.pack
    else if (a === '--count') args.count = Number(argv[++i] ?? args.count)
    else if (a === '--dry-run' || a === '--dryRun') args.dryRun = true
    else if (a === '--help' || a === '-h') {
      console.log('Usage: npx tsx scripts/generate-story-pack.ts [--pack NNN] [--count N] [--dry-run]')
      process.exit(0)
    }
  }
  return args
}

// ---------- Reference bundle (same shape as the API route) ---------------
function readRef(name: string, maxChars: number): string {
  const path = join(REFERENCE_ROOT, name)
  if (!existsSync(path)) return ''
  const txt = readFileSync(path, 'utf8')
  return txt.length <= maxChars ? txt : txt.slice(0, maxChars) + '\n\n[…truncated…]'
}

const REFERENCE = {
  universeGuide: readRef('universe-guide.md', 12000),
  storyInstructions: readRef('story-creation-instructions.md', 6000),
  futureSkills: readRef('future-ready-skills.md', 5000),
  rubric: readRef('evaluation-rubric.md', 6000),
}

const VALID_WASHES: WashKey[] = [
  'canyon', 'sunset', 'meadow', 'lilac', 'blush', 'river', 'snow', 'honey',
]

// ---------- Brief rotation ------------------------------------------------
// Every brief varies across (theme × setting × companion lead × skill × format).
// We dedupe by (theme × setting × companion) inside a pack.
const EMOTIONAL_THEMES = [
  'not feeling ready yet',
  'a plan gone crooked',
  'missing someone far away',
  'brave and crying at the same time',
  'no one notices I\'m scared',
  'explaining where I come from (more than one place)',
  'grown-ups miss home too',
  'saying "I love you" in a new language',
  'friends who are different but feelings the same',
  'a puzzle that takes longer than expected',
  'is it giving up, or taking a break?',
  'a song that changes how a feeling feels',
]

const FUTURE_SKILLS = [
  'emotional intelligence — naming feelings, belly breaths',
  'critical thinking — asking better questions',
  'cultural intelligence — code-switching, honoring both',
  'systems thinking — small actions ripple',
  'adaptability — when the plan changes',
  'creative problem-solving — many possible answers',
  'empathy — perspective-taking',
  'mindfulness — presence, slowing down',
]

const SETTINGS = [
  'Azi\'s Playroom (whisker-wiggle roll call)',
  'Azi\'s twilight Bedroom (moon-view window)',
  'The Backyard garden + trampoline + bees',
  'Pooh\'s Honey Farm',
  'Monkie\'s Dock and Boat',
  'The Yellow Bus (Pandies driving)',
  'Liberty Science Center with Brady',
  'A video call to Colombia (Lito & Lita)',
  'Dada & Dadi\'s house in Howell (dosas, Hess parade)',
  'The Neighborhood Circle (Flo\'s garden)',
]

const COMPANION_LEADS = [
  'Jujy', 'Dory', 'Pandies', 'Citie', 'Clappy', 'Slothie',
  'Monkie', 'Peter', 'Pooh',
]

const FORMATS: Array<'quick' | 'chapter'> = ['quick', 'quick', 'quick', 'chapter']

interface Brief {
  index: number
  ageBand: '4–6'
  format: 'quick' | 'chapter'
  theme: string
  skill: string
  setting: string
  companion: string
  culturalAccent: string
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length]
}

function buildBriefs(count: number): Brief[] {
  const out: Brief[] = []
  const seen = new Set<string>()
  let idx = 0
  let attempt = 0
  const MAX_ATTEMPTS = count * 20
  while (out.length < count && attempt < MAX_ATTEMPTS) {
    const theme = pick(EMOTIONAL_THEMES, idx)
    const skill = pick(FUTURE_SKILLS, idx + attempt)
    const setting = pick(SETTINGS, idx + Math.floor(attempt / 3))
    const companion = pick(COMPANION_LEADS, idx + Math.floor(attempt / 5))
    const format = pick(FORMATS, out.length)
    const cultural = pick(
      ['Colombian Spanish accent', 'Gujarati/Hindi warmth', 'Creole neighbor moment', 'blended tri-cultural'],
      idx + attempt
    )
    const key = `${theme}::${setting}::${companion}`
    attempt++
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      index: out.length + 1,
      ageBand: '4–6',
      format,
      theme,
      skill,
      setting,
      companion,
      culturalAccent: cultural,
    })
    idx++
  }
  return out
}

// ---------- Prompts (compact — mirror the API route) ---------------------
function systemPrompt(universe: unknown): string {
  return `You are the Little Fables v2 story engine — a chapter-book writer for one specific child in the voice of the Azi-Verse.

UNIVERSE:
${JSON.stringify(universe, null, 2)}

CANON:
${REFERENCE.universeGuide || '(unavailable)'}

CRAFT RULES:
${REFERENCE.storyInstructions || ''}

Non-negotiable craft: three-moment morals; repair language separates behavior from identity ("my hands did things my heart didn't mean"); code-switch 0-2 heritage words per page with context clues; age band 4-6 short rhythmic sentences read-aloud friendly; whisker-wiggle roll call opens; comfort ending (snack + song + moon-gaze); never brand/IP characters; respect avoid list absolutely.

FIVE-LAYER STORYVERSE ARCHITECTURE (all five run at once): surface adventure • embedded skills through action • values through choices • simple systems / cause-effect • futures that matter.

FUTURE-READY SKILLS FRAMEWORK (ages 4-8):
${REFERENCE.futureSkills || ''}

RUBRIC (a judge will score this — target 90+):
${REFERENCE.rubric || ''}

OUTPUT — return ONLY a JSON object, no fences, no prose:
{
  "title": string,
  "coverEmoji": string,
  "coverBg": string,        // CSS linear-gradient
  "wash": WashKey,          // ${VALID_WASHES.join(' | ')}
  "kind": "quick" | "chapter",
  // For quick stories: chapters:[oneChapter] with 5-7 pages.
  // For chapter books: 3-5 chapters, 4-7 pages each.
  "chapters": [{
    "title": string,
    "wash"?: WashKey,
    "pages": [{
      "text": string,           // 2-4 short sentences (~60-80 words)
      "wash"?: WashKey,
      "emojis": string[],       // 2-5 illustrative
      "star"?: string,          // vocab word learned here (also in top-level vocab)
      "fullBleed"?: boolean,
      "breathe"?: true,
      "ask"?: { "skill": string, "question": string, "praise": string, "hint": string, "kind"?: "wonder" },
      "choice"?: { "prompt": string, "options": [{ "label": string, "emoji": string }] }   // ≤1 per chapter
    }],
    "hook"?: string | { "b": string, "c": string },
    "recapQuestion"?: string
  }],
  "vocab": [{ "word": string, "meaning": string, "say"?: string }],  // 2-4 star words, kid-friendly meanings (5-8 words)
  "teachingGoals": string[],
  "retellPrompts": string[],   // 3-4
  "parentGuide"?: string,
  "quiet"?: boolean,           // true for bedtime pacing
  "seasonal"?: string,
  "done": true                  // pack stories are always fully resolved
}

Total choices across the whole book ≤ 2. Final page must NOT be a choice. Star words used on a page must also appear in top-level vocab. Emojis only, no brand marks.`
}

function briefPrompt(brief: Brief, byLine: string): string {
  return `Write a complete Little Fables story now.

BRIEF:
- Age band: ${brief.ageBand}
- Format: ${brief.format === 'quick' ? 'QUICK (1 chapter, 5-7 pages, done:true)' : 'CHAPTER BOOK (3-5 chapters, 4-7 pages each, done:true on the last chapter, hook at every chapter end except the last)'}
- Emotional theme: ${brief.theme}
- Future-ready skill target: ${brief.skill}
- Setting: ${brief.setting}
- Companion lead: ${brief.companion}
- Cultural accent: ${brief.culturalAccent}
- Attribution: "${byLine}"

Requirements: three-moment moral distributed across the arc (seed → stumble → soft click); comfort ending; 1-3 asks total; 2-4 star words with kid-friendly meanings; ≤1 choice with meaningful branches (the ≤2-per-book cap makes ONE choice safest); retellPrompts (3-4); parentGuide (2-4 discussion starters).

Return ONLY the JSON.`
}

function judgeSystemPrompt(): string {
  return `You are a strict but fair Azi-Verse rubric judge. Score against the rubric and return ONLY:

{ "score": number (0-100), "notes": string (2-4 sentences: what worked, what fell short by criterion, one concrete revision hint if <90) }

Do not inflate. 90 = genuinely publishable.

RUBRIC:
${REFERENCE.rubric || ''}

CANON REMINDER:
${(REFERENCE.universeGuide || '').slice(0, 4000)}`
}

// ---------- Anthropic call ------------------------------------------------
const API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
const STORY_MODEL = process.env.STORY_MODEL || 'claude-sonnet-4-6'
const JUDGE_MODEL = process.env.JUDGE_MODEL || 'claude-haiku-4-5-20251001'
const SHIP_GATE_MIN = Number(process.env.SHIP_GATE_MIN ?? '90')

async function callAnthropic(opts: {
  apiKey: string
  model: string
  system: string
  user: string
  maxTokens: number
}): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
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
    const txt = await resp.text()
    throw new Error(`Anthropic ${resp.status}: ${txt.slice(0, 300)}`)
  }
  const data = (await resp.json()) as {
    content: { type: string; text?: string }[]
    usage?: { input_tokens?: number; output_tokens?: number }
  }
  return {
    text: data.content?.find((c) => c.type === 'text')?.text ?? '',
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
  }
}

// ---------- Coercion (mirror route.ts, condensed) ------------------------
function extractJSON(text: string): unknown {
  const cleaned = text.replace(/```json|```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON')
  return JSON.parse(cleaned.slice(start, end + 1))
}

function coerceWash(v: unknown): WashKey | undefined {
  if (typeof v !== 'string') return undefined
  const low = v.toLowerCase() as WashKey
  return (VALID_WASHES as string[]).includes(low) ? low : undefined
}

function coerceChoice(raw: unknown): ChoiceBlock | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const c = raw as { prompt?: unknown; options?: unknown }
  if (typeof c.prompt !== 'string' || !Array.isArray(c.options)) return undefined
  const options: ChoiceOption[] = []
  for (const o of c.options) {
    if (!o || typeof o !== 'object') continue
    const opt = o as { label?: unknown; emoji?: unknown }
    if (typeof opt.label !== 'string' || typeof opt.emoji !== 'string') continue
    options.push({ label: opt.label, emoji: opt.emoji })
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
      .filter((e): e is string => typeof e === 'string').slice(0, 5)
  }
  if (typeof p.star === 'string') page.star = p.star
  if (p.fullBleed === true) page.fullBleed = true
  if (p.breathe === true) page.breathe = true
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
  const pages = (Array.isArray(c.pages) ? c.pages : []).map(coercePage).filter((p): p is Page => p !== null)
  if (pages.length === 0) return null
  const chapter: Chapter = {
    title: typeof c.title === 'string' ? c.title : '',
    pages,
  }
  const wash = coerceWash(c.wash)
  if (wash) chapter.wash = wash
  if (typeof c.recapQuestion === 'string') chapter.recapQuestion = c.recapQuestion
  const hook = c.hook
  if (typeof hook === 'string') chapter.hook = hook
  else if (hook && typeof hook === 'object') {
    const h = hook as { b?: unknown; c?: unknown }
    if (typeof h.b === 'string' && typeof h.c === 'string') chapter.hook = { b: h.b, c: h.c }
  }
  return chapter
}

function coerceVocab(raw: unknown): VocabWord[] {
  if (!Array.isArray(raw)) return []
  const out: VocabWord[] = []
  for (const v of raw) {
    if (typeof v === 'string') out.push({ word: v, meaning: '' })
    else if (v && typeof v === 'object' && typeof (v as { word?: unknown }).word === 'string') {
      const o = v as { word: string; meaning?: unknown; say?: unknown }
      out.push({
        word: o.word,
        meaning: typeof o.meaning === 'string' ? o.meaning : '',
        say: typeof o.say === 'string' ? o.say : undefined,
      })
    }
  }
  return out
}

interface GeneratedRaw {
  title?: string
  coverEmoji?: string
  coverBg?: string
  wash?: WashKey
  kind?: 'quick' | 'chapter'
  chapters?: Chapter[]
  vocab?: VocabWord[]
  teachingGoals?: string[]
  retellPrompts?: string[]
  parentGuide?: string
  quiet?: boolean
  seasonal?: string
}

function coerceStory(raw: unknown): GeneratedRaw {
  if (!raw || typeof raw !== 'object') throw new Error('Not an object')
  const r = raw as Record<string, unknown>
  const out: GeneratedRaw = {}
  if (typeof r.title === 'string') out.title = r.title
  if (typeof r.coverEmoji === 'string') out.coverEmoji = r.coverEmoji
  if (typeof r.coverBg === 'string') out.coverBg = r.coverBg
  const wash = coerceWash(r.wash)
  if (wash) out.wash = wash
  if (r.kind === 'quick' || r.kind === 'chapter') out.kind = r.kind
  if (Array.isArray(r.chapters)) {
    out.chapters = (r.chapters as unknown[])
      .map(coerceChapter)
      .filter((c): c is Chapter => c !== null)
  }
  out.vocab = coerceVocab(r.vocab)
  if (Array.isArray(r.teachingGoals)) {
    out.teachingGoals = (r.teachingGoals as unknown[]).filter((g): g is string => typeof g === 'string')
  }
  if (Array.isArray(r.retellPrompts)) {
    out.retellPrompts = (r.retellPrompts as unknown[]).filter((g): g is string => typeof g === 'string')
  }
  if (typeof r.parentGuide === 'string') out.parentGuide = r.parentGuide
  if (r.quiet === true) out.quiet = true
  if (typeof r.seasonal === 'string') out.seasonal = r.seasonal
  if (!out.chapters || out.chapters.length === 0) throw new Error('No chapters')
  return out
}

// ---------- Rubric --------------------------------------------------------
async function judge(
  apiKey: string,
  story: GeneratedRaw
): Promise<{ score: number; notes: string; inputTokens: number; outputTokens: number }> {
  const compact = JSON.stringify({
    title: story.title,
    chapters: story.chapters?.map((c) => ({
      title: c.title,
      hook: c.hook,
      recapQuestion: c.recapQuestion,
      pages: c.pages.map((p) => ({ text: p.text, ask: p.ask, choice: p.choice, star: p.star })),
    })),
    vocab: story.vocab,
    teachingGoals: story.teachingGoals,
  })
  const { text, inputTokens, outputTokens } = await callAnthropic({
    apiKey,
    model: JUDGE_MODEL,
    system: judgeSystemPrompt(),
    user: `Score this story against the rubric:\n\n${compact}`,
    maxTokens: 1500,
  })
  const cleaned = text.replace(/```json|```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) return { score: 0, notes: 'no JSON', inputTokens, outputTokens }
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as { score?: unknown; notes?: unknown }
    return {
      score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 0,
      notes: typeof parsed.notes === 'string' ? parsed.notes : '',
      inputTokens,
      outputTokens,
    }
  } catch {
    return { score: 0, notes: 'malformed JSON', inputTokens, outputTokens }
  }
}

// ---------- Cost estimator (rough) ---------------------------------------
// Sonnet 4.6-ish: $3/M input, $15/M output. Haiku 4.5-ish: $1/M in, $5/M out.
// These are order-of-magnitude — real numbers depend on the model billed.
function estimateCostUSD(sonnetIn: number, sonnetOut: number, haikuIn: number, haikuOut: number): number {
  return (sonnetIn / 1_000_000) * 3
    + (sonnetOut / 1_000_000) * 15
    + (haikuIn / 1_000_000) * 1
    + (haikuOut / 1_000_000) * 5
}

// ---------- Pack builder --------------------------------------------------
interface PackStoryRecord {
  id: string
  title: string
  by: string
  kind: 'chapter' | 'quick'
  source: 'generated'
  status: 'complete' | 'needs-review'
  coverEmoji: string
  coverBg?: string
  wash?: WashKey
  teachingGoals: string[]
  vocab: VocabWord[]
  retellPrompts: string[]
  parentGuide?: string
  quiet?: boolean
  seasonal?: string
  chapters: Chapter[]
  rubricScore: number
  rubricNotes: string
  brief: Brief
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

async function generateOne(
  apiKey: string,
  brief: Brief,
  byLine: string
): Promise<{ story: PackStoryRecord | null; sonnetIn: number; sonnetOut: number; haikuIn: number; haikuOut: number; log: string }> {
  const sys = systemPrompt(DEFAULT_UNIVERSE)
  const user = briefPrompt(brief, byLine)

  let sonnetIn = 0
  let sonnetOut = 0
  let haikuIn = 0
  let haikuOut = 0

  // Pass 1
  const first = await callAnthropic({
    apiKey,
    model: STORY_MODEL,
    system: sys,
    user,
    maxTokens: 6000,
  })
  sonnetIn += first.inputTokens
  sonnetOut += first.outputTokens

  let story: GeneratedRaw
  try {
    story = coerceStory(extractJSON(first.text))
  } catch (e) {
    return {
      story: null,
      sonnetIn, sonnetOut, haikuIn, haikuOut,
      log: `first-pass invalid (${(e as Error).message})`,
    }
  }

  // Judge pass 1
  const j1 = await judge(apiKey, story)
  haikuIn += j1.inputTokens
  haikuOut += j1.outputTokens

  let finalScore = j1.score
  let finalNotes = j1.notes
  let revisedNote = ''

  // Revision if needed
  if (j1.score < SHIP_GATE_MIN) {
    const revisionUser = `${user}

REVISION REQUESTED — previous draft scored ${j1.score}/100. Judge notes:
"${j1.notes}"

Revise to address those notes. Return the full revised story in the same JSON shape.`
    const second = await callAnthropic({
      apiKey,
      model: STORY_MODEL,
      system: sys,
      user: revisionUser,
      maxTokens: 6000,
    })
    sonnetIn += second.inputTokens
    sonnetOut += second.outputTokens
    try {
      const revised = coerceStory(extractJSON(second.text))
      const j2 = await judge(apiKey, revised)
      haikuIn += j2.inputTokens
      haikuOut += j2.outputTokens
      if (j2.score >= j1.score) {
        story = revised
        finalScore = j2.score
        finalNotes = j2.notes
        revisedNote = `revised → ${j2.score}`
      } else {
        revisedNote = `revision worse (${j2.score}) — kept original`
      }
    } catch (e) {
      revisedNote = `revision invalid (${(e as Error).message}) — kept original`
    }
  }

  const status: PackStoryRecord['status'] = finalScore >= SHIP_GATE_MIN ? 'complete' : 'needs-review'
  const kind = story.kind ?? (story.chapters!.length > 1 ? 'chapter' : 'quick')
  const title = story.title ?? 'Untitled'
  const id = slugify(title) || `pack-${brief.index}`

  const record: PackStoryRecord = {
    id,
    title,
    by: byLine,
    kind,
    source: 'generated',
    status,
    coverEmoji: story.coverEmoji ?? '✨',
    coverBg: story.coverBg,
    wash: story.wash,
    teachingGoals: story.teachingGoals ?? [],
    vocab: story.vocab ?? [],
    retellPrompts: story.retellPrompts ?? [],
    parentGuide: story.parentGuide,
    quiet: story.quiet,
    seasonal: story.seasonal,
    chapters: story.chapters!,
    rubricScore: finalScore,
    rubricNotes: finalNotes,
    brief,
  }

  return {
    story: record,
    sonnetIn, sonnetOut, haikuIn, haikuOut,
    log: `first=${j1.score}${revisedNote ? ' | ' + revisedNote : ''} | final=${finalScore} | status=${status}`,
  }
}

// ---------- Main ----------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv.slice(2))
  console.log(`\n=== Little Fables story-pack generator ===`)
  console.log(`Pack:   pack-${args.pack}`)
  console.log(`Count:  ${args.count}`)
  console.log(`Model:  story=${STORY_MODEL} judge=${JUDGE_MODEL}`)
  console.log(`Gate:   ${SHIP_GATE_MIN}`)
  console.log(`Mode:   ${args.dryRun ? 'DRY RUN (no API calls)' : 'LIVE'}\n`)

  const briefs = buildBriefs(args.count)
  console.log(`Prepared ${briefs.length} briefs (deduped by theme × setting × companion):\n`)
  briefs.forEach((b) => {
    console.log(`  #${b.index} [${b.format}] "${b.theme}" — ${b.companion} at ${b.setting}`)
    console.log(`         skill: ${b.skill}`)
    console.log(`         cultural: ${b.culturalAccent}`)
  })

  if (args.dryRun) {
    console.log(`\n(dry run — no API calls made)`)
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY missing. Set it in .env.local or export it.')
    process.exit(1)
  }

  const byLine = process.env.PACK_BY || 'Made with Papa'
  const stories: PackStoryRecord[] = []
  let totalSonnetIn = 0
  let totalSonnetOut = 0
  let totalHaikuIn = 0
  let totalHaikuOut = 0
  const dropped: Array<{ brief: Brief; reason: string }> = []

  for (const brief of briefs) {
    console.log(`\n[${brief.index}/${briefs.length}] "${brief.theme}" — ${brief.companion} at ${brief.setting}`)
    try {
      const result = await generateOne(apiKey, brief, byLine)
      totalSonnetIn += result.sonnetIn
      totalSonnetOut += result.sonnetOut
      totalHaikuIn += result.haikuIn
      totalHaikuOut += result.haikuOut
      const cost = estimateCostUSD(result.sonnetIn, result.sonnetOut, result.haikuIn, result.haikuOut)
      console.log(`         ${result.log} | ~$${cost.toFixed(3)}`)
      if (!result.story) {
        dropped.push({ brief, reason: result.log })
        continue
      }
      stories.push(result.story)
    } catch (e) {
      console.error(`         FAILED: ${(e as Error).message}`)
      dropped.push({ brief, reason: (e as Error).message })
    }
  }

  const totalCost = estimateCostUSD(totalSonnetIn, totalSonnetOut, totalHaikuIn, totalHaikuOut)
  console.log(`\n=== Summary ===`)
  console.log(`Kept:    ${stories.length}`)
  console.log(`Dropped: ${dropped.length}`)
  console.log(`Tokens:  sonnet in=${totalSonnetIn} out=${totalSonnetOut} | haiku in=${totalHaikuIn} out=${totalHaikuOut}`)
  console.log(`Est cost: ~$${totalCost.toFixed(3)}`)

  const outPath = join(PACKS_DIR, `pack-${args.pack}.json`)
  mkdirSync(PACKS_DIR, { recursive: true })
  const pack = {
    pack: `pack-${args.pack}`,
    note: `Generated by scripts/generate-story-pack.ts. Model: ${STORY_MODEL}. Ship gate: ${SHIP_GATE_MIN}.`,
    generatedAt: new Date().toISOString(),
    stories: stories.map((s) => {
      const out: Record<string, unknown> = {
        id: s.id,
        title: s.title,
        by: s.by,
        kind: s.kind,
        source: s.source,
        status: s.status,
        coverEmoji: s.coverEmoji,
        coverBg: s.coverBg,
        wash: s.wash,
        teachingGoals: s.teachingGoals,
        vocab: s.vocab,
        retellPrompts: s.retellPrompts,
        parentGuide: s.parentGuide,
        quiet: s.quiet,
        seasonal: s.seasonal,
        chapters: s.chapters,
        rubricScore: s.rubricScore,
        rubricNotes: s.rubricNotes,
      }
      // Strip undefined keys for cleaner JSON.
      Object.keys(out).forEach((k) => out[k] === undefined && delete out[k])
      return out
    }),
    dropped: dropped.map((d) => ({ brief: d.brief, reason: d.reason })),
  }
  writeFileSync(outPath, JSON.stringify(pack, null, 2), 'utf8')
  console.log(`Wrote:   ${outPath}\n`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
