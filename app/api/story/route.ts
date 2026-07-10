import { NextRequest, NextResponse } from 'next/server'
import type { GenerateRequest, GenerateResponse, StoryPage } from '@/types/story'

export const maxDuration = 60

const MODEL = process.env.STORY_MODEL || 'claude-sonnet-4-5'
const API_URL = 'https://api.anthropic.com/v1/messages'

function systemPrompt(universe: unknown): string {
  return `You are a children's story engine built on the Storyverse framework. You write for one specific child, described in the UNIVERSE JSON below.

UNIVERSE:
${JSON.stringify(universe, null, 2)}

Every story works on 5 simultaneous layers:
1. Surface (entertainment): a genuinely fun adventure with sound effects, humor, momentum
2. Skills: teaching goals embedded through ACTION, never lectures
3. Values: characters model the universe's values through choices
4. Systems: simple cause-and-effect and ripple effects a young child can follow
5. Future: choices matter and lead to different outcomes

RULES:
- Target the child's storyLevel. Sentences short and rhythmic. Read-aloud friendly. Sound effects (Vroom! Screech! Roar!) welcome.
- Use the universe's companions, settings, and interests. Original characters only - never brand/IP characters.
- 1-3 "ask" teaching moments per story chunk, embedded naturally in the plot (counting things in the scene, naming a feeling, living vs nonliving, letter sounds, predicting what happens next). The question must be answerable by a 4-6 year old out loud in a word or two.
- If the universe has culture.words, weave 0-2 of them naturally into dialogue the way the family speaks (context makes meaning clear; no dictionary translations).
- Emotional moments: characters name feelings and use calming strategies (belly breaths, counting, asking for help).
- Model gratefulness and kindness through character actions.
- Respect the universe's "avoid" list absolutely.
- Scene emojis: 2-5 emojis that illustrate the page, most important first. bg: a CSS linear-gradient string with 2 colors matching the mood.

OUTPUT: Respond with ONLY valid JSON, no markdown fences, matching exactly this TypeScript shape:
{
  "title": string,            // only in start mode
  "coverEmoji": string,       // one emoji, only in start mode
  "coverBg": string,          // CSS linear-gradient, only in start mode
  "pages": [{
    "text": string,           // 1-3 short sentences
    "scene": { "bg": string, "emojis": string[] },
    "ask": {                  // optional, max 3 per chunk
      "question": string, "answers": string[], "praise": string, "hint": string, "skill": string
    },
    "choice": {               // optional; ONLY as the final page of the chunk, and only if the story continues
      "prompt": string,
      "options": [{ "label": string, "emoji": string, "keywords": string[] }]  // exactly 2-3 options, keywords are spoken-answer words
    }
  }],
  "vocab": [{                 // 2-4 star words used in the text
    "word": string,           // the star word
    "meaning": string         // kid-friendly meaning (5-8 words, no dictionary tone)
  }],
  "teachingGoals": string[],  // which goals this chunk hit
  "retellPrompts": string[],  // only when done=true: 3-4 questions to help the child retell the story
  "done": boolean             // true if this chunk ends the story
}

STRUCTURE:
- "start" mode: write 4-6 pages, ending the LAST page with a "choice" (2-3 options) and done=false. Hook fast: page 1 must grab attention.
- "continue" mode: honor the child's choice meaningfully (the choice must change what happens), write 3-5 pages. Either end with another choice (done=false) or finish the story warmly (done=true) with a satisfying ending that echoes gratefulness/kindness. A full story should resolve after 1-2 choices total - do not drag on.
- When done=true: include retellPrompts and NO choice on the last page.`
}

function userPrompt(body: GenerateRequest): string {
  if (body.mode === 'start') {
    const parts = [`Start a brand new story.`]
    if (body.hero) parts.push(`Hero/companion focus: ${body.hero}`)
    if (body.place) parts.push(`Setting: ${body.place}`)
    if (body.idea) parts.push(`The child's story idea (in their own words): "${body.idea}"`)
    if (body.by) parts.push(`Attribution to include on the cover: "${body.by}" (e.g. "Made by Papa")`)
    if (!body.idea && !body.hero) parts.push('Pick an interest from the universe and surprise us.')
    return parts.join('\n')
  }
  const soFar = body.story?.pages.map((p, i) => `Page ${i + 1}: ${p.text}`).join('\n') ?? ''
  return `Continue this story titled "${body.story?.title}".
Original idea: ${body.story?.idea ?? 'n/a'}

STORY SO FAR:
${soFar}

THE CHILD CHOSE: "${body.choice}"

Continue from that choice. Count how many choices have already happened in the story so far - if this is the second choice, finish the story now (done=true).`
}

function extractJSON(text: string): GenerateResponse {
  // strip accidental fences and grab the outermost object
  const cleaned = text.replace(/```json|```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON in model output')
  return JSON.parse(cleaned.slice(start, end + 1)) as GenerateResponse
}

function validate(res: GenerateResponse): GenerateResponse {
  if (!Array.isArray(res.pages) || res.pages.length === 0) throw new Error('Model returned no pages')
  res.pages = res.pages.map((p: StoryPage) => ({
    ...p,
    text: String(p.text ?? ''),
    scene: {
      bg: typeof p.scene?.bg === 'string' && p.scene.bg.includes('gradient')
        ? p.scene.bg
        : 'linear-gradient(160deg,#38bdf8,#a7f3d0)',
      emojis: Array.isArray(p.scene?.emojis) ? p.scene.emojis.slice(0, 5) : ['✨'],
    },
  }))
  // Normalize vocab: accept the new {word,meaning}[] shape, and coerce legacy
  // string[] (from old models) into words with a placeholder meaning so nothing
  // crashes if the model regresses.
  if (Array.isArray(res.vocab)) {
    res.vocab = res.vocab
      .map((v) => {
        if (typeof v === 'string') return { word: v, meaning: '' }
        if (v && typeof v === 'object' && typeof (v as { word?: unknown }).word === 'string') {
          return {
            word: (v as { word: string }).word,
            meaning: String((v as { meaning?: unknown }).meaning ?? ''),
          }
        }
        return null
      })
      .filter((v): v is { word: string; meaning: string } => v !== null)
  }
  // a done story must not end on a choice
  if (res.done) {
    const last = res.pages[res.pages.length - 1]
    delete last.choice
  }
  return res
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not set. Add it in Vercel project settings (or .env.local) to enable story magic.' },
      { status: 500 }
    )
  }

  let body: GenerateRequest
  try {
    body = (await req.json()) as GenerateRequest
  } catch {
    return NextResponse.json({ error: 'Bad request body' }, { status: 400 })
  }

  try {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        system: systemPrompt(body.universe),
        messages: [{ role: 'user', content: userPrompt(body) }],
      }),
    })

    if (!resp.ok) {
      const errText = await resp.text()
      console.error('Anthropic API error', resp.status, errText)
      return NextResponse.json(
        { error: `Story engine error (${resp.status}). Check the API key and model name.` },
        { status: 502 }
      )
    }

    const data = (await resp.json()) as { content: { type: string; text?: string }[] }
    const text = data.content?.find((c) => c.type === 'text')?.text ?? ''
    const result = validate(extractJSON(text))
    return NextResponse.json(result)
  } catch (e) {
    console.error('Story generation failed', e)
    return NextResponse.json({ error: 'The story machine hiccuped. Try again!' }, { status: 500 })
  }
}
