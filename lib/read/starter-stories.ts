import type { Story } from '@/types/story'

// Baked-in stories so the shelf is never empty and the app works offline.
// Text, asks, choices, vocab, and retell prompts for the first three stories
// come verbatim from design/handoff/app/story-data.js — the family library.
// The rocket story is kept as an emoji-scene test case (no art yet).

export const STARTER_STORIES: Story[] = [
  {
    id: 'miko-bridge',
    title: 'Miko and the Wobbly Bridge',
    coverEmoji: '🦊',
    coverBg: 'linear-gradient(160deg,#f97316,#fbbf24)',
    coverImage: '/art/miko-cover.jpg',
    by: 'Made by Papa',
    status: 'complete',
    source: 'starter',
    createdAt: 0,
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
    pages: [
      {
        text: 'Miko the fox zoomed through Zoomtown on his little blue moto. Vroom vroom! The wind whooshed past his ears.',
        scene: {
          bg: 'linear-gradient(160deg,#38bdf8,#a7f3d0)',
          emojis: ['🦊', '🏍️', '🏙️', '💨'],
          image: '/art/miko-01-zoomtown.jpg',
        },
      },
      {
        text: 'Suddenly Miko squeezed his brakes. SCREEEECH! The bridge over Dino Canyon was wobbly. One, two, three planks were missing!',
        scene: {
          bg: 'linear-gradient(160deg,#fbbf24,#f97316)',
          emojis: ['🌉', '⚠️', '🦊'],
          image: '/art/miko-02-bridge.jpg',
        },
        ask: {
          question: 'Can you count the missing planks with me? How many were missing?',
          answers: ['three', '3'],
          praise: 'Yes! THREE planks were missing. Great counting!',
          hint: 'Let’s count together: one... two... THREE!',
          skill: 'counting',
        },
      },
      {
        text: 'Miko took one big belly breath. In... and out. His tummy felt softer. "I can’t fix this alone," he said. "But I know who can help!"',
        scene: {
          bg: 'linear-gradient(160deg,#a78bfa,#f0abfc)',
          emojis: ['🦊', '😮‍💨', '💜'],
          image: '/art/miko-03-breath.jpg',
        },
        ask: {
          question: 'Miko’s tummy felt tight and worried. Can you take one big belly breath with him? In... and out.',
          answers: [],
          praise: 'Ahhh. One BIG belly breath. Miko’s tummy feels softer — does yours?',
          hint: 'Hands on your tummy. Breathe in slowly... now let it whoosh out.',
          skill: 'feelings',
        },
      },
      {
        text: 'Tara the spider swung down on a silver thread. "A web can fix it!" she said. But they needed something strong to hold the web.',
        scene: {
          bg: 'linear-gradient(160deg,#818cf8,#38bdf8)',
          emojis: ['🕷️', '🕸️', '🌉'],
          image: '/art/miko-04-web.jpg',
        },
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
                  scene: {
                    bg: 'linear-gradient(160deg,#34d399,#a7f3d0)',
                    emojis: ['🦕', '🕸️', '🌉', '✨'],
                    image: '/art/miko-05-fixed-neck.jpg',
                  },
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
                  scene: {
                    bg: 'linear-gradient(160deg,#34d399,#a7f3d0)',
                    emojis: ['🏍️', '🕸️', '🌉', '✨'],
                    image: '/art/miko-05-fixed-moto.jpg',
                  },
                },
              ],
            },
          ],
        },
      },
      {
        text: 'That night the soccer game was the best ever. Boulder gave everyone a ride on his neck, and Miko whispered, "I’m grateful for my friends." The end!',
        scene: {
          bg: 'linear-gradient(160deg,#1e3a8a,#7c3aed)',
          emojis: ['⚽', '🌟', '🦊', '🦕', '🕷️'],
          image: '/art/miko-06-night.jpg',
        },
      },
    ],
  },

  {
    id: 'azi-bhen',
    title: 'Azi’s Little Bhen',
    coverEmoji: '💛',
    coverBg: 'linear-gradient(160deg,#fef3c7,#fbbf24)',
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
        scene: {
          bg: 'linear-gradient(160deg,#fef9ef,#fde8c8)',
          emojis: ['🍯'],
          image: '/illustration/azi-kitchen.jpg',
        },
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
        scene: {
          bg: 'linear-gradient(160deg,#fde8c8,#fbbf24)',
          emojis: ['💛'],
          image: '/illustration/azi-scene-03.jpg',
        },
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
    coverBg: 'linear-gradient(160deg,#fb7185,#f0abfc)',
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
        scene: {
          bg: 'linear-gradient(160deg,#1e3a8a,#7c3aed)',
          emojis: ['🐱', '🎄', '❄️'],
          image: '/illustration/jujy-cover.jpg',
        },
        bleed: true,
      },
      {
        text: 'She pressed one whisker to the glass. WHOOSH! Snow swirled all around, and Jujy landed softly in the little village.',
        scene: {
          bg: 'linear-gradient(160deg,#818cf8,#a7f3d0)',
          emojis: ['🐱', '🏘️', '❄️'],
          image: '/art/jujy-02-village.jpg',
        },
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

  // Emoji-scene story (no art). Kept as the render fallback test case.
  {
    id: 'starter-rocket-goal',
    title: 'The Rocket That Wouldn’t Roar',
    coverEmoji: '🚀',
    coverBg: 'linear-gradient(160deg,#1e3a8a,#7c3aed)',
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
        scene: { bg: 'linear-gradient(160deg,#0f172a,#4338ca)', emojis: ['🚀', '🕷️', '🔧', '🤫'] },
      },
      {
        text: '"Hmm," said Tara. "When something doesn’t work, we look for WHY." The rocket’s lights blinked: red, blue, red, blue, red...',
        scene: { bg: 'linear-gradient(160deg,#4338ca,#7c3aed)', emojis: ['🚀', '🔴', '🔵', '🔴'] },
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
        scene: { bg: 'linear-gradient(160deg,#f97316,#fbbf24)', emojis: ['🦊', '🏍️', '⛽', '💡'] },
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
        scene: { bg: 'linear-gradient(160deg,#0f172a,#1e3a8a)', emojis: ['🚀', '🌕', '⭐', '🎉'] },
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
