# PRD — Little Fables v3: Azi takes the wheel

**Owner:** Manav · **Status:** Draft for review · **Date:** July 2026
**Baseline:** v2/v2.2 as shipped (chapter books, buddies, world memory, two-stage QA, conversational layer per `docs/voice-architecture.md`)

---

## Problem Statement

v2 made Azad an empowered *reader*: he navigates, chooses, retells, and the world remembers him. But he is still a consumer of a shelf that Mama and Papa stock. Two gaps:

1. **Agency stops at the page.** He can operate a story but not the app. Every session is still shaped by what adults pre-built; "make me a story about an otter and a rocket" — the most natural request a 4-year-old makes — has no kid-facing path.
2. **The app listens but doesn't push back.** The conversational layer (judged asks, wonder questions) responds to what he says, but never asks him to *explain himself*. The developmental opportunity — articulating a want, giving a reason, revising an idea when questioned — is exactly what conversation with a patient adult does, and the app is positioned to do it inside fiction where it doesn't feel like a quiz.

v3 makes Azad the operator and a co-author: **the whole kid-facing app runs on his voice, he can create stories within the creative world his parents define, and the app teaches him to think out loud by asking him clarifying questions before it acts on his ideas.**

## The reversal, on the record

v1 and v2 both listed **kid-facing story creation as a non-goal** ("stays parent-only"). That call was right when generation was ungated: the risks were quality collapse, off-canon content, and unbounded API spend. All three now have shipped mitigations — the two-stage QA hard gates + 90+ rubric gate (v2.2), the child profile with `excludeTerms` and tone calibration, and the embodiment prompt that pins every generation to the Azi-Verse bible. Creation is no longer "ChatGPT, write my kid a story"; it's a constrained pipeline with a quality floor. The non-goal is retired, replaced by a boundary: **Azad creates inside the themes and world his parents define; parents review after, not before.**

## Research Foundations (July 2026 design-research synthesis)

Four independent research passes (`design/research-synthesis-master.md`) land directly on this PRD's core bets:

- **Contingency is the mechanism.** Parasocial characters measurably boost learning *specifically when they ask → wait → respond to what the child actually said* (Bond & Calvert; Georgetown CDMC). The buddy-drives model and the idea interview aren't UX flourishes — they are the evidence-backed delivery vehicle. Corollary: **verbal, specific acknowledgment enhances intrinsic motivation (d = +0.33)** while expected tangible rewards undermine it — the interview's echo-acknowledgments are the reward; the Storyteller badge stays recognition-only.
- **The same force is the #1 dark pattern.** Radesky 2022: parasocial pressure (characters begging, pleading, guilting) is the most common manipulative design in preschool apps. A buddy that can *drive the app and offer activities* sits one bad copy decision away from this. R19's post-book creation offer and all buddy-initiated suggestions therefore get hard etiquette rules (see R27 additions).
- **Choices must demonstrably matter.** "False branching" — inputs that don't change outputs — ranked among the worst anti-patterns across all four passes. R20's traceability AC (want/reason/obstacle each visible in the output) is elevated from acceptance criterion to the feature's integrity test: if his answers don't visibly shape the story, the interview teaches the opposite lesson.
- **Waiting can be the best moment.** The research's endpaper/loading pattern (never a spinner; a mood-setting craft moment) plus the Kusama/authorship findings answer the generation-wait problem: the ~20s wait should show *his own transcribed words being written into a little book* — authorship made visible, diegetic loading, and modeling of articulated ideas, all in one screen.
- **Sound rules extend to agency.** Intent confirmations use real-material foley with consistent sound-per-intent-family (synesthetic invariants, Pok Pok); no jingles, no "task complete" stingers. The buddy breathes visibly while listening (Handspring: breath creates the empathy that makes a child talk to a puppet).

## Design principles (additions to v2's four)

5. **The buddy is the hands, Azad is the will.** Voice control routes through the buddy character — Azad tells his buddy what he wants, the buddy does it and narrates what it's doing. No disembodied assistant, no command syntax; it's a conversation with a friend who can drive.
6. **Questions before magic.** When Azad asks for something creative, the app never generates from the first utterance. The buddy asks 2–3 genuine clarifying questions first — not to gatekeep, but because articulating *why* is the skill being taught. His answers visibly shape the result, proving that explaining yourself is powerful.
7. **Creation is special, not a slot machine.** Kid-initiated generation is capped per day. Scarcity keeps each creation an event (and bounds cost). The cap is framed in-fiction ("the story kitchen needs to rest"), never as a lockout.
8. **Instant magic, parent visibility after.** His story appears on the shelf the moment it passes QA. Parents see everything — the transcript of his idea conversation, the QA record, the story — in Parent Corner afterward and can archive. Pre-approval queues kill the magic and were rejected.

## Goals

1. **Full voice operation:** every kid-facing flow (open, continue, browse, badges, words, buddy switch, replay, create) is operable by voice through the buddy, with tap always equivalent.
2. **Kid creation:** Azad can request a story with X and Y, be interviewed about his idea, and read the result in the same session — within parent-defined creative guardrails, through the same QA gates as all content.
3. **Reasoning out loud:** the app reliably elicits and responds to *reasons*, not just answers — in creation, in asks, in retells — without ever feeling like a test.
4. **Parent trust preserved:** parents can see what he made and what he said, tune the guardrails, and never find off-canon or unsafe content on the shelf.

## Non-Goals

- **Open-ended chat.** The buddy is not a chatbot. Every conversation is anchored to an app action or a story and returns to it; engagement loops stay banned (voice-architecture safety rails apply verbatim).
- **Kid access to parent surfaces.** Grown-ups gate, profile, guardrails config, QA records — untouched by voice agency.
- **Kid-facing art generation.** His stories launch with the "art still painting" placeholder state; the art pipeline stays parent/batch-side.
- **Correctness pressure.** Clarifying questions never have right answers; the buddy never rejects a reason, only builds on it. If he doesn't want to answer, the story generates anyway from what he gave.
- **Multi-child, social, notifications** — all v2 non-goals stand.

## User Stories

**Azad (4)**
- I want to tell my buddy "make a story about an otter and a rocket" and get MY story, so the app feels like mine.
- I want my buddy to ask me about my idea, so the story has the parts I imagined — and I can prove I thought of it.
- I want to run the whole app by talking, especially in the car, so I never need Mama's hands.
- I want my stories on the shelf with my name, so I can show everyone I'm an author like Papa.

**Parent (Manav / family)**
- I want to define the creative sandbox once (themes, cast, what's out of bounds) and trust everything he makes stays inside it.
- I want to read the transcript of how he explained his idea — that's a window into his mind I can't get any other way.
- I want a cap on generation so a rainy Saturday doesn't produce forty stories.
- I want his "why" answers over time; the retell recordings became treasures, these will too.

## Requirements

### P0 — Voice agency (the buddy drives)

**R16. Intent layer.** A persistent buddy-mic affordance on every kid surface (Home: the buddy itself is tappable to talk; Reader: the existing ask-the-story mic gains app intents). Speech → existing MediaRecorder → `/api/listen` → new `/api/intent` (Haiku): input is transcript + current surface + app state (shelf, progress, badges); output is `{ intent, args, buddyLine, confidence }` from a **closed intent set**: `open_book, continue, show_badges, show_words, show_map, switch_buddy, replay_chapter, make_story, read_this, go_home, none`.
- The buddy confirms by voice *and* the target element visibly highlights before navigation ("The otter book? Here we GO!" + card pulse) — confirmation is the navigation, no extra "yes" step for low-risk intents. The highlight uses the hero-accent/weenie treatment (one glowing attractor), and confirmation sound is foley from that intent's sound family — never a synthetic stinger.
- **Listening state:** while the mic is open, the buddy visibly breathes/leans in (2–3s idle loop held; no frozen listening pose, no pulsing red dot as the primary signal — the character IS the signal).
- AC: every intent in the set works by voice from Home; tap path unchanged and always available; offline → mic hides, tap-only, nothing else degrades.

**R17. Misfire etiquette.** Unrecognized or low-confidence speech → the buddy offers at most two concrete spoken options drawn from current state ("Did you want your dino book, or to see your badges?"), one retry, then falls back to pointing at the screen. Never "I didn't understand" as a dead end; never more than 2 turns before a visual path appears (extends v2's turn etiquette).

**R18. Agency ≠ exposure.** Voice can never reach: Grown-ups gate, profile/guardrails, story deletion, QA records, anything network-config. `/api/intent`'s set is a whitelist; there is no passthrough intent.

### P0 — Kid story maker ("the story kitchen")

**R19. Entry.** "Make a story" is reachable three ways: saying it to the buddy anywhere, a dedicated kitchen door on Home's bookshelf row, and the buddy occasionally offering it after a book completes ("You know how this story machine works? YOU can drive it"). The flow is 100% voice-first with tap fallbacks per R8a.
- **Offer etiquette (anti-parasocial-pressure, per Radesky):** the buddy's creation offer fires at most once per session, only after a completed book, is phrased as capability ("YOU can drive it") never as want ("I really want you to…" is banned), and a decline or silence ends it — no re-offer that session, no sad reaction, ever.
- **First-run teaching is diegetic (World 1-1):** the first kitchen visit teaches by arrangement — the buddy simply starts the conversation — with zero tutorial overlays or instruction text.

**R20. The idea interview (the Socratic core).** The buddy collects the story recipe conversationally, **2–3 clarifying questions maximum**, chosen dynamically (Haiku, same `/api/respond` family) from what's missing or most generative:
- *Want/feeling:* "An otter and a rocket! What does the otter WANT?"
- *Reason:* "Why does she want to go to the moon?" — the why-question is mandatory in every interview; it's the teaching payload.
- *Obstacle/twist:* "Uh oh — what could go wrong on the way?"
- Every answer is acknowledged specifically ("Because the moon is where her grandma lives?! That's a BIG reason") — voice-architecture judge rules apply: generous, never "wrong," silence or "I don't know" is always acceptable and the buddy fills the gap itself.
- **Recipe read-back:** before generating, the buddy repeats the whole recipe aloud as a story-opening ("So: Ollie the otter, flying to the moon to visit her grandma, but the rocket only has ONE seat…") and asks "Did I get it right?" — his confirmation or correction is the final input. This read-back is itself modeling: it shows him what a fully-articulated idea sounds like.
- AC: interview ≤3 questions + read-back; total flow ≤90 seconds of buddy speech; his transcribed answers land verbatim in the generation brief and the story demonstrably uses them (the want, the reason, and the obstacle each traceable in the output).

**R21. Creative guardrails (Parent Corner config).** New `creativeGuardrails` on the child profile: `themes` (the parent-identified list — seeded from profile interests + the content-pipeline emotional-themes list, editable), `allowedCast` (defaults: full Azi-Verse canon + buddies; parents can add "wildcard" slots for novel characters like Ollie the otter), `allowedSettings` (canon + "anywhere imaginary" toggle), `maxCreationsPerDay` (default 2), `formats` (default quick-story only; chapter books toggleable), plus the existing `excludeTerms`/toneCalibration which apply automatically.
- Out-of-bounds requests are **redirected in-fiction, never refused flatly**: "Zombies aren't in our world… but Peter is the sneakiest trickster there IS. Should Peter be the spooky one?" The redirect suggestion comes from the nearest in-bounds equivalent.
- AC: a request outside `themes`/cast produces a redirect that keeps the kid's core idea; nothing outside guardrails ever reaches generation.

**R22. Same engine, same gates.** Kid briefs assemble into the identical embodiment prompt (brief = prompt step 7 seed + interview answers) and run the full two-stage QA + 90+ gate. Generation failure or double gate-fail → the buddy softens it ("This story needs more baking — let's check the oven after we read one!") and the request is queued for one background retry; never a raw error, never a dead screen.
- **The wait is a scene, not a spinner (R22a).** During generation (~20s), the screen becomes a diegetic writing moment: a little book open on the buddy's table, **Azad's own transcribed recipe words appearing onto its pages in the watercolor hand** (want → reason → obstacle, in his phrasing), while the buddy narrates softly. This is simultaneously the loading state, an endpaper-style mood beat, and the authorship lesson made visible. Reduced-motion: words fade in without the writing animation.
- AC: a kid-created story is indistinguishable from pipeline content in QA record completeness; failed generation leaves no broken shelf item.

**R23. Instant shelf + authorship.** The passing story appears on the shelf immediately with `by: Azad` and a distinct author mark (his name in the watercolor style). First creation mints the **Storyteller** badge; subsequent milestones (3, 10 stories) extend the line. His interview answers (want/reason/obstacle) are stored on the book and echoed into worldState — his authored ideas persist in the universe like his choices do.
- **Authorship as world-mark (Kusama/persistence research):** his books get a visibly distinct spine treatment on the shelf, and characters he invented through wildcard slots (an Ollie the otter) join the world permanently — appearing in the cast the buddy can reference and, guardrails permitting, in future generated stories. What he makes accumulates in the world like paint on the Obliteration Room wall.
- AC: create → on shelf → readable in one session with no adult present; the creation counts as activity toward that day's reading sun.

**R24. Review-after.** Parent Corner gains a **Made by Azad** section: each kid story shows the full interview transcript (+ audio), the recipe, the QA record, and archive/keep controls. Weekly digest (P2 in v2) would include creations. Archive removes from shelf without deleting (nothing he made is ever destroyed).

### P1 — Socratic layer beyond creation

**R25. Reasoning probes in asks.** The judged-ask follow-up turn (voice-architecture §1, currently "And what would YOU build?") gains a **why-variant**: after a real answer, the buddy sometimes asks for the reason ("You'd pick the web bridge? What makes it better?"). Budget: ≤1 reasoning probe per chapter, fits inside the existing ≤2-turn detour cap, judge stays generous, and any answer — or none — advances the story.

**R26. Retell follow-up.** After Tell-it-back and the buddy's specific delighted response, one motivation question ("WHY do you think Miko went back for Boulder?"). Answer transcribed + stored with the retell for parents. One turn, never repeated if he passes.

**R27. Probe quality rules (system-wide).** All clarifying/reasoning questions must be: about *his* idea or the story's events (never abstract), answerable by a 4-year-old in one breath, and followed by a response that uses his actual words. Banned: "are you sure?", stacked questions, re-asking after silence, any probe during drive mode's auto-continue flow (drive mode keeps v2 behavior; probes are for engaged sessions).
- **Buddy-initiative etiquette (research addition):** across ALL surfaces, buddy-initiated suggestions (create, read, replay) are capped at one per session, always capability-framed, and never express disappointment, longing, or urgency at a decline. The buddy may be sad *inside stories*; it is never sad *about Azad's choices in the app*. This is the bright line between a contingent companion (learning multiplier) and parasocial pressure (the most common preschool dark pattern).
- **Interview pacing:** buddy speech at children's-narration cadence (~120–140 wpm) with real silences for thinking; the buddy holds its listening pose through pauses rather than re-prompting (kids' answer latency is long; silence is not a misfire).

### P2 — Future

- Chapter-book creation by kid (guardrail toggle exists from day one, default off).
- "Tell your own story" mode — he narrates freely, the app transcribes and formats it as a shelf book (no generation at all; pure capture). Possibly the best version of this whole idea; scope when R19–R23 prove out.
- Sibling-safe defaults for guardrails when the little bhen gets a profile.

## Success Metrics

**Leading (2 weeks):** ≥50% of sessions include ≥1 successful voice intent; ≥3 kid-created stories in week one and creations hitting the daily cap ≤ half of active days (cap is a ceiling, not a target); interview completion (all probes answered) ≥60%; zero guardrail escapes (parent-audited).
**Lagging (6 weeks):** Azad re-reads his own stories at a rate ≥ pipeline stories; parent-observed: he gives unprompted *reasons* in everyday conversation ("because…" constructions — the real KPI, same spirit as v2's); at least one interview transcript a parent chooses to keep forever.

## Open Questions

1. **(Manav)** `maxCreationsPerDay` — draft says 2. Right for weekends? Should the cap be per-day or a weekly pool (e.g., 8/week) so a creative Saturday isn't throttled?
2. **(Manav)** Should kid creations count toward the seed-library dedupe/variety check, or is repetition fine when he's the author? (Draft: no dedupe — if he wants five otter-rocket stories, that's his prerogative.)
3. **(Design)** ~~The story kitchen metaphor~~ **Research-informed recommendation: the buddy "writes it down" wins.** R22a's writing-moment resolves the wait diegetically, models articulated ideas, and fits the app's book-world (kitchen/oven imports a foreign metaphor; a book being written IS the product). "Story kitchen" survives as the flow's internal codename only. Final call is Manav's; the design exploration should mock the writing moment in each visual direction.
4. **(Eng)** `/api/intent` vs. extending `/api/respond` with a mode — one route with modes probably wins; confirm against the existing conversational-layer implementation.
5. **(Manav)** Should the mandatory why-question in the interview ever be skipped for a kid clearly in "just make it!" mode, or is gentle persistence the point? (Draft: ask once, accept silence, generate anyway.)
6. **(Voice)** Interview answers arrive as messy 4-year-old speech. Does the recipe read-back suffice as the correction mechanism, or do parents need a pre-publish edit window? (Draft: read-back suffices; review-after catches the rest.)

## Design-language note (bridging to the visual rethink)

v3's new surfaces (the writing moment, the buddy's listening state, intent highlights, the author-marked shelf) land while the visual system is being re-explored (`design/research-synthesis-master.md` §6: Lantern Library / Little Country / Paper Theater, plus the composite hypothesis). The v3 design round must therefore mock the interview + writing moment inside whichever direction(s) survive — the writing moment is arguably the composite's best showcase (paper craft + light + authorship trace in one screen). Until the new system lands, v3 features build against the interaction specs here and inherit visuals from the current build; no v3 feature should bake in current-system styling assumptions.

## Phasing

- **Phase A:** R19–R24 — the story kitchen end to end (interview, guardrails, gates, shelf, review-after, the writing moment). Highest new value, builds directly on shipped generation + conversational infra.
- **Phase B:** R16–R18 — full voice agency. Depends on nothing in A but touches every surface; sequenced second so intent patterns can borrow from kitchen-flow learnings.
- **Phase C:** R25–R27 — Socratic probes in asks/retells. Small deltas to existing `/api/respond` behavior; ship when A's probe tone is validated in the wild.
