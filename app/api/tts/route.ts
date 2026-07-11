import { NextRequest, NextResponse } from 'next/server'
import type { WordTimestamp } from '@/lib/read/speech'

// Prefer Fluid Compute Node runtime for cold-start friendliness + longer timeout.
export const runtime = 'nodejs'
export const maxDuration = 60

// ElevenLabs convert-with-timestamps endpoint. Returns audio (base64) and
// per-character alignment which we aggregate into per-word timings.
// Docs: POST /v1/text-to-speech/{voice_id}/with-timestamps

interface ElevenLabsAlignment {
  characters: string[]
  character_start_times_seconds: number[]
  character_end_times_seconds: number[]
}

interface ElevenLabsResponse {
  audio_base64: string
  alignment: ElevenLabsAlignment
  normalized_alignment?: ElevenLabsAlignment
}

function charAlignmentToWords(
  alignment: ElevenLabsAlignment | undefined,
): WordTimestamp[] {
  if (!alignment || !alignment.characters || !alignment.character_start_times_seconds) return []
  const words: WordTimestamp[] = []
  const chars = alignment.characters
  const starts = alignment.character_start_times_seconds
  const ends = alignment.character_end_times_seconds
  let current = ''
  let currentStart: number | null = null
  let currentEnd: number | null = null
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]
    const isSep = /\s/.test(ch)
    if (isSep) {
      if (current) {
        words.push({
          word: current,
          start: currentStart ?? 0,
          end: currentEnd ?? currentStart ?? 0,
        })
      }
      current = ''
      currentStart = null
      currentEnd = null
    } else {
      if (currentStart == null) currentStart = starts[i] ?? 0
      currentEnd = ends[i] ?? starts[i] ?? currentEnd ?? 0
      current += ch
    }
  }
  if (current) {
    words.push({
      word: current,
      start: currentStart ?? 0,
      end: currentEnd ?? currentStart ?? 0,
    })
  }
  return words
}

export async function POST(req: NextRequest) {
  let body: { text?: string; voice?: 'narrator' | 'buddy' } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const text = (body.text ?? '').trim()
  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }
  const voiceKind = body.voice ?? 'narrator'

  const apiKey = process.env.ELEVENLABS_API_KEY
  const narratorVoiceId = process.env.NARRATOR_VOICE_ID
  // Fable voices everything — buddy characters and narration alike. If
  // BUDDY_VOICE_ID isn't set we fall back to the narrator voice so the app
  // never accidentally speaks with two voices.
  const buddyVoiceId = process.env.BUDDY_VOICE_ID || narratorVoiceId
  const voiceId = voiceKind === 'buddy' ? buddyVoiceId : narratorVoiceId

  if (!apiKey || !voiceId) {
    return NextResponse.json({ error: 'TTS not configured' }, { status: 501 })
  }

  // Buddy lines are dynamic → use Flash for latency + cost. Narrator uses the
  // higher-fidelity multilingual v2 model. Callers can override via env.
  const modelId =
    voiceKind === 'buddy'
      ? process.env.ELEVENLABS_BUDDY_MODEL || 'eleven_flash_v2_5'
      : process.env.ELEVENLABS_NARRATOR_MODEL || 'eleven_multilingual_v2'

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps`

  let upstream: Response
  try {
    upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        output_format: 'mp3_44100_128',
      }),
    })
  } catch (err) {
    return NextResponse.json(
      { error: `TTS upstream failed: ${(err as Error).message}` },
      { status: 502 },
    )
  }

  if (!upstream.ok) {
    let detail = `TTS upstream ${upstream.status}`
    try {
      const raw = await upstream.text()
      if (raw) detail = `TTS upstream ${upstream.status}: ${raw.slice(0, 300)}`
    } catch {
      // ignore
    }
    return NextResponse.json({ error: detail }, { status: 502 })
  }

  let data: ElevenLabsResponse
  try {
    data = (await upstream.json()) as ElevenLabsResponse
  } catch (err) {
    return NextResponse.json(
      { error: `TTS parse failed: ${(err as Error).message}` },
      { status: 502 },
    )
  }

  const timestamps = charAlignmentToWords(data.normalized_alignment ?? data.alignment)

  return NextResponse.json({
    audioBase64: data.audio_base64,
    mimeType: 'audio/mpeg',
    timestamps,
  })
}
