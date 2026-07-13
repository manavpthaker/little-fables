// Thin wrapper around Anthropic's Messages API for art-director planning.
// Mirrors the wire pattern used in app/api/story/route.ts.

const API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

export interface AnthropicCallOpts {
  apiKey: string
  model: string
  system: string
  user: string
  maxTokens?: number
}

interface AnthropicMessagesResponse {
  content: Array<{ type: string; text?: string }>
  stop_reason?: string
  usage?: { input_tokens?: number; output_tokens?: number }
}

export interface AnthropicCallResult {
  text: string
  inputTokens?: number
  outputTokens?: number
  model: string
}

export async function callAnthropicJSON(opts: AnthropicCallOpts): Promise<AnthropicCallResult> {
  if (!opts.apiKey) throw new Error('ANTHROPIC_API_KEY missing')
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': opts.apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: opts.maxTokens ?? 8000,
      system: opts.system,
      messages: [{ role: 'user', content: opts.user }],
    }),
  })
  if (!resp.ok) {
    const err = await resp.text().catch(() => '')
    throw new Error(`Anthropic ${resp.status}: ${err.slice(0, 500)}`)
  }
  const data = (await resp.json()) as AnthropicMessagesResponse
  const text = data.content?.find((c) => c.type === 'text')?.text ?? ''
  return {
    text,
    inputTokens: data.usage?.input_tokens,
    outputTokens: data.usage?.output_tokens,
    model: opts.model,
  }
}

/**
 * Extract the first JSON object/array from a model response, tolerating
 * fenced blocks and prefatory prose.
 */
export function extractJSON(text: string): unknown {
  const cleaned = text.replace(/```json|```/g, '').trim()
  // Prefer array (director plan is an array) but tolerate wrapper object.
  const firstArr = cleaned.indexOf('[')
  const firstObj = cleaned.indexOf('{')
  let start = -1
  let endChar = ''
  if (firstArr === -1 && firstObj === -1) {
    throw new Error('No JSON structure found in model output')
  }
  if (firstArr !== -1 && (firstObj === -1 || firstArr < firstObj)) {
    start = firstArr
    endChar = ']'
  } else {
    start = firstObj
    endChar = '}'
  }
  const end = cleaned.lastIndexOf(endChar)
  if (end < start) throw new Error('Truncated JSON in model output')
  return JSON.parse(cleaned.slice(start, end + 1))
}
