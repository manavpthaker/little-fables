/**
 * Little Fables — character reference sheet generator.
 *
 * Reads `content/art/characters.json`, prompts Gemini for a 3-pose reference
 * sheet per character, and writes candidate PNGs + meta JSONs to
 * `public/art-preview/sheets/<char_id>/pending/`.
 *
 * Usage:
 *   npm run art:characters -- --dry-run
 *   npm run art:characters -- --char char_azi --count 2
 *   npm run art:characters -- --force
 *
 * Costs: rough estimate — each Gemini image request is ~$0.03-0.05. For all
 * 15 characters × 2 candidates ≈ 30 image generations ≈ $1-1.50.
 */
import 'dotenv/config'
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { generateGeminiImage } from '../lib/art/gemini'
import {
  REPO_ROOT,
  characterPendingDir,
  characterCandidateFilename,
  characterCandidateMetaFilename,
  timestampSlug,
} from '../lib/art/paths'

// ---------- Characters schema (narrow — we tolerate extra fields) ----------
interface CharacterBibleEntry {
  id: string
  name: string
  role: string
  species?: string
  personality?: string
  loves?: string
  traits?: string[]
  visualAnchors?: string[]
  roleByBand?: Record<string, string>
}

interface CharacterBible {
  version?: string
  characters: CharacterBibleEntry[]
}

const CHARACTERS_PATH = join(REPO_ROOT, 'content', 'art', 'characters.json')

function loadBible(): CharacterBible {
  if (!existsSync(CHARACTERS_PATH)) {
    throw new Error(`characters.json not found at ${CHARACTERS_PATH}`)
  }
  const raw = readFileSync(CHARACTERS_PATH, 'utf8')
  return JSON.parse(raw) as CharacterBible
}

// ---------- Prompt ----------
function inferSpecies(c: CharacterBibleEntry): string {
  if (c.species && c.species.trim().length > 0) return c.species
  if (c.id === 'char_azi') return 'child (mixed Colombian and Indian heritage)'
  return 'child'
}

function characterPrompt(c: CharacterBibleEntry): string {
  const traits = (c.traits ?? []).join(', ') || 'gentle, distinct, kind'
  const anchors = (c.visualAnchors ?? []).join(', ') || 'clear silhouette, memorable feature'
  const loves = c.loves ?? '—'
  const roleFourEight = c.roleByBand?.['4-8'] ?? c.role

  return [
    "Character reference sheet for a children's book character.",
    "Style: warm hand-drawn watercolor with ink linework, textured paper feel,",
    "gentle warm palette (paper cream + warm ink + occasional wash pigments —",
    "marigold, sage, terracotta, dusk).",
    "",
    `Character: ${c.name} — ${c.role}. Species: ${inferSpecies(c)}.`,
    `Traits: ${traits}.`,
    `Loves: ${loves}.`,
    `Visual anchors: ${anchors}.`,
    `Age band context (4-8): ${roleFourEight}.`,
    "",
    "Show the character in three poses on a single sheet:",
    "(1) idle standing three-quarter view,",
    "(2) listening/leaning-in pose,",
    "(3) celebrating pose.",
    "",
    "Clean paper background. No text labels. No border, no frame.",
    "Consistent character between poses — same shape, same features, same colors.",
  ].join('\n')
}

// ---------- Args ----------
interface Args {
  char?: string
  count: number
  force: boolean
  dryRun: boolean
  verbose: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Args = { count: 2, force: false, dryRun: false, verbose: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--char') args.char = argv[++i]
    else if (a === '--count') args.count = Number(argv[++i] ?? args.count)
    else if (a === '--force') args.force = true
    else if (a === '--dry-run' || a === '--dryRun') args.dryRun = true
    else if (a === '--verbose' || a === '-v') args.verbose = true
    else if (a === '--help' || a === '-h') {
      console.log(
        'Usage: npm run art:characters -- [--char <id>] [--count N] [--force] [--dry-run]',
      )
      process.exit(0)
    }
  }
  return args
}

// ---------- Skip logic ----------
function countPendingFor(charId: string): number {
  const dir = characterPendingDir(charId)
  if (!existsSync(dir)) return 0
  return readdirSync(dir).filter((f) => f.endsWith('.png')).length
}

// ---------- Meta writer ----------
interface CharacterMeta {
  prompt: string
  model: string
  seed?: number
  generatedAt: string
  status: 'pending'
  kind: 'character-sheet'
  characterId: string
}

function writeMeta(pendingDir: string, filename: string, meta: CharacterMeta): string {
  const target = join(pendingDir, filename)
  writeFileSync(target, JSON.stringify(meta, null, 2), 'utf8')
  return target
}

// ---------- Main ----------
async function main() {
  const args = parseArgs(process.argv.slice(2))
  const apiKey = process.env.GEMINI_API_KEY

  if (!args.dryRun && !apiKey) {
    console.error('Missing GEMINI_API_KEY. Set it in .env.local or pass --dry-run.')
    process.exit(1)
  }

  const bible = loadBible()
  const targets = args.char
    ? bible.characters.filter((c) => c.id === args.char)
    : bible.characters

  if (targets.length === 0) {
    console.error(`No character matched --char="${args.char}". Check content/art/characters.json.`)
    process.exit(1)
  }

  console.log(
    `[art:characters] ${args.dryRun ? 'DRY RUN — ' : ''}targets: ${targets.length} · candidates each: ${args.count}`,
  )

  let totalRequests = 0
  let totalWritten = 0
  let skipped = 0
  let succeededModel = ''

  for (const c of targets) {
    const existing = countPendingFor(c.id)
    if (!args.force && existing >= args.count) {
      console.log(`  · ${c.id.padEnd(20)} SKIP (${existing} pending files already; --force to override)`)
      skipped++
      continue
    }

    const prompt = characterPrompt(c)
    if (args.dryRun) {
      console.log(`  · ${c.id.padEnd(20)} PLAN — ${args.count} candidate(s)`)
      if (args.verbose) console.log(prompt.replace(/^/gm, '        '))
      totalRequests += 1 // one API call per character (candidateCount inside)
      continue
    }

    const pendingDir = characterPendingDir(c.id)
    const ts = timestampSlug()
    try {
      totalRequests += 1
      const result = await generateGeminiImage({
        apiKey: apiKey!,
        prompt,
        candidateCount: args.count,
        preferModel: succeededModel || undefined,
        verbose: args.verbose,
      })
      if (!succeededModel) succeededModel = result.model
      const cands = result.candidates.slice(0, args.count)
      for (let i = 0; i < cands.length; i++) {
        const idx = i + 1
        const pngName = characterCandidateFilename(ts, idx)
        const metaName = characterCandidateMetaFilename(ts, idx)
        writeFileSync(join(pendingDir, pngName), Buffer.from(cands[i].base64, 'base64'))
        writeMeta(pendingDir, metaName, {
          prompt,
          model: result.model,
          generatedAt: new Date().toISOString(),
          status: 'pending',
          kind: 'character-sheet',
          characterId: c.id,
        })
        totalWritten++
      }
      console.log(`  · ${c.id.padEnd(20)} OK — ${cands.length} candidate(s) via ${result.model}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  · ${c.id.padEnd(20)} FAIL — ${msg}`)
    }
  }

  const estCostPerReq = 0.04
  const estTotal = (totalRequests * estCostPerReq).toFixed(2)
  console.log('')
  console.log(`[art:characters] done · requests: ${totalRequests} · files written: ${totalWritten} · skipped: ${skipped}`)
  console.log(`[art:characters] rough cost estimate: ~$${estTotal} (at $${estCostPerReq}/image request)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
