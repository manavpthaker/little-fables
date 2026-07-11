// Load pre-populated content packs into the v2 library.
// pack-000 = family originals (see docs/CONVERSION-NOTES.md).
// Packs live in content/packs/*.json and are imported statically at build.

import type { Book, Chapter, Page, VocabWord, WashKey } from '@/types/story'
import pack000 from '../../content/packs/pack-000-family-originals.json'

// Pack JSON shape (pre-schema for v2, normalized on load):
type PackScene = { bg?: string; emojis?: string[]; image?: string }
type PackAsk = { question: string; answers?: string[]; praise: string; hint: string; skill: string }
type PackChoice = { prompt: string; options: Array<{ label: string; emoji: string; keywords?: string[] }> }
type PackPage = {
  text: string
  scene?: PackScene
  ask?: PackAsk
  choice?: PackChoice
  breathe?: boolean
  bleed?: boolean
  star?: string
  fullBleed?: boolean
}
type PackChapter = { title: string; pages: PackPage[]; hook?: string; recapQuestion?: string }
type PackBook = {
  id: string
  title: string
  by?: string
  kind: 'quick' | 'chapter'
  source?: 'starter' | 'family' | 'generated'
  status?: 'complete'
  coverEmoji?: string
  coverBg?: string
  coverImage?: string
  teachingGoals?: string[]
  vocab?: Array<VocabWord | { word: string; meaning?: string }>
  retellPrompts?: string[]
  parentGuide?: string
  originNote?: string
  seasonal?: string
  quiet?: boolean
  chapters?: PackChapter[]
  pages?: PackPage[]
}
type Pack = { pack: string; note?: string; stories: PackBook[] }

// ---------- wash inference from linear-gradient hex ----------
// The pack stories store a `scene.bg` as a CSS linear-gradient. The v2 handoff
// UI expects a `wash` key ("canyon", "sunset", "meadow"…). Rather than parse
// gradients on every render, we map the pack colors to the nearest wash.
function washFromBg(bg?: string): WashKey {
  if (!bg) return 'meadow'
  const lower = bg.toLowerCase()
  // orange/amber → sunset
  if (/#f97316|#fbbf24|#fb7185/.test(lower) && !/#7c3aed|#4338ca/.test(lower)) return 'sunset'
  // purple/indigo → lilac
  if (/#7c3aed|#4338ca|#818cf8|#a78bfa/.test(lower)) return 'lilac'
  // navy/deep-blue → canyon
  if (/#1e3a8a|#0f172a|#1e1b4b|#312e81/.test(lower)) return 'canyon'
  // pink → blush
  if (/#f0abfc|#fb7185|#ec4899/.test(lower)) return 'blush'
  // teal/mint → meadow
  if (/#a7f3d0|#34d399|#10b981|#dfeedd/.test(lower)) return 'meadow'
  // sky/light-blue → river
  if (/#38bdf8|#93aebd|#93c5fd/.test(lower)) return 'river'
  // snow-white/cool → snow
  if (/#f8fafc|#fffdf7|#fbf4e6|#f0f9ff/.test(lower)) return 'snow'
  // honey/warm-cream → honey
  if (/#fde8c8|#fbbf24|#fef3c7|#d9a05b/.test(lower)) return 'honey'
  return 'meadow'
}

function normalizeVocab(v: PackBook['vocab']): VocabWord[] {
  if (!Array.isArray(v)) return []
  return v
    .map((x) =>
      typeof x === 'object' && x !== null && 'word' in x
        ? ({ word: (x as { word: string }).word, meaning: (x as { meaning?: string }).meaning ?? '' } as VocabWord)
        : null
    )
    .filter((x): x is VocabWord => x !== null && !!x.word)
}

function normalizePage(pp: PackPage, defaultWash: WashKey, bookVocab: VocabWord[]): Page {
  const wash = washFromBg(pp.scene?.bg) || defaultWash
  // Auto-pick a star word for this page if any vocab appears in the text.
  const star =
    pp.star ??
    bookVocab.find((v) => v.word && new RegExp(`\\b${v.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(pp.text))?.word
  return {
    text: pp.text,
    wash,
    emojis: pp.scene?.emojis,
    img: pp.scene?.image,
    scene: pp.scene,
    ask: pp.ask
      ? {
          skill: pp.ask.skill,
          question: pp.ask.question,
          answers: pp.ask.answers,
          praise: pp.ask.praise,
          hint: pp.ask.hint,
        }
      : undefined,
    choice: pp.choice,
    breathe: pp.breathe,
    fullBleed: pp.fullBleed ?? pp.bleed,
    star,
  }
}

function normalizeBook(b: PackBook): Book {
  const vocab = normalizeVocab(b.vocab)
  const bookWash = washFromBg(b.coverBg) ?? 'meadow'
  const chapters: Chapter[] = b.chapters
    ? b.chapters.map((c) => ({
        title: c.title,
        wash: bookWash,
        pages: c.pages.map((pp) => normalizePage(pp, bookWash, vocab)),
        hook: c.hook,
        recapQuestion: c.recapQuestion,
      }))
    : [
        {
          title: '',
          wash: bookWash,
          pages: (b.pages ?? []).map((pp) => normalizePage(pp, bookWash, vocab)),
        },
      ]

  return {
    id: b.id,
    title: b.title,
    by: b.by,
    kind: b.kind,
    status: 'complete',
    source: b.source ?? 'family',
    coverImage: b.coverImage,
    coverEmoji: b.coverEmoji ?? '📖',
    coverBg: b.coverBg,
    wash: bookWash,
    meta:
      b.kind === 'chapter'
        ? `${chapters.length} chapter${chapters.length === 1 ? '' : 's'}`
        : `${(chapters[0]?.pages.length ?? 0)} pages`,
    chapters,
    vocab,
    teachingGoals: b.teachingGoals ?? [],
    retellPrompts: b.retellPrompts ?? [],
    parentGuide: b.parentGuide,
    originNote: b.originNote ?? undefined,
    quiet: b.quiet,
    seasonal: b.seasonal,
    createdAt: 0,
  }
}

// ---------- Public API ----------

/** Books shipped in content packs (family originals + future generated packs). */
export const PACK_BOOKS: Book[] = (() => {
  const packs: Pack[] = [pack000 as Pack]
  return packs.flatMap((p) => p.stories.map(normalizeBook))
})()

/** Everything on the shelf, in this order:
 *  1) saved (parent-generated) books, newest first
 *  2) pack family originals
 *  3) built-in starter stories (Miko / Azi / Jujy / Rocket) from lib/read/starter-stories */
import { STARTER_STORIES } from './starter-stories'
import { loadStories } from './storage'

export function loadShelf(): Book[] {
  const saved = loadStories().slice().sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
  // Dedupe by id — parent-saved wins.
  const seen = new Set(saved.map((b) => b.id))
  const pack = PACK_BOOKS.filter((b) => !seen.has(b.id))
  const packSeen = new Set([...seen, ...pack.map((b) => b.id)])
  const starters = STARTER_STORIES.filter((b) => !packSeen.has(b.id))
  return [...saved, ...pack, ...starters]
}
