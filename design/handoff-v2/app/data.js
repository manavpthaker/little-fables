/* Little Fables — world data (stories, buddies, badges, words, parent corner). */
(function () {
  // Heirloom watercolor washes (rgba layers painted over paper)
  const WASH = {
    canyon:  ['rgba(147,174,189,.55)', 'rgba(168,181,154,.45)', 'rgba(217,160,91,.30)'],
    sunset:  ['rgba(217,160,91,.50)',  'rgba(251,225,228,.60)', 'rgba(168,181,154,.28)'],
    meadow:  ['rgba(168,181,154,.55)', 'rgba(223,238,221,.65)', 'rgba(147,174,189,.28)'],
    lilac:   ['rgba(233,230,246,.75)', 'rgba(147,174,189,.35)', 'rgba(251,225,228,.45)'],
    blush:   ['rgba(251,225,228,.70)', 'rgba(217,160,91,.30)',  'rgba(233,230,246,.50)'],
    river:   ['rgba(147,174,189,.60)', 'rgba(223,238,221,.55)', 'rgba(233,230,246,.40)'],
    snow:    ['rgba(233,230,246,.65)', 'rgba(147,174,189,.40)', 'rgba(255,255,255,.60)'],
    honey:   ['rgba(217,160,91,.45)',  'rgba(255,232,207,.70)', 'rgba(168,181,154,.30)'],
  };

  const BUDDIES = [
    { id: 'bear',  name: 'Bear',  emoji: '🐻', nature: 'living',    trait: 'Cozy and brave',
      wash: 'honey',
      intro: { b: "I'm Bear. I'm big and cozy. When the bridge wobbles — I hold your paw. We're brave TOGETHER!",
               c: "I'm Bear. I'm big and cozy. When things wobble, I hold your paw. We're brave together." },
      greet: { b: 'Good morning, Azad! Ready for Crossing Day?', c: 'Good morning, Azad. Ready for Crossing Day?' },
      memory: 'The web bridge you built is still standing!' },
    { id: 'otter', name: 'Otter', emoji: '🦦', nature: 'living',    trait: 'Playful water-lover',
      wash: 'river',
      intro: { b: "I'm Otter! SPLISH SPLASH! I love rivers, puddles, and YOUR stories. Let's dive in!",
               c: "I'm Otter. I love rivers, puddles, and your stories. Let's dive in." },
      greet: { b: 'Azad! SPLISH! A new story day!', c: 'Hello Azad. A new story day.' },
      memory: 'The web bridge you built is still standing!' },
    { id: 'anky',  name: 'Little Anky', emoji: '🦕', nature: 'living', trait: 'Shy but sturdy',
      wash: 'meadow',
      intro: { b: "Um… hi. I'm Little Anky. I'm shy, but my back is SUPER sturdy. You can lean on me.",
               c: "Um… hi. I'm Little Anky. I'm shy, but my back is very sturdy. You can lean on me." },
      greet: { b: 'H-hi Azad. I saved you a seat.', c: 'Hi Azad. I saved you a seat.' },
      memory: 'The web bridge you built is still standing!' },
    { id: 'moto',  name: 'Moto',  emoji: '🏍️', nature: 'nonliving', trait: 'Tells vroom jokes',
      wash: 'canyon',
      intro: { b: "I'm Moto! I'm a motorcycle — I don't sleep, I PARK! Vroom vroom, let's zoom to a story!",
               c: "I'm Moto. I'm a motorcycle — I don't sleep, I park. Let's ride to a story." },
      greet: { b: 'VROOM VROOM, Azad! Story fuel is full!', c: 'Vroom, Azad. Story fuel is full.' },
      memory: 'The web bridge you built is still standing!' },
    { id: 'rocky', name: 'Rocky', emoji: '🪨', nature: 'nonliving', trait: 'Deadpan. Very still.',
      wash: 'lilac',
      intro: { b: "I'm Rocky. I'm a rock. I don't eat or grow — but I'm a GREAT listener.",
               c: "I'm Rocky. I'm a rock. I don't eat or grow — but I'm a great listener." },
      greet: { b: 'Hello Azad. I have been here the whole time.', c: 'Hello Azad. I have been here the whole time.' },
      memory: 'The web bridge you built is still standing!' },
    { id: 'rusty', name: 'Rusty', emoji: '🚀', nature: 'nonliving', trait: 'Dreams of space',
      wash: 'blush',
      intro: { b: "I'm Rusty, a toy rocket. I haven't been to space yet… but every story counts down. 3… 2… 1…",
               c: "I'm Rusty, a toy rocket. I haven't been to space yet. Every story counts down. 3… 2… 1…" },
      greet: { b: '3… 2… 1… AZAD! Ready for liftoff?', c: '3… 2… 1… Azad. Ready when you are.' },
      memory: 'The web bridge you built is still standing!' },
  ];

  // ---- Reader pages ----
  const mikoCh1Pages = [
    { wash: 'canyon', emojis: ['🦊', '🏍️', '🌉'],
      slot: 'miko-zoomtown-ride', slotLabel: 'Zoomtown ride',
      text: 'Vroom vroom! Miko zoomed to Dino Canyon. The old bridge went WIBBLE-WOBBLE. Three planks were missing!',
      star: 'wobbly' },
    { wash: 'canyon', emojis: ['🦊', '🌉', '🕳️'],
      slot: 'miko-wobbly-bridge', slotLabel: 'Wobbly bridge',
      text: 'Miko counted the empty spots. One… two… three!',
      ask: { skill: 'counting', question: 'Can you count the missing planks with me?',
             praise: 'Yes! THREE planks were missing. Great counting!', hint: 'One… two… th-th-…?' } },
    { wash: 'blush', emojis: ['🦊', '💭'],
      slot: 'miko-belly-breath', slotLabel: 'Belly breath', breathe: true,
      text: "Miko's tummy felt tight and worried. One big belly breath. In… and out.", fullBleed: true },
  ];
  const mikoCh2Pages = [
    { wash: 'meadow', emojis: ['🕷️', '🌉'],
      slot: 'miko-web', slotLabel: "Tara's web",
      text: "Tara skittered down on a silver thread. 'A web can fix it!' she said." },
    { wash: 'meadow', emojis: ['🕸️', '🌉', '🔨'],
      slot: 'miko-web', slotLabel: "Tara's web",
      text: 'What should hold the new bridge? Miko looked up. Miko looked down.',
      choice: { prompt: 'What should hold the bridge?',
                options: [ { emoji: '🕸️', label: "Tara's web" }, { emoji: '🦕', label: "Boulder's neck" }, { emoji: '🪵', label: 'A big log' } ] } },
    { wash: 'sunset', emojis: ['🕸️', '✨'],
      slot: 'miko-fixed-bridge-1', slotLabel: 'Fixed bridge (sunset)',
      text: 'They wove and wove and wove. The new web bridge shone in the sun. Sturdy!', star: 'sturdy', fullBleed: true },
  ];
  const mikoCh3Pages = [
    { wash: 'canyon', emojis: ['🦊', '🕸️', '🌉'],
      slot: 'miko-fixed-bridge-2', slotLabel: 'Fixed bridge (crossing)',
      text: 'Miko held the rail with both paws. The web bridge hummed a tiny song. It felt steady — not wobbly. Steady!',
      star: 'steady' },
    { wash: 'meadow', emojis: ['🦕', '🧰'],
      slot: 'miko-boulder-toolbox', slotLabel: 'Boulder and the toolbox',
      text: 'Boulder carried the toolbox on his long, long neck. Step. Step. Step.',
      ask: { skill: 'word detective', question: 'Which word means NOT wobbly?',
             praise: 'YES! STEADY! The web held strong.', hint: 'It starts with sss… st-st-ste…?' } },
    { wash: 'honey', emojis: ['🦊', '🦕', '🎉'],
      slot: 'miko-thank-you', slotLabel: 'Thank-you moment',
      text: 'Boulder set the toolbox down. TA-DA! Miko wanted to say thank you.',
      choice: { prompt: 'How should Miko say thank you?',
                options: [ { emoji: '🌼', label: 'A canyon flower' }, { emoji: '🎺', label: 'A VROOM song' }, { emoji: '🍓', label: 'Share his berries' } ] } },
    { wash: 'sunset', emojis: ['🦊', '🦕', '🌼'],
      slot: 'miko-night-scene', slotLabel: 'Night scene',
      text: "'Thank you, Boulder!' Boulder smiled a slow, happy smile. Miko felt grateful — happy-thankful, right down to his tail.",
      star: 'grateful', fullBleed: true },
  ];

  const STORIES = {
    miko: {
      id: 'miko', kind: 'chapter', title: 'Miko and the Wobbly Bridge',
      coverEmoji: '🦊', wash: 'sunset', meta: '3 chapters · counting',
      coverSlot: 'miko-cover',
      progress: 0.72,
      chapters: [
        { title: 'The Wobbly Bridge', status: 'done', wash: 'canyon', slot: 'miko-wobbly-bridge', emojis: ['🦊', '🌉'], pages: mikoCh1Pages,
          hook: { b: 'Next time: Tara has a BIG idea…', c: 'Next time: Tara has a big idea.' } },
        { title: "Tara's Big Idea", status: 'done', wash: 'meadow', slot: 'miko-web', emojis: ['🕷️', '🕸️'], pages: mikoCh2Pages,
          hook: { b: 'Next time: CROSSING DAY! Will the web hold?', c: 'Next time: Crossing Day. Will the web hold?' } },
        { title: 'Crossing Day', status: 'current', wash: 'honey', slot: 'miko-fixed-bridge-2', emojis: ['🦊', '🦕'], pages: mikoCh3Pages, resumeAt: 0,
          hook: { b: 'Next time: the cave door creaks open…', c: 'Next time: the cave door creaks open…' } },
        { title: 'The Cave Door', status: 'painting' },
      ],
      recap: {
        lines: ['Miko and Boulder are crossing the new web bridge.', 'The toolbox was too heavy for little paws…'],
        choice: "YOU chose Boulder's long neck!",
      },
    },
    azi: {
      id: 'azi', kind: 'quick', title: "Azi's Little Bhen",
      coverImg: 'assets/azi-kitchen.jpg', wash: 'honey', meta: '5 min · family',
      pages: [
        { img: 'assets/azi-scene-03.jpg', text: 'Azi has a little bhen. Bhen means little sister!', star: 'bhen',
          ask: { skill: 'Gujarati words', question: "What does 'bhen' mean?",
                 praise: 'YES! BHEN means little sister!', hint: 'Your little sis-s-s…?' } },
        { img: 'assets/azi-kitchen.jpg', text: 'Azi and his bhen helped Ba stir the pot. Round and round and round.', fullBleed: true },
      ],
    },
    jujy: {
      id: 'jujy', kind: 'quick', title: "Jujy's Christmas Adventure",
      coverImg: 'assets/jujy-cover.jpg', wash: 'snow', meta: '6 min · kindness',
      pages: [
        { wash: 'snow', emojis: ['🐱', '❄️', '✨'], text: 'Jujy the cat tiptoed under the twinkle-lights. The snow went crunch, crunch.', star: 'twinkle' },
        { wash: 'snow', emojis: ['🐱', '🛷', '🏠'], text: 'Jujy pulled the little sleigh all the way home. What a kind, brave cat!', star: 'sleigh', fullBleed: true },
      ],
    },
  };

  const BADGES = [
    { id: 'firstChoice', name: 'First Choice', emoji: '🕸️', wash: 'meadow', earned: true,  line: 'You made your very first story choice' },
    { id: 'days5',       name: '5 Reading Days', emoji: '☀️', wash: 'honey',  earned: true,  line: 'Five days of stories together' },
    { id: 'mikoMaster',  name: 'Miko Master', emoji: '🦊', wash: 'sunset', earned: false, how: 'Finish all 3 Miko chapters',
      earnLine: { b: 'You finished all 3 Miko books!', c: 'You finished all three Miko books.' } },
    { id: 'words10',     name: '10 Star Words', emoji: '⭐', wash: 'lilac',  earned: false, how: 'Collect 10 star words — 7 so far!' },
  ];

  const WORDS = [
    { w: 'wobbly',   story: 'miko', mean: 'shaky and wibbly, not steady', say: 'WOB-blee' },
    { w: 'steady',   story: 'miko', mean: 'strong and still — it does not wobble', say: 'STEH-dee' },
    { w: 'grateful', story: 'miko', mean: 'happy-thankful, right down to your tail', say: 'GRATE-ful' },
    { w: 'sturdy',   story: 'miko', mean: 'built strong — hard to tip over', say: 'STUR-dee' },
    { w: 'bhen',     story: 'azi',  mean: 'little sister, in Gujarati', say: 'behn' },
    { w: 'twinkle',  story: 'jujy', mean: 'tiny lights blinking hello', say: 'TWIN-kul' },
    { w: 'sleigh',   story: 'jujy', mean: 'a sled that glides over snow', say: 'slay' },
  ];

  const SUNS = [
    { d: 'M', lit: true }, { d: 'T', lit: true }, { d: 'W', lit: true },
    { d: 'T', lit: false }, { d: 'F', lit: true, today: true },
    { d: 'S', lit: false }, { d: 'S', lit: false },
  ];

  const PARENT = {
    stories: [
      { title: 'Miko and the Wobbly Bridge', author: 'Mom', pages: 24, status: 'Published', emoji: '🦊', wash: 'sunset' },
      { title: "Azi's Little Bhen", author: 'Dad', pages: 12, status: 'Published', img: 'assets/azi-kitchen.jpg' },
      { title: "Jujy's Christmas Adventure", author: 'Mom', pages: 14, status: 'Published', img: 'assets/jujy-cover.jpg' },
      { title: 'Miko and the Cave Door', author: 'Mom', pages: 9, status: 'Draft', note: 'art still painting', emoji: '🦇', wash: 'lilac' },
    ],
    retells: [
      { label: 'Miko — Chapter 2 retell', when: 'Tuesday', dur: '0:42' },
      { label: "Azi's Little Bhen retell", when: 'Sunday', dur: '1:05' },
    ],
    interests: ['motorcycles', 'dinosaurs', 'bridges', 'snow', 'space'],
    goals: [
      { label: 'Counting and numbers', on: true },
      { label: 'Star words (vocabulary)', on: true },
      { label: 'Naming feelings', on: true },
      { label: 'Living vs. nonliving', on: true },
      { label: 'Gujarati family words', on: true },
    ],
    gujarati: [
      { w: 'bhen', m: 'little sister' },
      { w: 'dada', m: 'grandpa' },
      { w: 'jaldi', m: 'quick!' },
    ],
  };

  window.LF = {
    WASH, BUDDIES, STORIES, BADGES, WORDS, SUNS, PARENT,
    quest: { b: 'Read one chapter and find a new star word ⭐', c: 'Read one chapter and find a new star word.' },
    cp: (obj, energy) => (typeof obj === 'string' ? obj : (energy === 'calm' ? obj.c : obj.b)),
  };
})();
