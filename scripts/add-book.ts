#!/usr/bin/env tsx
/**
 * Little Fables — add (or re-import) a book from content/originals into pack-000.
 *
 * Drop a story file in content/originals/ and run:
 *   npm run books:add -- --file my_story.md --dry-run     # preview pagination
 *   npm run books:add -- --file my_story.md               # write into the pack
 *   npm run books:add -- --file my_story.md --id my-story --title "My Story" --by "Made by Papa"
 *
 * FORMAT (plain markdown / text — the same rules used for the 5 originals):
 *   # Book Title                      ← first heading = title (or --title)
 *   *optional subtitle / byline*      ← italic-only lines near the top are skipped
 *
 *   Paragraphs separated by blank lines. EACH PARAGRAPH = ONE READER PAGE.
 *   Text is imported VERBATIM — only markdown emphasis markers are stripped.
 *
 *   Part One: The Chapter Title       ← chapter books; quick stories have none
 *   (also accepts "Chapter 1: ..." )
 *
 *   **The End**                       ← everything at/after this is ignored
 *   ---  /  ✦ ✦ ✦  /  * * *          ← separator lines are skipped
 *
 * .docx: save/export as .md or .txt first (Google Docs / Word → "Download as
 * plain text"), then run this.
 */
import 'dotenv/config'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'

const REPO_ROOT = process.cwd()
const ORIGINALS_DIR = join(REPO_ROOT, 'content', 'originals')
const PACK_PATH = join(REPO_ROOT, 'content', 'packs', 'pack-000-family-originals.json')

// ---------- parsing ----------

const SEP_RE = /^(-{3,}|\*\s*\*\s*\*|✦(\s*✦)*|☽)$/
const PART_RE = /^(?:Part|Chapter)\s+(One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|\d+)\s*:\s*(.+)$/i
const END_RE = /^\**\s*The End\s*\**\.?$/i
// Back-matter headings that end the story body if The End is absent.
const BACKMATTER_RE = /^\**\s*(Family Discussion|Reading Guide|A Note for|Discussion Starters?)/i

function stripEmphasis(s: string): string {
  return s.replace(/\*\*/g, '').replace(/\*/g, '').trim()
}

interface ParsedChapter {
  title: string
  pages: Array<{ text: string }>
}
interface Parsed {
  title: string | null
  chapters: ParsedChapter[]
}

function parseStory(raw: string): Parsed {
  let paras = raw
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  let title: string | null = null

  // Title can be `# Heading` OR a plain short first line (docx exports).
  const first = paras[0]?.split('\n')[0].trim() ?? ''
  if (first.startsWith('# ')) title = stripEmphasis(first.slice(2))
  else if (paras[0] && paras[0].split('\n').length === 1 && first.length < 60 && !/[.!?]$/.test(first)) {
    title = stripEmphasis(first)
  }

  // Chapter books: everything before the FIRST "Part/Chapter N:" heading is
  // front matter (title, dedication, reader notes) — drop it wholesale.
  const unhash = (s: string) => s.replace(/^#{1,6}\s+/, '').trim()
  const firstPart = paras.findIndex(
    (p) => p.split('\n').length === 1 && PART_RE.test(unhash(p.split('\n')[0].trim())),
  )
  if (firstPart > 0) paras = paras.slice(firstPart)

  const chapters: ParsedChapter[] = []
  let cur: ParsedChapter | null = null
  let seenBody = false

  const ensureChapter = (t: string) => {
    cur = { title: t, pages: [] }
    chapters.push(cur)
  }

  for (const p of paras) {
    const firstLine = p.split('\n')[0].trim()

    // Markdown headings (single-line): `#` = title, `Part/Chapter N:` at any
    // depth = chapter, any other `##+` = section marker to skip ("The Story").
    if (/^#{1,6}\s/.test(firstLine) && p.split('\n').length === 1) {
      const text = stripEmphasis(unhash(firstLine))
      if (END_RE.test(text) || BACKMATTER_RE.test(text)) break
      const hPart = PART_RE.exec(text)
      if (hPart) ensureChapter(stripEmphasis(hPart[2]))
      else if (/^#\s/.test(firstLine) && !title) title = text
      continue
    }
    // Separators.
    if (SEP_RE.test(firstLine)) continue
    // End of story / back matter → stop.
    if (END_RE.test(firstLine) || BACKMATTER_RE.test(stripEmphasis(firstLine))) break
    // Chapter heading (single-line paragraph).
    const part = PART_RE.exec(firstLine)
    if (part && p.split('\n').length === 1) {
      ensureChapter(stripEmphasis(part[2]))
      continue
    }
    // Italic-only front-matter line before any body text ("*A bedtime story*").
    if (!seenBody && /^\*[^*]+\*$/.test(firstLine) && p.split('\n').length === 1) continue
    // Metadata block before any body text ("Target Age: 3-5 / Reading Time: …").
    if (!seenBody && p.split('\n').every((l) => /^[A-Z][A-Za-z ]{1,28}:\s/.test(stripEmphasis(l)) || !l.trim())) continue
    // The bare title repeated as a plain paragraph before the body.
    if (!seenBody && title && stripEmphasis(firstLine) === title && p.split('\n').length === 1) continue

    // A real page. Blockquote lines keep their line breaks (signs etc.).
    const text = p.startsWith('>')
      ? p
          .split('\n')
          .map((l) => stripEmphasis(l.replace(/^>\s?/, '')))
          .join('\n')
          .trim()
      : stripEmphasis(p)
    if (!text) continue
    seenBody = true
    if (!cur) ensureChapter('') // quick story: single unnamed chapter
    cur!.pages.push({ text })
  }

  return { title, chapters }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

// ---------- pack upsert ----------

interface PackPage {
  text: string
  [k: string]: unknown
}
interface PackChapter {
  title: string
  pages: PackPage[]
}
interface PackBook {
  id: string
  title: string
  by?: string
  kind: 'quick' | 'chapter'
  source?: string
  status?: string
  coverEmoji?: string | null
  teachingGoals?: string[]
  vocab?: unknown[]
  retellPrompts?: string[]
  parentGuide?: string | null
  originNote?: string
  chapters: PackChapter[]
}
interface Pack {
  pack: string
  note?: string
  stories: PackBook[]
}

// ---------- CLI ----------

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : undefined
}
const has = (name: string) => process.argv.includes(`--${name}`)

function main() {
  const file = arg('file')
  if (!file || has('help')) {
    console.log('Usage: npm run books:add -- --file <name-in-content/originals | path> [--id x] [--title "X"] [--by "X"] [--kind quick|chapter] [--dry-run]')
    process.exit(file ? 0 : 1)
  }
  const path = existsSync(file) ? resolve(file) : join(ORIGINALS_DIR, file)
  if (!existsSync(path)) {
    console.error(`File not found: ${file} (looked in content/originals/ too)`)
    process.exit(1)
  }
  if (/\.docx$/i.test(path)) {
    console.error('.docx not supported directly — export as .md or .txt (Google Docs/Word → download as plain text) and re-run.')
    process.exit(1)
  }

  const parsed = parseStory(readFileSync(path, 'utf8'))
  const title = arg('title') ?? parsed.title ?? basename(path).replace(/\.[^.]+$/, '')
  const id = arg('id') ?? slugify(title)
  const kind = (arg('kind') as 'quick' | 'chapter') ?? (parsed.chapters.length > 1 ? 'chapter' : 'quick')
  const by = arg('by') ?? 'Made by Papa'

  // Quick stories: title the single chapter after the book.
  const chapters = parsed.chapters.map((c) => ({ title: c.title || title, pages: c.pages }))
  const pageCount = chapters.reduce((n, c) => n + c.pages.length, 0)
  const words = chapters.reduce((n, c) => n + c.pages.reduce((m, p) => m + p.text.split(/\s+/).length, 0), 0)

  console.log(`${id}  [${kind}]  "${title}" by ${by}`)
  console.log(`  chapters: ${chapters.length}  pages: ${pageCount}  words: ${words}`)
  chapters.forEach((c, i) => console.log(`    Ch${i + 1}: ${c.title} (${c.pages.length} pages)`))
  console.log(`  first page: ${chapters[0]?.pages[0]?.text.slice(0, 100) ?? '(none)'}`)
  console.log(`  last  page: ${chapters.at(-1)?.pages.at(-1)?.text.slice(0, 100) ?? '(none)'}`)

  if (pageCount === 0) {
    console.error('\nNo pages parsed — check the file format (blank-line paragraphs).')
    process.exit(1)
  }
  if (has('dry-run')) {
    console.log('\n(dry run — pack not written)')
    return
  }

  const pack = JSON.parse(readFileSync(PACK_PATH, 'utf8')) as Pack
  const existing = pack.stories.find((s) => s.id === id)
  if (existing) {
    existing.title = title
    existing.by = by
    existing.kind = kind
    existing.chapters = chapters
    console.log(`\nUpdated existing book "${id}" in pack-000 (metadata like vocab preserved).`)
  } else {
    pack.stories.push({
      id,
      title,
      by,
      kind,
      source: 'family-original',
      status: 'complete',
      coverEmoji: null,
      teachingGoals: [],
      vocab: [],
      retellPrompts: [],
      parentGuide: null,
      originNote: 'A family original.',
      chapters,
    })
    console.log(`\nAdded new book "${id}" to pack-000.`)
  }
  writeFileSync(PACK_PATH, `${JSON.stringify(pack, null, 2)}\n`)
  console.log('Next: commit + push (deploys to prod), then optionally generate audio + art for it.')
}

main()
