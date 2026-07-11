# Voice architecture — reading voice, voice input, conversation

Research date: July 2026. This replaces the v1 approach (device speechSynthesis + webkitSpeechRecognition) and defines the conversational interaction layer.

## The forcing fact

**webkitSpeechRecognition does not work in installed iOS PWAs.** It works in Safari-the-browser, but in Add-to-Home-Screen standalone mode — exactly how Azad uses the app — the API is detectable but silently dead. `getUserMedia`/`MediaRecorder` **does** work standalone (iOS 14.3+). Therefore: all speech input records audio client-side and transcribes server-side. No browser STT anywhere in the kid app.

## Reading voice (TTS)

**Decision: ElevenLabs, pre-generated per page, with character-level timestamps.**

- Stories are static once published → generate audio **once per page at publish time** (a step in the content pipeline and parent-maker flow), not live at read time.
- Use the `convert-with-timestamps` endpoint: returns audio + character/word alignment JSON → drives word-by-word highlighting *precisely* (v1's boundary-event/timer hack dies).
- Two voices: a warm **narrator** (the project docs already chose ElevenLabs "Rachel"/"Aria" territory) and a distinct **buddy voice** (playful, slightly higher). Buddy lines in data (greetings, intros, praise) get pre-generated too; dynamic buddy lines (conversational replies) generate on the fly with Flash v2.5 (low latency, ~half-price).
- Audio + timestamp JSON cached in the service worker / IndexedDB → **offline reading with the good voice**, and drive mode never stalls.
- Cost: ~$0.05–0.10 per 1K characters. The entire family pack (279 pages ≈ ~100K chars) ≈ **$5–10 one-time**. A new chapter ≈ pennies.
- Fallback chain: cached ElevenLabs audio → device speechSynthesis (offline, uncached edge case) → text-only with manual page turns.

## Voice input (STT)

**Decision: MediaRecorder → `/api/listen` → server transcription.**

- Client records (existing `createRecorder()` works standalone), posts audio/mp4.
- Server transcribes via OpenAI Whisper API (~$0.017–0.034/min) or ElevenLabs Scribe — pick in env (`STT_PROVIDER`). A 5-second kid answer costs ~$0.002.
- Kid speech is messy; **never string-match transcripts**. The transcript goes to the judge (below), which is tolerant by design.
- Retells: already recorded — now also transcribed and stored alongside the audio, so parents get text + the buddy can respond to content.

## The conversational layer (fixing "too basic")

v1 interactions = keyword match → canned praise/hint. That's beneath a kid who reads at 5–6 level. The upgrade: **every spoken answer gets a real listener.**

New route `/api/respond` (Claude Haiku, ~1s, fraction of a cent per turn), input: story context (current page + ask/choice intent + universe + choice log), the transcript, and the turn budget. Output: `{ judgment, buddyReply, followUp?, action }`.

1. **Judged asks.** Haiku decides if the answer engages the question (generously — "free" or "wobbly-free" both count for `steady`). The buddy's reply references **what he actually said** ("THREE! You counted the missing planks!"), not a canned line. One optional follow-up turn max ("And what would YOU build?"), then the story moves on. Canned praise/hint remain as instant-fallback when offline or on API error.
2. **Freeform choices.** Every choice point gets a third path: "…or tell me YOUR idea!" His spoken idea goes into the continuation generation (`mode:'continue'` gains `childIdea`). This is co-authorship — the app's single biggest magic trick, and it feeds worldState so his idea persists.
3. **Wonder questions.** New ask type `wonder` — open questions with no right answer ("Where do you think the bees go in winter?"). The buddy responds specifically to his idea, never evaluates. Generation prompt: ≤1 per chapter.
4. **Retell feedback.** After "Tell it back", the transcript goes to `/api/respond` (mode `retell`): the buddy gives ONE specific, delighted response naming a detail he included ("You remembered the ladoos AND Boulder's long neck!"). Transcript saved for parents with the audio.
5. **Ask-the-story.** A small always-there mic on the Reader: he can interrupt with a question ("Why did Miko's tummy feel tight?"). Answered **in the buddy's voice, from story context**, ≤2 exchanges, then a gentle "let's see what happens next!" returns to the page. Bounded on purpose — it's a story app, not a chatbot.
6. **Turn etiquette** (kid-tuned): 8s listen timeout with a re-invite, one retry, then the tap fallback appears; never two buddy questions in a row; total conversational detour per page ≤2 turns.

## What we skipped (deliberately)

- **OpenAI Realtime / speech-to-speech** (~$0.06/min in, $0.24/min out, sub-second): right latency, wrong shape for v1 — our turns are story-anchored and infrequent, the pipeline is ~2s end-to-end (record-stop → Whisper → Haiku → Flash TTS) which is fine for a turn-based book, and we need transcripts (parent visibility, safety, worldState). Reconsider for a P2 "chat with your buddy" free-talk mode.
- **On-device Whisper**: not viable in a PWA at quality; revisit if this ever goes native.

## Cost picture (monthly, heavy use)

Reading (cached audio): ~$0 after generation. 20 asks+retells/day ≈ 600 STT-minutes-equivalent… realistically <$3/mo STT + <$2/mo Haiku + ~$2/mo dynamic TTS. **Under $10/month at full tilt**, dominated by story/chapter generation itself.

## Phase 6 (fast follow) — native shell via Capacitor

**Decision: ship v2 as the PWA; wrap it in a Capacitor shell only if friction shows up** (conversation mic latency, drive-mode audio dying on screen-sleep, or iOS evicting PWA storage). Full SwiftUI native is rejected: one user, second codebase, slower iteration, and the whole design system is CSS/React.

What the shell adds when we build it (days, not weeks; one codebase; TestFlight to family iPads with a $99/yr dev account — no App Store review needed):

1. **Native STT** — SFSpeechRecognizer plugin replaces the record→Whisper roundtrip when running in-shell: instant, free, offline. Web path stays as-is.
2. **Background audio session** — drive mode keeps narrating with the screen off; proper interruption handling (calls, Siri).
3. **Durable storage** — native filesystem for audio cache, retells, and progress; immune to WebKit storage eviction.
4. **Apple Personal Voice** — the wishlist headliner: record ~15 minutes once, and AVSpeechSynthesizer can read stories in **Papa's actual voice**, on-device, free, private (user grants third-party access in Settings). Slots in as a third voice option beside narrator/buddy.
5. Guided Access pairing notes for kid-proofing.

**Seams the v2 build must keep clean so the shell drops in later** (these are build requirements now):
- `lib/read/speech.ts` exposes provider-agnostic interfaces: `TranscriptionProvider` (server-whisper | native), `TtsSource` (cached-elevenlabs | device-synth | native-personal-voice), `AudioSession` (web-audio | native). Feature-detect the Capacitor bridge at runtime; zero UI changes between environments.
- All persistence goes through the storage module (never raw localStorage/IndexedDB calls in components) so the backing store can swap.
- No `navigator.*` speech APIs referenced anywhere outside the speech module.

## Safety rails

All `/api/respond` output passes the same voice rules as generation (kind, short, no scary content, praise echoes the child, never "wrong"); system prompt pins the buddy's persona and forbids off-story topics, personal data collection, and open-ended engagement loops ("do you want to keep talking?" is banned — the story always resumes).
