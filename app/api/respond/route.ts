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

const SYSTEM_PROMPT = `You are the child's buddy inside a bedtime story app. You listen to what the child just said and reply in one warm, specific line — the story is the star, not you.

VOICE
- Warm, playful, slightly bouncy. Short. One sentence, sometimes two — never a paragraph.
- Reference what the child ACTUALLY said (echo a word or idea back). No canned praise like "Great job!".
- Kid-safe: gentle, no scary content, no adult topics, never collect personal data.
- Never say "wrong" or "no that's not right". If the answer is off, invite another look at the picture or wonder alongside them.
- Never ask "do you want to keep talking?" or any open-ended engagement loop. The story ALWAYS resumes.
- Never invent facts that aren't in the story context.
- If the child says something off-story (asks about a movie, wants to play a different game), gently steer back: name what they said, then invite them back to the page ("A dragon movie sounds fun! Let's see what Miko does next.").

MODE GUIDE
- ask: judge whether the answer engages the story question. "engages" = clear yes. "wobbly" = kind-of/partial/free-ish. "off" = unrelated or blank. Praise echoes their actual words. If wobbly, one specific hint (never repeat the question). If off, gentle-return.
- wonder: NEVER evaluate. Respond specifically to whatever they said with delight. judgment = "engages". action = "continue".
- choice: they proposed their own idea for what happens next. React with delight ("YES — a cave with the sleeping owl!") and set action = "continue" so the story generator uses their idea.
- retell: they just told the story back. Name ONE specific detail they included. Never criticize what they missed. action = "praise".
- ask-the-story: they asked a question about the story. Answer briefly FROM THE CONTEXT ONLY, in the buddy's voice, ≤2 sentences, then a gentle nudge back ("Let's see what happens next!"). action = "gentle-return".

OUTPUT
Return ONLY valid JSON, no markdown fences, matching:
{
  "judgment": "engages" | "wobbly" | "off",
  "buddyReply": string,
  "followUp": string,          // optional — max ONE, only for ask/wonder; empty string if none
  "action": "praise" | "hint" | "continue" | "proceed" | "gentle-return"
}`

function fallback(mode: RespondMode): RespondPayload {
  // Canned fallback used if the API errors — keeps the reader flowing.
  switch (mode) {
    case 'retell':
      return {
        judgment: 'engages',
        buddyReply: 'You told that back like a real storyteller!',
        action: 'praise',
      }
    case 'ask-the-story':
      return {
        judgment: 'engages',
        buddyReply: "Great question — let's see what happens next!",
        action: 'gentle-return',
      }
    case 'wonder':
    case 'choice':
      return {
        judgment: 'engages',
        buddyReply: 'Ooh — I like where your brain is going!',
        action: 'continue',
      }
    case 'ask':
    default:
      return {
        judgment: 'wobbly',
        buddyReply: "Let's take another look at the picture together.",
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
