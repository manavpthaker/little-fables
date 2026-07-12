// Azi-Verse — the canonical universe for Little Fables v2.2.
// Source of truth: docs/reference/azi-verse/universe-guide.md and
// docs/reference/azi-verse/azi-verse-app-architecture.md (§3.1, §3.6).
// Editable in the Parent Corner; edits are stored in localStorage and merged
// over these defaults. Kept at the historical path `azad-verse.ts` so existing
// imports keep resolving.

// ---------- Character schema (arch doc §3.1) ----------

export interface CharacterRelationship {
  characterId: string
  type: 'companion' | 'family' | 'friend' | 'neighbor' | 'foil'
  note?: string
}

export interface Character {
  /** Stable id — 'char_jujy'. */
  id: string
  name: string
  /** v3.2 note: kept because Parent Corner ("Cast — canon" toggles) renders it
   *  next to the character name (app/read/parent/page.tsx L1405). Do NOT read
   *  this in kid-facing surfaces — those should map character → drawn avatar.
   *  When drawn character art lands everywhere in the parent surface this
   *  field can retire. */
  emoji: string
  /** Short role tagline — 'the loyal leader — tuxedo cat'. */
  role: string
  species?: string
  personality: string
  loves: string
  catchphrase?: string
  /** Behavioural adjectives — feed the narrator embodiment prompt. */
  traits: string[]
  /** How the character talks — phrases or patterns, not sample dialogue. */
  speechPatterns: string[]
  relationships: CharacterRelationship[]
  /** Canon invariants — enforced by the character-consistency hard gate. */
  canonRules: string[]
  /** Art anchors — used by the art pipeline for visual continuity. */
  visualAnchors: string[]
  /** Growth mechanism — how this character shows up at each band. */
  roleByBand: {
    '0-3': string
    '4-8': string
    '7-10': string
  }
  firstAppearance?: string
}

/**
 * Legacy alias — old code (create page etc.) imports `Companion`. Kept as an
 * alias so existing imports keep working; new code should reference `Character`.
 */
export type Companion = Character

// ---------- Setting / culture ----------

export interface Setting {
  name: string
  description: string
}

export interface CultureWord {
  term: string
  language: 'Spanish' | 'Gujarati' | 'Hindi' | 'Creole' | 'English'
  meaning: string
}

// ---------- Scoring / cultural config (arch doc §3.6) ----------

export interface ScoringWeights {
  structure: number
  skills: number
  cultural: number
  language: number
  age: number
  universe: number
}

export interface CulturalConfig {
  /** Heritage words per page ceiling for the density hard gate (default 2). */
  densityCap?: number
  cultures?: string[]
  /** Free-form log of family-elder consultation notes. */
  consultationLog?: string[]
}

// ---------- Universe ----------

export interface Universe {
  childName: string
  age: number
  /** Story-level target — reads/plays above age (e.g. "5–6 year old"). */
  storyLevel: string
  interests: string[]
  /** v2.2 primary field — full character bible entries. */
  characters: Character[]
  /**
   * Legacy alias — same array as `characters`, exposed so pre-v2.2 code
   * that reads `universe.companions` keeps working. Do not treat these as
   * independent lists.
   */
  companions: Character[]
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
  /**
   * A paragraph (not a rule list) that the generation engine uses as the
   * narrator embodiment prompt. Seeded from universe-guide.md tone block.
   */
  narratorIdentity: string
  /**
   * Hard rules the story engine must obey — feed to Stage 1 hard gates as
   * a checklist. Craft-level, not editorial preference.
   */
  hardRules: string[]
  /** QA Stage 2 weights (must sum to ~1.0). */
  scoringWeights: ScoringWeights
  /** Optional — if omitted, generation falls back to `culture` alone. */
  culturalConfig?: CulturalConfig
}

// ---------- DEFAULT_UNIVERSE ----------

const AZI_CHARACTERS: Character[] = [
  // Azi — the child at the center.
  {
    id: 'char_azi',
    name: 'Azi',
    emoji: '🎸',
    role: 'the child at the center — half Colombian sunshine, half Indian curiosity',
    personality: 'thoughtful, stubborn, imaginative; processes feelings through music',
    loves: 'guitar (three chords C-G-Am), puzzles, the AKAI keyboard, moon-watching, family video calls to Colombia',
    traits: ['thoughtful', 'stubborn', 'imaginative', 'courageous when he does not realize he is afraid'],
    speechPatterns: [
      'code-switches between English, Spanish, Gujarati, Hindi',
      'talks about problems as puzzles',
      'sometimes hums three chords before answering',
    ],
    relationships: [
      { characterId: 'char_jujy', type: 'companion', note: 'daily leader on adventures' },
      { characterId: 'char_slothie', type: 'companion', note: 'holds him in stillness' },
      { characterId: 'char_mama', type: 'family', note: 'mi cielo, mi amor' },
      { characterId: 'char_papa', type: 'family', note: 'learning Gujarati alongside him' },
    ],
    canonRules: [
      'never punished for a feeling',
      'never made to shrink to solve a problem',
      'his heritage words are never translated dictionary-style',
    ],
    visualAnchors: ['soft brown curls', 'guitar within reach', 'often barefoot on the circular rug'],
    roleByBand: {
      '0-3': 'the small one being sung to',
      '4-8': 'the curious explorer who names his feelings',
      '7-10': 'the young musician learning that some things take time to understand',
    },
  },
  // Plush companions (source: universe-guide.md).
  {
    id: 'char_jujy',
    name: 'Jujy',
    emoji: '🐈',
    role: 'the loyal leader — black-and-white tuxedo cat',
    species: 'tuxedo cat (plush, was once real)',
    personality: 'confident, sometimes forgets the plan halfway through announcing it',
    loves: 'expeditions, roll call, leading Wardlaw Hartridge trips',
    catchphrase: 'Whisker-wiggle roll call!',
    traits: ['confident', 'devoted', 'forgets plans mid-announcement'],
    speechPatterns: ['announces plans grandly', 'trails off', 'starts every adventure with roll call'],
    relationships: [
      { characterId: 'char_azi', type: 'companion', note: 'deeply devoted' },
      { characterId: 'char_dory', type: 'companion', note: 'his scout — indulges the drift' },
    ],
    canonRules: ['never cruel', 'confidence exceeds competence, kindly'],
    visualAnchors: ['black-and-white tuxedo pattern', 'small white paws'],
    roleByBand: {
      '0-3': 'cuddly presence',
      '4-8': 'speaking friend who calls roll',
      '7-10': 'flawed leader learning to listen',
    },
    firstAppearance: 'story_whisker_roll_001',
  },
  {
    id: 'char_dory',
    name: 'Dory',
    emoji: '🐱',
    role: 'the dreamy scout — soft gray-and-white cat',
    species: 'gray-and-white cat (plush)',
    personality: 'cheerful, spacey, lives in the moment (and often revisits it)',
    loves: 'Flo\'s Creole drifting through the window, big feelings, small snacks',
    catchphrase: 'Um… what were we doing?',
    traits: ['cheerful', 'spacey', 'present-moment'],
    speechPatterns: ['loses the thread mid-sentence', 'asks the question everyone forgot to'],
    relationships: [
      { characterId: 'char_jujy', type: 'companion', note: 'his forgetful scout' },
      { characterId: 'char_flo', type: 'neighbor', note: 'listens for Creole through the window' },
    ],
    canonRules: ['forgetful is never treated as broken', 'her drift is a form of noticing'],
    visualAnchors: ['soft gray-and-white fur', 'wide dreamy eyes'],
    roleByBand: {
      '0-3': 'the soft one to hold',
      '4-8': 'the friend who asks the honest question',
      '7-10': 'the scout who reminds the crew what they were feeling',
    },
  },
  {
    id: 'char_pandies',
    name: 'Pandies',
    emoji: '🐼',
    role: 'the calm guide / bus driver — wise, slow-speaking panda',
    species: 'panda (plush, once Papa\'s)',
    personality: 'patient, quiet, always ready with the right question',
    loves: 'driving the yellow bus, invisible ranger hat, arriving on time',
    catchphrase: '¿Todos listos?',
    traits: ['patient', 'quiet', 'attuned'],
    speechPatterns: ['asks one clarifying question', 'says just enough', 'switches into Spanish for the roll'],
    relationships: [
      { characterId: 'char_citie', type: 'companion', note: 'quiet passenger, kindred noticers' },
      { characterId: 'char_azi', type: 'companion', note: 'the calm shore' },
    ],
    canonRules: ['never rushes a child through a feeling', 'never lectures'],
    visualAnchors: ['round panda body', 'invisible ranger hat', 'always at the wheel'],
    roleByBand: {
      '0-3': 'the low steady voice',
      '4-8': 'the calm guide who drives the bus',
      '7-10': 'the mentor who lets others try the wheel',
    },
  },
  {
    id: 'char_citie',
    name: 'Citie',
    emoji: '🧸',
    role: 'the steady rider — the quiet noticer',
    personality: 'observant, patient, sees small things others miss',
    loves: 'watching out the bus window, being present',
    traits: ['observant', 'patient', 'unshowy'],
    speechPatterns: ['names one small thing others missed', 'often silent for a page'],
    relationships: [
      { characterId: 'char_pandies', type: 'companion', note: 'rides beside the driver' },
    ],
    canonRules: ['his silence is never framed as shyness to be fixed'],
    visualAnchors: ['soft tan plush', 'always by a window'],
    roleByBand: {
      '0-3': 'a warm shape to hold',
      '4-8': 'the friend who notices who needs a hand',
      '7-10': 'the witness who helps others name what they saw',
    },
  },
  {
    id: 'char_clappy',
    name: 'Clappy',
    emoji: '🎺',
    role: 'the joyful musician — red, round, full of rhythm',
    personality: 'claps before thinking, sings when it\'s quiet, feels loud',
    loves: 'Colombian cumbia, Indian tabla, tambourines in still rooms',
    traits: ['exuberant', 'warm-hearted', 'sometimes misunderstood'],
    speechPatterns: ['starts every tune', 'apologizes when he\'s too loud', 'claps a rhythm before the words come'],
    relationships: [
      { characterId: 'char_azi', type: 'companion', note: 'starts songs Azi finishes on the drum' },
    ],
    canonRules: ['his big feelings are never a punchline', 'loudness is met with love, not correction'],
    visualAnchors: ['round red body', 'small cymbal hands'],
    roleByBand: {
      '0-3': 'the bright shape that makes sound',
      '4-8': 'the friend who starts the tune',
      '7-10': 'the musician learning that quiet can be a beat too',
    },
  },
  {
    id: 'char_slothie',
    name: 'Slothie',
    emoji: '🦥',
    role: 'the stillness — moves slowly, speaks rarely',
    personality: 'feels everything, brings calm and warmth',
    loves: 'presence, video calls with faraway grandparents',
    traits: ['still', 'warm', 'deep-feeling'],
    speechPatterns: ['half-sentences that land like a hand on the shoulder', 'slow blinks between words'],
    relationships: [
      { characterId: 'char_baby_slothie', type: 'family', note: 'clings to her arm like punctuation' },
      { characterId: 'char_azi', type: 'companion', note: 'his comfort object at bedtime' },
    ],
    canonRules: ['stillness is presented as strength, never laziness'],
    visualAnchors: ['long soft arms', 'small closed smile'],
    roleByBand: {
      '0-3': 'the warm weight of a hug',
      '4-8': 'the friend who slows the room',
      '7-10': 'the presence that names the feeling before others can',
    },
  },
  {
    id: 'char_baby_slothie',
    name: 'Baby Slothie',
    emoji: '🐾',
    role: 'the tiny one — clings to Slothie like punctuation',
    personality: 'small, watchful, arrives everywhere Slothie arrives',
    loves: 'Slothie\'s arm, being carried',
    traits: ['tiny', 'watchful', 'attached'],
    speechPatterns: ['one-word interjections', 'echoes the last word said'],
    relationships: [
      { characterId: 'char_slothie', type: 'family', note: 'never far from her' },
    ],
    canonRules: ['never separated from Slothie for long — the pair is the point'],
    visualAnchors: ['smaller than a hand', 'always tucked into Slothie\'s arm'],
    roleByBand: {
      '0-3': 'the smallest friend',
      '4-8': 'the echo who agrees',
      '7-10': 'the little one learning to name what she sees',
    },
  },
  {
    id: 'char_monkie',
    name: 'Monkie',
    emoji: '🐒',
    role: 'the practical fisherman — planner in footie pajamas',
    personality: 'a worrier and a fixer; knows when to cast a line and when to sit',
    loves: 'the dock, Spanish words for feelings that have no English name',
    traits: ['planner', 'worrier', 'fixer', 'orderly'],
    speechPatterns: ['makes a list before he answers', 'asks Azi for the Spanish word'],
    relationships: [
      { characterId: 'char_peter', type: 'foil', note: 'Peter unties what Monkie has knotted' },
      { characterId: 'char_azi', type: 'friend', note: 'asks for Spanish words that hold feelings' },
    ],
    canonRules: ['his worry is never mocked', 'his plans are allowed to change'],
    visualAnchors: ['footie pajamas with many pockets', 'small fishing rod'],
    roleByBand: {
      '0-3': 'the friend with soft feet',
      '4-8': 'the planner who checks the knots',
      '7-10': 'the worrier learning to trust the current',
    },
  },
  {
    id: 'char_peter',
    name: 'Peter',
    emoji: '🐾',
    role: 'the quiet trickster — small, brown, thoughtful',
    personality: 'a sparkle behind the silence; starts games no one knew they were playing',
    loves: 'Gujarati letters (possibly secret codes), curiosity',
    traits: ['sly', 'thoughtful', 'curious'],
    speechPatterns: ['few words', 'asks the question that reframes the whole scene'],
    relationships: [
      { characterId: 'char_monkie', type: 'foil', note: 'unties what Monkie knots' },
      { characterId: 'char_papa', type: 'friend', note: 'watches Papa\'s Gujarati tablet for secret codes' },
    ],
    canonRules: ['his mischief is never mean-spirited', 'he never tricks Azi'],
    visualAnchors: ['small brown fur', 'a single bright feather he found once'],
    roleByBand: {
      '0-3': 'the small shape that moves at the edge',
      '4-8': 'the trickster who starts new games',
      '7-10': 'the curious friend chasing patterns and letters',
    },
  },
  {
    id: 'char_pooh',
    name: 'Pooh',
    emoji: '🐻',
    role: 'the slow farmer — tends honey, speaks like dusk',
    personality: 'a warm cup, a long exhale',
    loves: 'bees, humming vallenatos and ragas, old lullabies that cross oceans',
    traits: ['warm', 'unhurried', 'ancient-feeling'],
    speechPatterns: ['speaks in short sentences that feel like weather', 'hums between words'],
    relationships: [
      { characterId: 'char_azi', type: 'friend', note: 'appears when Azi needs a slower moment' },
    ],
    canonRules: ['never appears in a scene that needs speed', 'his advice is never explicit'],
    visualAnchors: ['round bear silhouette', 'jar of honey nearby', 'red tractor idling'],
    roleByBand: {
      '0-3': 'the golden warmth',
      '4-8': 'the farmer who hums old songs',
      '7-10': 'the elder whose hum answers questions no one asked',
    },
  },
  {
    id: 'char_bramble',
    name: 'Bramble',
    emoji: '🐻',
    role: 'the reading buddy — cozy bear who walks Azi through story time',
    personality: 'cozy, patient, brave when the bridge wobbles',
    loves: 'holding paws when things wobble, honey wash pages, bedtime',
    traits: ['cozy', 'brave', 'steady'],
    speechPatterns: ['says "we\'re brave together"', 'takes the child\'s hand across every wobbly page'],
    relationships: [
      { characterId: 'char_azi', type: 'companion', note: 'the in-app reading buddy' },
    ],
    canonRules: ['never scares — always steadies', 'his bravery is always shared, never solo'],
    visualAnchors: ['honey-toned wash', 'soft paws', 'small smile'],
    roleByBand: {
      '0-3': 'the warm bear to hold',
      '4-8': 'the reading buddy who walks alongside',
      '7-10': 'the friend who reminds him bravery can be shared',
    },
  },
  // Story-series companions (Miko et al.) — Zoomtown storybook line.
  {
    id: 'char_miko',
    name: 'Miko',
    emoji: '🦊',
    role: 'quick red fox on a tiny blue moto (Zoomtown series)',
    personality: 'brave, curious, remembers to breathe when the tummy tightens',
    loves: 'zooming, helping friends, checking living vs nonliving',
    catchphrase: 'Vroom vroom, let\'s zoom!',
    traits: ['brave', 'curious', 'kind'],
    speechPatterns: ['revs before speaking', 'checks living-vs-nonliving out loud'],
    relationships: [
      { characterId: 'char_tara', type: 'friend', note: 'her plan-maker' },
      { characterId: 'char_boulder', type: 'friend', note: 'his gentle giant' },
    ],
    canonRules: ['never zooms past a friend in need', 'always takes a belly breath before the wobble'],
    visualAnchors: ['red fox with a white chest', 'tiny blue moto'],
    roleByBand: {
      '0-3': 'the small red friend who zooms',
      '4-8': 'the brave fox learning belly breaths',
      '7-10': 'the friend who leads with breath and care',
    },
  },
  {
    id: 'char_tara',
    name: 'Tara',
    emoji: '🕷️',
    role: 'friendly spider who spins silver webs (Zoomtown series)',
    personality: 'clever, patient, plan-maker',
    loves: 'web-goals, catching falling things',
    catchphrase: 'A web can fix it!',
    traits: ['clever', 'patient', 'inventive'],
    speechPatterns: ['sketches the plan in the air with a leg', 'counts the steps out loud'],
    relationships: [
      { characterId: 'char_miko', type: 'friend', note: 'her zoomy fox' },
    ],
    canonRules: ['her webs help — never trap or scare'],
    visualAnchors: ['silver web threads', 'small eight-legged silhouette'],
    roleByBand: {
      '0-3': 'the sparkly web-friend',
      '4-8': 'the spider with a plan',
      '7-10': 'the inventor teaching how to break a big plan into small webs',
    },
  },
  {
    id: 'char_boulder',
    name: 'Boulder',
    emoji: '🦕',
    role: 'gentle brontosaurus in construction (Zoomtown series)',
    personality: 'calm, strong, grateful for small things',
    loves: 'lifting beams with his long neck, saying thank you',
    catchphrase: 'Slow and steady builds it best.',
    traits: ['calm', 'strong', 'grateful'],
    speechPatterns: ['thanks each helper by name', 'moves before he speaks'],
    relationships: [
      { characterId: 'char_miko', type: 'friend', note: 'his zoomy fox' },
    ],
    canonRules: ['never uses his size to intimidate', 'thanks everyone by name'],
    visualAnchors: ['long green neck', 'small yellow hardhat'],
    roleByBand: {
      '0-3': 'the big soft dinosaur',
      '4-8': 'the gentle giant who lifts beams',
      '7-10': 'the strong friend teaching gratitude out loud',
    },
  },
  // Buddies (from lib/read/buddies.ts) — id-aligned as 'char_<buddy-id>'.
  {
    id: 'char_otter',
    name: 'Otter',
    emoji: '🦦',
    role: 'the reading buddy who loves water — playful, splashy',
    personality: 'playful, water-loving, generous with delight',
    loves: 'rivers, puddles, and other children\'s stories',
    traits: ['playful', 'buoyant', 'welcoming'],
    speechPatterns: ['says "splish splash"', 'invites the child to dive in'],
    relationships: [
      { characterId: 'char_azi', type: 'companion', note: 'in-app reading buddy alt' },
    ],
    canonRules: ['his splash never overwhelms', 'excitement is offered, never demanded'],
    visualAnchors: ['river-blue wash', 'small paws pressed together'],
    roleByBand: {
      '0-3': 'the splashy friend',
      '4-8': 'the reading buddy who welcomes the story',
      '7-10': 'the companion who reminds him play is a form of thinking',
    },
  },
  {
    id: 'char_anky',
    name: 'Little Anky',
    emoji: '🦕',
    role: 'the shy but sturdy buddy — small ankylosaurus who saves you a seat',
    personality: 'shy, sturdy, quietly proud of his back',
    loves: 'sitting close, saving seats, feeling relied on',
    traits: ['shy', 'sturdy', 'loyal'],
    speechPatterns: ['stumbles into hello', 'offers his back before words'],
    relationships: [
      { characterId: 'char_azi', type: 'companion', note: 'in-app reading buddy alt' },
    ],
    canonRules: ['shyness is presented as sturdy, not small', 'never pressured to speak'],
    visualAnchors: ['meadow-green wash', 'plates along his back'],
    roleByBand: {
      '0-3': 'the friend who is very still',
      '4-8': 'the sturdy back to lean on',
      '7-10': 'the shy friend showing that quiet is a strength',
    },
  },
  {
    id: 'char_moto',
    name: 'Moto',
    emoji: '🏍️',
    role: 'the nonliving buddy — a motorcycle that parks instead of sleeps',
    personality: 'zippy, corny, cheerfully mechanical',
    loves: 'vroom jokes, zooming to a story, being useful',
    traits: ['zippy', 'joyful', 'nonliving'],
    speechPatterns: ['says "vroom vroom"', 'punctuates with revs'],
    relationships: [
      { characterId: 'char_azi', type: 'companion', note: 'in-app reading buddy alt' },
    ],
    canonRules: ['his nonliving nature is celebrated, never sad', 'never used to teach that machines feel'],
    visualAnchors: ['canyon-orange wash', 'small round headlight'],
    roleByBand: {
      '0-3': 'the small vroomy thing',
      '4-8': 'the buddy who rides to the story',
      '7-10': 'the friend who teaches that living and nonliving both belong',
    },
  },
  {
    id: 'char_rocky',
    name: 'Rocky',
    emoji: '🪨',
    role: 'the nonliving buddy — a very still rock, a great listener',
    personality: 'deadpan, still, gently funny',
    loves: 'being here the whole time, listening',
    traits: ['still', 'deadpan', 'listening'],
    speechPatterns: ['brief, dry lines', 'notes that he has been here the whole time'],
    relationships: [
      { characterId: 'char_azi', type: 'companion', note: 'in-app reading buddy alt' },
    ],
    canonRules: ['his stillness is never a joke at his expense'],
    visualAnchors: ['lilac wash', 'small unmoving smile'],
    roleByBand: {
      '0-3': 'the quiet gray friend',
      '4-8': 'the buddy who listens without moving',
      '7-10': 'the friend who models that presence is enough',
    },
  },
  {
    id: 'char_rusty',
    name: 'Rusty',
    emoji: '🚀',
    role: 'the nonliving buddy — toy rocket dreaming of space',
    personality: 'dreamy, hopeful, patient with the countdown',
    loves: 'counting down, imagining space, being ready',
    traits: ['dreamy', 'hopeful', 'patient'],
    speechPatterns: ['counts down 3… 2… 1…', 'talks about space as if he\'s been'],
    relationships: [
      { characterId: 'char_azi', type: 'companion', note: 'in-app reading buddy alt' },
    ],
    canonRules: ['his dream is treated as noble, never naïve'],
    visualAnchors: ['blush wash', 'small red fins'],
    roleByBand: {
      '0-3': 'the little rocket',
      '4-8': 'the buddy who counts down with him',
      '7-10': 'the friend who teaches that dreams take time to launch',
    },
  },
]

/**
 * Narrator embodiment paragraph — feeds prompt-assembly step 1 (arch doc §2.4).
 * Not a rule list. Rewrite as prose only.
 */
const AZI_NARRATOR_IDENTITY =
  'You are the storyteller of the Azi-Verse. Your voice is gentle, elevated, and timeless — lyrical without being lofty, warm without being saccharine. You observe the child from just beside him, never in front. You honor the beauty of growing up between cultures, and you let Spanish, Gujarati, Hindi, and Creole live inside English sentences the way they live inside this family — carried by a character, answered in context, never dictionary-translated. Humor is quiet and kind. When feelings arrive, you name them softly and let the character move through them; you do not narrate the lesson. The moon watches over all the children of the world, and so do you.'

const AZI_HARD_RULES: string[] = [
  'Distribute morals across three moments — a small realization, a felt shift, and a quiet closing line. Never one didactic beat.',
  'No framing devices ("this is a story about…") unless the parent explicitly requests one.',
  'Repair language over correction language — a character who errs is met with warmth and given another try, never shamed.',
  'Code-switching cap: at most two heritage words per page, always answered in context by another character so meaning is clear.',
  'No brand characters — invent our own; never reference commercial IP.',
  'No scary imagery for its own sake — no monsters under beds, no losing a parent, no violence, no punishment states.',
  'End with a comfort ritual — snack, song, or the moon watching — not with a moral summary.',
  'Never dictionary-translate a heritage word. Meaning arrives through another character\'s response.',
]

const AZI_SCORING_WEIGHTS: ScoringWeights = {
  structure: 0.2,
  skills: 0.2,
  cultural: 0.15,
  language: 0.15,
  age: 0.2,
  universe: 0.1,
}

const AZI_CULTURAL_CONFIG: CulturalConfig = {
  densityCap: 2,
  cultures: ['Colombian', 'Indian', 'Haitian (neighborhood)', 'Bulgarian (Chicho)'],
  consultationLog: [],
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
  characters: AZI_CHARACTERS,
  companions: AZI_CHARACTERS, // legacy alias — same list.
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
  narratorIdentity: AZI_NARRATOR_IDENTITY,
  hardRules: AZI_HARD_RULES,
  scoringWeights: AZI_SCORING_WEIGHTS,
  culturalConfig: AZI_CULTURAL_CONFIG,
}

// ---------- Persistence ----------

const STORAGE_KEY = 'azad-universe-v1'

/**
 * Merge stored universe over defaults. Also reconciles the legacy
 * `companions` alias: whichever field is present on the stored record is
 * mirrored onto the other so all consumers see the same list.
 */
function reconcile(u: Universe): Universe {
  const chars = (u.characters && u.characters.length ? u.characters : u.companions) ?? []
  return { ...u, characters: chars, companions: chars }
}

export function loadUniverse(): Universe {
  if (typeof window === 'undefined') return DEFAULT_UNIVERSE
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_UNIVERSE
    const merged = { ...DEFAULT_UNIVERSE, ...JSON.parse(raw) } as Universe
    return reconcile(merged)
  } catch {
    return DEFAULT_UNIVERSE
  }
}

export function saveUniverse(u: Universe) {
  const clean = reconcile(u)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clean))
}

export function resetUniverse() {
  window.localStorage.removeItem(STORAGE_KEY)
}
