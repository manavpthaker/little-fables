# Little Fables — Full System Audit & Path Forward

**Date:** July 2026 · **Baseline:** prod as of PR #25 · **Sources:** `PRD-story-world-v2.md`, `PRD-azi-agency-v3.md`, `research-synthesis-master.md`, live-system verification (code greps + Playwright walks)

---

## Part 1 — Where we actually are

### Working and verified (recent sprint)
- Uniform content: all 9 family books re-paginated to ~55–65 w/page with washes + star pages; generated stories 4–6 full pages.
- Self-healing narration everywhere (cache → static → live TTS with staleness detection); tap-a-word speaks that word.
- Story-anchored art: whole-book `artBrief`, exact-moment prompts, pro model, redo-all pipeline with fresh URLs.
- Design layer: cloth-bound shelf covers, book-opening transition, one-bar reader chrome, full-bleed art spreads, breathing buddy, portrait stacking.
- Production safety: error boundaries, daily cost breakers (needs SQL migration applied), origin checks, `audio:check`/`audio:generate`.

### PRD v2 scorecard (the app's foundation)

| Req | Status | Gap |
|---|---|---|
| R1–R3 chapter model, nav, resume | ✅ | — |
| R4 retell at completion | ✅ | — |
| R5 chapter-by-chapter generation | ✅ | — |
| R6–R7 world memory + surfaced callbacks | ✅ partial | callbacks exist; "Ch.3 references Ch.1 choice" untested |
| R8 buddy carousel + growth | ✅ | — |
| **R8a spoken navigation everywhere** | ⚠️ partial | tap-and-hold voicing not universal; never tested "non-reader operates every flow" |
| R9 Home zones | ✅ | daily quest is a static line — no completion detection or celebration |
| R10 reading days | ✅ | — |
| R11 badges + earn moment | ✅ | — |
| R12 My Words | ✅ | tap-to-hear works; **no visible path from reader → Words; no remove; the star loop is invisible** (user-reported) |
| **R13 drive mode** | ❌ **NOT BUILT** | v2 called this P1 but "car-proof" was a stated *goal* — the app's primary context per the PRD ("daytime and car-ride app") |
| **R14 offline pre-generation** | ❌ NOT BUILT | no service worker; a dead zone kills a car session |
| **R15 recap on resume** | ❌ NOT BUILT | resuming after >24h drops him mid-page with no "Last time…" |

### PRD v3 scorecard (agency)

| Req | Status | Gap |
|---|---|---|
| R19 kitchen entry | ✅ | — |
| **R20 idea interview (the Socratic core)** | ❌ **REGRESSED** | replaced by the prompt-based flow (July fix for the crash). The **mandatory why-question — "the teaching payload" — is gone.** The story generates from the raw idea with zero articulation practice. |
| R21 creative guardrails | ✅ partial | cap works; in-fiction redirect was removed with the interview |
| R22 same engine/gates + writing moment | ✅ | — |
| R23 instant shelf + authorship | ✅ partial | `by: Azad` works; distinct spine treatment + wildcards-join-the-world unverified |
| R24 Made by Azad review section | ⚠️ verify | interview transcript no longer exists to show |
| R16–R18 full voice agency | ⚠️ partial | reader mic + intents exist; buddy-driven app-wide voice ops not systematic |
| R25–R27 socratic probes | ⚠️ partial | judged asks exist; why-variants + retell follow-up unverified |

### Research-synthesis scorecard (the experience bar)

| Finding | Status |
|---|---|
| Calm ground + pigment accents + hero-accent rule | ✅ largely (v4 design system) |
| Endpapers as loading, never spinners | ✅ (endpaper + painting moment) |
| Contingent buddy (ask → wait → respond) | ✅ in asks; ❌ in creation (interview removed) |
| Diegetic onboarding, zero overlays | ✅ |
| No dark patterns / no tangible rewards | ✅ (badges recognition-only, no strelicks/loss states) |
| **Foley-only soundboard, synesthetic invariants** | ❌ NOT BUILT — the app has zero sound design outside TTS. This is Pok Pok's #1 differentiator. |
| Colored shadows + color scripts in art style card | ❌ not in the scene prompt |
| Kusama permanence (world visibly accumulates) | ⚠️ weak — words/badges are lists, not a world that fills |
| Twilight/quiet mode (lantern-on-indigo) | ❌ not built |
| Living-world deltas between visits | ❌ not built |
| 120–140 wpm buddy cadence, real silences | ⚠️ unverified |

### User-reported issues (this audit's trigger)
1. **Landscape responsiveness** — improved but not systematic; no iPad-size QA, no breakpoint matrix.
2. **Art not visible when the page loads** — generate-while-reading waits 10–20s per *first* view (worse now with pro model). Read-ahead exists for only +1 page.
3. **Star-word loop is invisible** — a star chip appears; nothing says words are being collected, nothing links to My Words, no way to remove one. (Mechanic today: pages with a `star` auto-collect the word into My Words on view.)
4. **Tap word to hear it** — ✅ shipped (PR #23); if it still restarts on your device, the installed PWA is serving a stale bundle — pull-to-refresh or reinstall.

---

## Part 2 — What "Khan / Duolingo / Pok Pok parity" means for us

- **Khan Academy Kids' bar** = cognitive-load design: everything spoken, character-guided, immediate low-stakes feedback, and a **mastery view for parents.** Our gap: spoken navigation isn't universal (R8a), and parents can't see what Azi is *learning* — only what he read.
- **Duolingo's bar (the good half)** = layered goals, a daily quest with a real completion moment, forgiveness, and **spaced repetition** — the single most evidence-backed learning mechanic we don't have. Our star words are collected once and never resurface. (We continue refusing the bad half: streak loss, currencies, nagging.)
- **Pok Pok's bar** = calm + **foley sound design** + zero text + child-paced. Our gap is sound: the app is silent except for narration. Real-material foley on page turns, taps, celebrations, and the painting moment is the largest remaining "feel" gap.
- **Optimized for Azi specifically** = the Socratic why-question (his articulation practice — currently regressed), his wildcards visibly joining the world, retells resurfacing, and the band system adapting as his reading grows.

---

## Part 3 — The path forward

### Phase 1 — "The book is always ready" (reading-experience completeness) ~1 sprint
1. **Art read-ahead**: opening a book kicks background generation for the current chapter's pages (serial, budget-capped); prefetch horizon widens to +2; by the time he turns a page, its art is there. Cover art loads with the book.
2. **Star-word loop made visible**: star chip tap → speaks word + meaning + a small "flies into your Word Book" beat; a Word-Book doorway in the reader end-screen and Home; remove-a-word in My Words (parent-gesture or long-press).
3. **Recap on resume (R15)**: >24h gap → buddy speaks a 2-line "Last time…" from chapter summaries before the page.
4. **Responsive matrix**: systematic Playwright QA at iPhone landscape/portrait, iPad landscape/portrait, desktop — fix every break; keep landscape the hero layout.

### Phase 2 — The learning engine (Khan/Duolingo parity, zero dark patterns) ~1–2 sprints
5. **Word review inside fiction (spaced repetition)**: the buddy occasionally opens a session with a one-word game ("Remember *wobbly*? Show me wobbly arms!"); My Words tracks seen→known; review words preferentially seeded into new generated stories (the engine already takes vocab).
6. **Daily quest with a real loop**: completion detection + buddy celebration (verbal, specific — research-safe).
7. **Restore the Socratic layer**: after the prompt-based idea lands, ONE optional why-question ("Why does the bear want the moon?") — accepted silence generates anyway. Recovers R20's teaching payload without the fragile 5-phase machine. Reasoning probes in asks (R25) and retell follow-up (R26) verified/completed.
8. **Parent mastery view**: Words known, retells, choices, creations — one legible weekly picture.

### Phase 3 — Car-proof (v2's unbuilt goal) ~1 sprint
9. **Drive mode (R13)**: continuous autoplay exists; add voice-only asks w/ auto-continue, spoken choices, huge pause, screen-off audio survival.
10. **Offline (R14)**: service worker caching shell + current book's pages/audio/art; pre-cache next chapter on wifi.

### Phase 4 — World & wonder (Pok Pok parity) ~1–2 sprints
11. **Foley soundboard**: page turns, taps, star collection, celebration — real-material recordings, one sound family per intent, no jingles.
12. **Twilight mode**: lantern-gold-on-indigo evening theme (auto by clock, parent-toggleable).
13. **Kusama permanence**: the Language Wall becomes a visible wall that fills; his wildcard characters appear on Home; living-world deltas ("the web bridge is still standing" made visual).
14. **Art style card upgrades**: colored-shadow rule + per-book color scripts into the scene prompt.

### Ordering logic
Phase 1 removes friction from what he does every day. Phase 2 adds the learning loop that makes it Khan-class. Phase 3 honors the PRD's actual usage context (car). Phase 4 is the soul. Each phase ships independently.

---

## Part 4 — Standing action items (user)
- Run **Redo ALL art** in the Art tab (new pipeline), approve covers.
- Run `npm run audio:generate` (~$26) to restore instant narration.
- Apply `supabase/migrations/0003_usage_counters.sql` to arm cost breakers.
- If word-tap still seeks on your device: refresh/reinstall the PWA (stale bundle).
