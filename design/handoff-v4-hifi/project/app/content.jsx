/* Little Fables — REAL CONTENT. The shelf, the chapters, the words, the
   scripts. All copy follows the constitution: buddy voice, one breath per
   line, genuinely open questions, no loss language, star words lowercase
   italic (*word* marks them for the lamplight text renderer). */

const LF_BOOKS = {
  miko: {
    id: "miko", title: "Miko and the Wobbly Bridge", pigment: "river", motif: "boat",
    coverArt: "MikoCoverArt",
    chapters: [
      {
        title: "The Wobbly Bridge",
        pages: [
          { type: "read", text: "The bridge swung under Miko's paws. It felt *wobbly,* like a boat made of rope.", art: "BridgeArt" },
          { type: "read", text: "The wind hummed in the ropes. Miko held on tight and listened.", art: "WindArt" },
          {
            type: "ask", art: "RopeArt",
            question: "What could Miko hold onto?",
            /* SIM: ASR transcript queue — two soft misses first (to show the
               listening + gentle-hint states), then the real answer */
            script: ["mm… hmm…", "(too quiet)", "the ropes!"],
            praise: (words) => "\u201C" + words + "\u201D — YES. Miko wraps both paws around the rope, just like you said.",
            hint: "Look under Miko's paws. What is the bridge made of?"
          },
          { type: "read", text: "One small step. Then another. Miko's belly felt *steady,* and the other side came closer.", art: "StepsArt" }
        ],
        cheer: "You crossed the whole wobbly bridge with Miko!",
        recapQ: "What made the bridge feel wobbly?",
        recapScript: ["the wind!"],
        recapPraise: (w) => "\u201C" + w + "\u201D — the wind DID wobble it. And Miko held on anyway.",
        hook: "Next time: Boulder comes to the gorge…"
      },
      {
        title: "Boulder Comes By",
        pages: [
          { type: "read", text: "On the far side stood Boulder, tall as a tree. His long neck made a bridge of its own.", art: "BoulderArt" },
          {
            type: "choice", art: null,
            prompt: "How should Miko cross back over the gorge?",
            choices: [
              { id: "neck", label: "Boulder's neck", art: "NeckPathArt", pigment: "sage" },
              { id: "moto", label: "Miko's moto", art: "MotoPathArt", pigment: "marigold" }
            ],
            freeform: "…or tell me YOUR idea!",
            ideaScript: ["bounce on the clouds!"],
            ink: {
              neck: "So Miko climbed up Boulder's long, long neck, holding on with all four paws…",
              moto: "So Miko rode his little moto over the boards — brrrm, brrrm — careful and quick…",
              idea: "So Miko tried YOUR way, and bounced from soft cloud to soft cloud, all the way across…"
            }
          },
          { type: "breathe", text: "Miko's tummy went up… and down. In through the nose… out through the mouth.", art: "BellyArt" }
        ],
        cheer: "Boulder says thank you for the good idea.",
        recapQ: "Whose idea helped Miko cross?",
        recapScript: ["mine!"],
        recapPraise: (w) => "\u201C" + w + "\u201D — it was! Your idea carried Miko all the way over.",
        hook: "Next time: Crossing Day…"
      },
      {
        title: "Crossing Day",
        pages: [
          { type: "read", text: "Crossing Day! *Chalo,* called Miko — let's go! Everyone lined up to try the bridge.", art: "CrossingArt", mystery: { word: "chalo", lang: "Hindi", meaning: "let's go!", pin: "marigold" } },
          { type: "read", text: "Friends crossed one by one, brave and *steady.* The whole bridge sang under their feet.", art: "SingingBridgeArt" },
          { type: "read", text: "Miko looked back at the wobbly ropes and felt *grateful.* What a bridge. What a day.", art: "BridgeArt" }
        ],
        cheer: "Three whole chapters. You and Miko crossed together.",
        recapQ: "How did Miko feel at the very end?",
        recapScript: ["happy! grateful!"],
        recapPraise: (w) => "\u201C" + w + "\u201D — grateful, right down to his paws.",
        hook: null /* book complete → celebration */
      }
    ],
    starWords: [
      { word: "wobbly", meaning: "shaky, like jelly", pin: "river" },
      { word: "steady", meaning: "strong and still", pin: "sage" },
      { word: "grateful", meaning: "a thank-you feeling in your heart", pin: "berry" }
    ]
  },
  moose: {
    id: "moose", title: "The Moose Who Knew About Bigness", pigment: "sage", motif: "leaf", coverArt: "MooseCoverArt",
    chapters: [{
      title: "Bigness",
      pages: [
        { type: "read", text: "Bigness is not how tall you are, said the moose. It is how much sky you can love.", art: "WindArt" },
        { type: "read", text: "The small bird loved ALL of it. So the moose tipped his antlers, moose-style, and bowed.", art: "MooseSkyArt" }
      ],
      cheer: "That is a very big way to think.", recapQ: "What did the moose say bigness is?", recapScript: ["loving the sky!"],
      recapPraise: (w) => "\u201C" + w + "\u201D — as much sky as you can love.", hook: null
    }],
    starWords: [{ word: "enormous", meaning: "big as the whole sky", pin: "sage" }]
  },
  papa: {
    id: "papa", title: "Papa Gets the Moon", pigment: "plum", motif: "moon", coverArt: "PapaCoverArt", windDown: true,
    chapters: [{
      title: "Papa Gets the Moon",
      pages: [
        { type: "read", text: "Papa climbed and climbed. The moon was patient. Moons usually are.", art: "StepsArt" },
        { type: "read", text: "Fè *dodo,* sang Papa on the way down — sleepy-sleep, little one, sleepy-sleep.", art: "PapaMoonArt", mystery: { word: "dodo", lang: "Creole", meaning: "sleepy-sleep", pin: "plum" } }
      ],
      cheer: "Shh — Papa made it down. Soft landing.", recapQ: "Who waited for Papa at the top?", recapScript: ["the moon!"],
      recapPraise: (w) => "\u201C" + w + "\u201D — the patient old moon.", hook: null
    }],
    starWords: [{ word: "patient", meaning: "good at waiting", pin: "plum" }]
  },
  cozy: {
    id: "cozy", title: "The Cozy Circle", pigment: "dusk", motif: "star", coverArt: "CozyCoverArt", windDown: true,
    /* "the otter book" — Peter the otter is right on the cover; the voice
       system resolves the child's fuzzy name to this object */
    chapters: [{
      title: "The Cozy Circle",
      pages: [
        { type: "read", text: "Round the little lantern, everyone fit. Peter the otter squeezed in last, *agua* dripping from his whiskers.", art: "CozyRingArt", mystery: { word: "agua", lang: "Spanish", meaning: "water", pin: "river" } },
        { type: "read", text: "Nobody talked. The lantern did the talking, in warm and quiet gold.", art: "CozyRingArt" }
      ],
      cheer: "You fit in the circle too.", recapQ: "What was dripping from Peter's whiskers?", recapScript: ["agua! water!"],
      recapPraise: (w) => "\u201C" + w + "\u201D — agua. Water, in Peter's favorite word.", hook: null
    }],
    starWords: [{ word: "cozy", meaning: "warm, small, and safe", pin: "dusk" }]
  },
  bramble: {
    id: "bramble", title: "Bramble's Hello", pigment: "marigold", motif: "leaf", coverArt: "BrambleCoverArt",
    chapters: [{
      title: "Bramble's Hello",
      pages: [
        { type: "read", text: "Bramble practiced his hello all morning. Hedgehogs like to get hellos just right.", art: "BrambleWaveArt" },
        { type: "read", text: "When you came by, he took a breath — HELLO! — and every quill stood up proud.", art: "BrambleWaveArt" }
      ],
      cheer: "Hello, Bramble. Hello, you.", recapQ: "What did Bramble practice?", recapScript: ["his hello!"],
      recapPraise: (w) => "\u201C" + w + "\u201D — his very best hello.", hook: null
    }],
    starWords: [{ word: "proud", meaning: "tall-inside happy", pin: "marigold" }]
  },
  azi: {
    id: "azi", title: "Azi's Little Bhen", pigment: "berry", motif: "star", coverArt: "AziCoverArt",
    chapters: [{
      title: "Azi's Little Bhen",
      pages: [
        { type: "read", text: "Azi held his little *bhen's* hand. Small steps for her, small steps for him.", art: "AziBhenArt", mystery: { word: "bhen", lang: "Gujarati", meaning: "sister", pin: "berry" } },
        { type: "read", text: "\u201CChalo,\u201D said Azi, the way Dada says it. And his bhen laughed, and off they went.", art: "AziBhenArt" }
      ],
      cheer: "Big brothers know the way.", recapQ: "Who held Azi's hand?", recapScript: ["his bhen! his sister!"],
      recapPraise: (w) => "\u201C" + w + "\u201D — his bhen. His little sister.", hook: null
    }],
    starWords: []
  },
  bird: {
    id: "bird", title: "The Bird Who Waved", pigment: "butter", motif: "star", coverArt: "BirdCoverArt",
    authored: true, byline: "by Azad",
    chapters: [{
      title: "The Bird Who Waved",
      pages: [
        { type: "read", text: "The bird flew over my house and waved with one wing. I waved back with one hand.", art: "BirdCoverArt" }
      ],
      cheer: "Your bird story. Still one of my favorites.", recapQ: "Who waved first?", recapScript: ["the bird!"],
      recapPraise: (w) => "\u201C" + w + "\u201D — one wing, straight at you.", hook: null
    }],
    starWords: []
  },
  balloon: {
    id: "balloon", title: "Peter and the Runaway Balloon", pigment: "berry", motif: "star", coverArt: "BalloonCoverArt",
    authored: true, byline: "by Azad", madeInKitchen: true,
    chapters: [{
      title: "Peter and the Runaway Balloon",
      pages: [
        { type: "read", text: "Peter found a big red balloon, round as the moon. It was for his bhen — the best present ever.", art: "BalloonCoverArt" },
        { type: "read", text: "WHOOSH — the wind snatched it away! But Peter is the sneakiest trickster there is. He tricked the wind right back.", art: "WindArt" }
      ],
      cheer: "YOUR story. Peter, the balloon, the wind — all yours.", recapQ: "Who was the balloon for?", recapScript: ["his bhen!"],
      recapPraise: (w) => "\u201C" + w + "\u201D — for his bhen, and she loved it.", hook: null
    }],
    starWords: []
  }
};

const LF_SHELF_ORDER = ["miko", "moose", "papa", "cozy", "bramble", "azi"];

/* ---------- the language wall ---------- */
const LF_WALL = [
  { word: "bhen", lang: "Gujarati", meaning: "sister", from: "Azi's Little Bhen", pin: "berry" },
  { word: "chalo", lang: "Hindi", meaning: "let's go!", from: "Miko — Crossing Day", pin: "marigold", mystery: true },
  { word: "agua", lang: "Spanish", meaning: "water", from: "The Cozy Circle", pin: "river" },
  { word: "dodo", lang: "Creole", meaning: "sleepy-sleep", from: "Papa Gets the Moon", pin: "plum" },
  { word: "wobbly", lang: "star words", meaning: "shaky, like jelly", from: "Miko and the Wobbly Bridge", pin: "river" },
  { word: "steady", lang: "star words", meaning: "strong and still", from: "Miko and the Wobbly Bridge", pin: "sage" },
  { word: "grateful", lang: "star words", meaning: "a thank-you feeling in your heart", from: "Miko and the Wobbly Bridge", pin: "berry" }
];

/* ---------- medallions ---------- */
const LF_MEDALS = {
  suns7: { id: "suns7", label: "seven suns", pigment: "marigold", motif: "SunMotif", line: "Seven reading suns on the sill." },
  bridge: { id: "bridge", label: "bridge crosser", pigment: "river", motif: "BridgeMotif", line: "You crossed every wobbly plank. Bridge crosser — that's you." },
  storyteller: { id: "storyteller", label: "storyteller", pigment: "sage", motif: "PencilMotif", line: "Your first made-up story lives on the shelf now. Storyteller." }
};

/* ---------- home voice scripts (SIM: ASR + intent resolution) ---------- */
const LF_VOICE_SCRIPT = [
  { kind: "success", heard: "the otter book!", targetBook: "cozy", line: "The otter book? Here we GO!" },
  { kind: "lowconf", heard: "the mmm—buh?", line: "Hmm. The MOOSE book? Or Papa's moon book?", options: [{ book: "moose", label: "the moose book" }, { book: "papa", label: "Papa's moon book" }] },
  { kind: "fallback", line: "I'll show you — this one is waiting." }, /* buddy points; tap path lights */
  { kind: "kitchen", heard: "make a story!", line: "A brand-new story? To the desk!" }
];

/* ---------- the story kitchen (SIM: interview + generation pipeline) ---------- */
const LF_KITCHEN = {
  q1: "If we make a brand-new story… what should it be about?",
  q1Script: ["peter finds a big red balloon", "a zombie eats the moon"],
  ack1: (a) => "\u201C" + a.replace(/^peter/i, "Peter") + "\u201D! And why does Peter want that balloon?",
  redirect: "Hmm — zombies aren't in our world… but Peter is the sneakiest trickster there IS. Should Peter be the spooky one?",
  q2Script: ["to give it to his bhen"],
  ack2: "A present for his bhen — that's kind. And what could go WRONG?",
  q3Script: ["the wind takes it away"],
  readback: "So: Peter finds a big red balloon. He wants it for his bhen. But the wind snatches it away! Did I get it right?",
  fillIn: "Quiet is okay. I'll start us off: maybe Peter finds something shiny…",
  fillInWant: "peter finds something shiny",
  writingWords: "peter finds a big red balloon for his bhen but the wind takes it away",
  narrate: "I'm painting your story…",
  capLine: "The story desk needs to rest until tomorrow — let's READ one instead!"
};

/* ---------- retellings (parent corner data) ---------- */
const LF_RETELLINGS = [
  {
    book: "Miko and the Wobbly Bridge", date: "today, 4:12 pm", secs: 38,
    transcript: "Miko went on the bridge and it went woooobly wobbly and he holded the rope SO tight and then he did belly breathing like whooo and then he was steady and he crossed it!"
  },
  {
    book: "Bramble's Hello", date: "Tuesday, 8:40 am", secs: 21,
    transcript: "Bramble was practicing hello hello HELLO and his prickles standed up and he was proud."
  }
];

const LF_INTERVIEW_LOG = [
  { q: "What should it be about?", a: "peter finds a big red balloon" },
  { q: "Why does Peter want it?", a: "to give it to his bhen" },
  { q: "What could go wrong?", a: "the wind takes it away" }
];

Object.assign(window, { LF_BOOKS, LF_SHELF_ORDER, LF_WALL, LF_MEDALS, LF_VOICE_SCRIPT, LF_KITCHEN, LF_RETELLINGS, LF_INTERVIEW_LOG });
