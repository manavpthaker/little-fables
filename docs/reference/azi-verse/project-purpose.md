Purpose & context

Manav is building the
Azi-Verse
  a personalized, therapeutic children's story universe centered on a young multicultural character named Azi. The project blends immersive bedtime storytelling with emotional regulation support, cultural authenticity, and developmentally-informed parenting tools. Stories are designed to work on multiple simultaneous layers: surface entertainment, skill/values development, and embedded therapeutic technique  with educational content feeling natural rather than instructional ("inception-style" learning).
The universe is intended to grow with Azi from toddler through early childhood, and Manav has expressed interest in eventually building a web application for collaborative story creation with his partner, and potentially open-sourcing the framework for other families.

Current state

The Azi-Verse is an active, extensive creative project with a substantial body of completed work, including stories addressing sleep, emotional regulation, kindness, physical impulse control, cultural identity, and new family transitions. Recent additions include:

"Bramble's Hello"
  a standalone bear story with an embedded facing-fears moral (
"Brave wasn't not being scared. Brave was saying hello anyway"
)

"The Moose Who Knew About Bigness"
  an extended story set at a real Adirondacks farm featuring a regulation technique ("the Gentle Giant's Secret") with a parent guide

"The Coocoo"
  a story using a mirror-reflection figure to help Azi recognize capabilities he's already developed

A
Spirit Animals / Wisdom Animals framework
 (Turtle, Elephant, Raven, Snow Leopard, Ladybug) functioning as both a parenting self-regulation architecture and an in-universe story element

Manav has also developed a comprehensive Azi-Verse Universe Guide and AI briefing document to maintain consistency across sessions.

On the horizon

Web application for story creation and collaboration, with local-first storage (IndexedDB), conversational form interfaces, and progressive onboarding

Text-to-speech integration (ElevenLabs recommended, particularly voices like "Rachel" or "Aria"; voice cloning explored for personalization)

Potential Lulu or similar print publication of stories

Continued story development addressing ongoing behavioral and sleep challenges

Key learnings & principles

Story structure
: Rich, immersive, 1015 minute read-aloud stories work best. Format: 69 named parts, slow sensory pacing, embedded breathing cues for parent and child, explicit parent guide appended after story

Therapeutic framing
: Regulation techniques are embedded in narrative, never clinical. Core repair language separates behavior from identity (e.g.,
"my hands did things my heart didn't mean"
)

Age calibration
: Manav has explicitly rejected content that is too dense, scary, or mature for the 34 age range. Stories should be lighter and playful while maintaining emotional impact

Moral placement
: Emotional lessons land best when distributed across three progressive moments in the story, culminating in a clear closing line rather than front-loaded messaging

Spanish removal
: Manav has at times requested removal of Spanish-language terms of endearment  handle with care; confirm before including

Cultural elements
: The universe authentically integrates Spanish, Hindi, and Gujarati, with family references spanning Colombia and India. Code-switching should feel natural, not decorative

Standalone vs. framed
: Manav prefers standalone stories without framing devices (e.g., "Mama tells Azi a story") unless explicitly requested

Illustration aesthetic
: When illustration prompts are needed, Manav favors raw, authentic child-created-looking art  mixed media, joyful chaos  over polished professional styles

Approach & patterns

Stories go through iterative refinement; Manav provides clear directional feedback and Claude executes targeted revisions

Preferred output format:
markdown
 for stories;
Word documents (.docx)
 for full packages with parent guides and formatting

Docx generation uses the docx-js library in Node.js with all paragraph styles defined at construction time,
TextRun
 for inline formatting,
PageBreak
 wrapped in
Paragraph
, and
Packer.toBuffer
 for output; output files go to
/mnt/user-data/outputs/

When a script file becomes corrupted, full deletion and recreation is more reliable than in-place repair

Parent guides use plain language with concrete scripts, not clinical framing

Tools & resources

docx-js (Node.js)
: Primary tool for formatted story document generation

ElevenLabs
: Recommended TTS solution for narration; free tier with warm voices; Web Speech Synthesis API as a no-setup browser alternative

Lulu
: Print-on-demand publishing platform used for formatted PDF output (6"9" trim, proper bleed/safety margins)

Time Timer MOD + Hatch Restore 3
: Physical tools integrated into Azi's sleep protocol and referenced in stories

Liberty Science Center
: Real-world location woven into the Azi-Verse setting

Azi-Verse core characters (quick reference)

Azi
: Protagonist; Colombian-Indian heritage; Rahway, NJ; preschool age; high imagination, emerging independence, sensory-seeking, easily overwhelmed

Plush companions
: Jujy, Dory, Pandies, Clappy, Slothie (+ Baby Slothie), Monkie, Citie, Pooh, Peter

Wisdom Animals
: Turtle (patience), Elephant (strength), Raven (insight), Snow Leopard (quiet power), Ladybug (gentle protection)

Family
: Extended family in Colombia (Lito, Lita); local relatives including Brady and Anne; bilingual caregivers
