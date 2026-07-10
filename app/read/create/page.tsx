'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loadUniverse, type Universe } from '@/lib/universe/azad-verse'
import { saveStory, uid } from '@/lib/read/storage'
import { listen, recognitionAvailable, speak } from '@/lib/read/speech'
import type { GenerateResponse, Story } from '@/types/story'

const PLACES = [
  { label: 'Zoomtown', emoji: '🏙️' },
  { label: 'The Star Garage', emoji: '🚀' },
  { label: 'Dino Canyon', emoji: '🦕' },
  { label: 'Outer Space', emoji: '🌌' },
  { label: 'The Soccer Field', emoji: '⚽' },
  { label: 'The Hockey Rink', emoji: '🏒' },
]

export default function CreateStory() {
  const router = useRouter()
  const [universe, setUniverse] = useState<Universe | null>(null)
  const [hero, setHero] = useState<string | null>(null)
  const [place, setPlace] = useState<string | null>(null)
  const [idea, setIdea] = useState('')
  const [listening, setListening] = useState(false)
  const [making, setMaking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setUniverse(loadUniverse()) }, [])

  const captureIdea = () => {
    setListening(true)
    speak('Tell me your story idea!', {
      onEnd: () => {
        listen({
          onResult: (t) => setIdea(t),
          onEnd: () => setListening(false),
          timeoutMs: 12000,
        })
      },
    })
  }

  const makeStory = async () => {
    if (!universe) return
    setMaking(true)
    setError(null)
    try {
      const res = await fetch('/api/story', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode: 'start',
          hero: hero ?? undefined,
          place: place ?? undefined,
          idea: idea || undefined,
          universe,
        }),
      })
      const data = (await res.json()) as GenerateResponse
      if (!res.ok || data.error) throw new Error(data.error || 'Story engine error')

      const story: Story = {
        id: uid(),
        title: data.title ?? 'A New Adventure',
        coverEmoji: data.coverEmoji ?? '✨',
        coverBg: data.coverBg ?? 'linear-gradient(160deg,#7c3aed,#ec4899)',
        status: data.done ? 'complete' : 'awaiting-choice',
        teachingGoals: data.teachingGoals ?? [],
        vocab: data.vocab ?? [],
        pages: data.pages,
        retellPrompts: data.retellPrompts ?? [
          'Who was in your story?',
          'What was the problem?',
          'How did it end?',
        ],
        createdAt: Date.now(),
        source: 'generated',
        idea: idea || undefined,
      }
      saveStory(story)
      router.push(`/read/story/${story.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The story machine hiccuped. Try again!')
      setMaking(false)
    }
  }

  if (making) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center bg-indigo-950 text-white gap-6 px-8 text-center">
        <span className="text-8xl animate-bounce" aria-hidden>🪄</span>
        <h1 className="text-3xl font-bold">Making your story…</h1>
        <p className="text-xl text-indigo-300">Mixing in {hero ?? 'your heroes'}{place ? ` at ${place}` : ''}…</p>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-gradient-to-b from-purple-950 via-indigo-950 to-indigo-900 text-white pb-16">
      <header className="flex items-center gap-4 px-6 pt-8 pb-2">
        <Link href="/read" aria-label="Back" className="bg-black/25 rounded-full w-12 h-12 flex items-center justify-center text-2xl">⬅️</Link>
        <h1 className="text-3xl font-bold">Story Maker 🪄</h1>
      </header>

      {/* hero picker */}
      <section className="px-6 pt-6">
        <h2 className="text-xl text-indigo-200 mb-3">Who is the hero?</h2>
        <div className="flex gap-3 flex-wrap">
          {universe?.companions.map((c) => (
            <button key={c.name}
              onClick={() => setHero(hero === c.name ? null : c.name)}
              className={`rounded-2xl px-5 py-4 text-xl font-bold shadow active:scale-95 ${hero === c.name ? 'bg-amber-400 text-indigo-950 ring-4 ring-white' : 'bg-white/10'}`}>
              {c.emoji} {c.name}
            </button>
          ))}
          <button
            onClick={() => setHero(hero === 'surprise' ? null : 'surprise')}
            className={`rounded-2xl px-5 py-4 text-xl font-bold shadow active:scale-95 ${hero === 'surprise' ? 'bg-amber-400 text-indigo-950 ring-4 ring-white' : 'bg-white/10'}`}>
            🎁 Surprise me!
          </button>
        </div>
      </section>

      {/* place picker */}
      <section className="px-6 pt-8">
        <h2 className="text-xl text-indigo-200 mb-3">Where does it happen?</h2>
        <div className="flex gap-3 flex-wrap">
          {PLACES.map((p) => (
            <button key={p.label}
              onClick={() => setPlace(place === p.label ? null : p.label)}
              className={`rounded-2xl px-5 py-4 text-xl font-bold shadow active:scale-95 ${place === p.label ? 'bg-amber-400 text-indigo-950 ring-4 ring-white' : 'bg-white/10'}`}>
              {p.emoji} {p.label}
            </button>
          ))}
        </div>
      </section>

      {/* idea by voice */}
      <section className="px-6 pt-8">
        <h2 className="text-xl text-indigo-200 mb-3">What happens? (You tell me!)</h2>
        {recognitionAvailable() && (
          <button onClick={captureIdea}
            className={`rounded-full px-7 py-5 text-xl font-bold shadow active:scale-95 ${listening ? 'bg-red-500 animate-pulse' : 'bg-indigo-600'}`}>
            {listening ? '👂 Listening…' : '🎤 Tell me your idea!'}
          </button>
        )}
        {idea && (
          <p className="mt-4 bg-white/10 rounded-2xl p-4 text-xl">
            💭 &ldquo;{idea}&rdquo;
            <button onClick={() => setIdea('')} className="ml-3 text-sm underline text-indigo-300">clear</button>
          </p>
        )}
      </section>

      {error && (
        <p className="mx-6 mt-6 bg-red-500/20 border border-red-400 rounded-2xl p-4 text-lg">{error}</p>
      )}

      {/* go! */}
      <div className="px-6 pt-10">
        <button onClick={makeStory}
          className="w-full rounded-3xl py-6 text-3xl font-bold shadow-xl active:scale-95 transition-transform"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444,#ec4899)' }}>
          ✨ Make My Story! ✨
        </button>
      </div>
    </main>
  )
}
