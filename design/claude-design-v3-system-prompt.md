# Claude Design prompt — Little Fables design system v3 ("The Drawn Room")

Paste below the line into a **fresh Claude Design project** as a design-system build. Optionally attach 2–3 pages of the existing book art (the ink-and-wash Miko pages, an Azi's Little Bhen page) as style anchors — nothing else. This round produces the **design system**; the hi-fi app prototype comes after the system is approved.

---

Build the design system for **Little Fables** — a private, voice-first storybook app for one 4-year-old on an iPad. The direction is decided; your job is to execute it with taste and codify it into tokens, components, and rules.

## The direction (settled — do not re-explore)

**The app is one hand-drawn room.** Not a menu, not a map — a single, calm, beautiful child's room seen from one warm viewpoint, rendered entirely in loose-but-confident ink line with watercolor wash on warm paper. A Montessori sensibility governs the space: few objects, all meaningful, real materials, order, child-height, one honest light source (a window that knows the real time of day). The child's books live face-out on a wooden shelf; his companion character breathes on the rug; his accumulating things (found words, badges, his own authored books) are visible in the room. Opening a book, the room's edges fall away and the page takes over *in the same medium* — the app and the books are drawn by the same hand.

**Line-quality references (the taste target):** Sydney Smith (*Small in the City*) — loose ink, luminous wash, quiet and emotionally serious; Quentin Blake — confident scratchy energy; Carson Ellis (*Home*) — flat, composed domesticity. Aim between Smith and Ellis: confident-loose, never scribbly, never anxious. **Hard NOs:** glossy vector rendering, plastic 3D/dollhouse depth, faces or eyes on furniture, winking objects, cartoon clutter, hand-drawn *text* (type is always set; only the world is drawn).

## Deliverable 1 — the north-star scene (build this FIRST)

One full-bleed illustration of the room at golden hour, 1180×820: wooden shelf with 5–6 books face-out (use the real book titles: Miko and the Wobbly Bridge, The Moose Who Knew About Bigness, Papa Gets the Moon…), the buddy (a small bear) sitting on a circular rug mid-breath, a window pouring late-afternoon light, a low table, a guitar leaning in the corner, a puzzle on the floor, a few collected star-words pinned like postcards on the wall. No UI chrome — this is the world the UI lives in. Everything after is derived from this image; if it doesn't produce warmth and wonder, iterate on it before building anything else.

## Deliverable 2 — tokens

- **Color:** the pigment system. Warm paper ground (~#F4EBD8 family, always textured with visible fiber, never flat); a counted palette of 10–12 named pigments at watercolor saturation (marigold ~#E2A93B, terracotta ~#D1462F–#D95B43, sage ~#7C9A62, river ~#4E7FA3, teal ~#2E8B8B, berry ~#9B4A6B, dusk ~#5D6A8A, bark ~#5B4637, butter ~#EFC85C, plum ~#5B4B7A — tune by eye against the north-star scene); **terracotta reserved as the single hero accent** = the one primary action per screen. **Shadows are always colored (cool dusk or warm bark), never neutral grey.** Three lighting registers as token sets: *Day* (paper ground, window light), *Story* (inside books — the page's own palette governs, chrome recedes to ink on paper), *Lantern* (evening/quiet: deep indigo ~#22304A ground, lantern-gold ~#F3C77A pools; celebration moments borrow this light language).
- **Texture:** paper grain, wash bloom edges, dry-brush — as reusable treatments, with a rule for when each applies.
- **Type:** propose a display face with storybook warmth that holds at 30px+ and a body face readable at 24px+ (reading text ≥24px, ~65 words max per page); type is never hand-drawn but should sit comfortably on paper (consider a gentle warm ink color, never #000).
- **Geometry & motion:** drawn-line borders instead of geometric strokes where surfaces need edges; wobble/jitter animation on 2s for drawn elements (subtle — handmade, not shaky); page-turn, kamishibai slide, and breath-loop timings; reduced-motion variants for all.
- **Sound annotations** (as token documentation): foley-only feedback families (paper, wood, pencil), one sound family per intent type; no jingles ever.

## Deliverable 3 — core components (each as a guideline card + working sample)

1. **The buddy** — one bear character sample in the house style: idle breath loop (2–3s), listening lean-in, pointing, celebrating. The buddy is the app's voice and hands; it must feel drawn, alive, and never pleading.
2. **Speech balloon** — hand-drawn balloon for buddy speech; calm/bouncy variants; how it coexists with spoken audio.
3. **Book on shelf** — face-out book object: real cover art framed in a drawn cover; progress shown as a drawn bookmark/ribbon; "Azad's books" get a distinct drawn spine mark; "art still painting" state as a pencil-sketch cover.
4. **Reading page** — the spread inside a book: art + text panel on paper, **word highlight as a warm lamplight glow moving across words** (never marker-yellow blocks); the mic affordance for asks (≥56px, drawn, terracotta when active).
5. **Interactive moments** — ask card, choice cards (2–3 drawn objects to pick up), breathe-along circle (ink circle that swells like a wash bloom), all with spoken-cue affordances shown.
6. **The writing moment** — the generation-wait scene: a little open book on the buddy's table, the child's own words appearing in watercolor handwriting (the one place "hand-drawn text" is allowed — it's *his* words, not UI).
7. **Progress in the room** — reading-day suns as drawn suns on the window sill or wall calendar; star words pinned to the wall (the Language Wall); badges as drawn medallions on the shelf. Progress only accumulates; nothing dims or breaks.
8. **Recap strip** — "Last time…" as three small hand-drawn comic panels with one caption each; this is the comic grammar's home.
9. **Transitions** — book-open (room recedes, page rises), kamishibai side-slide between pages/scenes, endpaper open/close beat (a wash-color field with a tiny motif — also the loading state; there is no spinner anywhere).
10. **Parent surfaces** — untouched by the drawn world: quiet shadcn neutrals, Inter, plain sentence case (carry over as-is; one guideline card noting the boundary).

## Rules to codify as guideline cards (the constitution)

One terracotta action per screen; every interactive element pairs a visual cue with spoken audio; primary kid targets ≥56px, everything ≥44px; nothing requires reading to operate; no loss states, counters, currencies, locks, or leaderboards — progress is things accumulating in the room; the buddy never begs, guilts, or expresses disappointment at the child's choices; no camera cuts within a scene — transitions are physical and continuous; ≤5 child decision points per screen; clutter is the enemy AND flat emptiness is the enemy — calm ground, rich focal points, always lit; child-initiated page turns everywhere except drive mode; celebrations use light (lantern register), not confetti-noise; reduced motion respected everywhere.

## Acceptance test for the whole system

Mock the north-star room as Home with real UI applied (buddy + one speech line, Continue beacon on one book, suns on the sill, ≤5 decisions). It must pass: the 9am test (from cold open, reaching page one of a chosen book ≤2 interactions), the squint test (one obvious glowing next thing), the silly test (an adult would frame it, not cringe), and the one-hand test (everything a child touches ≥56px, bottom two-thirds of screen).
