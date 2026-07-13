/**
 * Little Fables — scene image generator.
 *
 * Loads the director plan for a book plus any approved character reference
 * sheets, then calls Gemini with a text prompt (+ reference images when
 * available) to produce 1-2 candidate scene PNGs per page. Writes to
 * `public/art-preview/scenes/<book_id>/pending/`.
 *
 * Usage:
 *   npm run art:generate -- --book bus-detour --dry-run
 *   npm run art:generate -- --book bus-detour --page 0-3 --count 2
 *
 * Cost: same ballpark as art:characters — ~$0.03-0.05 per candidate. A
 * pack-000 book (bus-detour has 15 pages) at 2 candidates ≈ $0.9-1.5.
 */
import 'dotenv/config'
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { generateGeminiImage, type GeminiImagePart } from '../lib/art/gemini'
import {
  REPO_ROOT,
  characterApprovedDir,
  directorPlanPath,
  extFromMime,
  scenePendingDir,
  sceneCandidateFilename,
  sceneCandidateMetaFilename,
  timestampSlug,
} from '../lib/art/paths'

interface PlanEntry {
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

interface CharacterBibleEntry {
  id: string
  name: string
  role: string
  visualAnchors?: string[]
}

const CHARACTERS_PATH = join(REPO_ROOT, 'content', 'art', 'characters.json')

function loadBible(): Record<string, CharacterBibleEntry> {
  const raw = JSON.parse(readFileSync(CHARACTERS_PATH, 'utf8')) as {
    characters: CharacterBibleEntry[]
  }
  const out: Record<string, CharacterBibleEntry> = {}
  for (const c of raw.characters) out[c.id] = c
  return out
}

function loadPlan(bookId: string): PlanEntry[] {
  const p = directorPlanPath(bookId)
  if (!existsSync(p)) {
    throw new Error(
      `Director plan missing at ${p}. Run \`npm run art:director -- --book ${bookId}\` first.`,
    )
  }
  return JSON.parse(readFileSync(p, 'utf8')) as PlanEntry[]
}

// ---------- Character refs ----------
interface ResolvedRef {
  characterId: string
  path: string
  base64: string
}

function loadApprovedRefsFor(charIds: string[]): { refs: ResolvedRef[]; missing: string[] } {
  const refs: ResolvedRef[] = []
  const missing: string[] = []
  for (const id of charIds) {
    const dir = characterApprovedDir(id)
    const files = existsSync(dir)
      ? readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.png'))
      : []
    if (files.length === 0) {
      missing.push(id)
      continue
    }
    // Use the first approved ref as the primary anchor. Parent Corner can
    // rotate which file wins by naming (ref-01.png sorts first).
    const chosen = files.sort()[0]
    const full = join(dir, chosen)
    const base64 = readFileSync(full).toString('base64')
    refs.push({ characterId: id, path: full, base64 })
  }
  return { refs, missing }
}

// ---------- Prompt ----------
function scenePrompt(entry: PlanEntry, bible: Record<string, CharacterBibleEntry>): string {
  const chars = entry.characters
    .map((id) => bible[id])
    .filter((c): c is CharacterBibleEntry => !!c)

  const characterLines = chars.length
    ? chars
        .map((c) => {
          const anchors = (c.visualAnchors ?? []).join(', ') || '(no visual anchors specified)'
          return `  - ${c.name} (${c.role}) — visual anchors: ${anchors}`
        })
        .join('\n')
    : '  - (no bible characters — draw the scene per setting + action)'

  const styleAnchors =
    entry.styleAnchors.length > 0
      ? `\nStyle continuity references (from earlier in the book or canon):\n${entry.styleAnchors.map((s) => `  - ${s}`).join('\n')}`
      : ''

  return [
    "Scene illustration for a children's book. Warm watercolor + ink linework, textured paper feel, gentle palette.",
    "",
    `Setting: ${entry.setting}`,
    `Action: ${entry.action}`,
    `Mood: ${entry.mood}`,
    `Composition: ${entry.composition}`,
    `Palette: ${entry.paletteHint}`,
    "",
    "Characters present:",
    characterLines,
    styleAnchors,
    "",
    "Render as a single cinematic scene. No text, no captions, no borders, no page numbers.",
    "Consistent with the character reference images provided (if any) — same shapes, features, colors.",
  ]
    .filter((s) => s !== undefined)
    .join('\n')
}

// ---------- Args ----------
interface Args {
  book?: string
  page?: string  // "chapterIdx-pageIdx"
  count: number
  force: boolean
  dryRun: boolean
  verbose: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Args = { count: 2, force: false, dryRun: false, verbose: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--book') args.book = argv[++i]
    else if (a === '--page') args.page = argv[++i]
    else if (a === '--count') args.count = Number(argv[++i] ?? args.count)
    else if (a === '--force') args.force = true
    else if (a === '--dry-run' || a === '--dryRun') args.dryRun = true
    else if (a === '--verbose' || a === '-v') args.verbose = true
    else if (a === '--help' || a === '-h') {
      console.log(
        'Usage: npm run art:generate -- --book <id> [--page <ch>-<pg>] [--count N] [--force] [--dry-run]',
      )
      process.exit(0)
    }
  }
  return args
}

function pageFilter(args: Args): (e: PlanEntry) => boolean {
  if (!args.page) return () => true
  const parts = args.page.split('-').map((p) => Number(p))
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`--page must be in "ch-pg" form (e.g. 0-3). Got: "${args.page}"`)
  }
  const [ch, pg] = parts
  return (e) => e.chapterIdx === ch && e.pageIdx === pg
}

// ---------- Skip logic ----------
function countPendingForPage(bookId: string, chapterIdx: number, pageIdx: number): number {
  const dir = scenePendingDir(bookId)
  if (!existsSync(dir)) return 0
  const prefix = `${chapterIdx}-${pageIdx}-candidate-`
  return readdirSync(dir).filter((f) => f.startsWith(prefix) && f.endsWith('.png')).length
}

// ---------- Meta ----------
interface SceneMeta {
  prompt: string
  model: string
  mimeType?: string
  generatedAt: string
  status: 'pending'
  kind: 'scene'
  bookId: string
  chapterIdx: number
  pageIdx: number
  sceneKey: string | null
  sourceScenes: string[]
  sourceCharacterRefs: string[]
  characters: string[]
}

// ---------- Main ----------
async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.book) {
    console.error('--book <id> is required')
    process.exit(1)
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!args.dryRun && !apiKey) {
    console.error('Missing GEMINI_API_KEY. Set it in .env.local or pass --dry-run.')
    process.exit(1)
  }

  // Load plan (missing plan is a warn-and-stop for --dry-run so authors get
  // told to run the director first).
  let plan: PlanEntry[]
  try {
    plan = loadPlan(args.book)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (args.dryRun) {
      console.warn(`[art:generate] ${msg}`)
      console.warn('[art:generate] Continuing dry-run with 0 planned calls.')
      return
    }
    throw err
  }

  const bible = loadBible()
  const filtered = plan.filter(pageFilter(args))
  if (filtered.length === 0) {
    console.error(`No plan entries matched. Book: ${args.book}${args.page ? `, --page ${args.page}` : ''}`)
    process.exit(1)
  }

  console.log(
    `[art:generate] ${args.dryRun ? 'DRY RUN — ' : ''}book: ${args.book} · entries: ${filtered.length} · candidates each: ${args.count}`,
  )

  let totalRequests = 0
  let totalWritten = 0
  let skipped = 0
  let succeededModel = ''

  for (const entry of filtered) {
    const label = `${entry.chapterIdx}-${entry.pageIdx}`
    const existing = countPendingForPage(args.book, entry.chapterIdx, entry.pageIdx)
    if (!args.force && existing >= args.count) {
      console.log(`  · ${label.padEnd(6)} SKIP (${existing} pending files; --force to override)`)
      skipped++
      continue
    }

    const { refs, missing } = loadApprovedRefsFor(entry.characters)
    if (missing.length > 0) {
      console.log(`  · ${label.padEnd(6)} note — no approved refs yet for: ${missing.join(', ')}`)
    }

    const prompt = scenePrompt(entry, bible)

    if (args.dryRun) {
      totalRequests += 1
      console.log(
        `  · ${label.padEnd(6)} PLAN — ${args.count} candidate(s); refs: ${refs.length}/${entry.characters.length}`,
      )
      if (args.verbose) {
        console.log(prompt.replace(/^/gm, '        '))
      }
      continue
    }

    const referenceImages: GeminiImagePart[] = refs.map((r) => ({
      mimeType: 'image/png',
      data: r.base64,
    }))

    const pendingDir = scenePendingDir(args.book)
    const ts = timestampSlug()
    try {
      totalRequests += 1
      const result = await generateGeminiImage({
        apiKey: apiKey!,
        prompt,
        candidateCount: args.count,
        referenceImages,
        preferModel: succeededModel || undefined,
        verbose: args.verbose,
      })
      if (!succeededModel) succeededModel = result.model
      const cands = result.candidates.slice(0, args.count)
      for (let i = 0; i < cands.length; i++) {
        const idx = i + 1
        const ext = extFromMime(cands[i].mimeType)
        const imgName = sceneCandidateFilename(entry.chapterIdx, entry.pageIdx, ts, idx, ext)
        const metaName = sceneCandidateMetaFilename(entry.chapterIdx, entry.pageIdx, ts, idx)
        writeFileSync(join(pendingDir, imgName), Buffer.from(cands[i].base64, 'base64'))
        const meta: SceneMeta = {
          prompt,
          model: result.model,
          mimeType: cands[i].mimeType,
          generatedAt: new Date().toISOString(),
          status: 'pending',
          kind: 'scene',
          bookId: args.book,
          chapterIdx: entry.chapterIdx,
          pageIdx: entry.pageIdx,
          sceneKey: entry.sceneKey,
          sourceScenes: entry.styleAnchors,
          sourceCharacterRefs: refs.map((r) => r.path),
          characters: entry.characters,
        }
        writeFileSync(join(pendingDir, metaName), JSON.stringify(meta, null, 2), 'utf8')
        totalWritten++
      }
      console.log(`  · ${label.padEnd(6)} OK — ${cands.length} candidate(s) via ${result.model} (refs=${refs.length})`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  · ${label.padEnd(6)} FAIL — ${msg}`)
    }
  }

  const estCostPerReq = 0.04
  const estTotal = (totalRequests * estCostPerReq).toFixed(2)
  console.log('')
  console.log(`[art:generate] done · requests: ${totalRequests} · files written: ${totalWritten} · skipped: ${skipped}`)
  console.log(`[art:generate] rough cost estimate: ~$${estTotal} (at $${estCostPerReq}/image request)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
