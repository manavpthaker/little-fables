# Family originals — conversion notes (pack-000)

Converted 7 of 8 stories into `content/packs/pack-000-family-originals.json` (12 chapters, 279 pages). Originals preserved verbatim in `content/originals/`; the converter is `scripts/convert_family_stories.py` (rerunnable — edit the manifest in the script and rerun).

## Story-by-story

| Story | Format | Status | Notes for Manav |
|---|---|---|---|
| The Day the Yellow Bus Took a Detour | Quick (17 pp) | ✅ Ready | Your "Family Discussion Starters" became the parent guide; retells drawn from them. 2 asks placed (flexible thinking at Loki's puzzle line, hum-along at the flourish). |
| Bramble's Hello | Quick (24 pp) | ✅ Ready | Buddy origin story — the carousel Bear should be named Bramble and link here. 2 asks: whisper-hello courage moment, "brave anyway" closing. |
| The Cozy Circle | Quick (8 pp) | ✅ Ready (bedtime) | Star-counting pages carry the breathe-along treatment. Implementation guide preserved for Grown-ups. Kept bedtime-specific per your note — shelve under a "Quiet time" tag rather than adapting it away. |
| The Moose Who Knew About Bigness | Chapter book ×3 | ⚠️ Review | 9 parts grouped into 3 chapters (~24 pp each — long chapters; a 4-chapter split is one script edit if you prefer). Gentle Giant's Secret guide preserved. Breathing cues auto-flagged (most of the 26 breathe pages live here). |
| The Coocoo and the Boy Who Could | Chapter book ×2 | ⚠️ Review | Night-set but capability-themed — fine for daytime. Split point is mechanical (halfway); check it lands between scenes. |
| The Midnight Train | Chapter book ×2 | ✅ Ready (seasonal) | Christmas Eve story — suggest a seasonal shelf slot come December. "About this story" + Spanish glossary preserved in parent guide. |
| Papa Gets the Moon | Chapter book ×2 | ✅ Ready | Your three-movement wind-down design noted; chapter 2 ("The Journey and the Rest") is intentionally sleepy — flagged for quiet time / bedtime mode. Reader note preserved for Grown-ups. |
| Azi and the Thunder Symphony | — | ❌ Excluded | **The uploaded file is truncated** — it ends mid-Chapter 2 ("The note expanded, wrapping around him"). Re-export and I'll convert it; the hitting-repair theme ("my hands did things my heart didn't mean") is exactly what the library needs. |

## What still needs a human pass

1. **Asks are sparse by design** (5 placed across 279 pages). I only added them at moments where the stories already pause — per your craft rule against moralizing. The long chapter books could take 1–2 more each; mark the lines you'd want and I'll anchor them.
2. **Bedtime adaptation:** rather than rewriting bedtime stories for daytime, the pack tags them (`originNote`) so the app can shelve them under Quiet time / bedtime mode. Cozy Circle and Papa Gets the Moon's Rest chapter deliberately keep their sleepy pacing.
3. **Art:** every page ships with a mood-gradient scene placeholder → "art still painting" in the UI. These 7 are the priority queue for the art-generation pass (style anchors: the existing ink-and-wash books + `style_analysis_framework.md`).
4. **Spanish:** kept verbatim everywhere it appears (bus detour, Midnight Train glossary). The project-purpose doc had a truncated "Spanish removal" note — confirm whether that decision affects these.
5. **Page count sanity:** ~65 words/page targets the reader card. Moose/Coocoo/Midnight/Moon average 45–70 pages per book — right for multi-day chapter reading, too long for one sitting, which is exactly what the chapter map is for.

## Schema note (for the build)

Pack stories use the PRD's Book model (`kind: quick|chapter`, `chapters[].pages[]`) plus two additive fields the build must support: `parentGuide` (markdown, Grown-ups surface only) and `breathe: true` pages (render the breathe-along interaction instead of a mic ask). `originNote` is parent-facing metadata.
