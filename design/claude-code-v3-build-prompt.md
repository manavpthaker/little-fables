# Claude Code prompt — Little Fables v3: The Drawn Room build

Run from the repo root. This is the definitive rebuild of the kid-facing app onto the approved Drawn Room design. The engine layer (story generation, two-stage QA, profile, skills, conversational APIs) shipped in v2.2 and is kept; the presentation layer is replaced wholesale.

## Sources of truth, in precedence order

1. **`design/v3-build-addenda.md` — A1 touch-native, A2 clock lighting, A3 reader transport.** These BIND and OVERRIDE anything that conflicts in the mockup.
2. **The touch-balance directive (below)** — corrects the mockup's known flaw.
3. **`design/handoff-v4-hifi/`** — the hi-fi prototype. Read `Little Fables.html` and every import (`app/arrival.jsx, home.jsx, room.jsx, reader.jsx, kitchen.jsx, complete.jsx, words.jsx, parent.jsx, sim.jsx, content.jsx, art.jsx, art2.jsx`). Its `_ds/` bundle is the authoritative token set (it supersedes `design/handoff-v3-system/` where they differ). **Port the SVG art library (`art.jsx`, `art2.jsx`, `assets/north-star.svg`) and fonts into the app as real assets** — this is the app's visual soul; reproduce rendered output faithfully.
4. **PRDs:** `design/PRD-story-world-v2.md` (reader/world), `design/PRD-azi-agency-v3.md` (voice agency + story kitchen), `docs/aziverse-adoption.md` (engine, already built — wire, don't rebuild).
5. **`docs/voice-architecture.md`** (TTS/STT/conversation — implemented in v2.2; reconnect to the new UI) and `design/research-synthesis-master.md` (rationale; consult when interpreting ambiguity).

## The touch-balance directive (Manav's review of the hi-fi)

The mockup leans voice-first to a fault. The build inverts the emphasis without losing the voice layer:

- **Touch is the primary, always-visible path.** Every action reachable by voice has a visible, tappable element on screen at all times — no flow may require speaking, waiting for speech, or discovering a voice affordance. Where the mockup shows a voice-only path, add the touch twin (drawn, in-world, per the system).
- **Voice is an accelerant, clearly signposted.** The buddy-as-mic stays, but listening is always *explicitly* initiated by tapping the buddy (never auto-listening), and while the buddy speaks a question, the tappable options appear WITH the speech (not after a voice timeout). The child should never wait on audio to act.
- **The kitchen interview is dual-mode:** each buddy question shows 3–4 drawn suggestion chips + the mic simultaneously; answering by tap or by voice are equal citizens; the read-back confirmation is a big tap target ("That's it!" / "Change it") with voice equivalent.
- **Asks/choices:** mic and tappable answers always co-present (this was already spec; enforce it everywhere the mockup dropped the tap path).
- Review checkpoint: complete every flow twice — once touch-only, once voice-only. Both must succeed; touch must never be slower to discover.

## Build phases (commit per phase)

**Phase 0 — Assets + tokens.** Port the v4 `_ds` tokens/fonts/filters (`lf-filters.js` paper/ink effects) into the app (`app/read/read.css` + font loading via next/font/local). Port `art.jsx`/`art2.jsx` SVG components into `app/read/art/` as typed React components. North-star room SVG becomes the Home scene base. Delete the superseded wash-gradient styling.

**Phase 1 — The room.** Rebuild Home as the drawn room per `room.jsx`/`home.jsx`: buddy on the rug (breath loop, one speech line — real worldState callback or greeting), shelf with face-out covers (SVG cover art; kid-authored spine marks; art-still-painting pencil state), suns on the sill, word-pins on the wall, medallions on the shelf, writing desk (kitchen door), crate. **A2 lighting:** implement the full six-keyframe clock-lighting module driving the CSS light variables over the room SVG; dusk auto-engages lantern; `?clock=` override. First-run: arrival flow per `arrival.jsx` (buddies in the room, chosen buddy walks to rug).

**Phase 2 — Reader + transport.** Rebuild the reader per `reader.jsx` visuals, but the interaction model is **A3 verbatim**: prev/play-pause/next transport with fixed semantics; continuous read-to-me play mode pausing at interactive moments; tap-word = seek-and-play from that word (ElevenLabs character timestamps); hold-word = speak word (+meaning if star); ribbon scrubber with page ticks + snap; folio corner → Contents spread (chapters, ✓/current/closed states); back = one level up. Endpaper beats as all loading states. Asks/choices/breathe per mockup + touch-balance directive. **A1 throughout:** pressed states <100ms, pointer events only, touch-action manipulation, targets ≥56px biased low, swipe-follow page turns, no hover dependence.

**Phase 3 — Completion loop.** Chapter end (recap question, hook, Next chapter/All done), book complete per `complete.jsx` (lantern-light celebration, star words flying to wall pins, record button states, envelope-to-shelf), badge earn + shelf medallions, RecapStrip on >24h resume, Words wall per `words.jsx` (Language Wall groups, mystery-word arrival).

**Phase 4 — Voice layer + kitchen.** Reconnect `/api/listen` + `/api/respond` + `/api/intent` to the new UI under the touch-balance directive (buddy tap-to-listen, target-glow confirm, two-miss visual fallback). Story kitchen per `kitchen.jsx` + PRD R19–R24 dual-mode: interview (chips + mic), read-back confirm, **the writing moment** (Caveat handwriting of his transcribed words onto the desk book — the generation wait), instant shelf arrival with Storyteller badge, guardrail redirects in-fiction, daily-cap line, Made-by-Azad parent section (parent.jsx).

**Phase 5 — Verify.** `tsc` clean (known 3 exemptions), `next build`, then: the five prototype acceptance tests (9am ≤2 interactions, squint, silly, car, interview-traceability) + addenda checkpoints (touch-only full pass AND voice-only full pass; transport semantics — play never navigates; 3+ lighting states + dusk transition + `?clock` override; word-tap seek accuracy) + regression: pack-000 books render with new reader, retells record/transcribe, QA records visible in Parent Corner, offline reading with cached audio works, Supabase-free kid app preserved. Deploy preview and list every checkpoint result in the final report.

## Standing rules (unchanged, enforce)

One terracotta action per screen; colored shadows never grey; no spinners (endpapers); no cuts within scenes; no loss states or sad-buddy reactions; buddy speech ≤1 line per screen visit; kid errors friendly; parent surfaces plain (Inter/neutrals, no drawn elements); no hand-drawn UI text except the child's own words in the writing moment; reduced-motion variants everywhere; middleware public-route bypass extended to any new API route; native-shell seams preserved (provider-agnostic speech interfaces, storage-module-only persistence).
