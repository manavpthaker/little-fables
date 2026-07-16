#!/usr/bin/env tsx
/**
 * Pre-generate ElevenLabs audio + word timestamps for every page in a pack.
 *
 * Usage:
 *   npx tsx scripts/generate-audio.ts                     # all books, resume
 *   npx tsx scripts/generate-audio.ts --book bus-detour   # one book
 *   npx tsx scripts/generate-audio.ts --dry-run           # no API calls
 *
 * Reads env directly (no need for the API route). Writes:
 *   public/audio/{bookId}/{chapterIdx}-{pageIdx}.mp3
 *   public/audio/{bookId}/{chapterIdx}-{pageIdx}.timestamps.json
 *
 * Skips files that already exist (resume behavior) — UNLESS the existing
 * timestamps no longer match the page's current text (the story was edited
 * after its audio was made). Stale pages are regenerated so the narration can
 * never read different words than the page shows. `--check` reports staleness
 * without calling the API.
 */

import 'dotenv/config'
import { readFile, mkdir, writeFile, access } from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

interface WordTimestamp {
  word: string
  start: number
  end: number
}

interface Page {
  text?: string
}
interface Chapter {
  title?: string
  pages?: Page[]
}
interface PackStory {
  id: string
  title?: string
  chapters?: Chapter[]
}
interface Pack {
  stories: PackStory[]
}

// ---------- CLI ----------

interface Args {
  book?: string
  dryRun: boolean
  check: boolean
  packPath: string
  outDir: string
  source: 'pack' | 'starters'
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    dryRun: false,
    check: false,
    packPath: 'content/packs/pack-000-family-originals.json',
    outDir: 'public/audio',
    source: 'pack',
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--book') args.book = argv[++i]
    else if (a === '--dry-run') args.dryRun = true
    else if (a === '--check') args.check = true
    else if (a === '--pack') args.packPath = argv[++i]
    else if (a === '--out') args.outDir = argv[++i]
    else if (a === '--source') args.source = argv[++i] as 'pack' | 'starters'
    else if (a === '--help' || a === '-h') {
      console.log(
        'Usage: npx tsx scripts/generate-audio.ts [--book <id>] [--dry-run] [--check] [--pack <path>] [--out <dir>] [--source pack|starters]',
      )
      process.exit(0)
    }
  }
  return args
}

// ---------- Staleness ----------
// Same normalization the reader uses: audio whose word list doesn't match the
// page's current text is stale and must be regenerated.
function normWord(w: string): string {
  return w.toLowerCase().replace(/[^a-z0-9']/gi, '')
}
function timestampsMatchText(timestamps: WordTimestamp[], text: string): boolean {
  const textWords = text.split(/\s+/).map(normWord).filter(Boolean)
  const tsWords = timestamps.map((t) => normWord(t.word)).filter(Boolean)
  if (textWords.length !== tsWords.length) return false
  for (let i = 0; i < textWords.length; i++) {
    if (textWords[i] !== tsWords[i]) return false
  }
  return true
}

// ---------- ElevenLabs ----------

interface ElevenLabsAlignment {
  characters: string[]
  character_start_times_seconds: number[]
  character_end_times_seconds: number[]
}
interface ElevenLabsResponse {
  audio_base64: string
  alignment: ElevenLabsAlignment
  normalized_alignment?: ElevenLabsAlignment
}

function charAlignmentToWords(alignment: ElevenLabsAlignment | undefined): WordTimestamp[] {
  if (!alignment || !alignment.characters) return []
  const words: WordTimestamp[] = []
  const chars = alignment.characters
  const starts = alignment.character_start_times_seconds
  const ends = alignment.character_end_times_seconds
  let current = ''
  let currentStart: number | null = null
  let currentEnd: number | null = null
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]
    if (/\s/.test(ch)) {
      if (current) {
        words.push({
          word: current,
          start: currentStart ?? 0,
          end: currentEnd ?? currentStart ?? 0,
        })
      }
      current = ''
      currentStart = null
      currentEnd = null
    } else {
      if (currentStart == null) currentStart = starts[i] ?? 0
      currentEnd = ends[i] ?? starts[i] ?? currentEnd ?? 0
      current += ch
    }
  }
  if (current) {
    words.push({
      word: current,
      start: currentStart ?? 0,
      end: currentEnd ?? currentStart ?? 0,
    })
  }
  return words
}

async function ttsElevenLabs(
  text: string,
  voiceId: string,
  apiKey: string,
  modelId: string,
): Promise<{ audio: Buffer; timestamps: WordTimestamp[] }> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      output_format: 'mp3_44100_128',
    }),
  })
  if (!res.ok) {
    const raw = await res.text().catch(() => '')
    throw new Error(`ElevenLabs ${res.status}: ${raw.slice(0, 300)}`)
  }
  const data = (await res.json()) as ElevenLabsResponse
  const audio = Buffer.from(data.audio_base64, 'base64')
  const timestamps = charAlignmentToWords(data.normalized_alignment ?? data.alignment)
  return { audio, timestamps }
}

// ---------- FS helpers ----------

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, fsConstants.F_OK)
    return true
  } catch {
    return false
  }
}

async function ensureDir(path: string) {
  await mkdir(path, { recursive: true })
}

// ---------- Main ----------

async function main() {
  const args = parseArgs(process.argv.slice(2))

  const __filename = fileURLToPath(import.meta.url)
  const projectRoot = resolve(dirname(__filename), '..')
  const packPath = resolve(projectRoot, args.packPath)
  const outRoot = resolve(projectRoot, args.outDir)

  let stories: Array<{ id: string; chapters: Array<{ pages: Array<{ text?: string }> }> }>
  if (args.source === 'starters') {
    // Starter books live in TypeScript. Import compiled Book[] and reshape to
    // the pack iteration form (id + chapters[].pages[].text). tsx handles the
    // TS import natively; we resolve via file:// URL from the project root.
    const starterUrl = new URL('../lib/read/starter-stories.ts', import.meta.url).href
    const mod = (await import(starterUrl)) as {
      STARTER_STORIES: Array<{
        id: string
        chapters: Array<{ pages: Array<{ text: string }> }>
      }>
    }
    stories = mod.STARTER_STORIES.filter((s) => !args.book || s.id === args.book).map((s) => ({
      id: s.id,
      chapters: s.chapters.map((c) => ({ pages: c.pages.map((p) => ({ text: p.text })) })),
    }))
    if (!stories.length) {
      console.error(`No starter matched${args.book ? ` --book ${args.book}` : ''}.`)
      process.exit(1)
    }
    console.log(`[source=starters] loaded ${stories.length} starter books`)
  } else {
    const raw = await readFile(packPath, 'utf8')
    const pack = JSON.parse(raw) as Pack
    stories = (pack.stories || [])
      .filter((s) => !args.book || s.id === args.book)
      .map((s) => ({ id: s.id, chapters: s.chapters ?? [] }))
    if (!stories.length) {
      console.error(`No stories matched${args.book ? ` --book ${args.book}` : ''}. Nothing to do.`)
      process.exit(1)
    }
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  const narratorVoiceId = process.env.NARRATOR_VOICE_ID
  const modelId = process.env.ELEVENLABS_NARRATOR_MODEL || 'eleven_multilingual_v2'

  if (!args.dryRun && !args.check) {
    if (!apiKey || !narratorVoiceId) {
      console.error(
        'Missing ELEVENLABS_API_KEY or NARRATOR_VOICE_ID. Set env or use --dry-run to plan.',
      )
      process.exit(1)
    }
  }

  // Price: multilingual v2 ≈ $0.30 per 1K chars (Creator). We show a conservative
  // estimate; tune COST_PER_1K if you're on a different plan.
  const COST_PER_1K = Number(process.env.ELEVENLABS_COST_PER_1K || 0.3)

  let totalChars = 0
  let planned = 0
  let generated = 0
  let skipped = 0
  let stale = 0
  let failed = 0

  for (const story of stories) {
    const chapters = story.chapters ?? []
    for (let ci = 0; ci < chapters.length; ci++) {
      const pages = chapters[ci].pages ?? []
      for (let pi = 0; pi < pages.length; pi++) {
        const text = (pages[pi].text || '').trim()
        if (!text) continue

        const bookDir = resolve(outRoot, story.id)
        const audioPath = resolve(bookDir, `${ci}-${pi}.mp3`)
        const tsPath = resolve(bookDir, `${ci}-${pi}.timestamps.json`)

        planned++
        totalChars += text.length

        if ((await exists(audioPath)) && (await exists(tsPath))) {
          // Resume — but only when the audio still matches the CURRENT text.
          let fresh = false
          try {
            const ts = JSON.parse(await readFile(tsPath, 'utf8')) as WordTimestamp[]
            fresh = timestampsMatchText(ts, text)
          } catch {
            fresh = false
          }
          if (fresh) {
            skipped++
            continue
          }
          stale++
          console.log(`  STALE ${story.id} ch${ci} p${pi} — text changed since audio was made${args.check ? '' : ', regenerating'}`)
        }

        if (args.check) continue
        if (args.dryRun) {
          console.log(
            `[dry] ${story.id} ch${ci} p${pi} — ${text.length} chars → ${audioPath.replace(projectRoot + '/', '')}`,
          )
          continue
        }

        await ensureDir(bookDir)
        try {
          const { audio, timestamps } = await ttsElevenLabs(
            text,
            narratorVoiceId!,
            apiKey!,
            modelId,
          )
          await writeFile(audioPath, audio)
          await writeFile(tsPath, JSON.stringify(timestamps, null, 2))
          generated++
          console.log(
            `  ok  ${story.id} ch${ci} p${pi} — ${text.length} chars, ${timestamps.length} words`,
          )
        } catch (err) {
          failed++
          console.error(`  FAIL ${story.id} ch${ci} p${pi}: ${(err as Error).message}`)
        }
      }
    }
  }

  const estCost = (totalChars / 1000) * COST_PER_1K
  console.log('')
  console.log('---- summary ----')
  console.log(`books:       ${stories.length}`)
  console.log(`pages seen:  ${planned}`)
  console.log(`generated:   ${generated}`)
  console.log(`skipped:     ${skipped} (resume, still fresh)`)
  console.log(`stale:       ${stale} (text changed since audio was made)`)
  console.log(`failed:      ${failed}`)
  console.log(`total chars: ${totalChars}`)
  console.log(`est. cost:   $${estCost.toFixed(2)} @ $${COST_PER_1K}/1K chars`)
  if (args.dryRun) console.log('(dry run — no API calls made, no files written)')
}

main().catch((err) => {
  console.error('generate-audio failed:', err)
  process.exit(1)
})
