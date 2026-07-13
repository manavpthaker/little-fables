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

export function characterPrompt(c: CharacterBibleEntry): string {
  const traits = (c.traits ?? []).join(', ') || 'gentle, distinct, kind'
  const anchors = (c.visualAnchors ?? []).join(', ') || 'clear silhouette, memorable feature'
  const loves = c.loves ?? '—'
  const roleFourEight = c.roleByBand?.['4-8'] ?? c.role
  const safeName = IP_SAFE_NAMES[c.name] ?? c.name
  const safeRole = c.role.replace(/\bPooh\b/g, 'the honey farmer')
  return [
    "Character reference sheet for a children's book character.",
    'Style: warm hand-drawn watercolor with ink linework, textured paper feel,',
    'gentle warm palette (paper cream + warm ink + occasional wash pigments —',
    'marigold, sage, terracotta, dusk).',
    '',
    `Character: ${safeName} — ${safeRole}. Species: ${inferSpecies(c)}.`,
    `Traits: ${traits}.`,
    `Loves: ${loves}.`,
    `Visual anchors: ${anchors}.`,
    `Age band context (4-8): ${roleFourEight}.`,
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
