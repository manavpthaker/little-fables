# Little Fables — Design System

A private, voice-first storybook app for one 4-year-old (Azad) on an iPad. The entire app is **one hand-drawn room** — a calm child's bedroom rendered in loose-but-confident ink line with watercolor wash on warm paper. Books live face-out on a wooden shelf; a small bear companion breathes on the rug; the child's accumulating things (star words, badges, his own authored books) are visible in the room. Opening a book, the room's edges fall away and the page takes over in the same medium.

**Sources:** no external codebase, Figma, or brand assets were provided. This system was authored from a written creative brief (see project history). Everything visual derives from the north-star scene: `assets/room/north-star.svg`.

**Taste target:** between Sydney Smith (*Small in the City* — loose ink, luminous wash, emotionally serious) and Carson Ellis (*Home* — flat, composed domesticity), with Quentin Blake's confident scratchy energy. Confident-loose, never scribbly, never anxious.

**Hard NOs:** glossy vector rendering · plastic 3D/dollhouse depth · faces or eyes on furniture · winking objects · cartoon clutter · hand-drawn text (type is always set; only the world is drawn) · neutral grey shadows · spinners · confetti · jingles · emoji.

---

## CONTENT FUNDAMENTALS

**Who speaks:** the buddy (a small bear) is the app's voice and hands. All UI copy is what the buddy says. There is no narrator, no system voice, no "app" persona.

**Every interactive element pairs a visual cue with spoken audio.** Nothing requires reading to operate — the child is 4. On-screen text exists for atmosphere and for the adult's peripheral vision; the spoken line carries the meaning.

**Voice & tone:** warm, unhurried, curious. Short sentences a 4-year-old holds in one breath. The buddy asks, offers, and wonders — it never instructs, begs, guilts, or expresses disappointment.

- ✅ "Shall we see what Miko does next?"
- ✅ "Which one shall we pick up?"
- ✅ "You found a new word. *Wobbly.*"
- ❌ "Tap the book to continue!" (instructional, points at UI)
- ❌ "Are you sure you want to leave?" (guilt)
- ❌ "Great job!!! 🎉" (pleading energy, emoji, exclamation stacking)

**Casing & punctuation:** sentence case everywhere. One exclamation mark at most in a celebration, usually none. Questions end in question marks and are genuinely open (a real choice exists). Second person "you", first person "I" for the buddy, "we" for shared reading.

**Story text** (inside books): ≥24px, ~65 words max per page, present tense preferred, concrete sensory words. Star words — words worth collecting — appear lowercase and italic ("*wobbly*", "*enormous*").

**No loss language.** Nothing dims, breaks, expires, or is missed. Progress is only things accumulating in the room.

**Parent surfaces** speak plain adult English: Inter, sentence case, factual and quiet ("Reading days this week: 4"). No mascot voice, no drawn world.

---

## VISUAL FOUNDATIONS

**Ground.** Warm paper `#F4EBD8`, always textured with visible fiber (`--texture-paper`), never flat. Cards and pages use `--paper-bright #F9F2E3`; recesses `--paper-deep #EADCC0`.

**Ink.** Lines and set type are warm ink `#46362A` — never `#000`. Secondary `#6E5B49`, whisper/sketch `#97836B`.

**The 10 pigments** (watercolor saturation, tuned against the north-star scene): marigold `#E2A93B` · butter `#EFC85C` · terracotta `#D95B43` · sage `#7C9A62` · river `#4E7FA3` · teal `#2E8B8B` · berry `#9B4A6B` · dusk `#5D6A8A` · bark `#5B4637` · plum `#5B4B7A`. Washes are pigments diluted ~42% (`color-mix(in srgb, var(--pigment-x) 42%, transparent)`).

**Terracotta is reserved**: the single hero action per screen. If two things are terracotta, one is wrong.

**Shadows are colored, never grey:** cool dusk `rgba(93,106,138,.28)` for daytime object shadows; warm bark `rgba(91,70,55,.22)` for contact shadows. Light comes from one honest source (the window), so shadows fall away from it.

**Three lighting registers** (token scopes):
- **Day** (`:root`) — paper ground, butter window light.
- **Story** (`[data-register="story"]`) — inside books; the page's own palette governs; chrome recedes to ink on paper.
- **Lantern** (`[data-register="lantern"]`) — evening/quiet and celebrations: deep indigo `#22304A` ground, lantern-gold `#F3C77A` pools. Celebration = light, not confetti.

**Type.** Display: Young Serif (storybook warmth, 30px floor). Body/reading: Alegreya (24px floor, 28px default, ~65 words/page). Parent surfaces: Inter. Type is never hand-drawn — one exception: the child's own words in the writing moment appear in watercolor handwriting (his words, not UI).

**Texture treatments** (rules in `tokens/texture.css`): paper grain on every surface; wash bloom edges on pigment fields (rugs, covers, endpapers, light pools — never on type); dry-brush on small accents (rules, badge rims), max one per composition.

**Geometry.** Drawn-line borders instead of geometric strokes (`.lf-drawn-border`, wobble filter on the border only). Radii soft and bookish (10/18/22). Line weights 2px standard, 3px emphasis.

**Motion** (all tokens in `tokens/motion.css`, all with reduced-motion variants): wobble/line-boil on 2s (3 discrete frames — handmade, not shaky); buddy breath 2.6s; page-turn 700ms; kamishibai side-slide 520ms; endpaper open/close 900ms (this wash beat IS the loading state — there is no spinner anywhere). Transitions are physical and continuous; no camera cuts within a scene.

**Interaction states.** Hover/rest are calm; the invited action glows like lamplight (`--glow-lamplight`), never scales aggressively. Press = the object settles (translateY 1–2px + slightly deeper wash). Focus/highlight of words = a warm lamplight glow moving across text, never marker-yellow blocks.

**Touch.** Primary kid targets ≥56px, everything ≥44px, key actions in the bottom two-thirds of the screen (one-hand test).

**Backgrounds & imagery.** Full-bleed drawn scenes; no photographs; no gradients except light itself (window beams, lantern pools, endpapers). Everything in the world is drawn by the same hand as the books.

---

## ICONOGRAPHY

There is **no icon font and no external icon set** (Lucide/Heroicons would violate the medium). Affordances are **drawn objects** in the house style — a drawn microphone, a drawn sun, a drawn star — living in `assets/icons/` as small SVGs using ink `#46362A` lines with pigment washes. They follow the same wobble/wash filters as everything else.

- Icons never appear alone as abstract UI glyphs; they are things (a sun on the sill, a ribbon on a book).
- No emoji, ever. No unicode-character icons.
- The one recurring "logo-like" mark is the child's star (five-point, terracotta) marking authored books. There is no company logo; where a wordmark is needed, set "Little Fables" in Young Serif.

**Intentional additions** (no source inventory existed): the drawn-object icon set itself (mic, sun, star, ribbon, arrow) — required for affordances; documented per component.

---

## FONT SUBSTITUTION FLAG

The brief asked for "a display face with storybook warmth" and "a body face readable at 24px+" without naming faces. Chosen: **Young Serif** (display) and **Alegreya** (body), plus **Caveat** for the single sanctioned handwriting moment (the child's own words) — all OFL, binaries in `fonts/`. If the family has licensed faces in mind (e.g. Recoleta, ITC Souvenir, Mrs Eaves), supply the files and swap `fonts/fonts.css`.

---

## INDEX

- `styles.css` — global entry; imports everything under `tokens/` + `fonts/`.
- `tokens/` — `colors.css` (pigments, registers, shadows), `typography.css`, `spacing.css` (touch targets), `texture.css` (grain/bloom/dry-brush + `.lf-*` utilities), `motion.css`, `sound.css` (foley annotations), `base.css`.
- `fonts/` — Young Serif, Alegreya (+italic), Inter, `fonts.css`.
- `assets/room/north-star.svg` — THE scene; everything derives from it. `assets/lf-filters.js` — shared SVG filters (`#lf-wobble`, `#lf-wash-edge`, `#lf-dry`, `#lf-boil`); include once per page. `assets/icons/` — drawn-object icons. `assets/buddy/` — buddy pose art.
- `components/` — `buddy/` (Buddy), `speech/` (SpeechBalloon), `shelf/` (BookCover), `reading/` (ReadingPage), `moments/` (AskCard, ChoiceCards, BreatheCircle), `writing/` (WritingMoment), `progress/` (ReadingSuns, StarWord, Medallion), `recap/` (RecapStrip), `transitions/` (Endpaper), `parent/` (ParentSurface).
- `guidelines/` — the constitution (rule cards) + foundation specimen cards.
- `ui_kits/home/` — the acceptance-test Home (room → book → reading page, interactive).
- `SKILL.md` — agent skill entry point.

Component names are exported on the compiled bundle namespace — see each directory's `*.prompt.md` for usage.
