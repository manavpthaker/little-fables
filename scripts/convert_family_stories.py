#!/usr/bin/env python3
"""Convert the family-written Azi-Verse stories (content/originals/) into the
Little Fables content pack (content/packs/pack-000-family-originals.json).

Rules (docs/content-pipeline.md): prose preserved verbatim, paged at natural
beats (~<=65 words/page, paragraph boundaries), chapters split on the story's
own part headings, asks only at the story's existing question moments,
breathe-along flags on the story's own breathing cues, parent guides preserved
for the Grown-ups surface.
"""

import json, re, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'content', 'originals')
OUT = os.path.join(ROOT, 'content', 'packs', 'pack-000-family-originals.json')

MAX_WORDS = 65

SCENES = {
    'playroom':  {'bg': 'linear-gradient(160deg,#fbbf24,#a7f3d0)', 'emojis': ['🎸', '🧸', '🌞']},
    'bus':       {'bg': 'linear-gradient(160deg,#fbbf24,#f97316)', 'emojis': ['🚌', '🐼', '🛣️']},
    'night':     {'bg': 'linear-gradient(160deg,#1e3a8a,#7c3aed)', 'emojis': ['🌙', '⭐', '🛏️']},
    'forest':    {'bg': 'linear-gradient(160deg,#34d399,#a7f3d0)', 'emojis': ['🐻', '🌲', '🍃']},
    'farm':      {'bg': 'linear-gradient(160deg,#a7f3d0,#38bdf8)', 'emojis': ['🫎', '🌲', '🏔️']},
    'train':     {'bg': 'linear-gradient(160deg,#0f172a,#4338ca)', 'emojis': ['🚂', '🎄', '✨']},
    'moon':      {'bg': 'linear-gradient(160deg,#1e1b4b,#818cf8)', 'emojis': ['🌕', '🪜', '💤']},
    'mirror':    {'bg': 'linear-gradient(160deg,#a78bfa,#f0abfc)', 'emojis': ['🪞', '🌙', '✨']},
}


def read(name):
    with open(os.path.join(SRC, name), encoding='utf-8') as f:
        return f.read()


def paragraphs(text):
    """Split into paragraphs, dropping markdown scaffolding but keeping prose verbatim."""
    out = []
    for block in re.split(r'\n\s*\n', text):
        b = block.strip()
        if not b:
            continue
        if re.match(r'^[#*_\-—✦\s]+$', b):           # rules, dividers, star rows
            continue
        if b.startswith('#'):                          # headings handled by caller
            continue
        b = re.sub(r'\s*\n\s*', ' ', b)                # unwrap hard-wrapped lines
        b = b.replace("\\'", "'").replace('\\"', '"').replace('\\-', '-')
        out.append(b)
    return out


def pages_from(paras, scene, asks=None, breathe_on=None):
    """Group paragraphs into pages of <= MAX_WORDS, attach asks/breathe by substring anchor."""
    pages, cur, count = [], [], 0
    def flush():
        nonlocal cur, count
        if cur:
            pages.append({'text': ' '.join(cur), 'scene': scene})
            cur, count = [], 0
    for p in paras:
        w = len(p.split())
        if count and count + w > MAX_WORDS:
            flush()
        cur.append(p)
        count += w
        if count >= MAX_WORDS:
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
        'coverEmoji': SCENES[scene_key]['emojis'][0],
        'coverBg': SCENES[scene_key]['bg'],
        'teachingGoals': teaching, 'vocab': vocab, 'retellPrompts': retells,
        'parentGuide': parent_guide, 'originNote': origin_note,
        'chapters': chapters,
    }


def chapter(title, paras, scene_key, asks=None, breathe_on=None):
    return {'title': title, 'pages': pages_from(paras, SCENES[scene_key], asks or {}, breathe_on or [])}


stories = []

# ---------- 1. Azi and the Day the Yellow Bus Took a Detour (quick) ----------
t = read('azi_bus_detour_story.md')
body, _, guide = t.partition('*Family Discussion Starters:*')
paras = paragraphs(body.split('**The End**')[0])
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
    [chapter('', paras, 'bus', asks)],
    parent_guide='Family discussion starters (from the original story):' + guide.strip() if guide.strip() else None,
))

# ---------- 2. Bramble's Hello (quick) ----------
t = read('brambles-hello.md')
paras = paragraphs(re.sub(r'\*A 5-minute bedtime story\*', '', t))
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
    [chapter('', paras, 'forest', asks)],
    origin_note='Bedtime ending kept — works for quiet daytime reading too. This bear is the buddy Bramble\'s origin story.',
))

# ---------- 3. The Cozy Circle (quick, bedtime) ----------
t = read('the_cozy_circle.md')
body = t.split('## The Story')[1].split('*The End*')[0]
_, _, guide = t.partition('## Implementation Guide')
paras = paragraphs(body)
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
    [chapter('', paras, 'night', asks, breathe_on=['breathed in', 'slow in. slower out', 'breathing goes like this'])],
    parent_guide=('Implementation guide (from the original story):\n' + guide.strip()) if guide.strip() else None,
    origin_note='Bedtime-specific by design — shines in bedtime mode / quiet time. Star-counting pages get the breathe-along treatment.',
))

# ---------- 4. The Moose Who Knew About Bigness (chapter book) ----------
t = read('The_Moose_Who_Knew_About_Bigness_Extended.md')
body, _, guide = t.partition('# The Gentle Giant')
parts = split_parts(body, r'^## Part (?:\w+): (?P<title>.+)$')
groups = [('Big Feelings at the Farm', parts[1:4]), ("The Moose's Secret", parts[4:7]), ('The Promise and the Return', parts[7:10])]
chapters = []
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
for i, (gtitle, group) in enumerate(groups):
    paras = []
    for ptitle, ptext in group:
        paras.extend(paragraphs(ptext))
    chapters.append(chapter(gtitle, paras, 'farm', ask_bank.get(i, {}), breathe_on=['breath', 'breathe']))
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
    origin_note='Set at the real Adirondacks farm. 9 parts grouped into 3 chapters.',
))

# ---------- 5. The Coocoo and the Boy Who Could (chapter book) ----------
t = read('The_Coocoo_and_the_Boy_Who_Could.md')
parts = split_parts(t, r'^(?P<title>Part \w+: .+)$')
mid = max(2, (len(parts) + 1) // 2)
c1 = [p for _, ptext in parts[1:mid] for p in paragraphs(ptext)]
c2 = [p for _, ptext in parts[mid:] for p in paragraphs(ptext)]
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
    [chapter('The House at Midnight', c1, 'mirror', asks), chapter('The Boy Who Could', c2, 'mirror')],
    origin_note='Night-set but about capability, not sleep — reads fine any time of day.',
))

# ---------- 6. The Midnight Train (chapter book, Christmas) ----------
t = read('The_Midnight_Train_Extended.md')
body, _, about = t.partition('**ABOUT THIS STORY**')
parts = split_parts(body, r'^(?P<title>Part \w+: .+)$')
third = max(2, (len(parts) + 2) // 3)
cs, labels = [], ['The Sleeping World Wakes', 'Aboard the Midnight Train', 'Home by Morning']
for i in range(3):
    seg = parts[1 + i * third: 1 + (i + 1) * third] if i < 2 else parts[1 + 2 * third:]
    paras = [p for _, ptext in seg for p in paragraphs(ptext)]
    if paras:
        cs.append(chapter(labels[i], paras, 'train', breathe_on=['breath']))
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
c1 = [p for _, ptext in parts[1:half] for p in paragraphs(ptext)]
c2 = [p for _, ptext in parts[half:] for p in paragraphs(ptext)]
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
    [chapter('The Ask', c1, 'moon', asks), chapter('The Journey and the Rest', c2, 'moon', breathe_on=['breath'])],
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
    print(f"  - {s['title']}: {len(s['chapters'])} ch, {sum(len(c['pages']) for c in s['chapters'])} pages, guide={'yes' if s['parentGuide'] else 'no'}")
