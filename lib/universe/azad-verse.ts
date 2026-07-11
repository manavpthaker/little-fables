// Azi-Verse — the canonical universe for Little Fables v2.
// Source of truth: docs/reference/azi-verse/universe-guide.md.
// Editable in the Parent Corner; edits are stored in localStorage and merged
// over these defaults. Kept at the historical path `azad-verse.ts` so existing
// imports keep resolving.

export interface Companion {
  name: string
  emoji: string
  role: string
  personality: string
  loves: string
  catchphrase?: string
}

export interface Setting {
  name: string
  description: string
}

export interface CultureWord {
  term: string
  language: 'Spanish' | 'Gujarati' | 'Hindi' | 'Creole' | 'English'
  meaning: string
}

export interface Universe {
  childName: string
  age: number
  /** Story-level target — reads/plays above age (e.g. "5–6 year old"). */
  storyLevel: string
  interests: string[]
  companions: Companion[]
  settings: Setting[]
  teachingGoals: string[]
  values: string[]
  culture: {
    languages: string[]
    words: CultureWord[]
    notes: string
  }
  rituals: string[]
  /** Things to avoid in stories. */
  avoid: string[]
}

export const DEFAULT_UNIVERSE: Universe = {
  childName: 'Azad',
  age: 4,
  storyLevel: '5–6 year old (reads and reasons above age level)',
  interests: [
    'guitar and music (Azi\'s three-chord C-G-Am progression)',
    'puzzles — fitting pieces together',
    'AKAI keyboard, patience while learning',
    'motorcycles, dinosaurs, bridges',
    'the moon and stars',
    'snow, honey, gardens, bees',
    'trains and yellow buses',
    'family video calls to Colombia',
    'code-switching — Spanish, English, Gujarati, Hindi, Creole',
  ],
  companions: [
    // Plush companions (source: universe-guide.md).
    {
      name: 'Jujy',
      emoji: '🐈',
      role: 'the loyal leader — black-and-white tuxedo cat',
      personality: 'confident, sometimes forgets the plan halfway through announcing it',
      loves: 'expeditions, roll call, leading Wardlaw Hartridge trips',
      catchphrase: 'Whisker-wiggle roll call!',
    },
    {
      name: 'Dory',
      emoji: '🐱',
      role: 'the dreamy scout — soft gray-and-white cat',
      personality: 'cheerful, spacey, lives in the moment (and often revisits it)',
      loves: 'Flo\'s Creole drifting through the window, big feelings, small snacks',
      catchphrase: 'Um… what were we doing?',
    },
    {
      name: 'Pandies',
      emoji: '🐼',
      role: 'the calm guide / bus driver — wise, slow-speaking panda',
      personality: 'patient, quiet, always ready with the right question',
      loves: 'driving the yellow bus, invisible ranger hat, arriving on time',
      catchphrase: '¿Todos listos?',
    },
    {
      name: 'Citie',
      emoji: '🧸',
      role: 'the steady rider — the quiet noticer',
      personality: 'observant, patient, sees small things others miss',
      loves: 'watching out the bus window, being present',
    },
    {
      name: 'Clappy',
      emoji: '🎺',
      role: 'the joyful musician — red, round, full of rhythm',
      personality: 'claps before thinking, sings when it\'s quiet, feels loud',
      loves: 'Colombian cumbia, Indian tabla, tambourines in still rooms',
    },
    {
      name: 'Slothie',
      emoji: '🦥',
      role: 'the stillness — moves slowly, speaks rarely',
      personality: 'feels everything, brings calm and warmth',
      loves: 'presence, video calls with faraway grandparents',
    },
    {
      name: 'Monkie',
      emoji: '🐒',
      role: 'the practical fisherman — planner in footie pajamas',
      personality: 'a worrier and a fixer; knows when to cast a line and when to sit',
      loves: 'the dock, Spanish words for feelings that have no English name',
    },
    {
      name: 'Peter',
      emoji: '🐾',
      role: 'the quiet trickster — small, brown, thoughtful',
      personality: 'a sparkle behind the silence; starts games no one knew they were playing',
      loves: 'Gujarati letters (possibly secret codes), curiosity',
    },
    {
      name: 'Pooh',
      emoji: '🐻',
      role: 'the slow farmer — tends honey, speaks like dusk',
      personality: 'a warm cup, a long exhale',
      loves: 'bees, humming vallenatos and ragas, old lullabies that cross oceans',
    },
    // Story-series companions (Miko et al.) kept for the Zoomtown storybook line.
    {
      name: 'Miko',
      emoji: '🦊',
      role: 'quick red fox on a tiny blue moto (Zoomtown series)',
      personality: 'brave, curious, remembers to breathe when the tummy tightens',
      loves: 'zooming, helping friends, checking living vs nonliving',
      catchphrase: 'Vroom vroom, let\'s zoom!',
    },
    {
      name: 'Tara',
      emoji: '🕷️',
      role: 'friendly spider who spins silver webs (Zoomtown series)',
      personality: 'clever, patient, plan-maker',
      loves: 'web-goals, catching falling things',
      catchphrase: 'A web can fix it!',
    },
    {
      name: 'Boulder',
      emoji: '🦕',
      role: 'gentle brontosaurus in construction (Zoomtown series)',
      personality: 'calm, strong, grateful for small things',
      loves: 'lifting beams with his long neck, saying thank you',
      catchphrase: 'Slow and steady builds it best.',
    },
  ],
  settings: [
    {
      name: 'The Westfield',
      description:
        'Home — green clapboard, red door, white picket fence. Sits slightly sideways to the sun. Spanish flows like honey in the morning; Hindi books wait for bedtime discoveries.',
    },
    {
      name: 'Azi\'s Playroom',
      description:
        'Circular rug, cozy shelves, guitar, felt-covered stool, record player, AKAI keyboard, Papa\'s Gujarati tablet on the windowsill. Whisker-wiggle roll call happens here.',
    },
    {
      name: 'Azi\'s Bedroom',
      description:
        'Twilight-toned room with a moon-view window, books tucked under pillows (some en español), a little sofa with slumped companions. Where endings and soft questions happen.',
    },
    {
      name: 'The Backyard',
      description:
        'Kale, beans, tomatoes, herbs, the trampoline, the BBQ grill. Honeybees hum like gentle neighbors. April 21st birthdays under spring sun.',
    },
    {
      name: 'Pooh\'s Honey Farm',
      description:
        'Beyond the backyard fence, down a path that sometimes isn\'t there. Bees hum in a language older than words. Red tractor idles patiently.',
    },
    {
      name: 'Monkie\'s Dock and Boat',
      description:
        'The dock appears when needed. Sometimes beside water that sparkles like the Caribbean, sometimes streams that whisper like mountain rivers. Monkie knows the knots.',
    },
    {
      name: 'The Yellow Bus',
      description:
        'Driven by Pandies. Stops for Wardlaw Hartridge (camp), Apple Montessori (school), and anywhere a story needs to begin.',
    },
    {
      name: 'Liberty Science Center (Brady\'s World)',
      description:
        'Where questions become adventures. Brady\'s gentle scientist heart meets Azi\'s drumming curiosity.',
    },
    {
      name: 'Video Call Spaces',
      description:
        'The laptop screen that becomes a window to Colombia — Lito and Lita\'s voices carry sunshine. Where "te amo" travels through screens.',
    },
    {
      name: 'Dada & Dadi\'s House in Howell',
      description:
        'An hour-long car ride that feels like traveling to a land of abundance. Dosas cooking, Gujarati floating through rooms, Dada\'s Hess trucks parading on shelves.',
    },
    {
      name: 'The Neighborhood Circle',
      description:
        'Brady and Anne next door, Flo\'s warm Haitian welcome across the way, walking routes that connect houses and hearts.',
    },
    // Zoomtown (Miko series) kept as a distinct storybook place.
    {
      name: 'Zoomtown / Dino Canyon',
      description:
        'The Miko series — moto lanes, soccer field, wobbly bridge over Dino Canyon. Storybook-only; not part of the Azi-Verse proper.',
    },
  ],
  teachingGoals: [
    'counting and simple numeracy',
    'star words (vocabulary + meaning)',
    'naming feelings and belly breaths',
    'flexible thinking (plan changes → new possibilities)',
    'living vs nonliving classification',
    'letter sounds, rhymes, code-switching between languages',
    'kindness, sharing, gratefulness, trying again',
    'family words: Gujarati, Spanish, Hindi',
  ],
  values: ['kindness', 'gratefulness', 'courage', 'sharing', 'trying again', 'family'],
  culture: {
    languages: ['English', 'Spanish', 'Gujarati', 'Hindi', 'Creole'],
    words: [
      { term: 'agua', language: 'Spanish', meaning: 'water' },
      { term: 'lechita', language: 'Spanish', meaning: 'a little milk' },
      { term: 'mi cielo', language: 'Spanish', meaning: 'my sky (endearment)' },
      { term: 'mi amor', language: 'Spanish', meaning: 'my love' },
      { term: 'te amo', language: 'Spanish', meaning: 'I love you' },
      { term: 'celebración', language: 'Spanish', meaning: 'celebration' },
      { term: '¿todos listos?', language: 'Spanish', meaning: 'everyone ready?' },
      { term: 'bhen', language: 'Gujarati', meaning: 'little sister' },
      { term: 'beta', language: 'Gujarati', meaning: 'child (term of endearment)' },
      { term: 'chalo', language: 'Gujarati', meaning: 'come on / let\'s go' },
      { term: 'Dada', language: 'Gujarati', meaning: 'grandfather (father\'s side)' },
      { term: 'Dadi', language: 'Gujarati', meaning: 'grandmother (father\'s side)' },
      { term: 'Kaka', language: 'Gujarati', meaning: 'uncle (father\'s brother)' },
      { term: 'Kaki', language: 'Gujarati', meaning: 'aunt (Kaka\'s wife)' },
      { term: 'jaldi', language: 'Gujarati', meaning: 'quick!' },
      { term: 'ek do teen', language: 'Hindi', meaning: 'one, two, three' },
    ],
    notes:
      'Colombian sunshine + Indian curiosity + neighborhood Creole. Code-switch naturally (1–2 heritage words per page max); a character says the word and another responds so meaning is clear from context. Never dictionary translations. Mama\'s Spanish is warm; Papa is learning Gujarati alongside Azi.',
  },
  rituals: [
    '"Whisker-wiggle roll call!" — opens each adventure',
    'Azi\'s three-chord progression (C-G-Am) signals thinking',
    'Puzzle-corner-pieces metaphor when life feels complicated',
    'Dosas / arepas / honey mark emotional calm',
    'The moon watches over all the children of the world — story endings',
    'AKAI keyboard humming — patience waiting for understanding to grow',
    'Snack-song-moon closings',
    'April 21 birthday celebrations on the deck',
    'Hess truck parades at Dada and Dadi\'s house',
  ],
  avoid: [
    'real violence',
    'scary imagery for its own sake',
    'brand characters (make our own)',
    'moralizing or explicit teaching',
    'cultural tokenism (superficial heritage words / traditions)',
    'loss states, streaks-with-punishment, leaderboards, currencies',
  ],
}

const STORAGE_KEY = 'azad-universe-v1'

export function loadUniverse(): Universe {
  if (typeof window === 'undefined') return DEFAULT_UNIVERSE
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_UNIVERSE
    return { ...DEFAULT_UNIVERSE, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_UNIVERSE
  }
}

export function saveUniverse(u: Universe) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
}

export function resetUniverse() {
  window.localStorage.removeItem(STORAGE_KEY)
}
