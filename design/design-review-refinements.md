# Little Fables design review — refinement round

Reviewed the live prototype (Little Fables.html) end to end: buddy carousel → home → chapter map → reader (ask, choice, branch) → book complete → badge earn → badge shelf → My Words → gate → Parent Corner (all tabs).

## What's working — keep exactly as is

- **Chapter map** solves the progression problem: winding path, ✓ thumbnails on finished stops, big current stop with coral ▶ and the buddy standing beside it, and "Not yet… Mom is still painting this one ✦" instead of a padlock. The re-read affordance line is right.
- **Buddy carousel**: intro copy is on-voice and the living/nonliving tags read perfectly ("I'm Moto! I don't sleep, I PARK!"). The crate teaser ("Shhh… something is inside!") lands. Picking a buddy updates the Home header.
- **Home structure**: memory callback in the buddy bubble, KEEP GOING card with chapter dots + daily quest line, reading suns, My badges / My words entry cards, labeled shelf rows, parent-made footer line.
- **Reader flow**: word highlight, ask with hint link, choice cards → chosen glow, others dim → "Your choice is changing the story…" dots → branch page. Blocked Next grays correctly.
- **Book complete → badge**: star words, Tell it back with real recording state ("Recording… 0:03"), "A badge is waiting for you…" handoff, Miko Master earn screen with buddy speech line, badge shelf with silhouetted next-ups and how-to-earn lines.
- **Parent Corner**: tabs (Stories / Retellings / Azad's universe), status pills including "Draft — art still painting", author attribution, retell play rows, universe editor with interests chips, goal toggles, Gujarati words (bhen/dada/jaldi), auto-saved footer.

## Refinements — paste this into Claude Design

---

Refine the Little Fables prototype. Keep every flow and layout as-is; these are targeted fixes:

1. **Use the real book art everywhere it exists.** The Miko book has finished ink-and-wash illustrations (zoomtown ride, wobbly bridge, belly breath, web, fixed bridge ×2, night scene, plus a square cover). Replace: (a) the emoji-on-gradient art panels in the Reader's Miko chapters, (b) the emoji fox cover on Home's Continue card and Chapter books shelf, (c) the chapter-map stop thumbnails. Emoji scenes remain ONLY as the placeholder treatment for stories whose art is still painting — never for stories that have art. The shelf must show three different real covers in matching cream mats.
2. **Declare buddy art direction.** Apple emoji are stand-ins. Add a designer note/frame in the file stating buddies are original watercolor characters in the book-art style, and render one buddy (Bear) as a proper illustrated sample so the target is unambiguous.
3. **Missing screens/states — add them:**
   - **Parent story maker** (New story button is currently dead): guided wizard — step 1 format (Quick story / Chapter book 3–5 chapters), step 2 one question per card (hero, want, place, teaches — with suggestion chips from Azad's interests/goals), step 3 review + "Write it" with per-chapter generating progress.
   - **Mid-book chapter end** (between chapters): buddy cheer, one spoken recap question with mic, next-chapter hook line ("Next time: the cave door creaks open…"), giant coral **Next chapter** + quiet **All done for now**.
   - **Breathe-along ask variant**: a large soft circle that slowly grows and shrinks with "In… and out…" — no mic, completes on its own (use in Miko's belly-breath page).
   - **Buddy arrival**: the crate's three beats — wiggling, cracking open, reveal celebration.
   - **Recap on resume**: interstitial before a resumed chapter — buddy + "Last time…" two lines + "YOU chose the canyon flower!" + coral ▶.
   - **Offline banner** on Home: "No internet — your saved stories still work!"
4. **Reader top bar**: add the read-aloud toggle (🔊/🔇) — it's missing entirely.
5. **Fix the ask block label**: page 2's question is labeled "STAR WORDS" — label asks by their skill ("WORD DETECTIVE", "COUNTING", "FEELINGS") or drop the label.
6. **Book-complete celebration is too quiet**: add the confetti/starburst moment and buddy cheer at the top of "You read the WHOLE book!" — it currently reads calmer than the badge screen that follows it.
7. **Pastel rule check**: My badges (lilac) and My words (mint) cards are tappable pastel surfaces. Restyle as cream cards with a pastel accent strip/icon chip so pastels label rather than act.
8. **Touch sizes**: ask-mic and hint link are under the 56px primary-target floor for kid surfaces — bump the mic to ≥56px and give "Need a little hint?" a pill hit area.
9. **Home density**: with one chapter book the shelf feels empty — add the "writing itself…" dashed slot into the Chapter books row (it exists in the parent corner as a draft; mirror it on the kid shelf) so the row always has a living second item.

---

## Known prototype-only issues (fine to leave for the build)

- Blocked Next still advances on click (blocking is cosmetic in the prototype; the build enforces it).
- No portrait variants mocked (build handles responsive stacking).
- Buddy speech/audio is implied by bubbles; real TTS comes in the build.
