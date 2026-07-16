// Load pre-populated content packs into the v2 library.
// pack-000 = family originals (see docs/CONVERSION-NOTES.md).
// Packs live in content/packs/*.json and are imported statically at build.

import type { Book, Chapter, ComfortRitual, MysteryWord, Page, SkillTag, VocabWord, WashKey } from '@/types/story'
import pack000 from '../../content/packs/pack-000-family-originals.json'

// Pack JSON shape (pre-schema for v2, normalized on load):
// v3.2: page `scene` is a semantic key (string) OR null. The v2 {bg, emojis,
// image} presentation blob is gone.
type PackAsk = { question: string; answers?: string[]; praise: string; hint: string; skill: string }
type PackChoice = { prompt: string; options: Array<{ label: string; emoji: string; keywords?: string[] }> }
type PackPage = {
  text: string
  scene?: string | null
  /** v3.2: real illustration path (starters only — pack-000 has none yet). */
  img?: string
  wash?: string
  ask?: PackAsk
  choice?: PackChoice
  breathe?: boolean
  bleed?: boolean
  star?: string
  fullBleed?: boolean
}
type PackChapter = { title: string; wash?: string; pages: PackPage[]; hook?: string; recapQuestion?: string }
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
  // v2.2 optional fields (backfilled per docs/aziverse-adoption.md items 5–7)
  mysteryWord?: MysteryWord
  comfortRitual?: ComfortRitual
  skillTags?: SkillTag[]
}
type Pack = { pack: string; note?: string; stories: PackBook[] }

// ---------- wash inference from semantic scene key ----------
// v3.2: pack stories store a semantic scene key ('bus', 'bear-hollow', ...).
// The v2 handoff UI still expects a `wash` key ('canyon', 'sunset', 'meadow'…).
// This mapping is best-effort: it picks a mood-matching wash so pages without a
// drawn scene component still land on a coherent color. Missing/null → meadow.
const SCENE_KEY_TO_WASH: Record<string, WashKey> = {
  // night / bedroom / winter → snow
  'night': 'snow',
  'bedroom-night': 'snow',
  'bedroom': 'snow',
  'winter-night': 'snow',
  'christmas-night': 'snow',
  'sleepy': 'snow',
  'moon': 'snow',
  'moon-window': 'snow',
  'dawn': 'snow',
  'stars': 'snow',
  // outdoor greens → meadow
  'forest': 'meadow',
  'bear-hollow': 'meadow',
  'bramble-quiet': 'meadow',
  'farm': 'meadow',
  'meadow': 'meadow',
  'garden': 'meadow',
  'neighborhood': 'meadow',
  // warm household / celebration → sunset
  'kitchen-warm': 'sunset',
  'celebration': 'sunset',
  'home-rest': 'sunset',
  // amber travel routes → honey
  'bus': 'honey',
  'bus-detour': 'honey',
  'village-lit': 'honey',
  // deep-blue skies / space → canyon
  'train': 'canyon',
  'star-garage': 'canyon',
  'launch': 'canyon',
  'space': 'canyon',
  'night-crossing': 'canyon',
  // playful mid-tones → sunset
  'zoomtown': 'sunset',
  'wobbly-bridge': 'sunset',
  'crossing': 'sunset',
  // introspective → blush / lilac
  'belly-breath': 'blush',
  'web': 'meadow',
  'mirror': 'lilac',
  'courage': 'lilac',
  'playroom': 'sunset',
}
function washFromKey(key?: string | null): WashKey {
  if (!key) return 'meadow'
  return SCENE_KEY_TO_WASH[key] ?? 'meadow'
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

const VALID_WASHES = new Set<string>(['canyon', 'sunset', 'meadow', 'lilac', 'blush', 'river', 'snow', 'honey'])
function coercePackWash(w?: string): WashKey | undefined {
  return w && VALID_WASHES.has(w) ? (w as WashKey) : undefined
}

function normalizePage(pp: PackPage, defaultWash: WashKey, bookVocab: VocabWord[]): Page {
  // Priority: explicit page wash → scene-key inference → chapter/book default.
  const wash = coercePackWash(pp.wash) ?? (pp.scene ? washFromKey(pp.scene) : defaultWash)
  // Auto-pick a star word for this page if any vocab appears in the text.
  const star =
    pp.star ??
    bookVocab.find((v) => v.word && new RegExp(`\\b${v.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(pp.text))?.word
  // v3.2: emojis are gone from the pack contract. The `emojis` field on the
  // normalized Page is left undefined so downstream consumers that still read
  // it (kid-app fallback illustrator) simply see nothing to paint.
  return {
    text: pp.text,
    wash,
    img: pp.img,
    scene: pp.scene ?? null,
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
  // v3.2: pack no longer emits coverBg. Fall back on meadow — Agent B's
  // backfill can lay in a real cover wash later.
  const bookWash: WashKey = 'meadow'
  const chapters: Chapter[] = b.chapters
    ? b.chapters.map((c) => {
        // Honor the pack's per-chapter wash (imports rotate these); fall back
        // to the book wash for older pack entries without one.
        const chapterWash = coercePackWash(c.wash) ?? bookWash
        return {
          title: c.title,
          wash: chapterWash,
          pages: c.pages.map((pp) => normalizePage(pp, chapterWash, vocab)),
          hook: c.hook,
          recapQuestion: c.recapQuestion,
        }
      })
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
    mysteryWord: b.mysteryWord,
    comfortRitual: b.comfortRitual,
    skillTags: b.skillTags,
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
