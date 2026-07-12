// Little Fables v3 Drawn Room — local fonts (Alegreya, YoungSerif, Caveat).
// Loaded once per session via next/font/local; CSS vars are consumed by the
// .lf-room token scope in app/read/read.css.

import localFont from 'next/font/local'

// Alegreya — body reading. Variable weight axis.
export const alegreya = localFont({
  src: [
    { path: '../../public/fonts/lf-v3/Alegreya[wght].ttf', style: 'normal' },
    { path: '../../public/fonts/lf-v3/Alegreya-Italic[wght].ttf', style: 'italic' },
  ],
  variable: '--font-alegreya',
  display: 'swap',
  fallback: ['Iowan Old Style', 'Georgia', 'serif'],
})

// YoungSerif — display / titles.
export const youngSerif = localFont({
  src: [{ path: '../../public/fonts/lf-v3/YoungSerif-Regular.ttf', style: 'normal' }],
  variable: '--font-youngserif',
  display: 'swap',
  fallback: ['Iowan Old Style', 'Georgia', 'serif'],
})

// Caveat — the CHILD'S OWN WORDS only, in the WritingMoment. Never UI.
export const caveat = localFont({
  src: [{ path: '../../public/fonts/lf-v3/Caveat[wght].ttf', style: 'normal' }],
  variable: '--font-caveat',
  display: 'swap',
  fallback: ['cursive'],
})
