// SS-taxonomy — source of truth for skill tagging.
// Derived from docs/reference/azi-verse/future-ready-skills.md (§Core Future-
// Ready Skills Framework + §Age-Specific Development Targets) and the
// architecture doc §3.3 (Skill Graph Node shape).
//
// Ids are structured: `SS<cluster>.<slug>` — cluster numbers match the doc
// (SS001 = Cognitive & Analytical, SS002 = Socio-Emotional Intelligence,
// SS003 = Adaptive Resilience, etc.). Slug is the specific skill.
//
// Age targets are keyed by the leveling-engine bands (0-3 / 4-8 / 7-10). We
// map the doc's AT001/AT002/AT003 windows onto our bands:
//   0-3   ← AT001 (Ages 0-4, Foundation Building)
//   4-8   ← AT002 (Ages 5-8, Skill Development)
//   7-10  ← AT003 (Ages 9-12, Complex Integration; overlap is fine)
//
// This module is consumed by:
//   - /api/story (prompt step 6: skill target injection + response validation)
//   - Parent Dashboard coverage report (item 11, later)
//   - Backfills that convert pack-000 `teachingGoals` strings into SS ids

export type Band = '0-3' | '4-8' | '7-10'

export interface SkillNode {
  /** e.g. 'SS003.emotional-regulation' */
  id: string
  /** SS-taxonomy cluster label. */
  cluster: string
  /** Human label. */
  label: string
  /** Age-band-specific target descriptor. */
  ageTargets: Record<Band, string>
  /** Which ST002 archetypes teach this skill. */
  teachingArchetypes: string[]
  /** How you know the child is picking this up (Parent Dashboard signals). */
  observableIndicators: string[]
  /** Related SS ids for suggestion / clustering. */
  relatedSkills?: string[]
}

// ---------------------------------------------------------------------------
// Taxonomy
// ---------------------------------------------------------------------------

export const SKILL_TAXONOMY: Record<string, SkillNode> = {
  // ===== SS002 — Socio-Emotional Intelligence =====
  'SS002.emotional-regulation': {
    id: 'SS002.emotional-regulation',
    cluster: 'Socio-Emotional Intelligence',
    label: 'Emotional regulation',
    ageTargets: {
      '0-3': 'naming feelings; noticing bodies get big and small',
      '4-8': 'pause-and-choose strategies (belly breaths, counting, asking for help)',
      '7-10': 'self-directed coping under pressure; repair language separates behavior from identity',
    },
    teachingArchetypes: ['The Resilience Champion'],
    observableIndicators: [
      'child references a technique outside story time',
      'improved recovery time from upsets (parent-reported)',
      'uses feeling words unprompted',
    ],
    relatedSkills: ['SS002.empathy', 'SS003.adaptability', 'SS003.mental-health'],
  },
  'SS002.empathy': {
    id: 'SS002.empathy',
    cluster: 'Socio-Emotional Intelligence',
    label: 'Empathy & perspective-taking',
    ageTargets: {
      '0-3': 'basic empathy — noticing another creature is sad or hurt',
      '4-8': 'putting yourself in a friend\'s shoes; imagining how someone else feels',
      '7-10': 'understanding diverse experiences; holding two viewpoints at once',
    },
    teachingArchetypes: ['The Bridge Builder', 'The Resilience Champion'],
    observableIndicators: [
      'child asks about others\' feelings',
      'offers comfort spontaneously',
      'names a character\'s feeling separate from their own',
    ],
    relatedSkills: ['SS002.emotional-regulation', 'SS002.cultural-intelligence'],
  },
  'SS002.cultural-intelligence': {
    id: 'SS002.cultural-intelligence',
    cluster: 'Socio-Emotional Intelligence',
    label: 'Cross-cultural fluency',
    ageTargets: {
      '0-3': 'exposure to different languages and family customs',
      '4-8': 'cultural exchange — global awareness, cooperation, code-switching in play',
      '7-10': 'adapting across differences; inclusive thinking; global perspective',
    },
    teachingArchetypes: ['The Bridge Builder'],
    observableIndicators: [
      'child uses heritage words in play',
      'asks about family traditions',
      'notices and welcomes difference',
    ],
    relatedSkills: ['SS002.empathy'],
  },

  // ===== SS003 — Adaptive Resilience =====
  'SS003.adaptability': {
    id: 'SS003.adaptability',
    cluster: 'Adaptive Resilience',
    label: 'Adaptability & flexibility',
    ageTargets: {
      '0-3': 'accepting small changes to routine with support',
      '4-8': 'growth mindset — "I can try again"; learning from failure',
      '7-10': 'embracing change; adjusting strategy when the first plan fails',
    },
    teachingArchetypes: ['The Resilience Champion', 'The Future Planner'],
    observableIndicators: [
      'child tries again after a mistake',
      'says "I don\'t know yet" instead of "I can\'t"',
      'accepts an unexpected substitution calmly',
    ],
    relatedSkills: ['SS002.emotional-regulation', 'SS001.creative-problem-solving'],
  },
  'SS003.mental-health': {
    id: 'SS003.mental-health',
    cluster: 'Adaptive Resilience',
    label: 'Mental health & wellbeing',
    ageTargets: {
      '0-3': 'comfort rituals; predictable soothing (moon, snack, song)',
      '4-8': 'mindfulness moments; noticing the body; asking for a break',
      '7-10': 'stress management; self-care habits; mindful pause',
    },
    teachingArchetypes: ['The Resilience Champion'],
    observableIndicators: [
      'child initiates a comfort ritual (breath, hug, moon-gaze)',
      'names being tired or overwhelmed',
    ],
    relatedSkills: ['SS002.emotional-regulation'],
  },

  // ===== SS001 — Cognitive & Analytical =====
  'SS001.systems-thinking': {
    id: 'SS001.systems-thinking',
    cluster: 'Cognitive & Analytical',
    label: 'Systems thinking',
    ageTargets: {
      '0-3': 'cause-effect: I push the block, it falls',
      '4-8': 'small actions ripple — noticing sequences and consequences',
      '7-10': 'feedback loops, emergent properties, interconnected systems',
    },
    teachingArchetypes: ['The Systems Detective'],
    observableIndicators: [
      'child predicts a downstream effect ("if we don\'t water it…")',
      'connects two events across time',
      'traces a chain of consequences',
    ],
    relatedSkills: ['SS001.creative-problem-solving', 'SS005.systems-ecology'],
  },
  'SS001.curiosity': {
    id: 'SS001.curiosity',
    cluster: 'Cognitive & Analytical',
    label: 'Curiosity & question-asking',
    ageTargets: {
      '0-3': 'wonder preservation — "why?" as delight, not test',
      '4-8': 'sharpening questions; refining what you actually want to know',
      '7-10': 'critical thinking; source verification; better prompts',
    },
    teachingArchetypes: ['The Questioner'],
    observableIndicators: [
      'child asks a follow-up question',
      'reframes a question when the first answer isn\'t satisfying',
    ],
    relatedSkills: ['SS001.creative-problem-solving', 'SS001.systems-thinking'],
  },
  'SS001.self-directed-learning': {
    id: 'SS001.self-directed-learning',
    cluster: 'Cognitive & Analytical',
    label: 'Self-directed learning',
    ageTargets: {
      '0-3': 'choosing what to explore next',
      '4-8': 'attempting a task, noticing where you got stuck, asking for the specific help you need',
      '7-10': 'learning to learn with mentors and AI; maintaining independence',
    },
    teachingArchetypes: ['The Questioner', 'The Future Planner'],
    observableIndicators: [
      'child sets a small goal for themselves',
      'asks a targeted question ("how do I…") vs. a global one ("help me")',
    ],
    relatedSkills: ['SS001.curiosity', 'SS003.adaptability'],
  },
  'SS001.creative-problem-solving': {
    id: 'SS001.creative-problem-solving',
    cluster: 'Cognitive & Analytical',
    label: 'Creative problem-solving & expression',
    ageTargets: {
      '0-3': 'trying more than one way; playful experimentation',
      '4-8': 'multiple solutions to one problem; innovative thinking',
      '7-10': 'novel solutions; combining ideas across domains',
    },
    teachingArchetypes: ['The Questioner', 'The Systems Detective'],
    observableIndicators: [
      'child offers a second solution unprompted',
      'invents a variation on a story or game',
    ],
    relatedSkills: ['SS001.curiosity', 'SS003.adaptability'],
  },

  // ===== SS005 — Environmental & Sustainability (light, for older bands) =====
  'SS005.systems-ecology': {
    id: 'SS005.systems-ecology',
    cluster: 'Environmental & Sustainability Literacy',
    label: 'Nature connection & systems ecology',
    ageTargets: {
      '0-3': 'noticing plants, animals, weather',
      '4-8': 'environmental stewardship — small conservation actions; ecosystem awareness',
      '7-10': 'interconnected natural systems; biodiversity; long-term consequences',
    },
    teachingArchetypes: ['The Systems Detective', 'The Bridge Builder'],
    observableIndicators: [
      'child notices a bug or bird outside story time',
      'connects a story\'s environment to their own',
    ],
    relatedSkills: ['SS001.systems-thinking'],
  },
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

export function isValidSkillId(id: string): boolean {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(SKILL_TAXONOMY, id)
}

export function skillsForBand(band: Band): SkillNode[] {
  // All taxonomy nodes carry all three bands; return them all sorted for
  // deterministic ordering (id asc).
  return Object.values(SKILL_TAXONOMY)
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    // No-op filter for band — every node has a target — but keeps the signature
    // future-proof if we later scope some skills out of certain bands.
    .filter((n) => typeof n.ageTargets[band] === 'string' && n.ageTargets[band].length > 0)
}

/**
 * Best-effort mapping from a legacy pack-000 `teachingGoals` string to an SS id.
 * Returns null when there's no confident map. Callers should treat null as
 * "leave the tag off; don't guess."
 */
export function mapLegacyGoal(g: string): string | null {
  if (typeof g !== 'string') return null
  const key = g.toLowerCase().trim()

  // Direct SS id passthrough — someone may already be storing new-format tags.
  if (isValidSkillId(g)) return g

  const table: Record<string, string> = {
    // Emotional regulation family
    'naming feelings': 'SS002.emotional-regulation',
    'feelings': 'SS002.emotional-regulation',
    'big feelings': 'SS002.emotional-regulation',
    'emotional regulation': 'SS002.emotional-regulation',
    'calming down': 'SS002.emotional-regulation',
    'belly breaths': 'SS002.emotional-regulation',
    'breathing': 'SS002.emotional-regulation',
    'the gentle giant\'s secret': 'SS002.emotional-regulation',
    'repair and apology': 'SS002.emotional-regulation',
    'self-regulation': 'SS002.emotional-regulation',
    'mindfulness': 'SS003.mental-health',

    // Empathy / social
    'empathy': 'SS002.empathy',
    'kindness': 'SS002.empathy',
    'friendship': 'SS002.empathy',
    'community': 'SS002.empathy',
    'sharing': 'SS002.empathy',
    'listening': 'SS002.empathy',

    // Cultural / heritage
    'family words (gujarati)': 'SS002.cultural-intelligence',
    'heritage words': 'SS002.cultural-intelligence',
    'code-switching': 'SS002.cultural-intelligence',
    'cultural intelligence': 'SS002.cultural-intelligence',
    'papa love': 'SS002.cultural-intelligence',

    // Resilience
    'trying again': 'SS003.adaptability',
    'flexible thinking': 'SS003.adaptability',
    'growth mindset': 'SS003.adaptability',
    'facing fears': 'SS003.adaptability',
    'confidence': 'SS003.adaptability',
    'night courage': 'SS003.mental-health',
    'bedtime courage': 'SS003.mental-health',
    'winding down': 'SS003.mental-health',
    'calm': 'SS003.mental-health',
    'gratefulness': 'SS003.mental-health',
    'gratitude': 'SS003.mental-health',

    // Cognitive
    'counting': 'SS001.systems-thinking',
    'patterns': 'SS001.systems-thinking',
    'sequences': 'SS001.systems-thinking',
    'cause and effect': 'SS001.systems-thinking',
    'systems thinking': 'SS001.systems-thinking',
    'predicting': 'SS001.curiosity',
    'guessing': 'SS001.curiosity',
    'wonder': 'SS001.curiosity',
    'curiosity': 'SS001.curiosity',
    'letter sounds': 'SS001.self-directed-learning',
    'reading': 'SS001.self-directed-learning',
    'self-recognition': 'SS001.self-directed-learning',
    'imagination': 'SS001.creative-problem-solving',
    'holiday magic': 'SS001.creative-problem-solving',
    'creative expression': 'SS001.creative-problem-solving',

    // Environmental
    'nature': 'SS005.systems-ecology',
    'gardens': 'SS005.systems-ecology',
    'seasons': 'SS005.systems-ecology',
  }

  if (table[key]) return table[key]

  // Fuzzy contains — cover a few common phrasings.
  if (key.includes('feel')) return 'SS002.emotional-regulation'
  if (key.includes('breath')) return 'SS002.emotional-regulation'
  if (key.includes('kind') || key.includes('friend')) return 'SS002.empathy'
  if (key.includes('spanish') || key.includes('gujarati') || key.includes('hindi') || key.includes('creole')) {
    return 'SS002.cultural-intelligence'
  }
  if (key.includes('try') || key.includes('brave') || key.includes('courage')) return 'SS003.adaptability'
  if (key.includes('count') || key.includes('pattern')) return 'SS001.systems-thinking'
  if (key.includes('question') || key.includes('curios')) return 'SS001.curiosity'
  if (key.includes('imagin') || key.includes('create')) return 'SS001.creative-problem-solving'

  return null
}
