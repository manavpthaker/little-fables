# Art pipeline — generated illustrations for every book

Goal: every book on the shelf gets real illustrations in the house style — ink-and-wash watercolor on cream — with characters that look the same on page 12 as on page 1. Same shape as the audio pipeline: generate at publish, human-approve, cache, done.

## Anchors (all already in the repo / family folder)

- **Style refs:** the finished Miko art (`public/art/miko-*.jpg`) and the Azi's Little Bhen colored-pencil pages (`public/books/azis-little-bhen/`), plus the palette from `docs/reference/style_analysis_framework.md` (cream · ink · sage · dusty blue · ochre). Three style refs ride along on **every** generation call.
- **Character refs:** `Little Fables Stories/Azi's Little Bhen/Reference Illustrations/` has approved sheets for Azi, Dada, Dadi, Kaka, Kaki. Miko/Tara/Boulder crop from the existing art. Plush companions (Jujy, Dory, Pandies, Clappy, Slothie, Monkie, Peter, Pooh) and the six buddies have **no sheets yet** — generating them is step one.

## The character bible (`content/art/characters.json`)

One entry per character: `{ id, name, descriptor, refImages[] }` — descriptor is the locked visual prompt ("Jujy: a black-and-white tuxedo cat, white chest and paws, confident upright posture, small red collar…"), refImages are 1–3 approved images. **Rule: no character appears in any illustration unless it's in the bible.** The art-director pass enforces this.

## Pipeline stages (per book)

1. **Art-director pass (Claude).** Reads the chapter pages → emits scene briefs: which pages share one illustration (one illo per 2–4 pages, picture-book spread style — art persists until the next image), characters present (bible ids only), setting, action, emotion, composition note. Covers get their own brief (square).
2. **Generate.** Provider call with: style card (fixed prompt block + 3 style refs), character refs for everyone in the scene, the brief. Landscape 3:2 for pages, square for covers. For chapter books, previously **approved** images from the same book join the refs (rolling continuity).
3. **Auto-QC (Claude vision).** Scores each image: character match vs refs, style match, no text/garbled anatomy, age-appropriate, scene matches the brief. Fail → regenerate with the QC notes, max 2 retries, then flag.
4. **Parent approval.** Parent Corner gets an **Art tab** per book: side-by-side brief + image, Approve / Regenerate (with an optional note) per illustration. Book stays "art still painting" until all approved; then flips to art automatically. This is the taste gate — non-negotiable for anything Azad sees.
5. **Publish.** Optimize to ~150KB JPEG → `public/books/<bookId>/scene-NN.jpg`, patch the pack/book `scene.image` fields, bump the SW cache. Shelf cover, chapter-map thumbnails, and reader pages all light up from the same files.

## Provider

Abstracted behind `/api/art` + `ART_PROVIDER` env. Two backends to start: **Gemini image (Nano Banana family)** — strong multi-reference character consistency, cheap; and **gpt-image-1** — strong instruction-following and editing. Both accept multiple reference images, which is the capability that matters. **First task is a bake-off:** render the same 4 Miko scene briefs with both providers using our refs; Manav picks the default in a Parent Corner side-by-side. (Midjourney looks great for this style but has no usable API for an automated pipeline.)

## Order of work

1. **Buddy sheets** (6) + **plush companion sheets** (8) — generated from their bible descriptors + style card, human-approved once, then locked as refs. These appear everywhere, so they come first.
2. **Bake-off** on Miko scenes → pick provider.
3. **Backfill pack-000** (family originals — the priority queue from CONVERSION-NOTES) via `scripts/generate-art.ts`.
4. **Wire StoryMaker:** after the rubric gate passes, art generation kicks off in the background; the book publishes immediately with washes ("art still painting") and upgrades when the parent approves the art.
5. Backfill pack-001 and everything after.

## Costs

~$0.03–0.15 per image depending on provider/quality; a book ≈ 6–10 illustrations incl. retries ≈ **$0.50–1.50**. The whole current library ≈ **$15–40 one-time**, then ~$1/book ongoing. QC + art-director passes add pennies (Haiku/vision).

## Family-likeness note

Family-character art (Azi, Dada, Dadi…) generates from the approved *illustration* reference sheets, not from photos, and stays in this private app. If a sheet ever needs regenerating from photos, that's a parent-run local step, kept out of the automated pipeline.

## Failure posture

Washes-with-emoji remain the permanent graceful fallback. Art never blocks reading; a book with rejected art simply stays in washes. No kid-facing surface ever waits on an image model.
