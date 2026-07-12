#!/usr/bin/env python3
"""Convert the family-written Azi-Verse stories (content/originals/) into the
Little Fables content pack (content/packs/pack-000-family-originals.json).

Rules (docs/content-pipeline.md): prose preserved verbatim, paged at natural
beats (~<=65 words/page, paragraph boundaries), chapters split on the story's
own part headings, asks only at the story's existing question moments,
breathe-along flags on the story's own breathing cues, parent guides preserved
for the Grown-ups surface.

Paging rules:
  * `---` (and equivalent horizontal-rule dividers: `✦ ✦ ✦`, `☽`, lone `*`)
    in the source are ABSOLUTE beat breaks. The converter NEVER merges text
    across a divider into the same page. Each divider-bounded chunk is a
    "segment".
  * Default: within a segment, paragraphs are grouped up to `maxWords`
    (natural-beat paging). Never merges across a segment boundary.
  * `beatPerPage: True` (equivalent to `'segment'`): every segment becomes
    exactly one page, regardless of word count — used for stanza-style
    stories like The Cozy Circle where each `---` chunk IS the beat.
  * `beatPerPage: 'paragraph'`: every paragraph becomes exactly one page —
    used for wind-down chapters that lack internal `---` dividers.
  * `maxWords: N` override: also works to slow pacing without going full
    beat-per-page (e.g., Papa's Rest chapter uses maxWords=30).
  * Per-story config (STORY_CONFIG) can override paging globally or per
    chapter (via `chapterOverrides: {chapter_index: {...}}`).
  * `chapterSplit: N` on multi-part stories picks a grouping (e.g., Moose
    9 parts → 3 or 4 chapters). Auto-escalates to 4 if any chapter > 30 pages.
"""

import json, re, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'content', 'originals')
OUT = os.path.join(ROOT, 'content', 'packs', 'pack-000-family-originals.json')

DEFAULT_MAX_WORDS = 65
DEFAULT_BEAT_PER_PAGE = False

# Per-story paging configuration. Overrides layer over DEFAULT_*.
# Story-level keys: maxWords, beatPerPage, chapterSplit, chapterOverrides.
# `chapterOverrides` is a dict keyed by chapter index (0-based) → {maxWords, beatPerPage}.
STORY_CONFIG = {
    'bus-detour':        {},
    'brambles-hello':    {},
    'cozy-circle':       {'beatPerPage': True},
    'moose-bigness':     {'chapterSplit': 3},
    'coocoo':            {},
    'midnight-train':    {},
    # Papa's chapter 2 is the Rest movement. Papa's source uses ✦ ✦ ✦ (part) breaks,
    # not `---`, so segments there are large. Drop maxWords to ~30 to pace the
    # wind-down at roughly one beat (~a short paragraph) per page.
    'papa-gets-the-moon': {'chapterOverrides': {1: {'maxWords': 30}}},
}

# Divider markers that act as ABSOLUTE segment breaks (never merge across).
# Recognizes: `---` rule, `✦ ✦ ✦` starburst, `☽` moon marker, lone `*`.
DIVIDER_RE = re.compile(r'^\s*(?:-{3,}|(?:✦\s*){2,}✦?|☽|\*)\s*$', re.M)


def resolve_paging(story_id, chapter_index=None):
    """Resolve effective paging config for a (story, chapter) pair."""
    cfg = {'maxWords': DEFAULT_MAX_WORDS, 'beatPerPage': DEFAULT_BEAT_PER_PAGE}
    story_cfg = STORY_CONFIG.get(story_id, {})
    for k in ('maxWords', 'beatPerPage'):
        if k in story_cfg:
            cfg[k] = story_cfg[k]
    if chapter_index is not None:
        ch_cfg = (story_cfg.get('chapterOverrides') or {}).get(chapter_index, {})
        for k in ('maxWords', 'beatPerPage'):
            if k in ch_cfg:
                cfg[k] = ch_cfg[k]
    return cfg

# v3.2 semantic scene keys.
#
# The pack JSON no longer stores presentation (gradients, emojis). Each page's
# `scene` field is a semantic key that the reader maps to a drawn scene
# component; missing keys fall back to a drawn endpaper placeholder.
#
# The vocabulary below is OPEN-ENDED — extend it as new source stories arrive.
# Labels are hints for the art pipeline, not a rigid controlled vocabulary.
#
# Vocabulary used in this converter (per pack-000 chapters):
#   bus          — the yellow bus rolling through the neighborhood
#   bear-hollow  — Bramble's forest hollow at dawn
#   bedroom-night— cozy circle bedtime, blanket + moon
#   farm         — the Adirondacks farm at dusk / moose window
#   mirror       — Coocoo's midnight house / mirror-lit rooms
#   train        — the Midnight Train, snow + Christmas glow
#   garden       — Papa's yard, moon rising over Rahway
#   home-rest    — Papa's Rest movement, wind-down at home
#
# Kept as a plain str→str map (STORY_SCENE_KEY per story key) rather than the
# old {bg, emojis} presentation blob.
STORY_SCENE_KEY = {
    'playroom':   'playroom',
    'bus':        'bus',
    'night':      'bedroom-night',
    'forest':     'bear-hollow',
    'farm':       'farm',
    'train':      'train',
    'moon':       'garden',
    'moon-rest':  'home-rest',
    'mirror':     'mirror',
}

# Legacy cover emoji per scene_key — kept only because the Book cover still
# renders an emoji as a low-effort placeholder. No gradient here.
COVER_EMOJI = {
    'playroom':   '🎸',
    'bus':        '🚌',
    'night':      '🌙',
    'forest':     '🐻',
    'farm':       '🫎',
    'train':      '🚂',
    'moon':       '🌕',
    'moon-rest':  '🌕',
    'mirror':     '🪞',
}


def read(name):
    with open(os.path.join(SRC, name), encoding='utf-8') as f:
        return f.read()


def _clean_paragraph(b):
    b = re.sub(r'\s*\n\s*', ' ', b)                # unwrap hard-wrapped lines
    b = b.replace("\\'", "'").replace('\\"', '"').replace('\\-', '-')
    return b


def _paragraph_blocks(text):
    """Yield (kind, cleaned_text) for each block in `text`.
    kind in {'prose', 'divider'}. Headings and empty blocks are dropped."""
    for block in re.split(r'\n\s*\n', text):
        b = block.strip()
        if not b:
            continue
        # Divider-only block (---, ✦ ✦ ✦, ☽)
        if DIVIDER_RE.match(b):
            yield ('divider', '')
            continue
        # Pure decoration/rule/star row with no letters — drop
        if re.match(r'^[#*_\-—✦☽\s]+$', b):
            continue
        # Headings handled by caller (split_parts strips them upstream)
        if b.startswith('#'):
            continue
        yield ('prose', _clean_paragraph(b))


def paragraphs(text):
    """Flat list of prose paragraphs — kept for callers that don't need segmentation
    (parent-guide extraction, etc.). Dividers are dropped here."""
    return [t for k, t in _paragraph_blocks(text) if k == 'prose']


def segments(text):
    """Split text into a list of segments (each a list of paragraphs), where a
    segment boundary is a divider block (`---`, `✦ ✦ ✦`, `☽`) in the source.
    Segments are the ATOMIC page-building unit — the pager never merges across
    a segment boundary."""
    segs, cur = [], []
    for kind, val in _paragraph_blocks(text):
        if kind == 'divider':
            if cur:
                segs.append(cur)
                cur = []
        else:
            cur.append(val)
    if cur:
        segs.append(cur)
    return segs


def pages_from(source, scene_key, asks=None, breathe_on=None, max_words=DEFAULT_MAX_WORDS, beat_per_page=False):
    """Build pages from either raw text (str) or a list of segments.
    Absolute rule: never merge paragraphs across a segment boundary.
    - beat_per_page=True: each segment → exactly one page (word count ignored).
    - beat_per_page=False: within a segment, group paragraphs up to max_words.
    `scene_key` is a semantic string (e.g. 'bus', 'farm') — emitted verbatim
    on each page's `scene` field. No gradients, no emojis."""
    if isinstance(source, str):
        segs = segments(source)
    elif source and isinstance(source[0], list):
        segs = source
    else:
        # Backwards-compat: flat paragraph list treated as a single segment.
        segs = [list(source)]

    pages = []
    mode = beat_per_page
    if mode is True:
        mode = 'segment'
    for seg in segs:
        if not seg:
            continue
        if mode == 'segment':
            pages.append({'text': ' '.join(seg), 'scene': scene_key})
            continue
        if mode == 'paragraph':
            for p in seg:
                pages.append({'text': p, 'scene': scene_key})
            continue
        # Default: group inside this segment up to max_words.
        cur, count = [], 0
        def flush():
            nonlocal cur, count
            if cur:
                pages.append({'text': ' '.join(cur), 'scene': scene_key})
                cur, count = [], 0
        for p in seg:
            w = len(p.split())
            if count and count + w > max_words:
                flush()
            cur.append(p)
            count += w
            if count >= max_words:
                flush()
        flush()

    for page in pages:
        if breathe_on and any(k.lower() in page['text'].lower() for k in breathe_on):
            page['breathe'] = True
        if asks:
            for anchor, ask in list(asks.items()):
                if anchor.lower() in page['text'].lower():
                    page['ask'] = ask
                    del asks[anchor]
    return pages


def split_parts(text, pattern):
    """Return list of (title, body) split on part-heading pattern; body before first part -> '' title."""
    parts, matches = [], list(re.finditer(pattern, text, re.M))
    if not matches:
        return [('', text)]
    if matches[0].start() > 0:
        parts.append(('', text[:matches[0].start()]))
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        parts.append((m.group('title').strip(), text[m.end():end]))
    return parts


def story(sid, title, by, kind, scene_key, teaching, vocab, retells, chapters, parent_guide=None, origin_note=None):
    return {
        'id': sid, 'title': title, 'by': by, 'kind': kind,
        'source': 'family', 'status': 'complete',
        'coverEmoji': COVER_EMOJI[scene_key],
        # v3.2: coverBg removed. Cover renders on the drawn endpaper wash;
        # emoji is a low-effort placeholder until real cover art lands.
        'teachingGoals': teaching, 'vocab': vocab, 'retellPrompts': retells,
        'parentGuide': parent_guide, 'originNote': origin_note,
        'chapters': chapters,
    }


def chapter(title, source, scene_key, asks=None, breathe_on=None, story_id=None, chapter_index=None, paging=None):
    """`source` may be raw text, a segment list (list-of-lists), or a flat paragraph list.
    Paging is resolved from STORY_CONFIG unless overridden explicitly. The
    semantic scene key is looked up in STORY_SCENE_KEY and emitted verbatim on
    every page in this chapter."""
    cfg = paging or resolve_paging(story_id, chapter_index)
    return {'title': title, 'pages': pages_from(
        source, STORY_SCENE_KEY[scene_key], asks or {}, breathe_on or [],
        max_words=cfg['maxWords'], beat_per_page=cfg['beatPerPage'],
    )}


stories = []

# ---------- 1. Azi and the Day the Yellow Bus Took a Detour (quick) ----------
t = read('azi_bus_detour_story.md')
body, _, guide = t.partition('*Family Discussion Starters:*')
bus_body = body.split('**The End**')[0]
asks = {
    'think about this like a puzzle': {
        'question': 'Uh oh — the road is blocked! What do YOU do when a plan has to change?',
        'answers': [], 'praise': 'That is a great idea. Azi is learning that too — new plans can work!',
        'hint': 'There is no wrong answer. What could Azi try?', 'skill': 'flexible thinking'},
    'sound of finding a new way home': {
        'question': 'Azi added one extra note to his song. Can you hum a tiny new note?',
        'answers': [], 'praise': 'Beautiful! That is the sound of finding a new way.',
        'hint': 'Any little hum counts — try mmm-MMM!', 'skill': 'music and feelings'},
}
stories.append(story(
    'bus-detour', 'The Day the Yellow Bus Took a Detour', 'Made by Papa', 'quick', 'bus',
    ['flexible thinking', 'naming feelings', 'community'],
    [{'word': 'detour', 'meaning': 'a different way to get somewhere'},
     {'word': 'flourish', 'meaning': 'a fancy little extra — like one more happy note'},
     {'word': 'celebración', 'meaning': 'a party or celebration, in Spanish'}],
    ['Why did the yellow bus take a different road?',
     'How did Azi feel when the plan changed? How did he feel at the end?',
     'What did Loki say about puzzles?',
     'Can you think of a time a change turned out okay for you?'],
    [chapter('', bus_body, 'bus', asks, story_id='bus-detour', chapter_index=0)],
    parent_guide='Family discussion starters (from the original story):' + guide.strip() if guide.strip() else None,
))

# ---------- 2. Bramble's Hello (quick) ----------
t = read('brambles-hello.md')
bramble_body = re.sub(r'\*A 5-minute bedtime story\*', '', t)
asks = {
    'his hello was almost a whisper': {
        'question': 'Bramble is nervous. Can you say a tiny brave hello with him? Even a whisper counts.',
        'answers': ['hello', 'hi'], 'praise': 'HELLO! You said it — that was brave, just like Bramble.',
        'hint': 'Take a little breath and try: h-h-hello…', 'skill': 'courage'},
    'brave was saying hello anyway': {
        'question': 'Bramble learned something big. Is being brave the same as never being scared?',
        'answers': ['no', 'anyway', 'scared'], 'praise': 'Right! Brave is being scared AND saying hello anyway.',
        'hint': 'Bramble was still scared… but what did he do anyway?', 'skill': 'facing fears'},
}
stories.append(story(
    'brambles-hello', "Bramble's Hello", 'Made by Papa', 'quick', 'forest',
    ['facing fears', 'friendship', 'trying again'],
    [{'word': 'brave', 'meaning': 'doing the thing even when you feel scared'},
     {'word': 'whisper', 'meaning': 'a very soft, tiny voice'},
     {'word': 'giggling', 'meaning': 'little laughs that will not stop'}],
    ['Who ran away when Bramble said hello?',
     'How did Bramble feel when he met Mose?',
     'What does "brave is saying hello anyway" mean?',
     'Who would YOU like to say a brave hello to?'],
    [chapter('', bramble_body, 'forest', asks, story_id='brambles-hello', chapter_index=0)],
    origin_note='Bedtime ending kept — works for quiet daytime reading too. This bear is the buddy Bramble\'s origin story.',
))

# ---------- 3. The Cozy Circle (quick, bedtime) ----------
t = read('the_cozy_circle.md')
cozy_body = t.split('## The Story')[1].split('*The End*')[0]
_, _, guide = t.partition('## Implementation Guide')
asks = {
    'in the cozy circle': {
        'question': 'Let\'s make the Cozy Circle with Azi: blanket… friends… and one slow breath.',
        'answers': [], 'praise': 'There it is. Your circle is cozy and strong.',
        'hint': 'Pull your blanket close and breathe out sloooow.', 'skill': 'calming down'},
}
stories.append(story(
    'cozy-circle', 'The Cozy Circle', 'Made by Papa', 'quick', 'night',
    ['calming down', 'bedtime courage', 'breathing'],
    [{'word': 'cozy', 'meaning': 'warm, soft, and safe-feeling'},
     {'word': 'wiggly', 'meaning': 'moving a little, like a feeling that cannot sit still'},
     {'word': 'promise', 'meaning': 'something you say you will do — and then do'}],
    ['What three things make the Cozy Circle?',
     'Where do wiggly feelings go to rest?',
     'What is the moon\'s promise?'],
    [chapter('', cozy_body, 'night', asks, breathe_on=['breathed in', 'slow in. slower out', 'breathing goes like this'], story_id='cozy-circle', chapter_index=0)],
    parent_guide=('Implementation guide (from the original story):\n' + guide.strip()) if guide.strip() else None,
    origin_note='Bedtime-specific by design — shines in bedtime mode / quiet time. Star-counting pages get the breathe-along treatment.',
))

# ---------- 4. The Moose Who Knew About Bigness (chapter book) ----------
t = read('The_Moose_Who_Knew_About_Bigness_Extended.md')
body, _, guide = t.partition('# The Gentle Giant')
parts = split_parts(body, r'^## Part (?:\w+): (?P<title>.+)$')
# Decide chapter groupings — 3 by default; 4 if any resulting chapter would exceed ~30 pages.
moose_cfg = STORY_CONFIG.get('moose-bigness', {})
chapter_split = moose_cfg.get('chapterSplit', 3)
groupings = {
    3: [('Big Feelings at the Farm', parts[1:4]),
        ("The Moose's Secret", parts[4:7]),
        ('The Promise and the Return', parts[7:10])],
    4: [('Big Feelings at the Farm', parts[1:3]),
        ('The Moose at the Window', parts[3:5]),
        ("The Gentle Giant's Secret", parts[5:8]),
        ('The Return and the Dreaming', parts[8:10])],
}
groups = groupings[chapter_split]
ask_bank = {
    0: {'the bigness burst': {
        'question': 'Azi\'s bigness burst out. Where do you feel YOUR big feelings — tummy, hands, or chest?',
        'answers': [], 'praise': 'Thank you for telling me. Big feelings need a place, just like Azi\'s.',
        'hint': 'Close your eyes one second — where does the rumble live?', 'skill': 'naming feelings'}},
    1: {'gentle giant': {
        'question': 'The Gentle Giant\'s Secret starts with one slow breath. Can you do a moose-sized breath with Azi?',
        'answers': [], 'praise': 'Moose-sized! In through your nose… and out like a slow wind.',
        'hint': 'Big animals breathe slooowly. Try one.', 'skill': 'calming down'}},
}
def _chapters_for(groups):
    out = []
    for i, (gtitle, group) in enumerate(groups):
        segs = []  # concatenate segments across parts; part boundaries are also segment breaks
        for ptitle, ptext in group:
            segs.extend(segments(ptext))
        out.append(chapter(gtitle, segs, 'farm', ask_bank.get(i, {}),
                           breathe_on=['breath', 'breathe'],
                           story_id='moose-bigness', chapter_index=i))
    return out
chapters = _chapters_for(groups)
# Safety net: if any chapter blows past ~30 pages, auto-escalate to 4-chapter split.
if chapter_split == 3 and any(len(c['pages']) > 30 for c in chapters):
    chapter_split = 4
    chapters = _chapters_for(groupings[4])
stories.append(story(
    'moose-bigness', 'The Moose Who Knew About Bigness', 'Made by Papa', 'chapter', 'farm',
    ['emotional regulation', 'the Gentle Giant\'s Secret', 'repair and apology'],
    [{'word': 'bigness', 'meaning': 'when a feeling grows huge inside you'},
     {'word': 'gentle', 'meaning': 'soft and careful, even when you are strong'},
     {'word': 'promise', 'meaning': 'something you say you will do — and then do'}],
    ['What happened when Azi\'s bigness burst?',
     'What is the Gentle Giant\'s Secret?',
     'What did the moose\'s scar teach Azi?',
     'When could YOU use a moose-sized breath?'],
    chapters,
    parent_guide=('# The Gentle Giant' + guide).strip() if guide else None,
    origin_note=f'Set at the real Adirondacks farm. 9 parts grouped into {chapter_split} chapters.',
))

# ---------- 5. The Coocoo and the Boy Who Could (chapter book) ----------
t = read('The_Coocoo_and_the_Boy_Who_Could.md')
parts = split_parts(t, r'^(?P<title>Part \w+: .+)$')
mid = max(2, (len(parts) + 1) // 2)
c1_segs = [seg for _, ptext in parts[1:mid] for seg in segments(ptext)]
c2_segs = [seg for _, ptext in parts[mid:] for seg in segments(ptext)]
asks = {
    'already know': {
        'question': 'The Coocoo shows Azi things he can ALREADY do. Tell me one thing you learned to do all by yourself!',
        'answers': [], 'praise': 'YES — you learned that, and nobody can unlearn it. It is yours.',
        'hint': 'Tying, climbing, counting, a song… anything you can do now!', 'skill': 'confidence'},
}
stories.append(story(
    'coocoo', 'The Coocoo and the Boy Who Could', 'Made by Papa', 'chapter', 'mirror',
    ['confidence', 'self-recognition', 'night courage'],
    [{'word': 'reflection', 'meaning': 'the you that looks back from a mirror'},
     {'word': 'patient', 'meaning': 'okay with waiting, like the moon'},
     {'word': 'settling', 'meaning': 'the little sounds a house makes getting comfy'}],
    ['Who is the Coocoo?', 'What could the boy already do?', 'What would the Coocoo show YOU?'],
    [chapter('The House at Midnight', c1_segs, 'mirror', asks, story_id='coocoo', chapter_index=0),
     chapter('The Boy Who Could', c2_segs, 'mirror', story_id='coocoo', chapter_index=1)],
    origin_note='Night-set but about capability, not sleep — reads fine any time of day.',
))

# ---------- 6. The Midnight Train (chapter book, Christmas) ----------
t = read('The_Midnight_Train_Extended.md')
body, _, about = t.partition('**ABOUT THIS STORY**')
parts = split_parts(body, r'^(?P<title>Part \w+: .+)$')
third = max(2, (len(parts) + 2) // 3)
cs, labels = [], ['The Sleeping World Wakes', 'Aboard the Midnight Train', 'Home by Morning']
for i in range(3):
    seg_range = parts[1 + i * third: 1 + (i + 1) * third] if i < 2 else parts[1 + 2 * third:]
    ch_segs = [s for _, ptext in seg_range for s in segments(ptext)]
    if ch_segs:
        cs.append(chapter(labels[i], ch_segs, 'train', breathe_on=['breath'],
                          story_id='midnight-train', chapter_index=i))
stories.append(story(
    'midnight-train', 'The Midnight Train', 'Made by Papa', 'chapter', 'train',
    ['wonder', 'calm', 'holiday magic'],
    [{'word': 'midnight', 'meaning': 'the very middle of the night'},
     {'word': 'glow', 'meaning': 'a soft warm light'},
     {'word': 'navidad', 'meaning': 'Christmas, in Spanish'}],
    ['What woke up under the Christmas tree?', 'Where did the train go?', 'What did Azi find in the morning?'],
    cs,
    parent_guide=('About this story (from the original):\n' + about.strip()) if about else None,
    origin_note='Christmas Eve dream story — seasonal shelf item. Spanish glossary preserved in the parent guide.',
))

# ---------- 7. Papa Gets the Moon (chapter book, wind-down) ----------
t = read('papa_gets_the_moon_extended.md')
body = t
reader_note = ''
if 'Part One' in t:
    pre, _, rest = t.partition('Part One')
    reader_note, body = pre, 'Part One' + rest
parts = split_parts(body, r'^(?P<title>Part \w+: .+)$')
half = max(2, (len(parts) + 1) // 2)
papa_c1 = [seg for _, ptext in parts[1:half] for seg in segments(ptext)]
papa_c2 = [seg for _, ptext in parts[half:] for seg in segments(ptext)]
asks = {
    'moon was rising over rahway': {
        'question': 'Azi asked Papa for the moon! If YOU could ask for anything in the sky, what would it be?',
        'answers': [], 'praise': 'Ooooh, wonderful. Big asks make big adventures.',
        'hint': 'A star? A cloud? The whole sky? Anything!', 'skill': 'imagination'},
}
stories.append(story(
    'papa-gets-the-moon', 'Papa Gets the Moon', 'Made by Papa', 'chapter', 'moon',
    ['imagination', 'winding down', 'papa love'],
    [{'word': 'rising', 'meaning': 'coming up slowly, like the moon at night'},
     {'word': 'sliver', 'meaning': 'a tiny thin piece of something'},
     {'word': 'luna', 'meaning': 'the moon, in Spanish'}],
    ['What did Azi ask Papa for?', 'How did Papa try to get it?', 'What happened at the end?'],
    [chapter('The Ask', papa_c1, 'moon', asks, story_id='papa-gets-the-moon', chapter_index=0),
     chapter('The Journey and the Rest', papa_c2, 'moon-rest', breathe_on=['breath'], story_id='papa-gets-the-moon', chapter_index=1)],
    parent_guide=('For the reader (from the original):\n' + reader_note.strip()) if reader_note.strip() else None,
    origin_note='Three-movement wind-down story (Adventure → Journey → Rest); the Rest chapter is deliberately sleepy — great for quiet time or bedtime mode.',
))

# ---------- write ----------
pack = {
    'pack': 'pack-000-family-originals',
    'note': 'Family-written Azi-Verse originals converted per docs/content-pipeline.md. Prose verbatim; art pending ("still painting"). Thunder Symphony excluded (source file incomplete).',
    'stories': stories,
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(pack, f, ensure_ascii=False, indent=1)

total_pages = sum(len(c['pages']) for s in stories for c in s['chapters'])
print(f"{len(stories)} stories, {sum(len(s['chapters']) for s in stories)} chapters, {total_pages} pages -> {OUT}")
for s in stories:
    cfg = STORY_CONFIG.get(s['id'], {})
    notes = []
    if cfg.get('beatPerPage'):
        notes.append('beatPerPage=True (all chapters)')
    for idx, ov in (cfg.get('chapterOverrides') or {}).items():
        if ov.get('beatPerPage'):
            notes.append(f"ch{idx+1} beatPerPage=True")
        if 'maxWords' in ov:
            notes.append(f"ch{idx+1} maxWords={ov['maxWords']}")
    if 'maxWords' in cfg:
        notes.append(f"maxWords={cfg['maxWords']}")
    if 'chapterSplit' in cfg:
        notes.append(f"chapterSplit={cfg['chapterSplit']}")
    per_ch = ', '.join(f"ch{i+1}={len(c['pages'])}" for i, c in enumerate(s['chapters']))
    note_str = f"  [{'; '.join(notes)}]" if notes else ''
    # v3.2: scene key distribution per story — one line so Manav can eyeball it.
    key_counts = {}
    for c in s['chapters']:
        for pg in c['pages']:
            k = pg.get('scene') or '(none)'
            key_counts[k] = key_counts.get(k, 0) + 1
    key_str = ', '.join(f"{k}:{n}" for k, n in sorted(key_counts.items(), key=lambda x: -x[1]))
    print(f"  - {s['title']}: {len(s['chapters'])} ch ({per_ch}), guide={'yes' if s['parentGuide'] else 'no'}{note_str}")
    print(f"    scenes: {key_str}")
