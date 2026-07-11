# Azi-Verse architecture → Little Fables adoption map

The reverse-engineered docs (`docs/reference/azi-verse/azi-verse-app-architecture.md`, `azi-verse-full-picture.md`, `open-source-generalization-roadmap.md`) describe the product we're building — "Epic!'s library + Khan's skill graph + an on-brand generation engine." Much is already live in v2. This maps what to adopt, in priority order.

## Already aligned (no action)

Local-first/IndexedDB privacy architecture · universe-as-runtime-config · rubric with a 90+ gate · parent guides attached to stories · chapter/quick format split · buddy-narrated delivery · retell capture. The docs validate these; keep going.

## Adopt now (engine round — v2.2)

1. **Two-stage QA replaces the single rubric score.** Stage 1 hard gates, pass/fail, any fail → regenerate with violation notes: character consistency vs. bible, cultural sensitivity, age-developmental match, cultural element accuracy. Run **deterministic checks first** (word counts per band, heritage-word density, `excludeTerms` list) before spending an LLM-judge call. Stage 2: weighted soft scoring using the doc's `scoringWeights` (structure .20, skills .20, cultural .15, language .15, age .20, universe .10), <90 → revision loop. Store the full `qaRecord` (gates, score breakdown, revision count) on every book — surfaced in Parent Corner.
2. **Embodiment prompt assembly, in the doc's exact order:** narrator identity → child context → universe payload → cultural config → band spec → skill target → optional seed. "Rule-following produces compliance; embodiment produces stories that feel alive." Add `narratorIdentity` + `hardRules` + `scoringWeights` to the universe config.
3. **Character schema upgrade** (universe + art bible get this together): `traits`, `speechPatterns`, `relationships`, `canonRules` ("never cruel; confidence exceeds competence, kindly"), `visualAnchors`, and **`roleByBand`** (Jujy at 0–3: cuddly presence → 4–8: speaking friend → 7–10: flawed leader learning to listen). roleByBand is the growth mechanism for the whole universe.
4. **Child profile object** (Parent Corner editable): `currentBand`, `languages {home, heritage, exposureGoals}`, `interests`, `currentChallenges`, `comfortObjects`, `contentPreferences {excludeTerms, toneCalibration, framingDevices}`. **This resolves the "Spanish removal" mystery: it's a per-profile `excludeTerms`/preference toggle, not a universe rule.** Profile feeds prompt-assembly step 2.
5. **Skill tagging on every story** (SS-taxonomy ids from `future-ready-skills.md`), stored in book metadata at generation/conversion time.

## Adopt next (experience round)

6. **Mystery Word + Language Wall.** One heritage word hidden per story; finding it (tapping the star word) adds it to a family **Language Wall** — this upgrades My Words from a list into a game with a family artifact. Fits the existing `star` field almost verbatim.
7. **Comfort-ritual closing screen.** Every story ends in-app the way Azi-Verse stories end on the page: a quiet closing beat (snack/song/moon motif from the universe rituals) before the celebration screen. Cheap, deeply on-brand.
8. **Feeling Passengers.** The research framework's emotion check-in: child assigns feelings to train cars and chooses where each "gets off." Ship as a quiet-time activity attached to The Midnight Train first (perfect pairing), generalize later.
9. **Prediction pauses as a first-class ask kind** (`kind: 'predict'`) with optional voice-memo capture, local-only, auto-deleted weekly (the doc's COPPA-grade privacy protocol — adopt the weekly auto-delete for these memos, distinct from retells which parents keep).
10. **Interaction event log** (local): pause engagement, mystery words found, re-reads, ask participation. No new UI for Azad — it feeds #11.
11. **Parent dashboard upgrades:** skill coverage over time ("this month: emotional regulation ×4, systems thinking ×1"), engagement signals, and **behavioral integration prompts** ("The Gentle Giant's Secret came up 3× this month — try referencing it during transitions"). That last one is the bridge from app to parenting — the doc's best single idea.

## Adopt later

12. **Format ladder / reader graduation.** Band specs (0–3 board / 4–8 picture / 7–10 early chapter, word counts 0–100 / ~500 / 4,000–10,000, structure ladder), `classifyStory`, `suggestNextBand`. Azad is mid-4–8; build the tagging now (cheap), the graduation logic when it matters. Cross-age continuity techniques (cameos, callbacks, role evolution) go into the generation prompt today though — they cost nothing.
13. **Seed bank.** Tag the quotes collection into searchable theme seeds for prompt-assembly step 7.
14. **Open-source track** (`open-source-generalization-roadmap.md`): Tier 1 extractions (rubric → Universe Quality Standard, format ladder, skill-graph starter) feed the public storyverse repo when ready; the stories themselves never ship. Not part of the app roadmap.

## The one line worth pinning

> "The library is the product; generation is just the supply chain." — versus 'ChatGPT, write my kid a story,' the moat is the leveling taxonomy + enforced universe bible + multi-objective QA gate.
