/* Little Fables — drawn art, part 1: the buddy creatures + book cover art.
   Same hand as assets/north-star.svg: loose-but-confident ink (#46362A, never
   #000) over watercolor wash; wash via #lf-wash-edge, lines via #lf-wobble. */

const INK = "var(--ink, #46362A)";
const W = { filter: "url(#lf-wash-edge)" };
const L = { fill: "none", stroke: INK, strokeWidth: 2.2, filter: "url(#lf-wobble)" };

/* =================== the six buddies =================== */
/* Each is drawn once; poses are carried by the CreatureSprite wrapper
   (lean-in to listen, glow to celebrate, tilt to point). The bear is the
   design system's own Buddy component with full drawn poses. */

function OtterArt() {
  return (
    <g>
      <g {...W}>
        <path d="M96 178 q -26 -8 -24 -46 q 2 -44 30 -62 q 10 -6 22 0 q 28 18 28 62 q 0 38 -24 46 q -16 6 -32 0" fill="#8A6A48" opacity="0.85"></path>
        <ellipse cx="112" cy="132" rx="20" ry="34" fill="#E8D3A8" opacity="0.9"></ellipse>
        <circle cx="112" cy="62" r="27" fill="#8A6A48" opacity="0.9"></circle>
        <ellipse cx="112" cy="72" rx="15" ry="11" fill="#E8D3A8" opacity="0.95"></ellipse>
        <circle cx="92" cy="42" r="7.5" fill="#8A6A48" opacity="0.95"></circle>
        <circle cx="132" cy="42" r="7.5" fill="#8A6A48" opacity="0.95"></circle>
        <path d="M124 172 q 34 10 44 -12 q 6 -16 -8 -20 q -4 18 -20 22" fill="#75583B" opacity="0.85"></path>
        <ellipse cx="88" cy="180" rx="16" ry="8" fill="#75583B" opacity="0.8"></ellipse>
        <ellipse cx="130" cy="182" rx="16" ry="8" fill="#75583B" opacity="0.8"></ellipse>
      </g>
      <g {...L}>
        <path d="M98 176 q -24 -10 -22 -44 q 2 -44 30 -62 q 10 -6 22 0 q 28 18 28 62 q 0 34 -22 44"></path>
        <path d="M87 51 A 27 27 0 1 1 137 51"></path>
        <circle cx="92" cy="42" r="7.5"></circle><circle cx="132" cy="42" r="7.5"></circle>
        <path d="M124 170 q 32 10 42 -10 q 6 -15 -8 -19" strokeWidth="2"></path>
        <ellipse cx="88" cy="180" rx="16" ry="8"></ellipse><ellipse cx="130" cy="182" rx="16" ry="8"></ellipse>
        <path d="M104 76 q 8 6 16 0" strokeWidth="1.8"></path>
        <path d="M84 66 l -12 -2 M84 72 l -11 3 M140 66 l 12 -2 M140 72 l 11 3" strokeWidth="1.3"></path>
      </g>
      <ellipse cx="112" cy="66" rx="4.4" ry="3.4" fill={INK}></ellipse>
      <circle cx="100" cy="56" r="2.6" fill={INK}></circle><circle cx="124" cy="56" r="2.6" fill={INK}></circle>
      <path d="M96 66 q 3 2 6 0 M126 66 q 3 2 6 0" stroke="#D95B43" strokeWidth="2" opacity="0.4" fill="none" filter="url(#lf-wobble)"></path>
    </g>
  );
}

function AnkyArt() {
  return (
    <g>
      <g {...W}>
        <path d="M34 150 q 4 -44 56 -46 q 54 -2 62 40 q 4 26 -22 32 l -76 0 q -22 -6 -20 -26" fill="#7C9A62" opacity="0.8"></path>
        <path d="M60 106 q 4 -12 14 -6 M84 100 q 4 -14 16 -7 M112 99 q 5 -13 16 -5 M138 106 q 6 -11 14 -3" fill="#5F7C48" opacity="0.85"></path>
        <circle cx="46" cy="96" r="22" fill="#94AF7C" opacity="0.9"></circle>
        <path d="M148 152 q 26 2 38 -12 q 8 -10 -2 -16 q -10 12 -30 10" fill="#5F7C48" opacity="0.8"></path>
        <circle cx="186" cy="130" r="12" fill="#94AF7C" opacity="0.9"></circle>
        <ellipse cx="66" cy="178" rx="13" ry="7" fill="#5F7C48" opacity="0.85"></ellipse>
        <ellipse cx="122" cy="180" rx="13" ry="7" fill="#5F7C48" opacity="0.85"></ellipse>
      </g>
      <g {...L}>
        <path d="M36 148 q 4 -42 54 -44 q 54 -2 62 38 q 4 26 -22 32"></path>
        <circle cx="46" cy="96" r="22"></circle>
        <path d="M60 104 q 4 -12 14 -6 M84 98 q 4 -14 16 -7 M112 97 q 5 -13 16 -5 M138 104 q 6 -11 14 -3" strokeWidth="1.8"></path>
        <path d="M148 150 q 26 2 38 -12 q 8 -10 -2 -16" strokeWidth="2"></path>
        <circle cx="186" cy="130" r="12"></circle>
        <ellipse cx="66" cy="178" rx="13" ry="7"></ellipse><ellipse cx="122" cy="180" rx="13" ry="7"></ellipse>
        <path d="M34 104 q -6 4 -6 10" strokeWidth="1.6"></path>
      </g>
      <circle cx="40" cy="92" r="2.5" fill={INK}></circle><circle cx="54" cy="92" r="2.5" fill={INK}></circle>
      <path d="M42 102 q 4 3 9 0" stroke={INK} strokeWidth="1.8" fill="none" filter="url(#lf-wobble)"></path>
      <path d="M36 100 q 2.6 1.8 5 0" stroke="#D95B43" strokeWidth="1.8" opacity="0.4" fill="none" filter="url(#lf-wobble)"></path>
    </g>
  );
}

function MotoArt() {
  /* moto — the scooter mouse. A small grey mouse who never leaves his
     little marigold scooter (the same moto Miko borrows in chapter two). */
  return (
    <g>
      <g {...W}>
        <circle cx="70" cy="168" r="17" fill="#5B4637" opacity="0.55"></circle>
        <circle cx="152" cy="168" r="17" fill="#5B4637" opacity="0.55"></circle>
        <path d="M56 152 q 40 -18 92 -2 l -6 14 q -40 -12 -80 2 z" fill="#E2A93B" opacity="0.85"></path>
        <path d="M138 148 L150 108 l 14 -4" fill="none" stroke="#E2A93B" strokeWidth="9" opacity="0.85"></path>
        <path d="M96 142 q -4 -38 20 -56 q 16 -10 28 4 q 14 18 2 52" fill="#9A93A8" opacity="0.85"></path>
        <circle cx="126" cy="74" r="20" fill="#9A93A8" opacity="0.9"></circle>
        <circle cx="112" cy="56" r="10" fill="#9A93A8" opacity="0.95"></circle>
        <circle cx="142" cy="56" r="10" fill="#9A93A8" opacity="0.95"></circle>
        <circle cx="112" cy="57" r="4.6" fill="#E8D3A8" opacity="0.95"></circle>
        <circle cx="142" cy="57" r="4.6" fill="#E8D3A8" opacity="0.95"></circle>
        <ellipse cx="118" cy="118" rx="13" ry="18" fill="#E8D3A8" opacity="0.85"></ellipse>
      </g>
      <g {...L}>
        <circle cx="70" cy="168" r="17"></circle><circle cx="152" cy="168" r="17"></circle>
        <path d="M58 150 q 40 -16 88 -2"></path>
        <path d="M140 146 L151 108 l 13 -4" strokeWidth="2.4"></path>
        <path d="M98 140 q -4 -36 18 -54 q 16 -10 28 4 q 14 18 2 50"></path>
        <path d="M112 88 A 20 20 0 1 1 142 86" strokeWidth="2"></path>
        <circle cx="112" cy="56" r="10"></circle><circle cx="142" cy="56" r="10"></circle>
        <path d="M96 140 q -18 10 -28 2" strokeWidth="2"></path>
      </g>
      <ellipse cx="127" cy="82" rx="3.6" ry="2.8" fill={INK}></ellipse>
      <circle cx="119" cy="72" r="2.3" fill={INK}></circle><circle cx="136" cy="72" r="2.3" fill={INK}></circle>
      <path d="M114 80 q 2.6 1.8 5 0 M133 80 q 2.6 1.8 5 0" stroke="#D95B43" strokeWidth="1.8" opacity="0.4" fill="none" filter="url(#lf-wobble)"></path>
    </g>
  );
}

function RockyArt() {
  /* rocky — the raccoon. Dusk-grey with the drawn mask and ringed tail. */
  return (
    <g>
      <g {...W}>
        <path d="M78 176 q -18 -10 -14 -48 q 4 -42 34 -56 q 12 -6 24 0 q 30 14 32 56 q 2 38 -16 48 q -30 10 -60 0" fill="#8B93A8" opacity="0.85"></path>
        <ellipse cx="110" cy="136" rx="20" ry="30" fill="#D8D3C4" opacity="0.9"></ellipse>
        <circle cx="110" cy="62" r="28" fill="#8B93A8" opacity="0.9"></circle>
        <path d="M88 58 q 10 -10 20 -2 M112 56 q 10 -8 20 2" fill="#4A5468" opacity="0.75"></path>
        <ellipse cx="96" cy="58" rx="10" ry="7" fill="#4A5468" opacity="0.8" transform="rotate(-12 96 58)"></ellipse>
        <ellipse cx="124" cy="58" rx="10" ry="7" fill="#4A5468" opacity="0.8" transform="rotate(12 124 58)"></ellipse>
        <ellipse cx="110" cy="74" rx="13" ry="9" fill="#D8D3C4" opacity="0.95"></ellipse>
        <path d="M86 36 l 8 12 M134 36 l -8 12" stroke="#4A5468" strokeWidth="11" strokeLinecap="round" opacity="0.85"></path>
        <path d="M140 168 q 30 6 40 -14 q 6 -14 -6 -18 q -6 16 -22 18" fill="#6E7891" opacity="0.85"></path>
        <path d="M152 166 l 6 -14 M166 162 l 6 -13" stroke="#3F4759" strokeWidth="7" opacity="0.7"></path>
      </g>
      <g {...L}>
        <path d="M80 174 q -16 -12 -12 -46 q 4 -42 32 -54 q 12 -6 24 0 q 30 14 32 54 q 2 36 -14 46"></path>
        <path d="M84 50 A 28 28 0 1 1 136 50"></path>
        <path d="M84 34 l 10 14 M136 34 l -10 14" strokeWidth="2"></path>
        <path d="M140 166 q 28 6 38 -12 q 6 -13 -6 -17" strokeWidth="2"></path>
        <path d="M102 78 q 8 6 16 0" strokeWidth="1.8"></path>
      </g>
      <ellipse cx="110" cy="70" rx="4.2" ry="3.2" fill={INK}></ellipse>
      <circle cx="97" cy="59" r="2.6" fill="#F9F2E3"></circle><circle cx="123" cy="59" r="2.6" fill="#F9F2E3"></circle>
      <circle cx="97" cy="59" r="1.6" fill={INK}></circle><circle cx="123" cy="59" r="1.6" fill={INK}></circle>
    </g>
  );
}

function RustyArt() {
  /* rusty — the terracotta pup with one floppy ear. */
  return (
    <g>
      <g {...W}>
        <path d="M84 178 q -20 -10 -16 -50 q 4 -40 32 -54 q 12 -6 24 0 q 28 14 30 54 q 2 40 -14 50 q -28 10 -56 0" fill="#C97B5A" opacity="0.85"></path>
        <ellipse cx="112" cy="138" rx="19" ry="28" fill="#EFD8B8" opacity="0.9"></ellipse>
        <circle cx="112" cy="62" r="28" fill="#C97B5A" opacity="0.9"></circle>
        <path d="M88 42 q -14 -2 -16 16 q 0 12 10 16 q 2 -20 12 -28" fill="#A85D40" opacity="0.9"></path>
        <path d="M136 40 q 16 0 16 20 q 0 22 -16 22 q -6 0 -8 -8 q 8 -12 4 -30" fill="#A85D40" opacity="0.9"></path>
        <ellipse cx="112" cy="76" rx="14" ry="10" fill="#EFD8B8" opacity="0.95"></ellipse>
        <circle cx="98" cy="52" r="9" fill="#EFD8B8" opacity="0.55"></circle>
        <path d="M142 172 q 18 -2 22 -18" fill="none" stroke="#A85D40" strokeWidth="10" strokeLinecap="round" opacity="0.85"></path>
        <ellipse cx="92" cy="182" rx="14" ry="7" fill="#A85D40" opacity="0.8"></ellipse>
        <ellipse cx="132" cy="182" rx="14" ry="7" fill="#A85D40" opacity="0.8"></ellipse>
      </g>
      <g {...L}>
        <path d="M86 176 q -18 -12 -14 -48 q 4 -40 30 -52 q 12 -6 24 0 q 28 14 30 52 q 2 36 -12 48"></path>
        <path d="M88 40 q -14 0 -16 17 q 0 12 10 16"></path>
        <path d="M136 38 q 16 2 16 21 q 0 22 -16 22" strokeWidth="2"></path>
        <path d="M89 47 A 28 28 0 0 1 135 45"></path>
        <path d="M142 170 q 18 -2 22 -17" strokeWidth="2"></path>
        <ellipse cx="92" cy="182" rx="14" ry="7"></ellipse><ellipse cx="132" cy="182" rx="14" ry="7"></ellipse>
        <path d="M104 80 q 8 6 16 0" strokeWidth="1.8"></path>
      </g>
      <ellipse cx="112" cy="70" rx="4.6" ry="3.6" fill={INK}></ellipse>
      <circle cx="100" cy="58" r="2.6" fill={INK}></circle><circle cx="124" cy="58" r="2.6" fill={INK}></circle>
      <path d="M96 68 q 3 2 6 0 M126 68 q 3 2 6 0" stroke="#D95B43" strokeWidth="2" opacity="0.4" fill="none" filter="url(#lf-wobble)"></path>
    </g>
  );
}

const CREATURES = {
  bear:  { name: "the bear",  intro: "Hello. I saved you a spot on the rug.", art: null },
  otter: { name: "otter",     intro: "I know ALL the river stories.", art: OtterArt },
  anky:  { name: "little anky", intro: "I am small but my tail is brave.", art: AnkyArt },
  moto:  { name: "moto",      intro: "Beep beep. Want to go somewhere?", art: MotoArt },
  rocky: { name: "rocky",     intro: "I found this shiny thing for you.", art: RockyArt },
  rusty: { name: "rusty",     intro: "I will sit VERY still for stories.", art: RustyArt }
};

/* CreatureSprite — one drawn creature with shared pose behaviors.
   pose: idle (breath) | listening (lean-in, no red dots anywhere) |
   pointing (tilt toward target) | celebrating (lantern-light glow).
   kind="bear" uses the design system's Buddy (full drawn poses). */
function CreatureSprite({ kind = "bear", pose = "idle", size = 200, style }) {
  const { Buddy } = window.LittleFablesDesignSystem_d603a2;
  if (kind === "bear") return <Buddy pose={pose} size={size} style={style}></Buddy>;
  const Art = CREATURES[kind].art;
  const lean = pose === "listening" ? "rotate(-5deg) translateX(-4px)" : pose === "pointing" ? "rotate(4deg) translateX(3px)" : "none";
  return (
    <svg viewBox="0 0 220 200" width={size * 1.1} height={size} style={{ display: "block", overflow: "visible", ...style }} role="img" aria-label={CREATURES[kind].name + ", " + pose}>
      {pose === "celebrating" && (
        <g className="lfp-fade-in">
          <ellipse cx="110" cy="110" rx="100" ry="88" fill="var(--glow-lamplight)" opacity="0.7" filter="url(#lf-wash-edge)"></ellipse>
          <circle cx="40" cy="40" r="3" fill="#EFC85C"></circle><circle cx="182" cy="34" r="2.5" fill="#F3C77A"></circle><circle cx="110" cy="14" r="3" fill="#EFC85C"></circle>
        </g>
      )}
      <ellipse cx="112" cy="188" rx="58" ry="9" fill="var(--shadow-warm)" filter="url(#lf-wash-edge)"></ellipse>
      <g className="lfp-breath" style={{ transform: lean !== "none" ? lean : undefined, transformOrigin: "50% 92%", transition: "transform 400ms var(--ease-settle)" }}>
        <Art></Art>
      </g>
    </svg>
  );
}

/* =================== book cover art (drawn, ~real) =================== */
/* Small pieces framed by the BookCover component at shelf scale. */

function MikoCoverArt() {
  return (
    <svg viewBox="0 0 72 52" width="58">
      <path d="M6 40 Q 36 20 66 40" fill="none" stroke="#C89A5E" strokeWidth="9" opacity="0.8" filter="url(#lf-wash-edge)"></path>
      <ellipse cx="36" cy="27" rx="10" ry="7.5" fill="#E2A93B" opacity="0.95" filter="url(#lf-wash-edge)"></ellipse>
      <g fill="none" stroke="#46362A" filter="url(#lf-wobble)">
        <path d="M6 40 Q 36 20 66 40" strokeWidth="1.8"></path>
        <path d="M10 30 l0 12 M62 30 l0 12" strokeWidth="2"></path>
        <ellipse cx="36" cy="27" rx="10" ry="7.5" strokeWidth="1.6"></ellipse>
        <path d="M44 23 q 6 -6 8 -1 q -2 5 -8 4" strokeWidth="1.4"></path>
      </g>
      <circle cx="33" cy="25.5" r="1.2" fill="#46362A"></circle>
    </svg>
  );
}
function MooseCoverArt() {
  return (
    <svg viewBox="0 0 72 52" width="56">
      <path d="M20 50 q 2 -22 16 -26 q 16 -4 20 -14 l 8 0 l 0 40 z" fill="#5B4637" opacity="0.8" filter="url(#lf-wash-edge)"></path>
      <g fill="none" stroke="#46362A" strokeWidth="1.6" filter="url(#lf-wobble)">
        <path d="M56 12 q 2 -8 -5 -12 M57 11 q 8 -3 10 -11 M62 4 q 5 1 7 -3"></path>
      </g>
      <circle cx="59" cy="17" r="1.2" fill="#F9F2E3"></circle>
    </svg>
  );
}
function PapaCoverArt() {
  return (
    <svg viewBox="0 0 72 60" width="54">
      <path d="M46 8 a 15 15 0 1 0 11 25 a 12 12 0 0 1 -11 -25" fill="#EFC85C" opacity="0.95" filter="url(#lf-wash-edge)"></path>
      <g fill="none" stroke="#F0E6CF" strokeWidth="1.7" filter="url(#lf-wobble)" opacity="0.95">
        <path d="M10 58 L30 18 M18 58 L38 18"></path>
        <path d="M16 46 l12 0 M20 36 l12 0 M24 27 l11 0"></path>
      </g>
      <circle cx="14" cy="12" r="1.3" fill="#F0E6CF"></circle><circle cx="28" cy="6" r="1.1" fill="#F0E6CF"></circle>
    </svg>
  );
}
function CozyCoverArt() {
  /* the cozy circle — everyone around one lantern (peter the otter included) */
  return (
    <svg viewBox="0 0 72 56" width="58">
      <ellipse cx="36" cy="34" rx="26" ry="14" fill="#F3C77A" opacity="0.5" filter="url(#lf-wash-edge)"></ellipse>
      <rect x="31" y="20" width="10" height="14" rx="3" fill="#EFC85C" opacity="0.95" filter="url(#lf-wash-edge)"></rect>
      <g fill="#5B4637" opacity="0.8" filter="url(#lf-wash-edge)">
        <circle cx="14" cy="36" r="6"></circle><circle cx="26" cy="42" r="5.4"></circle>
        <circle cx="46" cy="42" r="5.4"></circle><circle cx="58" cy="36" r="6"></circle>
      </g>
      <g fill="none" stroke="#46362A" strokeWidth="1.5" filter="url(#lf-wobble)">
        <rect x="31" y="20" width="10" height="14" rx="3"></rect>
        <path d="M33 20 q 3 -5 6 0"></path>
        <circle cx="36" cy="27" r="2.2"></circle>
      </g>
    </svg>
  );
}
function BrambleCoverArt() {
  /* bramble the hedgehog, waving hello */
  return (
    <svg viewBox="0 0 72 56" width="54">
      <path d="M18 44 q -4 -22 18 -26 q 24 -4 26 18 q 1 10 -8 12 z" fill="#8A6A48" opacity="0.85" filter="url(#lf-wash-edge)"></path>
      <path d="M22 22 l6 -8 M32 17 l4 -9 M42 16 l2 -9 M50 19 l5 -8 M57 25 l7 -6" stroke="#5B4637" strokeWidth="3.4" strokeLinecap="round" opacity="0.8" filter="url(#lf-wash-edge)"></path>
      <ellipse cx="20" cy="36" rx="9" ry="7" fill="#E8D3A8" opacity="0.95" filter="url(#lf-wash-edge)"></ellipse>
      <g fill="none" stroke="#46362A" strokeWidth="1.6" filter="url(#lf-wobble)">
        <path d="M18 44 q -4 -22 18 -26 q 24 -4 26 18"></path>
        <path d="M12 30 q -4 -8 3 -12" strokeWidth="1.8"></path>
      </g>
      <circle cx="17" cy="34" r="1.4" fill="#46362A"></circle>
      <circle cx="10" cy="38" r="1.8" fill="#46362A"></circle>
    </svg>
  );
}
function AziCoverArt() {
  /* azi and his little bhen, hand in hand */
  return (
    <svg viewBox="0 0 72 56" width="52">
      <g filter="url(#lf-wash-edge)">
        <circle cx="26" cy="16" r="8" fill="#C9906B" opacity="0.95"></circle>
        <path d="M18 26 q 8 -6 16 0 l 2 22 l -20 0 z" fill="#9B4A6B" opacity="0.8"></path>
        <circle cx="50" cy="24" r="6.4" fill="#C9906B" opacity="0.95"></circle>
        <path d="M44 32 q 6 -5 12 0 l 2 16 l -16 0 z" fill="#E2A93B" opacity="0.85"></path>
      </g>
      <g fill="none" stroke="#46362A" strokeWidth="1.5" filter="url(#lf-wobble)">
        <circle cx="26" cy="16" r="8"></circle><circle cx="50" cy="24" r="6.4"></circle>
        <path d="M34 34 q 4 4 9 2" strokeWidth="1.6"></path>
        <path d="M20 12 q 6 -4 12 0 M45 20 q 5 -3 10 0"></path>
      </g>
      <circle cx="23" cy="16" r="1.1" fill="#46362A"></circle><circle cx="29" cy="16" r="1.1" fill="#46362A"></circle>
      <circle cx="48" cy="24" r="1" fill="#46362A"></circle><circle cx="53" cy="24" r="1" fill="#46362A"></circle>
    </svg>
  );
}
function BirdCoverArt() {
  return (
    <svg viewBox="0 0 72 56" width="52">
      <g fill="none" stroke="#97836B" strokeWidth="1.7" filter="url(#lf-wobble)">
        <path d="M24 28 q -8 10 2 16 q 10 6 20 -2 q 8 -7 2 -15 q 10 2 12 -4 q -6 -2 -10 0 q -4 -8 -14 -6 q -10 2 -12 11"></path>
        <path d="M32 36 q 6 -4 12 0" opacity="0.8"></path>
        <path d="M36 44 l-2 8 m 8 -8 l2 8" opacity="0.8"></path>
      </g>
      <circle cx="41" cy="26" r="1.3" fill="#6E5B49"></circle>
    </svg>
  );
}
function BalloonCoverArt() {
  /* peter and the runaway balloon — his story */
  return (
    <svg viewBox="0 0 72 60" width="50">
      <circle cx="40" cy="18" r="13" fill="#9B4A6B" opacity="0.85" filter="url(#lf-wash-edge)"></circle>
      <ellipse cx="22" cy="46" rx="11" ry="8" fill="#8A6A48" opacity="0.9" filter="url(#lf-wash-edge)"></ellipse>
      <g fill="none" stroke="#46362A" strokeWidth="1.5" filter="url(#lf-wobble)">
        <circle cx="40" cy="18" r="13"></circle>
        <path d="M40 31 q -4 8 -10 10" strokeWidth="1.3"></path>
        <ellipse cx="22" cy="46" rx="11" ry="8"></ellipse>
        <path d="M30 42 q 6 -4 8 -1" strokeWidth="1.3"></path>
      </g>
      <circle cx="19" cy="44" r="1.2" fill="#46362A"></circle>
      <path d="M8 12 q 4 -3 7 0 M56 40 q 4 -3 7 0" stroke="#97836B" strokeWidth="1.4" fill="none" filter="url(#lf-wobble)"></path>
    </svg>
  );
}

Object.assign(window, { CREATURES, CreatureSprite, OtterArt, AnkyArt, MotoArt, RockyArt, RustyArt,
  MikoCoverArt, MooseCoverArt, PapaCoverArt, CozyCoverArt, BrambleCoverArt, AziCoverArt, BirdCoverArt, BalloonCoverArt });
