// Little Fables — buddy definitions.
// Ported from design/handoff-v2/app/data.js. Bear → Bramble per PRD § "Content:
// pre-populated library".
//
// Buddies are original watercolor characters (see design/handoff-v2 § "Buddy
// art direction"). Emoji are stand-ins until real art lands.

import type { BuddyDef } from '@/types/story'

export const BUDDIES: BuddyDef[] = [
  {
    id: 'bramble',
    name: 'Bramble',
    emoji: '🐻',
    nature: 'living',
    trait: 'Cozy and brave',
    wash: 'honey',
    intro: {
      b: "I'm Bramble. I'm big and cozy. When the bridge wobbles — I hold your paw. We're brave TOGETHER!",
      c: "I'm Bramble. I'm big and cozy. When things wobble, I hold your paw. We're brave together.",
    },
    greet: {
      b: 'Good morning, friend! Ready for today?',
      c: 'Good morning. Ready for today?',
    },
  },
  {
    id: 'otter',
    name: 'Otter',
    emoji: '🦦',
    nature: 'living',
    trait: 'Playful water-lover',
    wash: 'river',
    intro: {
      b: "I'm Otter! SPLISH SPLASH! I love rivers, puddles, and YOUR stories. Let's dive in!",
      c: "I'm Otter. I love rivers, puddles, and your stories. Let's dive in.",
    },
    greet: {
      b: 'SPLISH! A new story day!',
      c: 'Hello. A new story day.',
    },
  },
  {
    id: 'anky',
    name: 'Little Anky',
    emoji: '🦕',
    nature: 'living',
    trait: 'Shy but sturdy',
    wash: 'meadow',
    intro: {
      b: "Um… hi. I'm Little Anky. I'm shy, but my back is SUPER sturdy. You can lean on me.",
      c: "Um… hi. I'm Little Anky. I'm shy, but my back is very sturdy. You can lean on me.",
    },
    greet: {
      b: 'H-hi. I saved you a seat.',
      c: 'Hi. I saved you a seat.',
    },
  },
  {
    id: 'moto',
    name: 'Moto',
    emoji: '🏍️',
    nature: 'nonliving',
    trait: 'Tells vroom jokes',
    wash: 'canyon',
    intro: {
      b: "I'm Moto! I'm a motorcycle — I don't sleep, I PARK! Vroom vroom, let's zoom to a story!",
      c: "I'm Moto. I'm a motorcycle — I don't sleep, I park. Let's ride to a story.",
    },
    greet: {
      b: 'VROOM VROOM! Story fuel is full!',
      c: 'Vroom. Story fuel is full.',
    },
  },
  {
    id: 'rocky',
    name: 'Rocky',
    emoji: '🪨',
    nature: 'nonliving',
    trait: 'Deadpan. Very still.',
    wash: 'lilac',
    intro: {
      b: "I'm Rocky. I'm a rock. I don't eat or grow — but I'm a GREAT listener.",
      c: "I'm Rocky. I'm a rock. I don't eat or grow — but I'm a great listener.",
    },
    greet: {
      b: 'Hello. I have been here the whole time.',
      c: 'Hello. I have been here the whole time.',
    },
  },
  {
    id: 'rusty',
    name: 'Rusty',
    emoji: '🚀',
    nature: 'nonliving',
    trait: 'Dreams of space',
    wash: 'blush',
    intro: {
      b: "I'm Rusty, a toy rocket. I haven't been to space yet… but every story counts down. 3… 2… 1…",
      c: "I'm Rusty, a toy rocket. I haven't been to space yet. Every story counts down. 3… 2… 1…",
    },
    greet: {
      b: '3… 2… 1… Ready for liftoff?',
      c: '3… 2… 1… Ready when you are.',
    },
  },
]

export function getBuddy(id: string | null | undefined): BuddyDef {
  if (!id) return BUDDIES[0]
  return BUDDIES.find((b) => b.id === id) ?? BUDDIES[0]
}

/**
 * Copy picker — read a { b, c } pair against the buddy energy.
 * `b` = bouncy (default), `c` = calm.
 */
export function cp(v: string | { b: string; c: string }, energy: 'bouncy' | 'calm'): string {
  if (typeof v === 'string') return v
  return energy === 'calm' ? v.c : v.b
}
