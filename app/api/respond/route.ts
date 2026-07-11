import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 20

const MODEL = process.env.RESPOND_MODEL || 'claude-haiku-4-5-20251001'
const API_URL = 'https://api.anthropic.com/v1/messages'

type RespondMode = 'ask' | 'wonder' | 'choice' | 'retell' | 'ask-the-story'
type Judgment = 'engages' | 'wobbly' | 'off'
type Action = 'praise' | 'hint' | 'continue' | 'proceed' | 'gentle-return'

interface RespondBody {
  mode: RespondMode
  transcript: string
  context: unknown
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

export async function POST(req: NextRequest) {
  let body: RespondBody
  try {
    body = (await req.json()) as RespondBody
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const { mode, transcript, context } = body
  if (!mode || typeof transcript !== 'string') {
    return NextResponse.json({ error: 'mode and transcript are required' }, { status: 400 })
  }
  const validModes: RespondMode[] = ['ask', 'wonder', 'choice', 'retell', 'ask-the-story']
  if (!validModes.includes(mode)) {
    return NextResponse.json({ error: `unknown mode: ${mode}` }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Buddy response not configured' }, { status: 501 })
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
