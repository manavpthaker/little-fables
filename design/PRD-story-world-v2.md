# PRD — Little Fables v2 (the kid app is just "Little Fables")

**Owner:** Manav · **Status:** Draft for review · **Date:** July 2026
**Pipeline:** this PRD → revised Claude Design prompt → rebuilt Claude Code prompt

---

## Problem Statement

The current build is a shelf of one-shot 5-page stories. There is no way to progress through anything longer, nothing changes between sessions, and the homepage is a static menu — so the app has no reason to be opened twice. Azad (4, reading at a 5–6 level) engages deeply *within* a story (asks, choices, retells work) but the app has no arc *across* stories, which is where Epic, Khan, and school actually hold him.

**Context correction from v1:** this is a **daytime and car-ride app, not a bedtime app**. No screens late. Design for weekend mornings, quiet time, and drives — which makes offline-first and audio-forward behavior primary, and demotes bedtime mode to a nice-to-have dim theme.

## Research Foundations — what the best apps do (and what to refuse)

**Epic!** Its stickiest mechanic for this age isn't the library — it's the **Reading Buddy**: the child picks an egg, reading minutes hatch it into a creature that lives on their profile and reacts to progress. Reviewers consistently call the hatch "a moment of genuine delight and an emotional hook." Badges are displayed prominently on the child's homepage (book-count badges, "Daily Double" for reading two days in a row) and act as recognition, not currency. → *Adopt: a living companion on Home; badges as visible recognition.*

**Khan Academy Kids.** Its genius is cognitive-load design: a friendly character (Kodi Bear) guides the child through everything, every instruction is **spoken aloud and paired with a visual cue** so reading is never required to navigate, and feedback is immediate and low-stakes. It balances structured activities with open-ended creative expression. → *Adopt: character-guided navigation, spoken-everything as a hard rule, retells as our open-ended expression channel.*

**Duolingo.** The playbook: layered mechanics for different journey stages, daily quests as short-term goals, celebration moments, and forgiveness (Streak Freeze cut churn 21% *because it relieved anxiety*). But the same research documents the failure mode — loss-aversion streaks that become the goal while learning becomes the obstacle, leaderboards, nagging notifications, and extrinsic rewards crowding out intrinsic motivation. For a 4-year-old who already loves stories, that trade is toxic. → *Adopt: layering, daily quest, celebration, forgiveness-by-default. Refuse: loss states, leaderboards, push-nagging, reward currencies.*

**Design principles this locks in:**
1. **The companion is the interface.** Miko (or a chosen buddy) lives on Home: greets Azad by voice, delivers the world-memory callback, points at today's chapter, celebrates wins. Home stops being a menu and becomes a character.
2. **Nothing requires reading to navigate.** Every interactive element speaks when tapped-and-held or focused; every instruction is voiced with a visual cue.
3. **Celebration over pressure.** Suns light, never extinguish; badges recognize what happened, never gate content; zero notifications in v2.
4. **Rewards stay inside the fiction.** Progress hatches/grows the buddy and unlocks story-world things (badges drawn in the watercolor style) — no coins, gems, or abstract points.

## Goals

1. **Progression:** Azad can start, resume, and finish multi-chapter books entirely on his own (no reading required to navigate).
2. **A world that remembers:** his choices visibly persist across chapters and sessions — the app proves it remembers him within the first 10 seconds of opening.
3. **Ownership:** he can see and show off what's his — badges, star words, finished books, recordings.
4. **Habit without guilt:** a reading-days ritual a 4-year-old understands and a parent respects (no loss streaks, no dark patterns).
5. **Car-proof:** a full chapter is playable start-to-finish with zero network and minimal touching.

## Non-Goals

- **Kid-facing story creation** — stays parent-only (settled in v1).
- **Bedtime serialization / night ritual** — no screens at night. Bedtime dim mode stays as a P2 theme toggle only.
- **Social anything** — no sharing outside the family, no leaderboards.
- **Loss-aversion mechanics and notifications** — no breakable streaks, no reward currencies, no push reminders. The research on Duolingo's failure modes for kids is unambiguous; celebration only.
- **Reading-level assessment / phonics curriculum** — teaching stays embedded in stories (Storyverse layers), not drills. Khan Academy Kids already does drills.
- **Multi-child profiles** — one child (Azad) for v2; schema shouldn't preclude it later.

## User Stories

**Azad (4, pre-reader navigating by art + audio + voice)**
- I want to open the app and tap the big picture of *my* story to keep going where I left off, so I never have to find anything.
- I want to move to the next chapter myself when one ends, so finishing feels like MY doing.
- I want the story to remember what I chose yesterday, so it feels like a real world.
- I want to earn something I can see (badges, stars, words) and show Mama and Papa.
- I want to listen and answer out loud in the car without touching the screen much.

**Parent (Manav / family)**
- I want to make a chapter book once and have it fill a week of sessions, so effort amortizes.
- I want to see which chapters he finished, what he chose, and hear his retells, so I can talk with him about it.
- I want the streak to encourage without punishing — skipping a beach day must cost nothing.

## Requirements

### P0 — Chapter books & progression (the core fix)

**R1. Chapter book model.** A Book contains 3–5 Chapters; a Chapter is the existing story unit (4–7 pages, 1–3 asks, ≤1 choice). Short stories remain as 1-chapter books internally (one model, two shelf labels: "Chapter book" / "Quick story").
- AC: `Book { id, title, coverImage, by, kind: 'chapter'|'quick', chapters: Chapter[], worldState, progress }` replaces flat Story; migration maps v1 stories to 1-chapter books.

**R2. Chapter navigation.** Chapter end screen = mini-celebration + hook line ("Next time: the cave door creaks open…") + two giant actions: **Next chapter** (coral, primary) and **All done for now** (returns Home, progress saved). A chapter map (train-stops strip: done ✓ / current ▶ / locked 🔒 with art thumbnails) lives at book open and is tappable for finished chapters (re-read anytime; no skipping ahead past the current chapter).
- AC: Azad can go from Ch.1 end → Ch.2 start with one tap and no reading. Re-opening a book mid-flight lands on the chapter map with current chapter pre-highlighted.

**R3. Resume everywhere.** Progress (book, chapter, page) autosaves every page turn. Home's hero card is **Continue** whenever any book is mid-flight.
- AC: kill the app mid-page → reopen → one tap resumes the same page.

**R4. Retell at book completion** (not per chapter). Chapter ends get one quick spoken recap question instead ("What did Miko find?"). Book completion keeps the full Tell-it-back recording flow.

**R5. Generation upgrade.** Parent maker gets "Quick story" vs "Chapter book (3–5 chapters)". Chapter books generate chapter-by-chapter (Ch. N+1 generated from book premise + prior chapters + choice log — this is where choices persist mechanically). Each chapter ends with a hook; final chapter resolves warmly.
- AC: API supports `mode: 'chapter'` with `bookContext`; a chapter generates in <20s; failure leaves the book resumable at the last good chapter.

### P0 — World memory

**R6. Choice log.** Every choice is recorded (`{bookId, chapter, choice, label}`) into the book's `worldState` and echoed into the universe's rolling memory (last ~20 choices with summaries).
- AC: generation prompts include worldState; a Ch.3 scene references the Ch.1 choice when relevant ("They crossed on the web bridge Azad chose").

**R7. Memory surfaced, not just stored.** Home greets with one line of remembered fact ("The web bridge you built is still standing!") pulled from the latest choice log. Chapter recaps open with "Last time, YOU chose…".
- AC: opening the app after a session always shows one concrete callback within the top card.

### P0 — The Buddy (companion guide)

**R8. Buddy carousel.** On first launch (and anytime from Home), Azad swipes a carousel of personified buddies spanning his world: **animals** (otter, red panda…), **dinosaurs** (a small ankylosaurus…), and **nonliving things brought to life** (a moto, a rock, a rocket, a soccer ball). Each buddy card speaks its own intro when centered — and the nonliving ones own it as their bit: "I'm Rocky. I'm a rock. I don't eat or grow — but I'm a GREAT listener." The living/nonliving distinction is baked into the roster itself: living buddies mention eating/growing/breathing, nonliving ones joke about not needing to, and the app occasionally asks "is your buddy living or nonliving?" as a natural teaching moment. The chosen buddy lives on Home and is the app's voice: greets him by name aloud, speaks the world-memory callback (R7), points at the Continue card, celebrates badges and reading-day suns.
- Roster: launch with 6 buddies available; more join the carousel at reading-day milestones (arrive as eggs/crates that hatch/open over the next ~2 chapters — Epic's delight moment, kept). Switching buddies is free and instant; each remembers its growth stage (new scarf, goggles, sidecar… story-world things, never currency).
- AC: first launch → carousel → pick → buddy greets by name on every Home visit with exactly one spoken line (greeting, callback, or nudge — never more); every buddy card self-describes aloud including a living/nonliving beat; buddy states persist locally like everything else.

**R8a. Spoken navigation everywhere (Khan rule).** Every kid-surface interactive element voices itself on tap-and-hold; all instructions are spoken + visually cued. Navigation must never require reading.
- AC: a tester who can't read can operate every kid flow start to finish.

### P0 — Homepage redesign

**R9. Home = buddy + three zones, top to bottom:**
1. **Buddy header** — buddy (with growth stage), spoken greeting/callback line rendered as a speech bubble, reading-days suns for this week inline.
2. **Continue** — dominant card: book art, chapter map mini-strip, progress ring, coral ▶. If nothing is mid-flight: **Today's adventure** (deterministic daily pick + one-line daily quest, e.g. "Read one chapter and find a new star word" — quest completion = buddy celebration, nothing else).
3. **My World strip** — badge shelf (latest 3 + count) and star-word count; each taps into its full view (R11/R12).
4. **Bookshelf** — two labeled rows: Chapter books (progress rings on covers) and Quick stories. "New stories appear here when Mom and Dad finish making them ✦" keeps its slot.
- AC: with a book mid-flight, the visually dominant element is Continue; total Home decision points for the child ≤ 5; the daily quest never blocks anything.

### P0 — Habit & ownership

**R10. Reading days (streak, guilt-free).** A day with ≥1 finished chapter or quick story lights that day's sun on a weekly calendar (in the buddy header). Suns never turn off; gaps are just unlit — no broken-streak state, no reminders, ever (this is the anti-Duolingo line). Milestones (5, 10, 25 reading days) mint badges and buddy growth stages.

**R11. Badges.** Earned for: finishing a book, finishing all books with a character (Miko Master), reading-day milestones, retell milestones, first choice, 10 star words. Badge = named watercolor-style medallion + one earned-line ("You finished all 3 Miko books!"). Earning moment = full-screen celebration, confetti + the buddy says it aloud. Badge shelf view shows earned (bright) + next-up (silhouette + how to earn, spoken on tap). Badges never gate content.
- AC: every badge is explainable aloud in one sentence; earning is detected the moment its condition is met.

**R12. My Words.** Every vocab star collected lands in a word book: word + meaning + which story it came from; tap = hear it (immediate, low-stakes feedback — Khan style). Stars in the header count words collected (replaces retell-count stars; retells get their own badge line).

### P1 — Car mode & polish

**R13. Drive mode.** Toggle on the Reader: continuous autoplay (page → auto-advance after narration), asks become voice-only with generous timeouts and auto-continue on silence, choices read both options aloud and accept voice with tap fallback, huge pause button. Survives screen-off audio if the PWA allows; degrades gracefully.
**R14. Full offline pipeline.** Finishing Ch. N pre-generates and caches Ch. N+1 in the background when online, so car sessions never stall. Home shows a tiny cloud-check on chapters that are ready offline (parent-legible, invisible-ish to Azad).
**R15. Recap on resume.** Resuming a book after >24h plays a 2-line "Last time…" recap (from chapter summaries), spoken by the buddy, before the page.

### P2 — Future considerations

- Bedtime dim theme (exists; keep behind the moon toggle, off the main flow).
- Per-chapter AI art generation using the family reference illustrations.
- Sibling profile (the little bhen will need her own shelf eventually).
- Parent weekly digest (chapters read, choices made, new words, retell links).

## Success Metrics

**Leading (2 weeks):** ≥4 reading days/week; ≥70% of chapter-end screens convert to "Next chapter"; Continue card is first tap in ≥60% of sessions with a book mid-flight; ≥3 star words collected/week.
**Lagging (6 weeks):** ≥2 chapter books finished; ≥8 retells recorded; Azad references a story choice or star word unprompted in conversation (the real KPI — parent-observed); car sessions complete without a network error.

## Open Questions

1. **(Manav)** Chapter length for drives: is ~5 min/chapter right for your typical car ride, or should drive mode chain 2–3 chapters?
2. **(Manav)** Should finished quick stories count toward reading days, or only chapters? (Draft assumes: anything finished counts.)
3. **(Design)** Chapter map metaphor: train stops / storybook path / bookshelf spines — pick one that survives a 4-year-old's comprehension test.
4. **(Eng)** Background pre-generation cost control: cap auto-generated chapters at N=1 ahead? (Draft assumes yes.)
5. ~~Buddy identity~~ **Resolved:** buddy carousel of personified animals, dinosaurs, and nonliving things (living/nonliving teaching baked into the roster); story companions (Miko/Tara/Boulder) stay in stories.
6. **(Manav)** Launch roster — starting 6, per Manav: **Bear** (living, cozy and brave — echoes the teddy bears in Azi's Little Bhen), **Otter** (living, water-lover), **Little Ankylosaurus** (living, dino), **Moto** (nonliving, vroom jokes), **Rocky the rock** (nonliving, deadpan), **Rusty the toy rocket** (nonliving, dreams of space). Three living / three nonliving keeps the classification game balanced. Milestone arrivals can pull from: red panda, soccer ball, hockey puck, friendly spider.

## Content: pre-populated library

Azad consumes stories fast; launch with a deep shelf. `docs/content-pipeline.md` defines the seed library (~6 chapter books + 24 quick stories, plus Manav's existing written stories ingested with their parent guides), the batch-generation pipeline with the Azi-Verse evaluation rubric as an automated 90+ ship gate, and the canon reconciliation: **the real Azi-Verse (`docs/reference/azi-verse/universe-guide.md`) is the universe** — Westfield/Rahway, the plush companions, the Colombian-Indian tri-cultural family — while Miko/Zoomtown remains one storybook series with finished art. Buddy-roster note: rename Bear to **Bramble** (existing canon bear whose story line — "Brave was saying hello anyway" — is already his character).

## Source Materials

The build does not start from a blank prompt. `docs/reference/` (indexed in `docs/reference/RESOURCES.md`) curates the Storyverse framework and the original LittleFables system into the repo: the master generation prompt, skill-embedding and therapeutic-technique guides, story structure by age band, cultural-integration rules, age-calibrated vocabulary/style exemplars, a quality-evaluation rubric (to run as an automated post-generation gate), parent-maker elicitation prompts, and the style-analysis framework for future art generation. The engineering round must assemble the story-engine system prompt and quality gate from these sources, and the parent maker's guided mode from the elicitation prompt sets.

## Phasing

- **Phase 1 (this cycle):** R1–R12 — chapter model + navigation, world memory, the buddy (egg → hatch → growth), spoken navigation, new Home, reading days, badges, My Words. Design round covers: buddy carousel (with spoken self-intros + living/nonliving beat), new-buddy hatch/unbox moment, Home v2 with buddy header, chapter map, chapter-end, badge shelf + earning moment, My Words, recap moment.
- **Phase 2:** R13–R15 — drive mode, offline pre-generation, resume recaps.
- **Phase 3:** P2 items as they earn their place.
