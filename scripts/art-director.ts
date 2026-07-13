/**
 * Little Fables — art director planner.
 *
 * Given a book id, load the book (pack-000 or starter-stories), send its
 * chapters + pages to Claude alongside the character bible + pigment palette,
 * and get back a per-page illustration plan. Writes the plan to
 * `public/art-preview/director/<book_id>/plan.json`.
 *
 * Usage:
 *   npm run art:director -- --book bus-detour --dry-run
 *   npm run art:director -- --book bus-detour
 *   npm run art:director -- --book miko-bridge --force
 *
 * Cost: one Anthropic Sonnet call per book. Rough ~5-15k input tokens, ~2-6k
 * output tokens per book. At Sonnet-4 rates (~$3/M input, ~$15/M output),
 * that's ~$0.05-$0.15 per book.
 */
import 'dotenv/config'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Book, Chapter, Page } from '../types/story'
import { STARTER_STORIES } from '../lib/read/starter-stories'
import { callAnthropicJSON, extractJSON } from '../lib/art/anthropic'
import { REPO_ROOT, directorPlanPath, directorDir } from '../lib/art/paths'

// ---------- Pack loading ----------
interface PackFile {
  pack?: string
  stories: Book[]
}

const PACK_PATH = join(REPO_ROOT, 'content', 'packs', 'pack-000-family-originals.json')

function loadBook(bookId: string): Book | null {
  // 1) Pack-000
  if (existsSync(PACK_PATH)) {
    try {
      const pack = JSON.parse(readFileSync(PACK_PATH, 'utf8')) as PackFile
      const hit = pack.stories?.find((b) => b.id === bookId)
      if (hit) return hit
    } catch (e) {
      console.warn('[art:director] failed to parse pack-000:', e)
    }
  }
  // 2) Starter stories (in-memory).
  const starter = STARTER_STORIES.find((b) => b.id === bookId)
  if (starter) return starter
  return null
}

// ---------- Character bible (compact form for prompt) ----------
interface CharacterCompact {
  id: string
  name: string
  role: string
  species?: string
  visualAnchors?: string[]
  traits?: string[]
}

interface CharacterBible {
  characters: Array<CharacterCompact & Record<string, unknown>>
}

const CHARACTERS_PATH = join(REPO_ROOT, 'content', 'art', 'characters.json')

function loadCharacterBibleCompact(): CharacterCompact[] {
  const raw = JSON.parse(readFileSync(CHARACTERS_PATH, 'utf8')) as CharacterBible
  return raw.characters.map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role,
    species: typeof c.species === 'string' ? c.species : undefined,
    visualAnchors: Array.isArray(c.visualAnchors) ? c.visualAnchors : undefined,
    traits: Array.isArray(c.traits) ? c.traits : undefined,
  }))
}

// ---------- Pigment palette ----------
// Mirrors the wash keys in types/story.ts and the watercolor style set in the
// v3.2 handoff. The director should draw pigment names from this list.
const PIGMENT_PALETTE = [
  'canyon (warm terracotta / rust)',
  'sunset (marigold / peach)',
  'meadow (sage / spring green)',
  'lilac (soft muted purple)',
  'blush (dusty rose)',
  'river (dusk blue)',
  'snow (paper cream)',
  'honey (golden amber)',
] as const

// ---------- Plan entry ----------
export interface PlanEntry {
  chapterIdx: number
  pageIdx: number
  sceneKey: string | null
  characters: string[]
  setting: string
  action: string
  mood: string
  composition: string
  paletteHint: string
  styleAnchors: string[]
}

// ---------- Prompt ----------
function systemPrompt(characters: CharacterCompact[]): string {
  return [
    "You are the art director for a warm children's picture book, working in a hand-drawn watercolor + ink style.",
    "",
    "You will receive a Book with chapters and pages. Every page carries a semantic `scene` key.",
    "For EACH page, produce one plan entry describing the illustration.",
    "",
    "Character bible (use these ids exactly when a character appears in a scene):",
    JSON.stringify(characters, null, 2),
    "",
    "Pigment palette to draw from (use the short name, e.g. 'canyon', 'honey'):",
    PIGMENT_PALETTE.map((p) => `  • ${p}`).join('\n'),
    "",
    "Style constants that apply to every scene (do NOT restate these — they are baked into the render):",
    "  - warm watercolor + ink linework, textured paper feel",
    "  - never lecture-y or over-detailed — leave room to breathe",
    "  - no text inside the image, no borders, no page numbers",
    "",
    "Output shape — a JSON array (no fences, no prose), one entry per page in reading order:",
    "",
    "[",
    "  {",
    '    "chapterIdx": number,     // zero-based',
    '    "pageIdx": number,        // zero-based within chapter',
    '    "sceneKey": string|null,  // carry through from page.scene',
    '    "characters": string[],   // ids from the bible present in this scene',
    '    "setting": string,        // 2-3 concrete phrases about the place',
    '    "action": string,         // one line about what is happening',
    '    "mood": string,           // emotional register (soft, hopeful, alert, tender…)',
    '    "composition": string,    // shot framing (wide, close on Azi, over-the-shoulder…)',
    '    "paletteHint": string,    // one or two pigment names',
    '    "styleAnchors": string[]  // 1-2 references — earlier scene in this book, or a canon anchor',
    "  }",
    "]",
    "",
    "Rules:",
    "  - Return JSON only. No markdown fences, no commentary.",
    "  - Every page must appear (do not skip pages). Preserve reading order.",
    "  - `characters` uses the exact ids from the bible (e.g. 'char_azi'). If no bible character clearly appears, return [].",
    "  - `paletteHint` uses palette short-names ONLY (canyon, sunset, meadow, lilac, blush, river, snow, honey).",
    "  - Keep composition varied across the book — vary wide/close/detail so the book breathes.",
  ].join('\n')
}

function bookForPrompt(book: Book): unknown {
  const chapters = (book.chapters ?? []).map((ch: Chapter, i: number) => ({
    chapterIdx: i,
    title: ch.title,
    wash: ch.wash,
    pages: ch.pages.map((p: Page, j: number) => ({
      pageIdx: j,
      sceneKey: p.scene ?? null,
      text: p.text,
      star: p.star,
      ask: p.ask ? { skill: p.ask.skill, question: p.ask.question } : undefined,
      choice: p.choice ? { prompt: p.choice.prompt } : undefined,
    })),
  }))
  return {
    id: book.id,
    title: book.title,
    kind: book.kind,
    wash: book.wash,
    teachingGoals: book.teachingGoals,
    chapters,
  }
}

// ---------- Args ----------
interface Args {
  book?: string
  force: boolean
  dryRun: boolean
  verbose: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Args = { force: false, dryRun: false, verbose: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--book') args.book = argv[++i]
    else if (a === '--force') args.force = true
    else if (a === '--dry-run' || a === '--dryRun') args.dryRun = true
    else if (a === '--verbose' || a === '-v') args.verbose = true
    else if (a === '--help' || a === '-h') {
      console.log('Usage: npm run art:director -- --book <id> [--force] [--dry-run]')
      process.exit(0)
    }
  }
  return args
}

// ---------- Coerce plan output ----------
function coercePlan(raw: unknown): PlanEntry[] {
  if (!Array.isArray(raw)) throw new Error('Director output was not a JSON array')
  const out: PlanEntry[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    if (typeof o.chapterIdx !== 'number' || typeof o.pageIdx !== 'number') continue
    out.push({
      chapterIdx: o.chapterIdx,
      pageIdx: o.pageIdx,
      sceneKey: typeof o.sceneKey === 'string' ? o.sceneKey : null,
      characters: Array.isArray(o.characters)
        ? (o.characters as unknown[]).filter((x): x is string => typeof x === 'string')
        : [],
      setting: typeof o.setting === 'string' ? o.setting : '',
      action: typeof o.action === 'string' ? o.action : '',
      mood: typeof o.mood === 'string' ? o.mood : '',
      composition: typeof o.composition === 'string' ? o.composition : '',
      paletteHint: typeof o.paletteHint === 'string' ? o.paletteHint : '',
      styleAnchors: Array.isArray(o.styleAnchors)
        ? (o.styleAnchors as unknown[]).filter((x): x is string => typeof x === 'string')
        : [],
    })
  }
  return out
}

// ---------- Main ----------
async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.book) {
    console.error('--book <id> is required')
    process.exit(1)
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  const model = process.env.STORY_MODEL || 'claude-sonnet-4-6'

  if (!args.dryRun && !apiKey) {
    console.error('Missing ANTHROPIC_API_KEY. Set it in .env.local or pass --dry-run.')
    process.exit(1)
  }

  const book = loadBook(args.book)
  if (!book) {
    console.error(`Book "${args.book}" not found in pack-000 or starter-stories.`)
    process.exit(1)
  }

  const outPath = directorPlanPath(book.id)
  if (existsSync(outPath) && !args.force) {
    console.error(`Plan already exists at ${outPath}. Pass --force to overwrite.`)
    process.exit(1)
  }

  const characters = loadCharacterBibleCompact()
  const system = systemPrompt(characters)
  const userPayload = bookForPrompt(book)
  const user = [
    `Plan the illustrations for this Book. Return the JSON array described in the system prompt.`,
    '',
    JSON.stringify(userPayload, null, 2),
  ].join('\n')

  const totalPages = (book.chapters ?? []).reduce((n, ch) => n + ch.pages.length, 0)
  const approxTokens = Math.round((system.length + user.length) / 4)

  console.log(`[art:director] book: ${book.id} · chapters: ${book.chapters?.length ?? 0} · pages: ${totalPages}`)
  console.log(`[art:director] rough prompt size: ~${approxTokens} input tokens`)
  console.log(`[art:director] output → ${outPath}`)

  if (args.dryRun) {
    console.log('[art:director] DRY RUN — not calling Anthropic.')
    if (args.verbose) {
      console.log('---- SYSTEM ----')
      console.log(system)
      console.log('---- USER ----')
      console.log(user.slice(0, 2000) + (user.length > 2000 ? `\n[…${user.length - 2000} more chars]` : ''))
    }
    // Print an illustrative empty plan shape for one page.
    console.log('---- INTENDED PLAN SHAPE (example, one entry) ----')
    console.log(
      JSON.stringify(
        [
          {
            chapterIdx: 0,
            pageIdx: 0,
            sceneKey: (book.chapters?.[0]?.pages?.[0]?.scene ?? null) as string | null,
            characters: ['char_azi', 'char_jujy'],
            setting: '(director will fill)',
            action: '(director will fill)',
            mood: '(director will fill)',
            composition: '(director will fill)',
            paletteHint: '(canyon | honey | …)',
            styleAnchors: ['(previous scene or canon anchor)'],
          },
        ],
        null,
        2,
      ),
    )
    return
  }

  const started = Date.now()
  const result = await callAnthropicJSON({
    apiKey: apiKey!,
    model,
    system,
    user,
    maxTokens: 8000,
  })
  const took = ((Date.now() - started) / 1000).toFixed(1)
  const parsed = extractJSON(result.text)
  const plan = coercePlan(parsed)

  directorDir(book.id) // ensure the dir
  writeFileSync(outPath, JSON.stringify(plan, null, 2), 'utf8')

  console.log(
    `[art:director] wrote ${plan.length}/${totalPages} plan entries in ${took}s ` +
      `(in=${result.inputTokens ?? '?'} out=${result.outputTokens ?? '?'})`,
  )
  if (plan.length !== totalPages) {
    console.warn(`[art:director] WARN — expected ${totalPages} entries, got ${plan.length}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
