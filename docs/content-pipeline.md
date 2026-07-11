# Little Fables — content pipeline (pre-populating the library)

Azad reads fast; the shelf must launch deep and keep refilling. This doc defines the canon, the seed library, the batch-generation pipeline, and how existing stories get ingested.

## Canon: the Azi-Verse is the universe

Source of truth: `docs/reference/azi-verse/` (universe guide, evaluation rubric, creation instructions, future-ready skills, parent-child research, project purpose, quotes). Key facts the app must respect:

- **World:** the Westfield (green clapboard, red door) in Rahway — playroom (whisker-wiggle roll call), twilight bedroom (moon-view window), backyard garden + trampoline + bees, Pooh's Honey Farm, Monkie's dock, the yellow bus (Pandies driving), Liberty Science Center with Brady, video-call spaces to Colombia, Dada & Dadi's house in Howell (dosas, Hess truck parades).
- **Cast:** Azi (guitar, puzzles, AKAI keyboard, feels deeply, processes through music) + plush companions: Jujy (tuxedo-cat leader), Dory (dreamy scout), Pandies (calm bus-driver panda), Citie (steady noticer), Clappy (joyful musician), Slothie & Baby Slothie (the stillness), Monkie (practical fisherman), Peter (quiet trickster), Pooh (slow farmer). Extended: Mama (Spanish, "mi cielo"), Papa (learning Gujarati), Tia & Chicho, Sebitas, Lito/Lita, Dada/Dadi, Kaka & Kaki, school friends Loki (origami) and Inu (Hindi), neighbors Brady & Anne, Flo (Haitian Creole), Dr. Diaz.
- **Tri-cultural texture:** Colombian Spanish + Gujarati/Hindi + neighborhood Creole, code-switching naturally ("agua", "lechita", "todos listos?", dosas/arepas/honey as comfort motifs). The moon watches over all the children of the world.
- **Rituals:** whisker-wiggle roll call opens adventures; C-G-Am chords; puzzle-corner-pieces metaphor; moon endings; April 21 birthday; snack-song-moon closings.
- **Existing standalone canon:** "Bramble's Hello" (bear, facing fears — "Brave was saying hello anyway"), "The Moose Who Knew About Bigness" (Gentle Giant's Secret regulation technique), "The Coocoo" (mirror-figure capability recognition), the Wisdom Animals framework (Turtle, Elephant, Raven, Snow Leopard, Ladybug).
- **Craft rules from the project:** morals distributed across three progressive moments, closing line lands the lesson; repair language separates behavior from identity ("my hands did things my heart didn't mean"); nothing too dense/scary for the age band; stories score **90+ on the evaluation rubric** before shipping.

**Reconciliation with app-era characters:** Miko/Tara/Boulder + Zoomtown were invented for the app prototype and have finished art — they stay as one "storybook series" on the shelf, but they are not the universe. New generation defaults to the Azi-Verse. Recommended: rename the Bear buddy **Bramble** (he already exists in canon and his line is already perfect).

## Seed library (launch target)

Mix mapped to the PRD's shelf: **6 chapter books (3–5 chapters each) + 24 quick stories ≈ 40+ chapters of content.** Distribution:

| Slice | Count | Drawn from |
|---|---|---|
| Existing written stories (Manav attaching) | as many as exist | Converted to app schema; asks/choices/retells added; art "still painting" |
| Azi + companions quick stories | 12 | Universe guide settings × emotional themes list (ready feelings, plans gone crooked, missing home, brave-and-crying, two-places identity…) |
| Azi chapter books | 4 | Bigger arcs: honey-farm season, yellow-bus journey, Howell visit + Hess parade, Liberty Science Center wonder |
| Wisdom Animals stories | 5 | One per animal (Turtle/Elephant/Raven/Snow Leopard/Ladybug) — regulation techniques in-narrative |
| Miko series (has art) | already built | Wobbly Bridge (+ Cave Door draft) |
| Buddy-cameo stories | 3 | Each launch buddy stars once (living/nonliving thread) |

Every story: 1–3 asks (skill-tagged), ≤1 choice with meaningful branches, 2–4 star words with meanings, 3–4 retell prompts, teaching goals, `by` attribution, culture words woven per the code-switching rules.

## Batch generation pipeline (`scripts/generate-story-pack.ts`)

1. **Brief builder** — assembles a per-story brief: age band 4–6, setting + cast picks (rotating), one emotional theme, one future-ready skill target, culture elements, format (quick/chapter).
2. **Generate** — story-engine system prompt (assembled from `docs/reference/` per RESOURCES.md) + the brief → structured story JSON (the app schema).
3. **Rubric gate** — second model call scores against `azi-verse/evaluation-rubric.md`; < 90 → one revision pass with the scorer's notes; still < 90 → flag for human review, don't ship.
4. **Dedupe/variety check** — no two stories in a pack share the same theme × setting × companion lead.
5. **Emit** — `content/packs/pack-001.json` (array of stories); the app loads packs as pre-seeded library alongside starters. Art fields left as emoji-scene placeholders → "art still painting" state until the art pass.
6. **Cost note:** ~40 chapters ≈ 80–100 Sonnet calls (generate + score) ≈ a few dollars total. Rerunnable for pack-002 whenever the shelf thins.

## Ingesting existing stories (next step, when attached)

For each existing story (Bramble, Moose, Coocoo, sleep/kindness/impulse stories…): preserve the prose verbatim where possible (it's the canon voice), chunk into pages at natural beats, add asks at the story's existing question moments (never invent moralizing), pull star words from its own vocabulary, write retell prompts from its arc, keep the parent guide as a parent-corner-visible note (`parentGuide` field — new, shown only in Grown-ups), mark `by` (Papa/Mama), art placeholder. Long 10–15-minute stories become 2–3 chapter books rather than being cut.

## Consistency memory

`azad-verse.ts` gets rewritten from the universe guide (real cast, settings, rituals, tri-cultural words including Spanish: agua, lechita, mi cielo, te amo; Gujarati: bhen, beta, dosas context; plus Creole hello from Flo). The generation prompt must include the rituals and craft rules, not just the cast list.
