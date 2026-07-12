// Little Fables — badge definitions + earning rules.
// Badges are milestones, not currency. Suns light, never unlight. Badges are
// granted once via `grantBadge()`; a "pendingEarn" id triggers BadgeEarn.
//
// Sources:
//   - design/handoff-v2/app/data.js BADGES (firstChoice, days5, mikoMaster,
//     words10)
//   - PRD § R11 book-complete + retell milestones

import type { BadgeDef } from '@/types/story'
import {
  loadBadges,
  loadReadingDays,
  loadWordBook,
  loadWorldState,
  grantBadge,
  listRetells,
} from './storage'

export const BADGES: BadgeDef[] = [
  {
    id: 'firstChoice',
    name: 'First Choice',
    emoji: '🕸️',
    wash: 'meadow',
    earnLine: {
      b: 'You made your very first story choice!',
      c: 'You made your very first story choice.',
    },
    how: 'Make your first story choice',
  },
  {
    id: 'days5',
    name: '5 Reading Days',
    emoji: '☀️',
    wash: 'honey',
    earnLine: {
      b: 'Five days of stories together — WOW!',
      c: 'Five days of stories together.',
    },
    how: 'Read for 5 different days',
  },
  {
    id: 'days10',
    name: '10 Reading Days',
    emoji: '☀️',
    wash: 'sunset',
    earnLine: {
      b: 'Ten days of stories! You are on a ROLL!',
      c: 'Ten days of stories together.',
    },
    how: 'Read for 10 different days',
  },
  {
    id: 'days25',
    name: '25 Reading Days',
    emoji: '☀️',
    wash: 'blush',
    earnLine: {
      b: 'TWENTY-FIVE reading days! You are a story-star!',
      c: 'Twenty-five reading days. Wow.',
    },
    how: 'Read for 25 different days',
  },
  {
    id: 'words10',
    name: '10 Star Words',
    emoji: '⭐',
    wash: 'lilac',
    earnLine: {
      b: 'TEN star words in your pocket!',
      c: 'Ten star words. Well done.',
    },
    how: 'Collect 10 star words',
  },
  {
    id: 'mikoMaster',
    name: 'Miko Master',
    emoji: '🦊',
    wash: 'sunset',
    earnLine: {
      b: 'You finished all 3 Miko books!',
      c: 'You finished all three Miko books.',
    },
    how: 'Finish all 3 Miko chapters',
  },
  {
    id: 'bookComplete',
    name: 'First Book Finished',
    emoji: '📖',
    wash: 'honey',
    earnLine: {
      b: 'You read a WHOLE book, all the way to the end!',
      c: 'You finished a whole book.',
    },
    how: 'Finish a whole book',
  },
  {
    id: 'firstRetell',
    name: 'Retell',
    emoji: '🎙',
    wash: 'blush',
    earnLine: {
      b: 'You told a story in YOUR own words!',
      c: 'You told a story in your own words.',
    },
    how: 'Record your first retell',
  },
  {
    id: 'retells5',
    name: '5 Retells',
    emoji: '🎙',
    wash: 'lilac',
    earnLine: {
      b: 'FIVE retells — you are a real storyteller!',
      c: 'Five retells. You are a storyteller.',
    },
    how: 'Record 5 retells',
  },
  // v3 — R19 story kitchen. Granted from create-with-buddy after the story
  // lands successfully. Kept separate from the retell badges so they can stack.
  {
    id: 'storyteller',
    name: 'Storyteller',
    emoji: '✍️',
    wash: 'meadow',
    earnLine: {
      b: 'You wrote your OWN story!',
      c: 'You wrote your own story.',
    },
    how: 'Make a story with your buddy',
  },
  {
    id: 'storyteller3',
    name: 'Storyteller x3',
    emoji: '✍️',
    wash: 'sunset',
    earnLine: {
      b: 'THREE stories of your own — you\'re on a roll!',
      c: 'Three stories of your own.',
    },
    how: 'Make three stories with your buddy',
  },
  {
    id: 'storyteller10',
    name: 'Storyteller x10',
    emoji: '✍️',
    wash: 'canyon',
    earnLine: {
      b: 'TEN of your own stories — you are a real author!',
      c: 'Ten of your own stories. You are a real author.',
    },
    how: 'Make ten stories with your buddy',
  },
]

export function getBadge(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id)
}

// --- Earn checks --------------------------------------------------------
// Each rule is a small predicate over stored state. Kept synchronous where
// possible so it can be called from any state-change point (page turn, choice,
// chapter-end, book-complete).

async function currentSignals() {
  const badges = new Set(loadBadges().ids)
  const days = loadReadingDays().daysLit.length
  const words = loadWordBook().words.length
  const choices = loadWorldState().choiceLog.length
  let retells = 0
  try {
    retells = (await listRetells()).length
  } catch {
    /* IDB unavailable — treat as 0 */
  }
  return { badges, days, words, choices, retells }
}

/**
 * Recompute all badge rules against current state and grant anything newly
 * earned. Idempotent (grantBadge dedupes). Returns the ids granted THIS call.
 * Callers typically await this after a state-changing event and, if any ids
 * come back, navigate to /read/badges/earn/[id] using the first one.
 */
export async function checkBadges(opts?: {
  /** If a specific book id just completed, checks book-scoped badges. */
  bookCompletedId?: string
  /** Total lifetime kid-authored creations (from lib/read/kid-creations if
   *  extended, or the caller counts books with author==='azad'). Enables the
   *  Storyteller / Storyteller x3 / Storyteller x10 badges. */
  kidCreationsCount?: number
}): Promise<string[]> {
  const granted: string[] = []
  const { badges, days, words, choices, retells } = await currentSignals()

  const grant = (id: string) => {
    if (badges.has(id)) return
    grantBadge(id)
    badges.add(id)
    granted.push(id)
  }

  if (choices >= 1) grant('firstChoice')
  if (days >= 5) grant('days5')
  if (days >= 10) grant('days10')
  if (days >= 25) grant('days25')
  if (words >= 10) grant('words10')
  if (retells >= 1) grant('firstRetell')
  if (retells >= 5) grant('retells5')

  if (opts?.bookCompletedId) {
    grant('bookComplete')
    if (opts.bookCompletedId === 'miko-bridge' || opts.bookCompletedId === 'miko') {
      grant('mikoMaster')
    }
  }

  if (typeof opts?.kidCreationsCount === 'number') {
    if (opts.kidCreationsCount >= 1) grant('storyteller')
    if (opts.kidCreationsCount >= 3) grant('storyteller3')
    if (opts.kidCreationsCount >= 10) grant('storyteller10')
  }

  return granted
}
