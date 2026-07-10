// Story World — real content. "Miko and the Wobbly Bridge" text verbatim from
// ui_kits/story-world/story-data.js; scenes now carry mocked art (ink & wash,
// heirloom palette) standing in for the coming art generation. Every story is
// parent-made; the child reads and the app teaches along the way.

window.SW_STORIES = {

  'miko-bridge': {
    id: 'miko-bridge',
    title: 'Miko and the Wobbly Bridge',
    coverImage: 'assets/art/miko-cover.png',
    by: 'Made by Papa',
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
        image: 'assets/art/miko-01-zoomtown.png',
      },
      {
        text: 'Suddenly Miko squeezed his brakes. SCREEEECH! The bridge over Dino Canyon was wobbly. One, two, three planks were missing!',
        image: 'assets/art/miko-02-bridge.png',
        ask: {
          question: 'Can you count the missing planks with me? How many were missing?',
          praise: 'Yes! THREE planks were missing. Great counting!',
          hint: 'Let’s count together: one... two... THREE!',
          skill: 'counting',
        },
      },
      {
        text: 'Miko took one big belly breath. In... and out. His tummy felt softer. "I can’t fix this alone," he said. "But I know who can help!"',
        image: 'assets/art/miko-03-breath.png',
        ask: {
          question: 'Miko’s tummy felt tight and worried. Can you take one big belly breath with him? In... and out.',
          praise: 'Ahhh. One BIG belly breath. Miko’s tummy feels softer — does yours?',
          hint: 'Hands on your tummy. Breathe in slowly... now let it whoosh out.',
          skill: 'feelings',
        },
      },
      {
        text: 'Tara the spider swung down on a silver thread. "A web can fix it!" she said. But they needed something strong to hold the web.',
        image: 'assets/art/miko-04-web.png',
        choice: {
          prompt: 'What should hold the web?',
          options: [
            {
              label: 'Boulder’s long neck', emoji: '🦕',
              page: {
                text: 'Boulder stretched his looooong neck across the canyon like a crane. Tara spun her web around it — zip zip zip! The web pulled the bridge tight and steady.',
                image: 'assets/art/miko-05-fixed-neck.png',
              },
            },
            {
              label: 'Miko’s moto', emoji: '🏍️',
              page: {
                text: 'Miko parked his moto and Tara tied her web to it — zip zip zip! Miko held the brakes tight. The web pulled the bridge steady like a seatbelt.',
                image: 'assets/art/miko-05-fixed-moto.png',
              },
            },
          ],
        },
      },
      {
        text: 'That night the soccer game was the best ever. Boulder gave everyone a ride on his neck, and Miko whispered, "I’m grateful for my friends." The end!',
        image: 'assets/art/miko-06-night.png',
      },
    ],
  },

  // ---- Real watercolor book art (full-bleed pages) ----
  'azi-bhen': {
    id: 'azi-bhen',
    title: 'Azi’s Little Bhen',
    coverImage: 'assets/illustration/azi-kitchen.jpg',
    by: 'Made by Mom',
    meta: '⏱ 4 min · counting · family words',
    bleed: true,
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
        bleed: true,
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
        bleed: true,
        ask: {
          question: 'Bhen means little sister. Can you say bhen?',
          praise: 'BHEN! Beautiful. Bhen means little sister.',
          hint: 'Try it slowly: b-b-bhen.',
          skill: 'family words',
        },
      },
    ],
  },

  'jujy-christmas': {
    id: 'jujy-christmas',
    title: 'Jujy’s Christmas Adventure',
    coverImage: 'assets/illustration/jujy-cover.jpg',
    by: 'Made by Dadi',
    meta: '⏱ 8 min · kindness',
    bleed: true,
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
        bleed: true,
      },
      {
        text: 'She pressed one whisker to the glass. WHOOSH! Snow swirled all around, and Jujy landed softly in the little village.',
        image: 'assets/art/jujy-02-village.png',
        ask: {
          question: 'Look at the little houses. Who do you think is calling Jujy’s name?',
          praise: 'Ooooh, what a good guess. Let’s find out together on the next page!',
          hint: 'Look at the lit windows — someone tiny lives there.',
          skill: 'guessing',
        },
      },
    ],
  },
};

// Kid bookshelf order
window.SW_SHELF = ['miko-bridge', 'azi-bhen', 'jujy-christmas'];

// Parent story list (the library the family curates)
window.SW_PARENT_STORIES = [
  { id: 'miko-bridge', title: 'Miko and the Wobbly Bridge', by: 'Papa', pages: 5, status: 'Published', teaches: 'counting, belly breaths' },
  { id: 'azi-bhen', title: 'Azi’s Little Bhen', by: 'Mom', pages: 2, status: 'Published', teaches: 'counting, family words' },
  { id: 'jujy-christmas', title: 'Jujy’s Christmas Adventure', by: 'Dadi', pages: 2, status: 'Published', teaches: 'kindness, guessing' },
  { id: null, title: 'The Rocket That Wouldn’t Roar', by: 'Papa', pages: 3, status: 'Draft', teaches: 'counting down' },
];
