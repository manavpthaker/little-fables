// v1 → v2 → v3.2 migration.
// v1 Story: { id, title, coverEmoji, coverBg, coverImage?, status, teachingGoals,
//   vocab: string[] | {word,meaning}[], pages: [{ text, scene:{bg,emojis,image?},
//   ask?, choice? }], retellPrompts, source, createdAt, idea?, by? }
// v2 Book:  { id, title, kind:'quick', chapters: [{ title:'', pages, hook? }],
//   vocab:{word,meaning}[], teachingGoals, retellPrompts, ... }
// v3.2 scrub: Page.scene changes from { bg, emojis, image } → semantic key
// (string) OR null. Legacy inputs are dropped: gradients+emojis are presentation
// metadata, not story data. Any `image` on legacy scenes lifts to page.img so
// real illustrations aren't lost.

import type {
  Book,
  Chapter,
  ChoiceOption,
  Page,
  VocabWord,
} from '@/types/story'

type LegacyScene = { bg?: string; emojis?: string[]; image?: string }
type LegacyChoiceOption = {
  label: string
  emoji: string
  keywords?: string[]
  pages?: LegacyPage[]
}
type LegacyChoice = { prompt: string; options: LegacyChoiceOption[] }
type LegacyAsk = {
  question: string
  answers?: string[]
  praise: string
  hint: string
  skill: string
}
type LegacyPage = {
  text: string
  /** v1 legacy scene blob (bg + emojis + image). v3.2 also accepts a plain
   *  string as the semantic scene key. Either shape passes through normalizePage. */
  scene?: LegacyScene | string | null
  /** v3.2: top-level image path (starters were flipped to this shape). */
  img?: string
  emojis?: string[]
  ask?: LegacyAsk
  choice?: LegacyChoice
  bleed?: boolean
}
type LegacyVocab = string | { word: string; meaning?: string }
type LegacyStory = {
  id: string
  title: string
  coverEmoji?: string
  coverBg?: string
  coverImage?: string
  by?: string
  status?: 'complete' | 'awaiting-choice'
  source?: 'starter' | 'generated' | 'family'
  createdAt?: number
  teachingGoals?: string[]
  vocab?: LegacyVocab[]
  pages?: LegacyPage[]
  retellPrompts?: string[]
  idea?: string
}

function normalizeVocab(v: LegacyVocab[] | undefined): VocabWord[] {
  if (!Array.isArray(v)) return []
  return v
    .map((x) =>
      typeof x === 'string'
        ? ({ word: x, meaning: '' } as VocabWord)
        : ({ word: x.word, meaning: x.meaning ?? '' } as VocabWord)
    )
    .filter((w) => w.word)
}

function normalizePage(p: LegacyPage): Page {
  const choice = p.choice
    ? {
        prompt: p.choice.prompt,
        options: p.choice.options.map<ChoiceOption>((o) => ({
          label: o.label,
          emoji: o.emoji,
          keywords: o.keywords,
          pages: o.pages ? o.pages.map(normalizePage) : undefined,
        })),
      }
    : undefined
  // v3.2: scene becomes a semantic key string (or null). Legacy {bg,emojis,image}
  // is dropped; only the image path lifts to page.img.
  const scene = typeof p.scene === 'string' ? p.scene : null
  const legacyImage = typeof p.scene === 'object' && p.scene ? p.scene.image : undefined
  return {
    text: p.text,
    scene,
    // Page.emojis intentionally omitted — the reader no longer paints emoji
    // scenes. The Page type still declares the field so downstream callers
    // that read `page.emojis` compile; the value here is undefined.
    img: p.img ?? legacyImage,
    fullBleed: p.bleed,
    ask: p.ask
      ? {
          skill: p.ask.skill,
          question: p.ask.question,
          answers: p.ask.answers,
          praise: p.ask.praise,
          hint: p.ask.hint,
        }
      : undefined,
    choice,
  }
}

/** Turn a v1 Story into a 1-chapter v2 Book. */
export function legacyToBook(input: unknown): Book {
  const s = input as LegacyStory
  if (!s || !s.id || !s.title) throw new Error('bad legacy story')

  const pages = (s.pages ?? []).map(normalizePage)
  const chapter: Chapter = { title: '', pages, status: 'current' }

  return {
    id: s.id,
    title: s.title,
    by: s.by,
    kind: 'quick',
    status: s.status ?? 'complete',
    source: s.source === 'starter' ? 'starter' : s.source === 'family' ? 'family' : 'generated',
    coverImage: s.coverImage,
    coverEmoji: s.coverEmoji ?? '✨',
    coverBg: s.coverBg,
    chapters: [chapter],
    vocab: normalizeVocab(s.vocab),
    teachingGoals: s.teachingGoals ?? [],
    retellPrompts: s.retellPrompts ?? [],
    createdAt: s.createdAt ?? Date.now(),
    idea: s.idea,
  }
}

/** Turn a v2 Book back into a v1-shaped Story for legacy sync / API contracts. */
export function bookToLegacy(book: Book): LegacyStory & { source: 'starter' | 'generated' | 'family' } {
  const pages = book.chapters.flatMap((c) => c.pages)
  return {
    id: book.id,
    title: book.title,
    by: book.by,
    coverEmoji: book.coverEmoji,
    coverBg: book.coverBg,
    coverImage: book.coverImage,
    status: book.status === 'draft' || book.status === 'needs-review' ? 'awaiting-choice' : (book.status as 'complete' | 'awaiting-choice'),
    source: book.source,
    createdAt: book.createdAt,
    teachingGoals: book.teachingGoals,
    vocab: book.vocab,
    pages: pages.map((p) => ({
      text: p.text,
      // v3.2: emit the semantic scene key verbatim (string | null). Legacy
      // consumers that expected {bg, emojis, image} will now see a string —
      // the sync route is the only consumer and treats scene opaquely.
      scene: p.scene ?? null,
      img: p.img,
      emojis: undefined,
      ask: p.ask
        ? {
            skill: p.ask.skill,
            question: p.ask.question,
            answers: p.ask.answers ?? [],
            praise: p.ask.praise,
            hint: p.ask.hint,
          }
        : undefined,
      choice: p.choice,
      bleed: p.fullBleed,
    })),
    retellPrompts: book.retellPrompts,
    idea: book.idea,
  }
}
