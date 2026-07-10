// Story World — real content. "Miko and the Wobbly Bridge" verbatim from
// ui_kits/story-world/story-data.js (lib/read/starter-stories.ts); the other
// stories follow the same data model (types/story.ts) and voice guidelines.

window.SW_STORIES = {

  // ---- Starter story 1 (emoji-on-gradient scenes) ----
  'miko-bridge': {
    id: 'miko-bridge',
    title: 'Miko and the Wobbly Bridge',
    coverEmoji: '🦊',
    coverBg: 'linear-gradient(160deg,#f97316,#fbbf24)',
    meta: '⏱ 5 min · counting · belly breaths',
    vocab: [
      { word: 'wobbly', meaning: 'shaky and wibbly, not steady' },
      { word: 'steady', meaning: 'strong and still, not moving' },
      { word: 'grateful', meaning: 'feeling warm and thankful inside' },
    ],
    retellPrompts: [
      'Who needed help in the story?',
      'What was wrong with the bridge?',
      'How did Miko calm down when he felt worried?',
      'What would YOU have built?',
    ],
    pages: [
      {
        text: 'Miko the fox zoomed through Zoomtown on his little blue moto. Vroom vroom! The wind whooshed past his ears.',
        scene: { bg: 'linear-gradient(160deg,#38bdf8,#a7f3d0)', emojis: ['🦊', '🏍️', '🏙️', '💨'] },
      },
      {
        text: 'Suddenly Miko squeezed his brakes. SCREEEECH! The bridge over Dino Canyon was wobbly. One, two, three planks were missing!',
        scene: { bg: 'linear-gradient(160deg,#fbbf24,#f97316)', emojis: ['🌉', '⚠️', '🦊'] },
        ask: {
          question: 'Can you count the missing planks with me? How many were missing?',
          praise: 'Yes! THREE planks were missing. Great counting!',
          hint: 'Let’s count together: one... two... THREE!',
          skill: 'counting',
        },
      },
      {
        text: 'Miko took one big belly breath. In... and out. His tummy felt softer. "I can’t fix this alone," he said. "But I know who can help!"',
        scene: { bg: 'linear-gradient(160deg,#a78bfa,#f0abfc)', emojis: ['🦊', '😮‍💨', '💜'] },
      },
      {
        text: 'Tara the spider swung down on a silver thread. "A web can fix it!" she said. But they needed something strong to hold the web.',
        scene: { bg: 'linear-gradient(160deg,#818cf8,#38bdf8)', emojis: ['🕷️', '🕸️', '🌉'] },
        choice: {
          prompt: 'What should hold the web?',
          options: [
            {
              label: 'Boulder’s long neck', emoji: '🦕',
              page: {
                text: 'Boulder stretched his looooong neck across the canyon like a crane. Tara spun her web around it — zip zip zip! The web pulled the bridge tight and steady.',
                scene: { bg: 'linear-gradient(160deg,#34d399,#a7f3d0)', emojis: ['🦕', '🕸️', '🌉', '✨'] },
              },
            },
            {
              label: 'Miko’s moto', emoji: '🏍️',
              page: {
                text: 'Miko parked his moto and Tara tied her web to it — zip zip zip! Miko held the brakes tight. The web pulled the bridge steady like a seatbelt.',
                scene: { bg: 'linear-gradient(160deg,#34d399,#a7f3d0)', emojis: ['🏍️', '🕸️', '🌉', '✨'] },
              },
            },
          ],
        },
      },
      {
        text: 'That night the soccer game was the best ever. Boulder gave everyone a ride on his neck, and Miko whispered, "I’m grateful for my friends." The end!',
        scene: { bg: 'linear-gradient(160deg,#1e3a8a,#7c3aed)', emojis: ['⚽', '🌟', '🦊', '🦕', '🕷️'] },
      },
    ],
  },

  // ---- Made by the Story Maker (emoji scenes — art is "still painting") ----
  'rocket-roar': {
    id: 'rocket-roar',
    title: 'The Rocket That Wouldn’t Roar',
    coverEmoji: '🚀',
    coverBg: 'linear-gradient(160deg,#1e3a8a,#7c3aed)',
    meta: '⏱ 4 min · counting down · just made',
    vocab: [
      { word: 'countdown', meaning: 'counting backwards to blastoff' },
      { word: 'rumble', meaning: 'a big, deep, shaky sound' },
      { word: 'brave', meaning: 'trying even when your tummy flutters' },
    ],
    retellPrompts: [
      'Why was the rocket so quiet?',
      'What numbers woke it up?',
      'Where would YOU fly the rocket?',
    ],
    pages: [
      {
        text: 'Miko tiptoed into the Star Garage. The big red rocket sat quiet as a sleeping bear. "Wake up, rocket!" said Miko. Click click... nothing.',
        scene: { bg: 'linear-gradient(160deg,#0f172a,#4338ca)', emojis: ['🚀', '🦊', '🔧'] },
      },
      {
        text: 'Tara peeked from the toolbox. "Rockets can’t roar without a countdown," she said. "It needs YOUR counting voice!"',
        scene: { bg: 'linear-gradient(160deg,#818cf8,#38bdf8)', emojis: ['🕷️', '🚀', '🔢'] },
        ask: {
          question: 'Can you count down from five with me? Five, four...',
          praise: 'Yes! FIVE, four, three, two, ONE. What a countdown!',
          hint: 'Start big and go down: f-f-five... four... three...',
          skill: 'counting down',
        },
      },
      {
        text: 'RRRROAR! The rocket rumbled awake and lifted into the stars. Miko held on tight and laughed. "Thank you for counting with me!" The end!',
        scene: { bg: 'linear-gradient(160deg,#1e3a8a,#7c3aed)', emojis: ['🚀', '🌟', '🦊', '✨'] },
      },
    ],
  },

  // ---- Real watercolor art — "Azi's Little Bhen" ----
  'azi-bhen': {
    id: 'azi-bhen',
    title: 'Azi’s Little Bhen',
    coverImage: 'assets/illustration/azi-kitchen.jpg',
    meta: '⏱ 4 min · counting · family',
    vocab: [
      { word: 'bhen', meaning: 'sister, in Gujarati' },
      { word: 'stir', meaning: 'to mix round and round' },
      { word: 'gentle', meaning: 'soft and careful, like a whisper' },
    ],
    retellPrompts: [
      'What did Azi and Dadi cook together?',
      'What does bhen mean?',
      'What will Azi show his little bhen one day?',
    ],
    pages: [
      {
        text: 'Azi helped Dadi stir the big silver pot. Round and round went the spoon. Something smelled warm and sweet.',
        image: 'assets/illustration/azi-kitchen.jpg',
        ask: {
          question: 'Look at the little plate. Can you count the eggs for Dadi?',
          praise: 'Yes! THREE eggs, ready to crack. Great counting!',
          hint: 'Point to each one: one... two... th-th-three!',
          skill: 'counting',
        },
      },
      {
        text: '"One day your little bhen will cook with us too," said Mama. Azi painted her a tiny picture — gentle, gentle — to save for her. The end!',
        image: 'assets/illustration/azi-scene-03.jpg',
      },
    ],
  },

  // ---- Real watercolor art — "Jujy & the Christmas Adventure" ----
  'jujy-christmas': {
    id: 'jujy-christmas',
    title: 'Jujy’s Christmas Adventure',
    coverImage: 'assets/illustration/jujy-cover.jpg',
    meta: '⏱ 8 min · kindness',
    vocab: [
      { word: 'glowing', meaning: 'shining with a soft, warm light' },
      { word: 'whisker', meaning: 'a cat’s tickly face hair' },
    ],
    retellPrompts: [
      'What was glowing in Jujy’s house?',
      'Who do you think was calling her name?',
    ],
    pages: [
      {
        text: 'Jujy the cat put on her red cape. Tonight the snow globe was glowing, and something tiny inside was calling her name...',
        image: 'assets/illustration/jujy-cover.jpg',
      },
      {
        text: 'She pressed one whisker to the glass. WHOOSH! Snow swirled all around, and Jujy landed softly in the little village. The adventure had begun!',
        scene: { bg: 'linear-gradient(160deg,#1e3a8a,#7c3aed)', emojis: ['🐈‍⬛', '❄️', '🏘️', '✨'] },
      },
    ],
  },
};

// Bookshelf order (mixing watercolor + gradient-emoji covers)
window.SW_SHELF = ['miko-bridge', 'azi-bhen', 'jujy-christmas'];

// Story Maker screen content
window.SW_MAKER = {
  heroes: [
    { emoji: '🦊', label: 'Miko' },
    { emoji: '🕷️', label: 'Tara' },
    { emoji: '🦕', label: 'Boulder' },
    { emoji: '👨🏽', label: 'Papa' },
    { emoji: '👵🏽', label: 'Dadi' },
    { emoji: '🎁', label: 'Surprise' },
  ],
  places: [
    { emoji: '🏙️', label: 'Zoomtown' },
    { emoji: '🚀', label: 'Star Garage' },
    { emoji: '🏜️', label: 'Dino Canyon' },
    { emoji: '🎲', label: 'Surprise' },
  ],
  heardIdea: '“A rocket that won’t roar!”',
  makingLines: [
    'Teaching the rocket to ROAR...',
    'Asking Miko to hop in...',
    'Counting down: five, four, three...',
    'Sprinkling star dust on the pages...',
  ],
};
