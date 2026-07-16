import { NextRequest, NextResponse } from 'next/server'
import { dailyLimit, sameOriginOk, underDailyBudget } from '@/lib/server/guard'

export const runtime = 'nodejs'
export const maxDuration = 20

const MODEL = process.env.RESPOND_MODEL || 'claude-haiku-4-5-20251001'
const API_URL = 'https://api.anthropic.com/v1/messages'

type RespondMode =
  | 'ask'
  | 'wonder'
  | 'choice'
  | 'retell'
  | 'ask-the-story'
  // v3 R19/R20 — story kitchen conversational interview.
  | 'interview-redirect'
  | 'interview-next'
  | 'interview-correction'
  // v3 R16 — intent layer (buddy-driven navigation).
  | 'intent'
type Judgment = 'engages' | 'wobbly' | 'off'
type Action = 'praise' | 'hint' | 'continue' | 'proceed' | 'gentle-return'

interface RespondBody {
  mode: RespondMode
  transcript?: string
  context?: unknown
  // v3 interview payload fields
  guardrails?: Record<string, unknown>
  prior?: Array<{ question: string; answer: string; slot: string }>
  seed?: string
  slotsAsked?: string[]
  prevRecipe?: Record<string, unknown>
  corrections?: string
  // v3 intent-mode payload fields
  surface?: 'home' | 'reader' | 'end' | 'other'
  state?: {
    hasMidFlightBook?: { id: string; title: string }
    shelf?: Array<{ id: string; title: string }>
    currentBook?: { id: string; title: string; chapterIdx?: number; totalChapters?: number }
    childName?: string
    lastIntentsMissed?: number
  }
}

// ---------- Intent whitelist (PRD R16 / R18) ----------
// This is the CLOSED set the client dispatcher can act on. Any string outside
// this list — even if the model returns it — is coerced to 'none' by the
// server (belt) AND ignored by the client (suspenders). Parent-surface routes
// (/read/parent, /story/create, /dashboard, /auth) are NOT and can NEVER be
// members here. That's the whole R18 guarantee.
const INTENT_WHITELIST = [
  'open_book',
  'continue',
  'show_badges',
  'show_words',
  'show_map',
  'switch_buddy',
  'replay_chapter',
  'make_story',
  'read_this',
  'go_home',
  'none',
] as const
type Intent = (typeof INTENT_WHITELIST)[number]

interface IntentPayload {
  intent: Intent
  args?: { bookId?: string; hint?: string }
  confidence: 'high' | 'medium' | 'low'
  buddyLine: string
  options?: string[]
}

interface RespondPayload {
  judgment: Judgment
  buddyReply: string
  followUp?: string
  action: Action
}

const SYSTEM_PROMPT = `You are FABLE — the storyteller and gentle guide of the Little Fables app. Think of yourself as the child's personal teacher: warm, unhurried, delighted by them, precise. If you need a mental model, use Miss Honey from Matilda — kind eyes, real belief, no baby talk, no rush.

The child in front of you is small (~4 years old) and reads at a 5–6 level. He picks a "buddy" (Bramble the bear, Rocky the rock, Rusty the rocket…) — those buddies are CHARACTERS you voice. You speak everyone: the narration, the buddy's lines, praise, questions. One warm voice all the way through, the way a mother reads a picture book aloud.

VOICE — how Fable sounds
- Warm, unhurried, precise. Short sentences with gentle music. Occasional soft pause ("…") when a moment wants to breathe.
- Reference what the child ACTUALLY said. Echo a specific word or idea. Never generic praise ("Great job!", "Good work!"). Instead: "You noticed the wobbly plank — that's what a careful reader does."
- Play the buddy character just enough that it lands (Rocky is deadpan; Bramble is cozy; Rusty counts down) but never so much you disappear into a caricature. Fable's warmth carries through.
- No baby talk. No exclamation-mark storms. Never patronize.
- Never say "wrong" or "no, that's not right." When an answer is off, invite another look ("Look at the little plate — count them with me.").
- Never ask "do you want to keep talking?" or any open-ended engagement loop. The story ALWAYS resumes.
- If the child goes off-story (movies, different games), name what they said with respect, then bring them home: "A dragon movie sounds like a good one. Right now, though, Miko is on the wobbly bridge — shall we see what he does?"
- Never invent facts that aren't in the story context.
- Kid-safe: no scary content, no adult topics, never collect personal information.

MODE GUIDE
- ask: judge whether the answer engages the story question. "engages" = clear yes. "wobbly" = kind-of / partial / free-ish. "off" = unrelated or blank. On engages, praise by echoing THEIR words specifically. On wobbly, give one small hint that points at the picture or the sound of a word (never repeat the whole question). On off, gentle-return.
- wonder: NEVER evaluate. Respond specifically to whatever they said with delight. judgment = "engages". action = "continue".
- choice: they proposed their own idea for what happens next. React with delight and specificity ("A cave with the sleeping owl — I love that.") and set action = "continue" so the story generator uses their idea.
- retell: they just told the story back. Name ONE specific detail they included. Never critique what they left out. action = "praise".
- ask-the-story: they asked a question about the story. Answer briefly, warmly, FROM THE CONTEXT ONLY, ≤2 sentences, then a gentle nudge back ("Good question. Let's see what happens next."). action = "gentle-return".

The reply lives in the field "buddyReply" for compatibility — write it as Fable speaking, ideally in the voice of whichever buddy is present in the context if it's a buddy line.

OUTPUT
Return ONLY valid JSON, no markdown fences, matching:
{
  "judgment": "engages" | "wobbly" | "off",
  "buddyReply": string,
  "followUp": string,          // optional — max ONE, only for ask/wonder; empty string if none
  "action": "praise" | "hint" | "continue" | "proceed" | "gentle-return"
}`

function fallback(mode: RespondMode): RespondPayload {
  // Canned fallback used if the API errors — keeps the reader flowing in
  // Fable's voice.
  switch (mode) {
    case 'retell':
      return {
        judgment: 'engages',
        buddyReply: 'You told that back like a real storyteller. I heard every part.',
        action: 'praise',
      }
    case 'ask-the-story':
      return {
        judgment: 'engages',
        buddyReply: "Good question. Let's see what happens next.",
        action: 'gentle-return',
      }
    case 'wonder':
    case 'choice':
      return {
        judgment: 'engages',
        buddyReply: 'I love where your brain is going. Let\'s follow it.',
        action: 'continue',
      }
    case 'ask':
    default:
      return {
        judgment: 'wobbly',
        buddyReply: "Let's look at the picture again together.",
        action: 'hint',
      }
  }
}

function extractJson(raw: string): RespondPayload | null {
  const stripped = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  try {
    const parsed = JSON.parse(stripped) as Partial<RespondPayload>
    if (
      typeof parsed.buddyReply !== 'string' ||
      typeof parsed.judgment !== 'string' ||
      typeof parsed.action !== 'string'
    ) {
      return null
    }
    const followUp = typeof parsed.followUp === 'string' && parsed.followUp.trim().length > 0
      ? parsed.followUp
      : undefined
    return {
      judgment: parsed.judgment as Judgment,
      action: parsed.action as Action,
      buddyReply: parsed.buddyReply,
      followUp,
    }
  } catch {
    return null
  }
}

// ---------- v3 story kitchen prompts ----------
// The interview modes emit distinct JSON shapes than the reader modes above.
// We keep them in the same route so the caller only knows about /api/respond.

const INTERVIEW_SYSTEM_PROMPT = `You are FABLE — warm, unhurried, delighted by the child in front of you. You are running the STORY KITCHEN interview (PRD R19–R20): the child (~4 y/o) is going to tell you what their story is about, and you are going to ask 2-3 small follow-ups to distill it into a recipe (want / reason / obstacle), then read the recipe back so the story machine can bake it.

VOICE — same as always. Miss-Honey warm, specific, no baby talk, never generic ("nice!", "great job!"). Reference the exact words the child said. Short sentences. One idea per line. Never patronize.

RECIPE SLOTS you are filling in order of importance:
- "want" — what does the hero want? (or need)
- "reason" — WHY do they want it? (this one is mandatory; you MUST ask a "why" question before completing the interview)
- "obstacle" — what's the uh-oh? what's in the way?
- "character" / "setting" / "freeform" — optional extras only if the child leads with one

BEHAVIOR
- Ask ONE question at a time. Each question ≤14 words, specific to what the child JUST said.
- ACKNOWLEDGE the previous answer BEFORE moving on. Echo their words. ("Because the moon is where her grandma lives?! That's a BIG reason.")
- If the child said "I don't know" or was silent, give a graceful bridge line and MOVE ON — do not re-ask that slot.
- After ≤3 questions total OR when the recipe has want + reason + obstacle, COMPLETE the interview: return the recipe + a warm read-back line the buddy will speak aloud.
- Never say "wrong". Never criticize the idea. If it's off-universe (checked separately in interview-redirect mode), that's not your job here.
- Do NOT invent facts. Only use what the child said.

READ-BACK (when complete)
- Compose a single warm spoken line that names hero, want, reason, and obstacle in the child's own words. Example: "So: Ollie the otter, flying to the moon to visit her grandma, but the rocket only has ONE seat…"

REDIRECT MODE — evaluate the child's seed against guardrails. In-bounds if the seed doesn't hit excludeTerms, off-limits themes, or disallowed cast; the buddy might still fold the seed into the universe (e.g. spookiness → a mischievous universe character). Out-of-bounds if the seed frontally violates guardrails (violence, adult content, banned themes). Out-of-bounds redirects propose an in-fiction alternative using an allowed universe character.

CORRECTION MODE — the child said "no" to the read-back. Take their correction transcript, update the recipe surgically (keep what wasn't corrected), and produce a new read-back line.

STRICT: return ONLY the JSON shape described in each mode's schema. No prose, no fences.`

interface InterviewNextBody {
  prior: Array<{ question: string; answer: string; slot: string }>
  seed: string
  slotsAsked: string[]
  guardrails?: Record<string, unknown>
}

interface InterviewRedirectBody {
  transcript: string
  guardrails?: Record<string, unknown>
}

interface InterviewCorrectionBody {
  seed: string
  prevRecipe: Record<string, unknown>
  corrections: string
}

async function callAnthropicMessages(
  apiKey: string,
  system: string,
  user: string,
  maxTokens = 500,
): Promise<string> {
  const upstream = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature: 0.6,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })
  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '')
    throw new Error(`upstream ${upstream.status}: ${errText.slice(0, 200)}`)
  }
  const data = (await upstream.json()) as { content?: Array<{ type: string; text?: string }> }
  return (data.content ?? [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('\n')
    .trim()
}

function safeParse(raw: string): Record<string, unknown> | null {
  const stripped = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const start = stripped.indexOf('{')
  const end = stripped.lastIndexOf('}')
  if (start === -1 || end === -1) return null
  try {
    return JSON.parse(stripped.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return null
  }
}

// ---------- Deterministic guardrail helpers ----------
// The LLM is smarter but slower. For the seed redirect check we run a fast
// deterministic scan first so obvious excludeTerms/bad words get an immediate
// out-of-bounds answer without a round trip.

function transcriptHitsExcludeTerms(t: string, guardrails: Record<string, unknown> | undefined): string | null {
  if (!guardrails) return null
  const terms = Array.isArray(guardrails.excludeTerms)
    ? (guardrails.excludeTerms as unknown[]).filter((x): x is string => typeof x === 'string')
    : []
  if (!terms.length) return null
  const low = t.toLowerCase()
  for (const term of terms) {
    if (!term) continue
    const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    if (re.test(low)) return term
  }
  return null
}

// ---------- Mode handlers ----------

async function handleInterviewRedirect(
  apiKey: string,
  body: InterviewRedirectBody,
): Promise<NextResponse> {
  const transcript = (body.transcript ?? '').trim()
  const guardrails = body.guardrails ?? {}
  // Fast path: deterministic excludeTerms hit → out of bounds.
  const excludeHit = transcriptHitsExcludeTerms(transcript, guardrails)
  if (excludeHit) {
    const buddyLine = `${excludeHit} isn't in our world… but I know someone SNEAKY who could be in your story. Should we try them?`
    return NextResponse.json({
      inBounds: false,
      redirectSuggestion: `Reframe the story without "${excludeHit}" — use an allowed universe character to carry the same energy.`,
      buddyLine,
    })
  }

  const userPayload = {
    mode: 'interview-redirect',
    childSaid: transcript,
    guardrails,
    outputShape: {
      inBounds: 'boolean',
      redirectSuggestion: 'string (only when inBounds=false; describes an in-fiction alternative)',
      buddyLine:
        'string (a single warm spoken line — if inBounds:true this is a short delighted echo of the seed; if inBounds:false this is the redirect the buddy speaks aloud to the child)',
    },
    guidance:
      'Rule of thumb: err on the side of INbounds. Only redirect if the seed is a frontal violation (violence, gore, adult themes, terms that appear in guardrails.excludeTerms) or hits guardrails.themes[].off explicitly. When redirecting, propose a substitute using guardrails.allowedCast or a universe-native character. Never scold. Never say "no". The redirect should feel like an exciting new idea.',
  }
  try {
    const raw = await callAnthropicMessages(apiKey, INTERVIEW_SYSTEM_PROMPT, JSON.stringify(userPayload), 400)
    const parsed = safeParse(raw)
    if (!parsed) throw new Error('unparseable')
    const inBounds = parsed.inBounds !== false
    const buddyLine = typeof parsed.buddyLine === 'string' && parsed.buddyLine.trim().length > 0
      ? parsed.buddyLine
      : inBounds
        ? "I LOVE that. Let's build it."
        : "Let's try something else together."
    const redirectSuggestion = !inBounds && typeof parsed.redirectSuggestion === 'string'
      ? parsed.redirectSuggestion
      : undefined
    return NextResponse.json({ inBounds, buddyLine, redirectSuggestion })
  } catch {
    // Degrade to "in bounds + soft echo" so the flow keeps moving.
    return NextResponse.json({
      inBounds: true,
      buddyLine: transcript.length > 0
        ? "I LOVE where your brain is going. Let's build it."
        : "Tell me anything — I'll help you shape it into a story.",
    })
  }
}

const REQUIRED_SLOTS = ['want', 'reason', 'obstacle']

async function handleInterviewNext(
  apiKey: string,
  body: InterviewNextBody,
): Promise<NextResponse> {
  const prior = Array.isArray(body.prior) ? body.prior : []
  const seed = typeof body.seed === 'string' ? body.seed : ''
  const slotsAsked = Array.isArray(body.slotsAsked) ? body.slotsAsked : []
  const guardrails = body.guardrails ?? {}
  const priorCount = prior.length

  // Force "reason" before letting the model complete — the AC (R20) is explicit.
  const askedReason = slotsAsked.includes('reason') || prior.some((p) => p.slot === 'reason')
  const forceReasonQuestion = !askedReason && priorCount >= 1

  const userPayload = {
    mode: 'interview-next',
    seed,
    prior,
    slotsAsked,
    priorCount,
    forceReason: forceReasonQuestion,
    guardrails,
    outputShape: {
      complete: 'boolean',
      nextQuestion: 'string (only when complete=false — the next question to ask, ≤14 words)',
      slot:
        'string (only when complete=false — which slot this question fills: want|reason|obstacle|character|setting|freeform)',
      ackFromPrior:
        "string (short specific ack of the child's most recent answer; empty if this is the first question)",
      recipe:
        'object (only when complete=true) — { want?: string, reason?: string, obstacle?: string, extras?: [{slot,value}] }',
      readBack:
        "string (only when complete=true) — the buddy's warm read-back spoken to the child",
      buddyLine:
        'string (a single spoken line for the buddy to say right now — for next-question turns this is `${ackFromPrior} ${nextQuestion}`)',
    },
    hardRules: [
      'The reason slot MUST appear in prior[].slot before you may set complete=true.',
      'Max 3 questions total (priorCount + this one ≤ 3).',
      'If the child said "I don\'t know" or gave a blank answer on the last turn, skip that slot and move to the next.',
      'Never re-ask the same slot twice.',
      'Ack must reference specific words from the last answer, not generic praise.',
    ],
  }
  try {
    const raw = await callAnthropicMessages(apiKey, INTERVIEW_SYSTEM_PROMPT, JSON.stringify(userPayload), 700)
    const parsed = safeParse(raw)
    if (!parsed) throw new Error('unparseable')

    // Server-side enforcement of hard rules.
    let complete = parsed.complete === true
    if (complete && !askedReason) complete = false

    if (!complete) {
      const nextQuestion = typeof parsed.nextQuestion === 'string' && parsed.nextQuestion.trim().length > 0
        ? parsed.nextQuestion
        : askedReason
          ? 'What could get in her way?'
          : 'Why does she want that so much?'
      const slot = typeof parsed.slot === 'string' && parsed.slot.length > 0
        ? parsed.slot
        : askedReason
          ? 'obstacle'
          : 'reason'
      const ack = typeof parsed.ackFromPrior === 'string' ? parsed.ackFromPrior : ''
      const buddyLine = typeof parsed.buddyLine === 'string' && parsed.buddyLine.trim().length > 0
        ? parsed.buddyLine
        : ack
          ? `${ack} ${nextQuestion}`
          : nextQuestion
      return NextResponse.json({
        complete: false,
        nextQuestion,
        slot,
        ackFromPrior: ack || undefined,
        buddyLine,
      })
    }

    // Complete branch.
    const recipeRaw = (parsed.recipe && typeof parsed.recipe === 'object'
      ? (parsed.recipe as Record<string, unknown>)
      : {}) as Record<string, unknown>
    const recipe = {
      want: typeof recipeRaw.want === 'string' ? recipeRaw.want : undefined,
      reason: typeof recipeRaw.reason === 'string' ? recipeRaw.reason : undefined,
      obstacle: typeof recipeRaw.obstacle === 'string' ? recipeRaw.obstacle : undefined,
      extras: Array.isArray(recipeRaw.extras)
        ? (recipeRaw.extras as unknown[])
            .map((e) =>
              e && typeof e === 'object'
                ? {
                    slot: typeof (e as Record<string, unknown>).slot === 'string' ? ((e as Record<string, unknown>).slot as string) : '',
                    value: typeof (e as Record<string, unknown>).value === 'string' ? ((e as Record<string, unknown>).value as string) : '',
                  }
                : null,
            )
            .filter((x): x is { slot: string; value: string } => !!x && !!x.slot && !!x.value)
        : undefined,
    }
    const readBack = typeof parsed.readBack === 'string' && parsed.readBack.trim().length > 0
      ? parsed.readBack
      : `So: ${recipe.want ?? 'this story'}${recipe.reason ? `, because ${recipe.reason}` : ''}${recipe.obstacle ? `, but ${recipe.obstacle}` : ''}.`
    const buddyLine = typeof parsed.buddyLine === 'string' && parsed.buddyLine.trim().length > 0
      ? parsed.buddyLine
      : `${readBack} Did I get it right?`
    return NextResponse.json({ complete: true, recipe, readBack, buddyLine })
  } catch {
    // Deterministic fallback: if we can, ask the reason slot; if reason is
    // covered, complete with whatever we have.
    if (!askedReason && priorCount >= 1) {
      return NextResponse.json({
        complete: false,
        nextQuestion: 'Why does she want that so much?',
        slot: 'reason',
        buddyLine: 'Why does she want that so much?',
      })
    }
    if (priorCount >= REQUIRED_SLOTS.length) {
      // Best-effort recipe from prior slots.
      const recipe = {
        want: prior.find((p) => p.slot === 'want')?.answer,
        reason: prior.find((p) => p.slot === 'reason')?.answer,
        obstacle: prior.find((p) => p.slot === 'obstacle')?.answer,
      }
      const readBack = `So: ${recipe.want ?? 'this story'}${recipe.reason ? `, because ${recipe.reason}` : ''}${recipe.obstacle ? `, but ${recipe.obstacle}` : ''}.`
      return NextResponse.json({
        complete: true,
        recipe,
        readBack,
        buddyLine: `${readBack} Did I get it right?`,
      })
    }
    return NextResponse.json({
      complete: false,
      nextQuestion: 'Tell me a little more — what happens?',
      slot: 'freeform',
      buddyLine: 'Tell me a little more — what happens?',
    })
  }
}

async function handleInterviewCorrection(
  apiKey: string,
  body: InterviewCorrectionBody,
): Promise<NextResponse> {
  const userPayload = {
    mode: 'interview-correction',
    seed: body.seed ?? '',
    prevRecipe: body.prevRecipe ?? {},
    corrections: body.corrections ?? '',
    outputShape: {
      updatedRecipe: 'object — same shape as prevRecipe with fields patched to reflect the correction',
      newReadBack: 'string — the buddy re-reads the fixed recipe',
      buddyLine: 'string — spoken line to say now ("Ohhh, got it — let me try that again…")',
    },
    guidance:
      'Only patch fields the child explicitly corrected. Never invent facts. If the correction is unclear, keep the previous field and add a small note in extras.',
  }
  try {
    const raw = await callAnthropicMessages(apiKey, INTERVIEW_SYSTEM_PROMPT, JSON.stringify(userPayload), 600)
    const parsed = safeParse(raw)
    if (!parsed) throw new Error('unparseable')
    const updatedRecipe = parsed.updatedRecipe && typeof parsed.updatedRecipe === 'object'
      ? parsed.updatedRecipe
      : (body.prevRecipe ?? {})
    const newReadBack = typeof parsed.newReadBack === 'string' && parsed.newReadBack.trim().length > 0
      ? parsed.newReadBack
      : 'Let me try again — thanks for helping me get it right.'
    const buddyLine = typeof parsed.buddyLine === 'string' && parsed.buddyLine.trim().length > 0
      ? parsed.buddyLine
      : `Ohhh, got it. ${newReadBack} Did I get it now?`
    return NextResponse.json({ updatedRecipe, newReadBack, buddyLine })
  } catch {
    return NextResponse.json({
      updatedRecipe: body.prevRecipe ?? {},
      newReadBack: 'Let me try that again — I want to get it right.',
      buddyLine: 'Let me try that again — I want to get it right.',
    })
  }
}

// ---------- v3 intent classifier ----------

const INTENT_SYSTEM_PROMPT = `You are FABLE — the warm, unhurried guide of Little Fables. In this mode you are helping a small child (~4 y/o) navigate the app BY VOICE. You classify what the child said into ONE app intent, then reply in ONE short warm confirmation line in Fable's voice.

CLOSED INTENT SET (return EXACTLY one of these strings — nothing else):
- "open_book"       — child asked to open a specific book. Include args.bookId if you can match a state.shelf entry; else args.hint with a keyword ("dino","fox","rocket").
- "continue"        — child wants to keep going on the mid-flight book. Only valid if state.hasMidFlightBook is present.
- "show_badges"     — see badges / stickers / medals collection.
- "show_words"      — see the star words / word book / collected words.
- "show_map"        — Reader ONLY. Show the chapter map / where they are in the book.
- "switch_buddy"    — change buddy (Bramble / Rocky / Rusty / etc).
- "replay_chapter"  — Reader ONLY. Read this chapter again from the start.
- "make_story"      — go make a new story WITH the buddy.
- "read_this"       — Reader ONLY. Read this page aloud (start read-aloud from the current page).
- "go_home"         — go back to the shelf / home.
- "none"            — cannot classify OR the ask is off-app / unsafe.

STRICT RULES
1. NEVER invent an intent name that isn't in this list. If in doubt → "none".
2. NEVER classify anything related to parent settings, account, delete, edit, buy, subscribe, sign in, dashboard, admin, unlock, "grown-up mode", passwords, or any parent surface. → "none" with a redirect line ("That's a grown-ups thing — Papa can help.") and NO options.
3. surface=='home' → these intents are NOT valid: "show_map", "replay_chapter", "read_this". If child asked for one of those on home → "none".
4. Match generously: "the dino book" / "my dinosaur one" → open_book with hint "dino" (or bookId if state.shelf has an obvious title match). "keep going" / "let's keep reading" / "continue" → continue (only if hasMidFlightBook exists). "show me the stars" → show_words. "my medals" / "trophies" → show_badges. "pick a new buddy" / "different friend" → switch_buddy. "make a new story" / "let's make one" → make_story. "read this page" / "read it" (Reader) → read_this. "again" / "one more time" (Reader) → replay_chapter. "where am I" / "the map" (Reader) → show_map. "go home" / "back to my shelf" → go_home.
5. If confidence is low AND you can offer TWO concrete tap-options FROM THE ACTUAL STATE (real book titles or real actions listed above), return intent="none" with options: [option1, option2]. Options must be short (≤4 words each) and echo real things — e.g. ["The dino book","Keep going with Miko"]. NEVER invent options.
6. Never offer options for the redirect/unsafe path (rule 2).
7. buddyLine is ONE warm line in Fable's voice, always echoing the target: "The dino book? Here we GO!" — NEVER "Opening dino book." "Let's keep reading Miko!" — NEVER "Continuing." For "none" (unclassified), be soft: "Hmm, I'm not sure — did you mean one of these?" and options appear as chips.
8. Kid-safe. Warm. No baby talk. No exclamation storms (one "!" per line max).
9. Confidence tiers: "high" = clear literal match or clear paraphrase AND target unambiguous. "medium" = reasonably confident with a fuzzy hint. "low" = guessing; prefer "none" with options.

OUTPUT
Return ONLY valid JSON, no markdown fences, matching:
{
  "intent": string,
  "args": { "bookId"?: string, "hint"?: string },
  "confidence": "high" | "medium" | "low",
  "buddyLine": string,
  "options"?: [string, string]
}`

function intentFallback(): IntentPayload {
  return {
    intent: 'none',
    confidence: 'low',
    buddyLine: "Hmm, I didn't quite catch that — just tap what you want.",
  }
}

function extractIntentJson(raw: string, surface: RespondBody['surface']): IntentPayload | null {
  const parsed = safeParse(raw)
  if (!parsed) return null

  const rawIntent = typeof parsed.intent === 'string' ? parsed.intent : ''
  const buddyLine = typeof parsed.buddyLine === 'string' && parsed.buddyLine.trim().length > 0
    ? parsed.buddyLine.trim()
    : "Hmm, I didn't quite catch that — just tap what you want."

  // Whitelist enforcement (R18) — belt. Anything not in the closed set → 'none'.
  let intent: Intent = (INTENT_WHITELIST as readonly string[]).includes(rawIntent)
    ? (rawIntent as Intent)
    : 'none'

  // Surface guard — reader-only intents on Home coerce to none.
  const readerOnly: Intent[] = ['show_map', 'replay_chapter', 'read_this']
  if (surface !== 'reader' && readerOnly.includes(intent)) {
    intent = 'none'
  }

  const confidenceRaw = typeof parsed.confidence === 'string' ? parsed.confidence : 'low'
  const confidence: IntentPayload['confidence'] =
    confidenceRaw === 'high' || confidenceRaw === 'medium' || confidenceRaw === 'low'
      ? confidenceRaw
      : 'low'

  const argsRaw = parsed.args && typeof parsed.args === 'object'
    ? (parsed.args as Record<string, unknown>)
    : undefined
  const args: IntentPayload['args'] | undefined = argsRaw
    ? {
        bookId: typeof argsRaw.bookId === 'string' ? argsRaw.bookId : undefined,
        hint: typeof argsRaw.hint === 'string' ? argsRaw.hint : undefined,
      }
    : undefined

  // Options only accepted when intent === 'none' (the misfire fallback).
  let options: string[] | undefined
  if (intent === 'none' && Array.isArray(parsed.options)) {
    const cleaned = (parsed.options as unknown[])
      .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
      .map((s) => s.trim())
      .slice(0, 2)
    if (cleaned.length === 2) options = cleaned
  }

  return { intent, args, confidence, buddyLine, options }
}

async function handleIntent(apiKey: string, body: RespondBody): Promise<NextResponse> {
  const surface = body.surface ?? 'other'
  const state = body.state
    ? {
        ...body.state,
        // Keep the shelf token-bounded (contract: first 24).
        shelf: Array.isArray(body.state.shelf) ? body.state.shelf.slice(0, 24) : undefined,
      }
    : {}
  const userPayload = {
    mode: 'intent',
    surface,
    childSaid: body.transcript ?? '',
    state,
  }
  try {
    const raw = await callAnthropicMessages(apiKey, INTENT_SYSTEM_PROMPT, JSON.stringify(userPayload), 300)
    const payload = extractIntentJson(raw, surface) ?? intentFallback()
    return NextResponse.json(payload)
  } catch {
    return NextResponse.json(intentFallback())
  }
}

export async function POST(req: NextRequest) {
  if (!sameOriginOk(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  if (!(await underDailyBudget('respond', dailyLimit('respond', 300)))) {
    return NextResponse.json({ error: 'daily limit reached' }, { status: 429 })
  }
  let body: RespondBody
  try {
    body = (await req.json()) as RespondBody
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const { mode, transcript, context } = body
  if (!mode) {
    return NextResponse.json({ error: 'mode is required' }, { status: 400 })
  }
  const validModes: RespondMode[] = [
    'ask',
    'wonder',
    'choice',
    'retell',
    'ask-the-story',
    'interview-redirect',
    'interview-next',
    'interview-correction',
    'intent',
  ]
  if (!validModes.includes(mode)) {
    return NextResponse.json({ error: `unknown mode: ${mode}` }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // Intent mode degrades to a soft 'none' so the child still gets the toast.
    if (mode === 'intent') {
      return NextResponse.json(intentFallback())
    }
    return NextResponse.json({ error: 'Buddy response not configured' }, { status: 501 })
  }

  // Route v3 interview modes to their own handlers (different output shapes).
  if (mode === 'interview-redirect') {
    if (typeof transcript !== 'string') {
      return NextResponse.json({ error: 'transcript is required' }, { status: 400 })
    }
    return handleInterviewRedirect(apiKey, {
      transcript,
      guardrails: body.guardrails,
    })
  }
  if (mode === 'interview-next') {
    return handleInterviewNext(apiKey, {
      prior: body.prior ?? [],
      seed: body.seed ?? '',
      slotsAsked: body.slotsAsked ?? [],
      guardrails: body.guardrails,
    })
  }
  if (mode === 'interview-correction') {
    return handleInterviewCorrection(apiKey, {
      seed: body.seed ?? '',
      prevRecipe: body.prevRecipe ?? {},
      corrections: body.corrections ?? '',
    })
  }
  if (mode === 'intent') {
    if (typeof transcript !== 'string') {
      return NextResponse.json({ error: 'transcript is required' }, { status: 400 })
    }
    return handleIntent(apiKey, body)
  }

  if (typeof transcript !== 'string') {
    return NextResponse.json({ error: 'transcript is required' }, { status: 400 })
  }

  const userPayload = {
    mode,
    childSaid: transcript,
    context: context ?? null,
  }

  let upstream: Response
  try {
    upstream = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        temperature: 0.7,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: JSON.stringify(userPayload),
          },
        ],
      }),
    })
  } catch (err) {
    return NextResponse.json(
      { error: `Buddy upstream failed: ${(err as Error).message}` },
      { status: 502 },
    )
  }

  if (!upstream.ok) {
    let detail = `Buddy upstream ${upstream.status}`
    try {
      const raw = await upstream.text()
      if (raw) detail = `Buddy upstream ${upstream.status}: ${raw.slice(0, 300)}`
    } catch {
      // ignore
    }
    return NextResponse.json({ error: detail }, { status: 502 })
  }

  let raw: string
  try {
    const data = (await upstream.json()) as {
      content?: Array<{ type: string; text?: string }>
    }
    raw = (data.content ?? [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join('\n')
      .trim()
  } catch (err) {
    return NextResponse.json(
      { error: `Buddy parse failed: ${(err as Error).message}` },
      { status: 502 },
    )
  }

  const payload = extractJson(raw) ?? fallback(mode)
  return NextResponse.json(payload)
}
