# Claude Code prompt — wire Gemini 3 Pro Image (Nano Banana Pro) as the art engine

Run from the repo root. This implements the pipeline designed in `docs/art-pipeline.md`
(read it first — stages, character bible, approval gate are all specified there) on
**Gemini 3 Pro Image**, which is now the chosen provider (multi-reference character
consistency: up to 14 reference images per call, ≤5 people + ≤3 style refs — exactly the
character-bible architecture). The gpt-image bake-off is DROPPED; keep the provider seam so
an alternate can be added later, but build only the Gemini backend now.

## Credentials — already in place, do not move or print

- `GEMINI_API_KEY` is already set in `.env.local` (gitignored — verify it stays that way).
  Google Cloud project: `little-fables-v126` (633024306356), also in `.env.local` as
  `GOOGLE_CLOUD_PROJECT`.
- Never write the key into any committed file, log line, error message, or client bundle.
  Server/scripts only. Remind Manav at the end to add `GEMINI_API_KEY` to Vercel env vars
  (production + preview) for the on-demand kid-story art route.

## API surface (current, July 2026 — from ai.google.dev/gemini-api/docs/image-generation)

- SDK: `npm i @google/genai` → `import { GoogleGenAI } from "@google/genai"`;
  `new GoogleGenAI({})` reads `GEMINI_API_KEY` from env.
- **Interactions API** (not the legacy generateContent shape):

  ```ts
  const interaction = await ai.interactions.create({
    model: "gemini-3-pro-image",
    input: [
      { type: "text", text: prompt },                                  // style card + brief
      { type: "image", mime_type: "image/jpeg", data: base64Ref },     // ×N refs (≤14)
    ],
    generation_config: { aspect_ratio: "3:2", image_size: "2K" },      // "1:1" for covers
  })
  const b64 = interaction.output_image.data                            // base64 PNG
  ```

- REST fallback: `POST https://generativelanguage.googleapis.com/v1beta/interactions` with
  `x-goog-api-key: $GEMINI_API_KEY`.
- Model tiers: `gemini-3-pro-image` (~$0.13/img) for character sheets, covers, and any
  scene with 3+ bible characters; `gemini-3.1-flash-image` (~$0.07, still multi-ref, 4K)
  is the interiors workhorse — make the tier a per-call option, default flash for interior
  scenes, pro elsewhere.
- All output carries a SynthID watermark (invisible; fine for us — note it in the doc).
- Supported aspect ratios include `3:2` (reader pages) and `1:1` (covers); `image_size:
  "2K"` then optimize down to ~150KB JPEG at publish.

## Build phases

**Phase 0 — provider seam + plumbing.**
`lib/art/provider.ts` (interface: `generate(brief, refs, opts) → jpegBuffer`),
`lib/art/gemini.ts` (the only impl), `/api/art` route (server-side, kid-app middleware
bypass extended, `maxDuration` sized generously, never called synchronously from a kid
surface). Retry ×2 with backoff on 429/5xx; surface quota errors readably in script output.

**Phase 1 — character sheets first.** Per `docs/art-pipeline.md`: generate reference sheets
for the 6 buddies + 8 plush companions from `content/art/characters.json` descriptors + the
3 style refs (`public/art/miko-*.jpg` selects + Azi's Little Bhen pages). Parent approves
each sheet in the Art tab ONCE; approved sheets become locked `refImages` in the bible.
Family humans (Azi, Dada, Dadi, Kaka, Kaki) use only the existing approved illustration
sheets in `Little Fables Stories/Azi's Little Bhen/Reference Illustrations/` — never
photos in the automated pipeline.

**Phase 2 — art-director pass.** `scripts/art-director.ts` (Claude/Haiku): chapters →
scene briefs (one illo per 2–4 pages; characters = bible ids only; setting/action/emotion/
composition; square cover brief). Output `content/art/briefs/{bookId}.json`. The v3.2
semantic `scene` keys are the join: each brief maps to the page ranges whose scene key it
will fulfil.

**Phase 3 — batch generation.** `scripts/generate-art.ts` mirroring `generate-audio.ts`
exactly (tsx + dotenv, `--book`, `--dry-run`, resume/skip-existing, cost printout at end).
Call shape per brief: style card text + 3 style refs + character refs for everyone in the
scene + previously-APPROVED images from the same book (rolling continuity, cap total refs
at 14 favoring people). Write raw candidates to `content/art/candidates/{bookId}/` —
NOT to public/ (nothing reaches the kid app pre-approval).

**Phase 4 — QC + approval.** Auto-QC (Claude vision) per `docs/art-pipeline.md` stage 3
(character match, style match, no text/garbled anatomy, age-appropriate, brief match;
fail → regenerate with notes, max 2, then flag). Parent Corner Art tab: brief + image
side-by-side, Approve / Regenerate-with-note; book stays in the drawn endpaper placeholder
state ("art still painting" pencil chip) until all its art is approved.

**Phase 5 — publish + wire.** On approval: optimize → `public/books/{bookId}/scene-NN.jpg`,
patch the book's pages (`scene` key → image ref) + cover field, retire `coverEmoji`
(BookCoverArt uses the real cover when present, drawn glyph cover otherwise), bump SW cache
constant. Reader: image renders in the page-art slot with the drawn frame; shelf +
Contents thumbnails light up from the same files. Kid-story flow: after a generated book
lands on the shelf, fire art generation async — the book is readable immediately with
endpaper placeholders and upgrades when the parent approves (matches PRD; generation never
blocks reading).

**Phase 6 — verify.** `--dry-run` full pass prints the complete call plan + cost estimate ·
generate + approve ONE real book end-to-end (suggest `bus-detour`, it's short) · reader/
shelf/Contents show its art after approval and the placeholder before · a rejected image
never appears anywhere kid-facing · `tsc` + `next build` green · grep gate: `GEMINI_API_KEY`
appears only in `.env.local`, `lib/art/gemini.ts` (as `process.env` read), and docs.

## Standing rules

Art never blocks reading (endpaper placeholder is the permanent fallback) · nothing
unapproved reaches a kid surface · bible-only characters in prompts · no text in generated
images (the app sets type) · keep provider seam clean for a future second backend · pro
tier for sheets/covers, flash for interiors unless a scene has 3+ characters · after this
lands, update `docs/art-pipeline.md`'s Provider section to record the decision.
