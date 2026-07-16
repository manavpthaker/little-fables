// Shared prompt + reference builders for the art pipeline, lifted from the
// scripts so the on-prod /api/art/generate route and the local scripts compose
// identical prompts. Server-only.

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { GeminiImagePart } from './gemini'

export interface CharacterBibleEntry {
  id: string
  name: string
  role: string
  species?: string
  loves?: string
  traits?: string[]
  visualAnchors?: string[]
  roleByBand?: Record<string, string>
}

// Some character names collide with IP trademarks (e.g. "Pooh") and get
// rejected by Google's PROHIBITED_CONTENT filter — substitute the display name
// while keeping the identity fields that actually shape the drawing.
const IP_SAFE_NAMES: Record<string, string> = { Pooh: 'the honey farmer' }

function inferSpecies(c: CharacterBibleEntry): string {
  if (c.species && c.species.trim()) return c.species
  if (c.id === 'char_azi') return 'child (mixed Colombian and Indian heritage)'
  return 'child'
}

export interface CharacterPromptOpts {
  /** How many parent-uploaded reference photos precede the style refs. When
   *  present, the model is told to RECREATE the character shown in them
   *  rather than invent one from the text description. */
  photoRefCount?: number
  /** Free-text art direction from the family ("round belly, red felt collar,
   *  ears flop forward"). Takes priority over the bible's visual anchors. */
  notes?: string
}

export function characterPrompt(c: CharacterBibleEntry, opts: CharacterPromptOpts = {}): string {
  const traits = (c.traits ?? []).join(', ') || 'gentle, distinct, kind'
  const anchors = (c.visualAnchors ?? []).join(', ') || 'clear silhouette, memorable feature'
  const loves = c.loves ?? '—'
  const roleFourEight = c.roleByBand?.['4-8'] ?? c.role
  const safeName = IP_SAFE_NAMES[c.name] ?? c.name
  const safeRole = c.role.replace(/\bPooh\b/g, 'the honey farmer')
  const nRefs = opts.photoRefCount ?? 0

  const identity = nRefs > 0
    ? [
        `THE CHARACTER: the FIRST ${nRefs === 1 ? 'reference image shows' : `${nRefs} reference images show`} the actual character — a real, beloved toy/figure.`,
        'Recreate THIS exact character faithfully: same colors, same markings, same proportions,',
        'same face, same materials and stitching details. Do NOT invent a different design.',
        'The remaining reference images show only the ILLUSTRATION STYLE to render it in.',
        '',
        `Name for context: ${safeName} — ${safeRole}.`,
      ]
    : [
        `Character: ${safeName} — ${safeRole}. Species: ${inferSpecies(c)}.`,
        `Traits: ${traits}.`,
        `Loves: ${loves}.`,
        `Visual anchors: ${anchors}.`,
        `Age band context (4-8): ${roleFourEight}.`,
      ]

  const direction = opts.notes?.trim()
    ? ['', 'ART DIRECTION FROM THE FAMILY (highest priority):', opts.notes.trim()]
    : []

  return [
    "Character reference sheet for a children's book character.",
    'Style: warm hand-drawn watercolor with ink linework, textured paper feel,',
    'gentle warm palette (paper cream + warm ink + occasional wash pigments —',
    'marigold, sage, terracotta, dusk).',
    '',
    ...identity,
    ...direction,
    '',
    'Show the character in three poses on a single sheet:',
    '(1) idle standing three-quarter view,',
    '(2) listening/leaning-in pose,',
    '(3) celebrating pose.',
    '',
    'Clean paper background. No text labels. No border, no frame.',
    'Consistent character between poses — same shape, same features, same colors.',
  ].join('\n')
}

export interface ScenePlanEntry {
  chapterIdx: number
  pageIdx: number
  sceneKey: string | null
  characters: string[]
  setting: string
  action: string
  mood: string
  composition: string
  paletteHint: string
  styleAnchors?: string[]
}

export function scenePrompt(
  entry: ScenePlanEntry,
  bible: Record<string, CharacterBibleEntry>,
): string {
  const chars = entry.characters.map((id) => bible[id]).filter((c): c is CharacterBibleEntry => !!c)
  const characterLines = chars.length
    ? chars
        .map((c) => {
          const anchors = (c.visualAnchors ?? []).join(', ') || '(no visual anchors specified)'
          const safeName = IP_SAFE_NAMES[c.name] ?? c.name
          return `  - ${safeName} (${c.role.replace(/\bPooh\b/g, 'the honey farmer')}) — visual anchors: ${anchors}`
        })
        .join('\n')
    : '  - (no bible characters — draw the scene per setting + action)'
  const styleAnchors = entry.styleAnchors?.length
    ? `\nStyle continuity references:\n${entry.styleAnchors.map((s) => `  - ${s}`).join('\n')}`
    : ''
  return [
    "Scene illustration for a children's book. Warm watercolor + ink linework, textured paper feel, gentle palette.",
    '',
    `Setting: ${entry.setting}`,
    `Action: ${entry.action}`,
    `Mood: ${entry.mood}`,
    `Composition: ${entry.composition}`,
    `Palette: ${entry.paletteHint}`,
    '',
    'Characters present:',
    characterLines,
    styleAnchors,
    '',
    'Render as a single cinematic scene. No text, no captions, no borders, no page numbers.',
    'Consistent with the character reference images provided (if any) — same shapes, features, colors.',
  ].join('\n')
}

// ---------- passage-based scene prompts (generate-while-reading) ----------
// Instead of a fragile whole-book art-director plan (which overflows the model
// budget on long books), each page's brief is built directly from its text:
// characters detected by NAME against the bible, the passage handed to the
// image model to illustrate. No planning call, no truncation, fully per-page.

/** Bible characters actually mentioned in the text (word-boundary name match). */
export function detectCharacters(
  text: string,
  bible: CharacterBibleEntry[],
): CharacterBibleEntry[] {
  const found: CharacterBibleEntry[] = []
  for (const c of bible) {
    const re = new RegExp(`\\b${c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    if (re.test(text)) found.push(c)
  }
  // Focal cap — a busy page can name half the cast; the illustration reads
  // better (and refs stay under budget) with at most 3.
  return found.slice(0, 3)
}

export function passageScenePrompt(opts: {
  bookTitle: string
  chapterTitle?: string
  pageText: string
  /** Previous page text — one beat of context so the scene flows. */
  prevText?: string
  characters: CharacterBibleEntry[]
  /** How many character reference images precede the style refs. */
  photoRefCount: number
  /** Whole-book visual brief (theme, moral, setting, palette, protagonist).
   *  The same brief anchors every scene in the book so pages feel like one
   *  world; the page text then picks the moment to depict within it. */
  storyBrief?: string
}): string {
  const chars = opts.characters.length
    ? opts.characters
        .map((c) => {
          const safe = IP_SAFE_NAMES[c.name] ?? c.name
          const anchors = (c.visualAnchors ?? []).join(', ')
          return `  - ${safe}${anchors ? ` — ${anchors}` : ''}`
        })
        .join('\n')
    : '  - (no named characters — illustrate the setting and mood)'
  const refLine =
    opts.photoRefCount > 0
      ? `The FIRST ${opts.photoRefCount === 1 ? 'reference image is' : `${opts.photoRefCount} reference images are`} the character reference sheet(s) — match them exactly (same colors, markings, proportions). The remaining references show the illustration style.`
      : 'The reference images show the illustration style.'
  return [
    "One interior illustration for a children's picture book.",
    'Style: warm hand-drawn watercolor with ink linework, textured paper feel,',
    'gentle warm palette (paper cream + warm ink + wash pigments — marigold, sage, terracotta, dusk).',
    refLine,
    '',
    `Book: ${opts.bookTitle}${opts.chapterTitle ? ` — chapter "${opts.chapterTitle}"` : ''}.`,
    opts.storyBrief
      ? `\nTHE STORY'S WORLD (every illustration in this book lives here — keep the same protagonist look, setting, palette, and mood on every page):\n${opts.storyBrief.slice(0, 1000)}\n`
      : '',
    'Characters in this scene:',
    chars,
    '',
    'Illustrate THIS moment from the story (a single beat inside that world):',
    opts.prevText ? `(previous beat, for context only: ${opts.prevText.slice(0, 240)})` : '',
    `"${opts.pageText.slice(0, 700)}"`,
    '',
    'One clear focal moment, uncluttered background, generous negative space.',
    'Landscape composition. No text, no captions, no borders, no page numbers.',
    'Cozy and safe for a 4-year-old — nothing frightening.',
  ]
    .filter(Boolean)
    .join('\n')
}

/** Deterministic whole-book brief for books without a model-written one
 *  (pack books; generated books from before artBrief existed). How the story
 *  opens + how it ends + the moral is enough to hold setting, protagonist,
 *  and mood steady across pages. */
export function fallbackStoryBrief(opts: {
  title: string
  pagesText: string[]
  moral?: string
}): string {
  const opening = opts.pagesText.slice(0, 2).join(' ').slice(0, 420)
  const closing = opts.pagesText.length > 2 ? (opts.pagesText[opts.pagesText.length - 1] ?? '').slice(0, 240) : ''
  return [
    `"${opts.title}".`,
    opening ? `How it begins: ${opening}` : '',
    closing ? `How it ends: ${closing}` : '',
    opts.moral ? `The story's heart: ${opts.moral}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

// The 3 fixed style references shipped in the repo (deployed under public/).
const STYLE_REF_PATHS = [
  'public/art/miko-01-zoomtown.jpg',
  'public/art/miko-06-night.jpg',
  'public/books/azis-little-bhen/scene-01.jpg',
]

/** Load the style refs as inline image parts (best-effort; skips missing). */
export async function loadStyleRefs(): Promise<GeminiImagePart[]> {
  const out: GeminiImagePart[] = []
  for (const p of STYLE_REF_PATHS) {
    try {
      const buf = await readFile(join(process.cwd(), p))
      out.push({ mimeType: 'image/jpeg', data: buf.toString('base64') })
    } catch {
      /* skip a missing ref */
    }
  }
  return out
}
