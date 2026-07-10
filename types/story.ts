// Shared story schema for the reader app ("Storyverse mode")
// Stories operate on Storyverse's 5-layer architecture:
// surface (fun) / skills / values / systems / future

export interface AskBlock {
  /** Question spoken + shown to the child (teaching moment) */
  question: string
  /** Acceptable answer keywords (lowercase). Empty = any answer is praised */
  answers: string[]
  /** Said when answer matches (or after any answer if answers is empty) */
  praise: string
  /** Gentle hint if the answer doesn't match */
  hint: string
  /** Which skill this exercises, e.g. "counting", "feelings", "living vs nonliving" */
  skill: string
}

export interface ChoiceOption {
  label: string
  emoji: string
  /** Spoken-answer keywords that select this option */
  keywords: string[]
  /** Pre-baked branch pages (starter stories). Generated stories omit this and call the API. */
  pages?: StoryPage[]
}

export interface ChoiceBlock {
  prompt: string
  options: ChoiceOption[]
}

export interface Scene {
  /** CSS gradient background, e.g. "linear-gradient(160deg,#1e3a8a,#7c3aed)" */
  bg: string
  /** Large emojis composing the illustration, foreground first */
  emojis: string[]
  /** Optional real illustration (path under /public). When set, rendered instead of emojis. */
  image?: string
}

export interface VocabWord {
  word: string
  /** Kid-friendly meaning shown on the End screen when the star is tapped */
  meaning: string
}

export interface StoryPage {
  text: string
  scene: Scene
  ask?: AskBlock
  choice?: ChoiceBlock
  /** Full-bleed art page — art fills the left page edge-to-edge (see Azi's Little Bhen). */
  bleed?: boolean
}

export interface Story {
  id: string
  title: string
  coverEmoji: string
  coverBg: string
  /** Optional cover illustration (path under /public) */
  coverImage?: string
  /** Author attribution shown on covers/meta ("Made by Papa"). Optional. */
  by?: string
  /** 'complete' or 'awaiting-choice' (generated story paused at a choice) */
  status: 'complete' | 'awaiting-choice'
  teachingGoals: string[]
  /** Star words — tappable vocabulary with kid-friendly meanings */
  vocab: VocabWord[]
  pages: StoryPage[]
  /** Prompts shown at the end to help the child retell the story */
  retellPrompts: string[]
  createdAt: number
  source: 'starter' | 'generated'
  /** Original idea used to generate (for continuations) */
  idea?: string
}

export interface GenerateRequest {
  mode: 'start' | 'continue'
  idea?: string
  hero?: string
  place?: string
  /** Optional attribution woven into the returned story (e.g. "Made by Papa"). */
  by?: string
  /** Full story-so-far pages (continue mode) */
  story?: Story
  /** Label of the option the child chose (continue mode) */
  choice?: string
  universe: unknown
}

export interface GenerateResponse {
  title?: string
  coverEmoji?: string
  coverBg?: string
  by?: string
  pages: StoryPage[]
  vocab?: VocabWord[]
  teachingGoals?: string[]
  retellPrompts?: string[]
  /** True if the returned chunk ends the story */
  done: boolean
  error?: string
}
