import { NextRequest, NextResponse } from 'next/server'
import { dailyLimit, sameOriginOk, underDailyBudget } from '@/lib/server/guard'

export const runtime = 'nodejs'
export const maxDuration = 30

// STT endpoint. Multipart form: field `audio` = the recorded blob.
// Provider chosen by STT_PROVIDER (default 'openai'). ElevenLabs Scribe is
// an alternative when STT_PROVIDER=elevenlabs.

async function transcribeWithOpenAI(file: File): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('STT not configured')
  const model = process.env.OPENAI_STT_MODEL || 'gpt-4o-mini-transcribe'

  const form = new FormData()
  form.append('file', file, file.name || 'clip.webm')
  form.append('model', model)
  form.append('response_format', 'json')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}` },
    body: form,
  })
  if (!res.ok) {
    const raw = await res.text().catch(() => '')
    throw new Error(`openai stt ${res.status}: ${raw.slice(0, 300)}`)
  }
  const data = (await res.json()) as { text?: string }
  return data.text ?? ''
}

async function transcribeWithElevenLabs(file: File): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) throw new Error('STT not configured')
  const modelId = process.env.ELEVENLABS_STT_MODEL || 'scribe_v1'

  const form = new FormData()
  form.append('file', file, file.name || 'clip.webm')
  form.append('model_id', modelId)

  const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': apiKey },
    body: form,
  })
  if (!res.ok) {
    const raw = await res.text().catch(() => '')
    throw new Error(`elevenlabs stt ${res.status}: ${raw.slice(0, 300)}`)
  }
  const data = (await res.json()) as { text?: string }
  return data.text ?? ''
}

export async function POST(req: NextRequest) {
  if (!sameOriginOk(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  if (!(await underDailyBudget('listen', dailyLimit('listen', 300)))) {
    return NextResponse.json({ error: 'daily limit reached' }, { status: 429 })
  }
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'multipart form required' }, { status: 400 })
  }

  const audio = form.get('audio')
  if (!audio || typeof audio === 'string') {
    return NextResponse.json({ error: 'audio field is required' }, { status: 400 })
  }

  // Blob → File so upstream form-uploaders keep the filename.
  const file =
    audio instanceof File
      ? audio
      : new File([audio as Blob], 'clip.webm', { type: (audio as Blob).type || 'audio/webm' })

  const provider = (process.env.STT_PROVIDER || 'openai').toLowerCase()
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY)
  const hasEleven = Boolean(process.env.ELEVENLABS_API_KEY)
  if (provider === 'openai' && !hasOpenAI) {
    return NextResponse.json({ error: 'STT not configured' }, { status: 501 })
  }
  if (provider === 'elevenlabs' && !hasEleven) {
    return NextResponse.json({ error: 'STT not configured' }, { status: 501 })
  }

  try {
    const transcript =
      provider === 'elevenlabs'
        ? await transcribeWithElevenLabs(file)
        : await transcribeWithOpenAI(file)
    return NextResponse.json({ transcript })
  } catch (err) {
    const msg = (err as Error).message || 'STT upstream failed'
    if (msg === 'STT not configured') {
      return NextResponse.json({ error: msg }, { status: 501 })
    }
    return NextResponse.json({ error: `STT upstream failed: ${msg}` }, { status: 502 })
  }
}
