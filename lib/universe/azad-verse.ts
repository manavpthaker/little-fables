// Azad-verse — default universe config (Storyverse framework)
// Editable in the Parent Corner (/read/parent); edits are stored in localStorage
// and merged over these defaults. Update freely as Azad grows.

export interface Companion {
  name: string
  emoji: string
  species: string
  personality: string
  loves: string
  catchphrase: string
}

export interface Universe {
  childName: string
  age: number
  /** Reads/plays above age level — stories target this band */
  storyLevel: string
  interests: string[]
  companions: Companion[]
  settings: string[]
  teachingGoals: string[]
  values: string[]
  /** Cultural + language layer. words: { term, language, meaning } */
  culture: {
    languages: string[]
    words: { term: string; language: string; meaning: string }[]
    notes: string
  }
  /** Things to avoid in stories */
  avoid: string[]
}

export const DEFAULT_UNIVERSE: Universe = {
  childName: 'Azad',
  age: 4,
  storyLevel: '5-6 year old (reads and reasons above age level)',
  interests: [
    'motorcycles ("motos")',
    'soccer',
    'hockey',
    'space and rockets',
    'trucks and construction',
    'dinosaurs',
    'animals and nature',
    'spider-heroes and web-swinging rescues',
    'living vs nonliving things',
    'music, art, and building/inventing things',
  ],
  companions: [
    {
      name: 'Papa',
      emoji: '👨🏽',
      species: 'Azad’s papa — glasses, beard, loves his record collection and music',
      personality: 'warm, playful, loves explaining how things work',
      loves: 'playing records, building things with Azi, big bear hugs',
      catchphrase: 'Let’s figure it out together!',
    },
    {
      name: 'Dadi',
      emoji: '👵🏽',
      species: 'Azad’s grandmother — glasses, the best cook in the whole family',
      personality: 'gentle, patient, tells the oldest and best stories',
      loves: 'cooking sweet things with Azi, teaching Gujarati words',
      catchphrase: 'Chalo, beta!',
    },
    {
      name: 'Miko',
      emoji: '🦊',
      species: 'a quick red fox who rides a tiny blue moto',
      personality: 'brave, curious, sometimes goes too fast and has to slow down and breathe',
      loves: 'zooming, helping friends, checking if things are living or nonliving',
      catchphrase: 'Vroom vroom, let’s zoom!',
    },
    {
      name: 'Tara',
      emoji: '🕷️',
      species: 'a tiny friendly spider who spins super-strong silver webs',
      personality: 'clever, patient, great at making plans and catching falling things',
      loves: 'swinging between buildings, weaving web-goals for soccer practice',
      catchphrase: 'A web can fix it!',
    },
    {
      name: 'Boulder',
      emoji: '🦕',
      species: 'a gentle giant brontosaurus who works construction',
      personality: 'calm, strong, grateful for small things, a little slow but always steady',
      loves: 'building, lifting beams with his long neck, saying thank you',
      catchphrase: 'Slow and steady builds it best.',
    },
  ],
  settings: [
    'Home — the kitchen with Dadi, Papa’s record corner, Azi’s room full of teddy bears',
    'Zoomtown — a busy little city with moto lanes, a soccer field, and a hockey rink',
    'The Star Garage — a workshop where rockets and motos get built and fixed',
    'Dino Canyon — wild nature full of animals, fossils, and mystery caves',
  ],
  teachingGoals: [
    'early literacy: letter sounds, rhymes, new words',
    'early numeracy: counting, patterns, simple adding',
    'curiosity and critical thinking: predicting, asking why, cause and effect',
    'living vs nonliving classification',
    'emotional regulation: naming feelings, belly breaths, trying again',
    'kindness, gratefulness, and friendship',
  ],
  values: ['kindness', 'gratefulness', 'courage', 'sharing', 'trying again'],
  culture: {
    languages: ['English', 'Gujarati'],
    words: [
      { term: 'bhen', language: 'Gujarati', meaning: 'little sister' },
      { term: 'beta', language: 'Gujarati', meaning: 'child (term of endearment)' },
      { term: 'chalo', language: 'Gujarati', meaning: 'come on / let’s go' },
      { term: 'Dada', language: 'Gujarati', meaning: 'grandfather (father’s side)' },
      { term: 'Dadi', language: 'Gujarati', meaning: 'grandmother (father’s side)' },
      { term: 'Kaka', language: 'Gujarati', meaning: 'uncle (father’s brother)' },
      { term: 'Kaki', language: 'Gujarati', meaning: 'aunt (Kaka’s wife)' },
    ],
    notes:
      'The family cast is real: Mama, Papa, Dada, Dadi, Kaka, Kaki, and Azad ("Azi") — soon a big brother to his little bhen. Weave family words in naturally the way the family actually speaks - a character says the word, another responds so meaning is clear from context. Never translate like a dictionary. Family members can appear in stories alongside the animal companions.',
  },
  avoid: ['real violence', 'scary imagery for its own sake', 'brand characters (make our own heroes)'],
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
