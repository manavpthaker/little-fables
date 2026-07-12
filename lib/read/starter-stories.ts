import type { Book, ChoiceOption } from '@/types/story'
import { legacyToBook } from './migrate'

// Baked-in stories so the shelf is never empty and the app works offline.
// Text, asks, choices, vocab, and retell prompts for the first three stories
// come verbatim from design/handoff/app/story-data.js — the family library.
// The rocket story is the drawn-scene fallback test case (no art yet).
//
// Azi, Jujy, and the Rocket story are authored in the compact "v1-flat" shape
// (`pages` at the top level) and normalized into the v2 `Book` shape (with
// `chapters[]`) at module load. Miko is the flagship 3-chapter book and is
// authored natively as a v2 `Book` (bypasses the 1-chapter wrapper).
//
// v3.2 scrub: page `scene` is now a semantic key ('zoomtown', 'kitchen-warm',
// 'star-garage') that the reader maps to a drawn scene component. No
// gradients. No emoji-scene blobs. Existing `img` paths on Miko/Azi/Jujy
// pages are preserved verbatim — those are real illustrations, not the
// presentation-metadata this scrub is targeting.

// ---------- Miko: flagship 3-chapter book (native v2) ----------
// The prose is preserved verbatim from the v1 handoff (design/handoff/app/
// story-data.js) with tiny connective sentences at chapter boundaries so the
// break rhythm feels natural — Chapter 1 ends on the "I know who can help!"
// belly-breath moment; Chapter 2 opens with Tara arriving, ends on the web
// choice; Chapter 3 is the crossing + grateful night close.
const MIKO_BOOK: Book = {
  id: 'miko-bridge',
  title: 'Miko and the Wobbly Bridge',
  by: 'Made by Papa',
  kind: 'chapter',
  status: 'complete',
  source: 'starter',
  coverImage: '/art/miko-cover.jpg',
  coverEmoji: '🦊',
  wash: 'sunset',
  meta: '3 chapters · counting',
  teachingGoals: ['counting', 'belly breaths', 'gratefulness'],
  vocab: [
    { word: 'wobbly', meaning: 'shaky and wibbly, not steady' },
    { word: 'steady', meaning: 'strong and still, not moving' },
    { word: 'grateful', meaning: 'feeling warm and thankful inside' },
  ],
  retellPrompts: [
    'Who needed help in the story?',
    'What was wrong with the bridge?',
    'How did Miko calm down when he felt worried?',
    'What would YOU have built?',
  ],
  chapters: [
    {
      title: 'The Wobbly Bridge',
      wash: 'canyon',
      emojis: ['🦊', '🌉'],
      hook: {
        b: "Next time: a big belly breath and Tara's silver web…",
        c: "Next time: a big belly breath and Tara's silver web.",
      },
      recapQuestion: 'How many planks were missing from the bridge?',
      pages: [
        {
          text: 'Miko the fox zoomed through Zoomtown on his little blue moto. Vroom vroom! The wind whooshed past his ears.',
          wash: 'canyon',
          scene: 'zoomtown',
          emojis: ['🦊', '🏍️', '🏙️', '💨'],
          img: '/art/miko-01-zoomtown.jpg',
        },
        {
          text: 'Suddenly Miko squeezed his brakes. SCREEEECH! The bridge over Dino Canyon was wobbly. One, two, three planks were missing!',
          wash: 'canyon',
          scene: 'wobbly-bridge',
          emojis: ['🌉', '⚠️', '🦊'],
          img: '/art/miko-02-bridge.jpg',
          star: 'wobbly',
          ask: {
            skill: 'counting',
            question: 'Can you count the missing planks with me? How many were missing?',
            answers: ['three', '3'],
            praise: 'Yes! THREE planks were missing. Great counting!',
            hint: 'Let’s count together: one... two... THREE!',
          },
        },
      ],
    },
    {
      title: "Tara's Big Idea",
      wash: 'meadow',
      emojis: ['🕷️', '🕸️'],
      hook: {
        b: 'Next time: CROSSING DAY — will the web hold?',
        c: 'Next time: Crossing Day. Will the web hold?',
      },
      recapQuestion: 'What did Tara think would fix the bridge?',
      pages: [
        {
          text: 'Miko took one big belly breath. In... and out. His tummy felt softer. "I can’t fix this alone," he said. "But I know who can help!"',
          wash: 'blush',
          scene: 'belly-breath',
          emojis: ['🦊', '😮‍💨', '💜'],
          img: '/art/miko-03-breath.jpg',
          breathe: true,
        },
        {
          text: 'Tara the spider swung down on a silver thread. "A web can fix it!" she said. But they needed something strong to hold the web.',
          wash: 'meadow',
          scene: 'web',
          emojis: ['🕷️', '🕸️', '🌉'],
          img: '/art/miko-04-web.jpg',
          choice: {
            prompt: 'What should hold the web?',
            options: [
              {
                label: 'Boulder’s long neck',
                emoji: '🦕',
                keywords: ['boulder', 'neck', 'dinosaur', 'dino'],
                pages: [
                  {
                    text: 'Boulder stretched his looooong neck across the canyon like a crane. Tara spun her web around it — zip zip zip! The web pulled the bridge tight and steady.',
                    wash: 'meadow',
                    scene: 'crossing',
                    emojis: ['🦕', '🕸️', '🌉', '✨'],
                    img: '/art/miko-05-fixed-neck.jpg',
                  },
                ],
              },
              {
                label: 'Miko’s moto',
                emoji: '🏍️',
                keywords: ['moto', 'motorcycle', 'bike', 'miko'],
                pages: [
                  {
                    text: 'Miko parked his moto and Tara tied her web to it — zip zip zip! Miko held the brakes tight. The web pulled the bridge steady like a seatbelt.',
                    wash: 'meadow',
                    scene: 'crossing',
                    emojis: ['🏍️', '🕸️', '🌉', '✨'],
                    img: '/art/miko-05-fixed-moto.jpg',
                  },
                ],
              },
            ] satisfies ChoiceOption[],
          },
        },
      ],
    },
    {
      title: 'Crossing Day',
      wash: 'honey',
      emojis: ['🦊', '🦕'],
      recapQuestion: 'How did Miko feel at the end?',
      pages: [
        {
          text: 'The next morning, Boulder stretched his looooong neck across the canyon like a crane. Tara spun her web around it — zip zip zip! The web pulled the bridge tight and steady.',
          wash: 'honey',
          scene: 'crossing',
          emojis: ['🦕', '🕸️', '🌉', '✨'],
          img: '/art/miko-05-fixed-neck.jpg',
          star: 'steady',
        },
        {
          text: 'That night the soccer game was the best ever. Boulder gave everyone a ride on his neck, and Miko whispered, "I’m grateful for my friends." The end!',
          wash: 'honey',
          scene: 'night-crossing',
          emojis: ['⚽', '🌟', '🦊', '🦕', '🕷️'],
          img: '/art/miko-06-night.jpg',
          star: 'grateful',
        },
      ],
    },
  ],
  createdAt: 0,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RAW_STARTERS: any[] = [
  {
    id: 'azi-bhen',
    title: 'Azi’s Little Bhen',
    coverEmoji: '💛',
    coverImage: '/illustration/azi-kitchen.jpg',
    by: 'Made by Mom',
    status: 'complete',
    source: 'starter',
    createdAt: 0,
    teachingGoals: ['counting', 'family words (Gujarati)'],
    vocab: [
      { word: 'bhen', meaning: 'sister, in Gujarati' },
      { word: 'stir', meaning: 'to mix round and round' },
      { word: 'gentle', meaning: 'soft and careful, like a whisper' },
    ],
    retellPrompts: [
      'What did Azi and Dadi cook together?',
      'What does bhen mean?',
      'What will Azi show his little bhen one day?',
    ],
    pages: [
      {
        text: 'Azi helped Dadi stir the big silver pot. Round and round went the spoon. Something smelled warm and sweet.',
        scene: 'kitchen-warm',
        img: '/illustration/azi-kitchen.jpg',
        bleed: true,
        ask: {
          question: 'Look at the little plate. Can you count the eggs for Dadi?',
          answers: ['three', '3'],
          praise: 'Yes! THREE eggs, ready to crack. Great counting!',
          hint: 'Point to each one: one... two... th-th-three!',
          skill: 'counting',
        },
      },
      {
        text: '"One day your little bhen will cook with us too," said Mama. Azi painted her a tiny picture — gentle, gentle — to save for her. The end!',
        scene: 'kitchen-warm',
        img: '/illustration/azi-scene-03.jpg',
        bleed: true,
        ask: {
          question: 'Bhen means little sister. Can you say bhen?',
          answers: [],
          praise: 'BHEN! Beautiful. Bhen means little sister.',
          hint: 'Try it slowly: b-b-bhen.',
          skill: 'family words',
        },
      },
    ],
  },

  {
    id: 'jujy-christmas',
    title: 'Jujy’s Christmas Adventure',
    coverEmoji: '🐱',
    coverImage: '/illustration/jujy-cover.jpg',
    by: 'Made by Dadi',
    status: 'complete',
    source: 'starter',
    createdAt: 0,
    teachingGoals: ['kindness', 'guessing'],
    vocab: [
      { word: 'glowing', meaning: 'shining with a soft, warm light' },
      { word: 'whisker', meaning: 'a cat’s tickly face hair' },
    ],
    retellPrompts: [
      'What was glowing in Jujy’s house?',
      'Who do you think was calling her name?',
    ],
    pages: [
      {
        text: 'Jujy the cat put on her red cape. Tonight the snow globe was glowing, and something tiny inside was calling her name...',
        scene: 'winter-night',
        img: '/illustration/jujy-cover.jpg',
        bleed: true,
      },
      {
        text: 'She pressed one whisker to the glass. WHOOSH! Snow swirled all around, and Jujy landed softly in the little village.',
        scene: 'village-lit',
        img: '/art/jujy-02-village.jpg',
        ask: {
          question: 'Look at the little houses. Who do you think is calling Jujy’s name?',
          answers: [],
          praise: 'Ooooh, what a good guess. Let’s find out together on the next page!',
          hint: 'Look at the lit windows — someone tiny lives there.',
          skill: 'guessing',
        },
      },
    ],
  },

  // Drawn-scene fallback test case (no illustration yet — the reader renders
  // the endpaper placeholder for these semantic keys until art lands).
  {
    id: 'starter-rocket-goal',
    title: 'The Rocket That Wouldn’t Roar',
    coverEmoji: '🚀',
    by: 'Made by Papa',
    status: 'complete',
    source: 'starter',
    createdAt: 0,
    teachingGoals: ['patterns', 'letter sounds', 'trying again'],
    vocab: [
      { word: 'engine', meaning: 'the roaring heart of a rocket' },
      { word: 'pattern', meaning: 'the same thing that happens again and again' },
      { word: 'launch', meaning: 'to zoom up into the sky' },
    ],
    retellPrompts: [
      'Why wouldn’t the rocket roar?',
      'What pattern did the lights make?',
      'What did Tara say when it didn’t work the first time?',
    ],
    pages: [
      {
        text: 'In the Star Garage, a small silver rocket sat very quiet. "Today we launch!" said Tara. But when she pressed the button... nothing. No roar.',
        scene: 'star-garage',
      },
      {
        text: '"Hmm," said Tara. "When something doesn’t work, we look for WHY." The rocket’s lights blinked: red, blue, red, blue, red...',
        scene: 'star-garage',
        ask: {
          question: 'The lights made a pattern: red, blue, red, blue, red... what comes next?',
          answers: ['blue'],
          praise: 'Blue! You found the pattern. Patterns help us predict what comes next!',
          hint: 'Red, blue, red, blue, red... b-b-b...?',
          skill: 'patterns',
        },
      },
      {
        text: 'Miko rolled in on his moto with a can of rocket fuel. "The tank is empty!" he laughed. "No fuel, no roar. That’s the WHY!"',
        scene: 'launch',
        ask: {
          question: 'Fuel starts with the sound "fff". Can you make the FFF sound?',
          answers: ['f', 'fff', 'fuel'],
          praise: 'Fff-fantastic! F is for fuel, fox, and fast!',
          hint: 'Put your teeth on your lip and blow softly: fffff!',
          skill: 'letter sounds',
        },
      },
      {
        text: 'Second try: fuel AND the sparky plug plugged in tight. Three... two... one... ROOOOAAAR! The rocket zoomed up past the moon!',
        scene: 'space',
        ask: {
          question: 'It worked on the second try! What do we say when something is hard?',
          answers: ['try again', 'keep trying', 'again'],
          praise: 'Yes! We try again. Trying again is how rockets — and kids — learn to fly.',
          hint: 'We don’t give up, we try a-...gain!',
          skill: 'trying again',
        },
      },
    ],
  },
]

export const STARTER_STORIES: Book[] = [MIKO_BOOK, ...RAW_STARTERS.map(legacyToBook)]
