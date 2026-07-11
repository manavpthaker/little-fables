# Claude Code prompt — art generation phase

Run from the repo root, after (or alongside) the v2.1 fix round. Spec: `docs/art-pipeline.md` — read it fully first; it is binding. Style/character anchors and the character-bible rule live there.

Build, in order:

1. **Character bible** — `content/art/characters.json` with entries for Azi, the family (Dada/Dadi/Kaka/Kaki — refs exist), Miko/Tara/Boulder (crop refs from `public/art/`), the 8 plush companions, and the 6 buddies (descriptors from `design/handoff-v2/app/data.js` intros + `docs/reference/azi-verse/universe-guide.md`). Copy the existing reference sheets into `content/art/refs/`.
2. **`/api/art`** — provider-abstracted generation route (`ART_PROVIDER=gemini|openai`, keys in env): accepts a scene brief + character ids, assembles style card + refs, returns image. Public-route middleware bypass NOT needed (parent-triggered, can sit behind the same public policy as /api/story for now).
3. **Art-director + QC passes** — Claude calls per the doc (scene briefs with one-illo-per-2–4-pages grouping; vision QC with ≤2 retries).
4. **`scripts/generate-art.ts`** — batch: character sheets first (buddies + companions, output to `content/art/refs/pending/` for approval), then per-book backfill (pack-000 priority) writing to `public/books/<bookId>/` + patching packs.
5. **Bake-off command** — `scripts/art-bakeoff.ts`: 4 fixed Miko briefs × both providers → `content/art/bakeoff/` + a simple HTML side-by-side for Manav.
6. **Parent Corner Art tab** — per-book review: brief + image, Approve / Regenerate-with-note; all-approved flips the book from washes to art (and bumps SW cache manifest).
7. **StoryMaker hook** — after rubric pass, fire-and-forget art generation; book publishes in washes, upgrades on approval.

Rules: washes remain the permanent fallback — art never blocks reading or publishing; no character outside the bible ever appears in a prompt; every generation call includes the style card + 3 style refs; approved same-book images join subsequent calls as continuity refs; all images optimized ≤200KB before landing in `public/`.

Verify: bake-off renders 8 images; buddy + companion sheets generate and appear in a pending-approval list; approving Bramble's sheet locks it as a ref; running the backfill for "Bramble's Hello" produces briefs → images → Art tab review → approving all flips the book to art in the reader, on its cover, and on the chapter map; a rejected-art book still reads perfectly in washes.
