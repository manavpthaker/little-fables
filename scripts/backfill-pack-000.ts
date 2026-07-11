// One-time backfill for pack-000 (family originals) to add v2.2 fields:
//   - mysteryWord    (heritage word for the Language Wall — v2.2 item 6)
//   - comfortRitual  (closing beat for BookComplete — v2.2 item 7)
//   - skillTags      (SS-taxonomy ids derived from legacy teachingGoals — item 5)
//
// Idempotent: only writes fields that aren't already set. Run with:
//   npx tsx scripts/backfill-pack-000.ts
//
// NOTE: This edits `content/packs/pack-000-family-originals.json` in place.
// It is safe to run repeatedly; existing fields are preserved.

import 'dotenv/config'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mapLegacyGoal } from '../lib/read/skills'

const PACK_PATH = resolve(process.cwd(), 'content/packs/pack-000-family-originals.json')

// ---------- Per-story picks ----------
// mysteryWord: choose one heritage word (present in the story's vocab or text).
// Stories with no natural heritage word are skipped (no mystery word added).
type MysteryPick = { word: string; language: string; meaning?: string }
const MYSTERY_WORDS: Record<string, MysteryPick | null> = {
  'bus-detour': {
    word: 'celebración',
    language: 'es',
    meaning: 'a party or celebration, in Spanish',
  },
  'brambles-hello': null,
  'cozy-circle': null,
  'moose-bigness': null,
  'coocoo': null,
  'midnight-train': {
    word: 'navidad',
    language: 'es',
    meaning: 'Christmas, in Spanish',
  },
  'papa-gets-the-moon': {
    // The pack vocab already carries `luna` — the closing moon story is a
    // natural place to surface it as the heritage word.
    word: 'luna',
    language: 'es',
    meaning: 'the moon, in Spanish',
  },
}

// comfortRitual: moon / snack / song / lullaby. `alreadyClosed: true` skips
// the interstitial for books that already end on a matching quiet page (e.g.
// Cozy Circle's moon page, Papa Gets the Moon's rest chapter).
type RitualPick = {
  motif: 'moon' | 'snack' | 'song' | 'lullaby'
  line: string
  alreadyClosed?: boolean
}
const COMFORT_RITUALS: Record<string, RitualPick> = {
  'cozy-circle': {
    motif: 'moon',
    line: 'The moon is watching over you tonight.',
    alreadyClosed: true,
  },
  'papa-gets-the-moon': {
    motif: 'moon',
    line: 'Rest now — Papa already got the moon for you.',
    alreadyClosed: true,
  },
  'midnight-train': {
    motif: 'moon',
    line: 'The moon watches over all the children of the world.',
    alreadyClosed: false,
  },
  'moose-bigness': {
    motif: 'song',
    line: 'Big feelings are made a little smaller when we sing about them.',
    alreadyClosed: false,
  },
  'bus-detour': {
    motif: 'snack',
    line: "Some detours end with samosas. Home isn't always a straight road.",
    alreadyClosed: false,
  },
  'brambles-hello': {
    motif: 'song',
    line: 'Sometimes brave is just saying hello anyway.',
    alreadyClosed: false,
  },
  'coocoo': {
    motif: 'lullaby',
    line: 'You can do more than you know. The mirror knew before you did.',
    alreadyClosed: false,
  },
}

// ---------- skillTags ----------
// Map from legacy teachingGoals strings → SS ids. Uses `mapLegacyGoal` from
// lib/read/skills.ts. Unknown goals are dropped (per spec). Deduplicated.
function toSkillTags(goals: string[] | undefined): string[] {
  if (!goals) return []
  const ids = new Set<string>()
  for (const g of goals) {
    const id = mapLegacyGoal(g)
    if (id) ids.add(id)
  }
  return Array.from(ids)
}

// ---------- Main ----------
type Story = {
  id: string
  teachingGoals?: string[]
  mysteryWord?: MysteryPick
  comfortRitual?: RitualPick
  skillTags?: string[]
}
type Pack = { pack: string; note?: string; stories: Story[] }

function main() {
  const raw = readFileSync(PACK_PATH, 'utf8')
  const pack = JSON.parse(raw) as Pack

  let changed = 0
  for (const story of pack.stories) {
    const notes: string[] = []

    // Mystery word — only set if we have a mapping AND it isn't already there.
    if (!story.mysteryWord) {
      const pick = MYSTERY_WORDS[story.id]
      if (pick) {
        story.mysteryWord = pick
        notes.push(`mysteryWord=${pick.word} (${pick.language})`)
      } else if (pick === null) {
        notes.push('mysteryWord=skip')
      } else {
        notes.push('mysteryWord=(no mapping)')
      }
    } else {
      notes.push(`mysteryWord=(kept ${story.mysteryWord.word})`)
    }

    // Comfort ritual — only set if we have a mapping AND it isn't already there.
    if (!story.comfortRitual) {
      const ritual = COMFORT_RITUALS[story.id]
      if (ritual) {
        story.comfortRitual = ritual
        notes.push(
          `comfortRitual=${ritual.motif}${ritual.alreadyClosed ? ' (alreadyClosed)' : ''}`,
        )
      } else {
        notes.push('comfortRitual=(no mapping)')
      }
    } else {
      notes.push(`comfortRitual=(kept ${story.comfortRitual.motif})`)
    }

    // Skill tags — derive from teachingGoals if not already present.
    if (!story.skillTags || story.skillTags.length === 0) {
      const tags = toSkillTags(story.teachingGoals)
      if (tags.length > 0) {
        story.skillTags = tags
        notes.push(`skillTags=[${tags.join(', ')}]`)
      } else {
        notes.push('skillTags=(no mapping)')
      }
    } else {
      notes.push(`skillTags=(kept ${story.skillTags.length})`)
    }

    changed += 1
    // eslint-disable-next-line no-console
    console.log(`  · ${story.id}: ${notes.join('; ')}`)
  }

  // Preserve trailing newline + indentation style (JSON with 1-space indent
  // matches what the file uses; the diff should be minimal).
  writeFileSync(PACK_PATH, JSON.stringify(pack, null, 1) + '\n', 'utf8')
  // eslint-disable-next-line no-console
  console.log(`\nBackfilled ${changed} story/stories in ${PACK_PATH}`)
}

main()
