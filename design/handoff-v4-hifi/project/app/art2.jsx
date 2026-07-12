/* Little Fables — drawn art, part 2: story-page art for Miko and the Wobbly
   Bridge, plus drawn room props (crate, door note, envelope, night sky).
   Same hand as the north-star scene. */

const INK2 = "var(--ink, #46362A)";
const WASH2 = { filter: "url(#lf-wash-edge)" };
const LINE2 = { fill: "none", stroke: INK2, strokeWidth: 2.2, filter: "url(#lf-wobble)" };

/* ---------- Miko pages (chapter 1) ---------- */
function BridgeArt() {
  return (
    <svg width="100%" viewBox="0 0 300 220" style={{ maxWidth: 340 }}>
      <ellipse cx="150" cy="196" rx="120" ry="12" fill="var(--shadow-cool)" filter="url(#lf-wash-edge)"></ellipse>
      <path d="M30 150 Q 150 90 270 150" fill="none" stroke="#C89A5E" strokeWidth="16" opacity="0.75" filter="url(#lf-wash-edge)"></path>
      <ellipse cx="150" cy="120" rx="26" ry="18" fill="#E2A93B" opacity="0.9" filter="url(#lf-wash-edge)"></ellipse>
      <path d="M168 112 q 12 -8 16 -2 q -4 8 -14 8" fill="#E2A93B" opacity="0.85" filter="url(#lf-wash-edge)"></path>
      <g {...LINE2}>
        <path d="M30 150 Q 150 90 270 150"></path>
        <path d="M36 128 L36 172 M264 128 L264 172" strokeWidth="2.6"></path>
        <path d="M62 138 l0 10 M92 128 l0 10 M122 121 l0 10 M150 118 l0 10 M180 121 l0 10 M210 128 l0 10 M240 137 l0 10" strokeWidth="1.6"></path>
        <ellipse cx="150" cy="120" rx="26" ry="18" strokeWidth="2"></ellipse>
        <path d="M138 110 q -3 -8 4 -10 M158 108 q 2 -8 -4 -10" strokeWidth="1.8"></path>
      </g>
      <circle cx="142" cy="116" r="1.8" fill={INK2}></circle>
    </svg>
  );
}
function WindArt() {
  return (
    <svg width="100%" viewBox="0 0 300 220" style={{ maxWidth: 340 }}>
      <g fill="none" stroke="var(--ink-soft)" strokeWidth="3" strokeLinecap="round" filter="url(#lf-wobble)">
        <path d="M30 70 q 40 -26 76 0 q -22 18 -48 9"></path>
        <path d="M90 130 q 50 -30 94 0 q -26 22 -62 11"></path>
        <path d="M170 62 q 36 -22 66 0"></path>
      </g>
      <ellipse cx="76" cy="172" rx="22" ry="15" fill="#E2A93B" opacity="0.9" filter="url(#lf-wash-edge)"></ellipse>
      <g fill="none" stroke={INK2} strokeWidth="2" filter="url(#lf-wobble)">
        <ellipse cx="76" cy="172" rx="22" ry="15"></ellipse>
        <path d="M92 164 q 10 -6 14 -2" strokeWidth="1.8"></path>
        <path d="M60 150 L60 132 M84 148 L86 132" strokeWidth="1.6"></path>
      </g>
      <circle cx="70" cy="168" r="2" fill={INK2}></circle>
    </svg>
  );
}
function RopeArt() {
  /* two small paws wrapped around the rope */
  return (
    <svg width="100%" viewBox="0 0 300 220" style={{ maxWidth: 340 }}>
      <path d="M20 110 Q 150 84 280 116" fill="none" stroke="#C89A5E" strokeWidth="14" opacity="0.8" filter="url(#lf-wash-edge)"></path>
      <g {...WASH2}>
        <ellipse cx="118" cy="102" rx="16" ry="12" fill="#E2A93B" opacity="0.95"></ellipse>
        <ellipse cx="176" cy="104" rx="16" ry="12" fill="#E2A93B" opacity="0.95"></ellipse>
      </g>
      <g {...LINE2}>
        <path d="M20 110 Q 150 84 280 116"></path>
        <path d="M40 104 l4 12 M70 99 l3 12 M100 96 l3 12 M196 99 l3 12 M226 103 l3 12 M256 108 l3 12" strokeWidth="1.4"></path>
        <ellipse cx="118" cy="102" rx="16" ry="12" strokeWidth="2"></ellipse>
        <ellipse cx="176" cy="104" rx="16" ry="12" strokeWidth="2"></ellipse>
        <path d="M110 96 l0 12 M118 94 l0 14 M126 95 l0 13 M168 98 l0 12 M176 96 l0 14 M184 97 l0 13" strokeWidth="1.4"></path>
      </g>
    </svg>
  );
}
function StepsArt() {
  return (
    <svg width="100%" viewBox="0 0 300 220" style={{ maxWidth: 340 }}>
      <path d="M20 180 q 70 -12 120 -40 q 60 -34 140 -44" fill="none" stroke="#C89A5E" strokeWidth="14" opacity="0.7" filter="url(#lf-wash-edge)"></path>
      <path d="M20 180 q 70 -12 120 -40 q 60 -34 140 -44" fill="none" stroke={INK2} strokeWidth="2" filter="url(#lf-wobble)"></path>
      <g fill="#E2A93B" opacity="0.95">
        <ellipse cx="80" cy="160" rx="9" ry="6" filter="url(#lf-wash-edge)"></ellipse>
        <ellipse cx="130" cy="138" rx="9" ry="6" filter="url(#lf-wash-edge)"></ellipse>
        <ellipse cx="180" cy="112" rx="9" ry="6" filter="url(#lf-wash-edge)"></ellipse>
      </g>
      <path d="M226 78 q 16 -12 30 -4 q -2 12 -18 14 q 10 2 20 -2" fill="#7C9A62" opacity="0.7" filter="url(#lf-wash-edge)"></path>
      <path d="M238 96 l4.6 9.4 10.4 1.1 -7.8 7 2.3 10.2 -9.5 -5.3 -9.5 5.3 2.3 -10.2 -7.8 -7 10.4 -1.1 z" fill="#EFC85C" filter="url(#lf-wobble)"></path>
    </svg>
  );
}

/* ---------- Miko pages (chapter 2 + 3) ---------- */
function BoulderArt() {
  /* Boulder — tall as a tree; his neck makes a bridge of its own */
  return (
    <svg width="100%" viewBox="0 0 300 220" style={{ maxWidth: 340 }}>
      <g {...WASH2}>
        <path d="M40 196 q 30 -10 60 0 z" fill="#7C9A62" opacity="0.5"></path>
        <path d="M210 196 q 30 -10 60 0 z" fill="#7C9A62" opacity="0.5"></path>
        <path d="M226 170 q -10 -60 -60 -96 q -20 -14 -34 -6" fill="none" stroke="#7C9A62" strokeWidth="22" opacity="0.75" strokeLinecap="round"></path>
        <ellipse cx="240" cy="172" rx="34" ry="26" fill="#7C9A62" opacity="0.8"></ellipse>
        <ellipse cx="124" cy="62" rx="20" ry="14" fill="#94AF7C" opacity="0.9"></ellipse>
        <ellipse cx="80" cy="120" rx="12" ry="9" fill="#E2A93B" opacity="0.95"></ellipse>
      </g>
      <g {...LINE2}>
        <path d="M226 168 q -10 -58 -58 -94 q -20 -14 -36 -6"></path>
        <ellipse cx="240" cy="172" rx="34" ry="26"></ellipse>
        <ellipse cx="124" cy="62" rx="20" ry="14" strokeWidth="2"></ellipse>
        <path d="M232 196 l0 -8 M254 194 l0 -8" strokeWidth="2"></path>
        <ellipse cx="80" cy="120" rx="12" ry="9" strokeWidth="1.8"></ellipse>
        <path d="M88 114 q 7 -5 10 -1" strokeWidth="1.4"></path>
      </g>
      <circle cx="118" cy="60" r="1.8" fill={INK2}></circle>
      <circle cx="77" cy="118" r="1.4" fill={INK2}></circle>
      <path d="M40 196 q 110 10 220 0" stroke="var(--ink-soft)" strokeWidth="1.6" fill="none" opacity="0.5" filter="url(#lf-wobble)"></path>
    </svg>
  );
}
function NeckPathArt() {
  /* choice: up and over Boulder's long neck */
  return (
    <svg viewBox="0 0 120 96" width="104">
      <path d="M96 84 q -6 -44 -44 -64 q -14 -8 -26 -2" fill="none" stroke="#7C9A62" strokeWidth="14" strokeLinecap="round" opacity="0.8" filter="url(#lf-wash-edge)"></path>
      <ellipse cx="22" cy="16" rx="12" ry="9" fill="#94AF7C" opacity="0.9" filter="url(#lf-wash-edge)"></ellipse>
      <g fill="none" stroke={INK2} strokeWidth="1.8" filter="url(#lf-wobble)">
        <path d="M96 82 q -6 -42 -42 -62 q -14 -8 -28 -2"></path>
        <ellipse cx="22" cy="16" rx="12" ry="9"></ellipse>
      </g>
      <circle cx="18" cy="14" r="1.3" fill={INK2}></circle>
      <path d="M52 30 q 6 -8 12 -2 M66 44 q 6 -8 12 -2" stroke="#E2A93B" strokeWidth="3" fill="none" strokeLinecap="round" filter="url(#lf-wobble)"></path>
    </svg>
  );
}
function MotoPathArt() {
  /* choice: brrrm across on Miko's moto */
  return (
    <svg viewBox="0 0 120 96" width="104">
      <circle cx="34" cy="70" r="14" fill="#5B4637" opacity="0.55" filter="url(#lf-wash-edge)"></circle>
      <circle cx="92" cy="70" r="14" fill="#5B4637" opacity="0.55" filter="url(#lf-wash-edge)"></circle>
      <path d="M24 56 q 34 -14 74 -2 l -5 11 q -32 -9 -64 2 z" fill="#E2A93B" opacity="0.9" filter="url(#lf-wash-edge)"></path>
      <path d="M82 52 L 92 22 l 12 -3" fill="none" stroke="#E2A93B" strokeWidth="7" opacity="0.9" filter="url(#lf-wash-edge)"></path>
      <g fill="none" stroke={INK2} strokeWidth="1.8" filter="url(#lf-wobble)">
        <circle cx="34" cy="70" r="14"></circle><circle cx="92" cy="70" r="14"></circle>
        <path d="M26 54 q 34 -12 70 -2"></path>
        <path d="M84 50 L 93 23 l 11 -3" strokeWidth="2"></path>
      </g>
      <path d="M6 44 q 5 -4 9 0 M4 56 q 5 -4 9 0" stroke="var(--ink-soft)" strokeWidth="1.8" fill="none" strokeLinecap="round" filter="url(#lf-wobble)"></path>
    </svg>
  );
}
function BellyArt() {
  /* Miko sits; his belly is where the breath lives (the BreatheCircle
     overlays the belly spot, swelling like a wash bloom) */
  return (
    <svg width="100%" viewBox="0 0 300 220" style={{ maxWidth: 340 }}>
      <ellipse cx="150" cy="200" rx="86" ry="11" fill="var(--shadow-cool)" filter="url(#lf-wash-edge)"></ellipse>
      <g {...WASH2}>
        <path d="M104 192 q -12 -66 46 -78 q 54 -10 52 58 q 0 14 -10 20 q -44 12 -88 0" fill="#E2A93B" opacity="0.85"></path>
        <circle cx="150" cy="86" r="30" fill="#E2A93B" opacity="0.9"></circle>
        <ellipse cx="150" cy="150" rx="34" ry="30" fill="#F3D9A0" opacity="0.9"></ellipse>
        <circle cx="128" cy="62" r="9" fill="#E2A93B" opacity="0.95"></circle>
        <circle cx="172" cy="62" r="9" fill="#E2A93B" opacity="0.95"></circle>
      </g>
      <g {...LINE2}>
        <path d="M106 190 q -12 -64 44 -76 q 54 -10 52 56 q 0 14 -10 18"></path>
        <path d="M124 104 A 30 30 0 1 1 176 104"></path>
        <circle cx="128" cy="62" r="9"></circle><circle cx="172" cy="62" r="9"></circle>
        <path d="M142 98 q 8 6 16 0" strokeWidth="2"></path>
      </g>
      <circle cx="138" cy="82" r="2.4" fill={INK2}></circle><circle cx="162" cy="82" r="2.4" fill={INK2}></circle>
      <ellipse cx="150" cy="92" rx="4" ry="3" fill={INK2}></ellipse>
    </svg>
  );
}
function CrossingArt() {
  /* Crossing Day: flags on the ropes, friends lined up, a grateful sun */
  return (
    <svg width="100%" viewBox="0 0 300 220" style={{ maxWidth: 340 }}>
      <circle cx="256" cy="40" r="20" fill="#F9E7AE" opacity="0.95" filter="url(#lf-wash-edge)"></circle>
      <circle cx="256" cy="40" r="32" fill="#F1BE6B" opacity="0.4" filter="url(#lf-wash-edge)"></circle>
      <path d="M24 132 Q 150 76 276 132" fill="none" stroke="#C89A5E" strokeWidth="14" opacity="0.75" filter="url(#lf-wash-edge)"></path>
      <g filter="url(#lf-wash-edge)">
        <path d="M74 108 l 14 -2 l -3 12 z" fill="#D95B43" opacity="0.85"></path>
        <path d="M140 92 l 14 -2 l -3 12 z" fill="#7C9A62" opacity="0.85"></path>
        <path d="M206 104 l 14 -2 l -3 12 z" fill="#4E7FA3" opacity="0.85"></path>
      </g>
      <g {...WASH2}>
        <ellipse cx="64" cy="176" rx="15" ry="11" fill="#E2A93B" opacity="0.95"></ellipse>
        <ellipse cx="106" cy="182" rx="13" ry="10" fill="#8A6A48" opacity="0.9"></ellipse>
        <ellipse cx="146" cy="184" rx="14" ry="10" fill="#7C9A62" opacity="0.85"></ellipse>
        <ellipse cx="188" cy="182" rx="13" ry="10" fill="#8B93A8" opacity="0.9"></ellipse>
      </g>
      <g {...LINE2}>
        <path d="M24 132 Q 150 76 276 132"></path>
        <path d="M30 112 L30 152 M270 112 L270 152" strokeWidth="2.4"></path>
        <ellipse cx="64" cy="176" rx="15" ry="11" strokeWidth="1.8"></ellipse>
        <ellipse cx="106" cy="182" rx="13" ry="10" strokeWidth="1.8"></ellipse>
        <ellipse cx="146" cy="184" rx="14" ry="10" strokeWidth="1.8"></ellipse>
        <ellipse cx="188" cy="182" rx="13" ry="10" strokeWidth="1.8"></ellipse>
      </g>
      <circle cx="60" cy="173" r="1.5" fill={INK2}></circle><circle cx="102" cy="179" r="1.4" fill={INK2}></circle>
      <circle cx="142" cy="181" r="1.4" fill={INK2}></circle><circle cx="184" cy="179" r="1.4" fill={INK2}></circle>
    </svg>
  );
}
function SingingBridgeArt() {
  /* the whole bridge sang */
  return (
    <svg width="100%" viewBox="0 0 300 220" style={{ maxWidth: 340 }}>
      <path d="M30 150 Q 150 92 270 150" fill="none" stroke="#C89A5E" strokeWidth="16" opacity="0.75" filter="url(#lf-wash-edge)"></path>
      <ellipse cx="150" cy="122" rx="24" ry="16" fill="#E2A93B" opacity="0.9" filter="url(#lf-wash-edge)"></ellipse>
      <g {...LINE2}>
        <path d="M30 150 Q 150 92 270 150"></path>
        <ellipse cx="150" cy="122" rx="24" ry="16" strokeWidth="2"></ellipse>
        <path d="M136 112 q -3 -8 4 -10 M164 110 q 2 -8 -4 -10" strokeWidth="1.6"></path>
      </g>
      <g fill="none" stroke="var(--ink-soft)" strokeWidth="2.2" strokeLinecap="round" filter="url(#lf-wobble)" opacity="0.85">
        <path d="M84 96 q 4 -10 14 -8"></path>
        <path d="M206 92 q 8 -8 16 -2"></path>
        <path d="M116 74 q 2 -8 10 -8"></path>
        <path d="M180 66 q 6 -8 14 -4"></path>
      </g>
      <circle cx="98" cy="78" r="2" fill="var(--ink-soft)"></circle>
      <circle cx="196" cy="72" r="2" fill="var(--ink-soft)"></circle>
      <circle cx="144" cy="118" r="1.8" fill={INK2}></circle>
    </svg>
  );
}

/* ---------- room props ---------- */
function CrateArt() {
  /* the wrapped crate under the table — someone new is coming */
  return (
    <svg viewBox="0 0 110 78" width="110" height="78" style={{ display: "block", overflow: "visible" }}>
      <ellipse cx="55" cy="72" rx="46" ry="7" fill="var(--shadow-cool)" filter="url(#lf-wash-edge)"></ellipse>
      <path d="M12 26 L98 26 L94 70 L16 70 Z" fill="#C89A5E" opacity="0.6" filter="url(#lf-wash-edge)"></path>
      <path d="M50 26 L54 70 M12 46 L96 46" stroke="#9B4A6B" strokeWidth="6" opacity="0.6" filter="url(#lf-wash-edge)"></path>
      <g fill="none" stroke={INK2} strokeWidth="2" filter="url(#lf-wobble)">
        <path d="M12 26 L98 26 L94 70 L16 70 Z"></path>
        <path d="M50 26 L54 70 M12 46 L96 46" strokeWidth="1.6"></path>
        <path d="M52 26 q -6 -12 6 -14 q 8 -2 6 8 q 8 -8 12 0 q 2 6 -8 8" strokeWidth="1.8"></path>
      </g>
      <g transform="rotate(8 88 18)">
        <rect x="76" y="8" width="26" height="17" rx="2" fill="var(--paper-bright)" filter="url(#lf-wash-edge)"></rect>
        <rect x="76" y="8" width="26" height="17" rx="2" fill="none" stroke="var(--ink-soft)" strokeWidth="1.4" filter="url(#lf-wobble)"></rect>
        <circle cx="78" cy="12" r="1.6" fill="#D95B43" filter="url(#lf-wobble)"></circle>
      </g>
      <path d="M62 20 Q 72 10 78 14" fill="none" stroke="var(--ink-soft)" strokeWidth="1.4" filter="url(#lf-wobble)"></path>
    </svg>
  );
}

function DoorEdgeArt() {
  /* the sliver of the room's door on the far left wall */
  return (
    <svg viewBox="0 0 76 500" width="76" height="500" style={{ display: "block" }}>
      <rect x="0" y="12" width="58" height="474" fill="#C89A5E" opacity="0.34" filter="url(#lf-wash-edge)"></rect>
      <g fill="none" stroke={INK2} filter="url(#lf-wobble)">
        <path d="M58 6 L58 492" strokeWidth="2.6"></path>
        <path d="M66 0 L66 500" strokeWidth="2" opacity="0.7"></path>
        <path d="M0 14 L56 12 M0 486 L56 488" strokeWidth="2"></path>
        <path d="M44 236 q 8 6 0 14" strokeWidth="2.4"></path>
        <path d="M58 62 l8 1 M58 430 l8 1" strokeWidth="1.6" opacity="0.7"></path>
      </g>
      <circle cx="42" cy="250" r="3.4" fill="#B98A50" opacity="0.9" filter="url(#lf-wobble)"></circle>
    </svg>
  );
}

function EnvelopeArt({ size = 92 }) {
  /* a drawn envelope — "saved for Mama and Papa" */
  return (
    <svg viewBox="0 0 100 70" width={size} style={{ display: "block", overflow: "visible" }}>
      <path d="M6 12 L94 12 L92 62 L8 62 Z" fill="var(--paper-bright)" filter="url(#lf-wash-edge)"></path>
      <path d="M6 12 L50 42 L94 12" fill="none" stroke="#D95B43" strokeWidth="4" opacity="0.55" filter="url(#lf-wash-edge)"></path>
      <g fill="none" stroke={INK2} strokeWidth="2" filter="url(#lf-wobble)">
        <path d="M6 12 L94 12 L92 62 L8 62 Z"></path>
        <path d="M6 12 L50 42 L94 12" strokeWidth="1.8"></path>
      </g>
      <path d="M50 8 l1.8 3.7 4.1 .4 -3 2.8 .9 4 -3.8 -2.1 -3.8 2.1 .9 -4 -3 -2.8 4.1 -.4 z" fill="#D95B43" opacity="0.9" filter="url(#lf-wobble)"></path>
    </svg>
  );
}

function PencilMotif() {
  /* medallion motif: the storyteller's pencil */
  return (
    <svg viewBox="0 0 44 44" width="44" height="44">
      <g transform="rotate(-38 22 22)">
        <path d="M6 22 L32 22" stroke="#E2A93B" strokeWidth="6" strokeLinecap="round" filter="url(#lf-wash-edge)"></path>
        <path d="M32 19 l8 3 l-8 3 z" fill="#F3D9A0" filter="url(#lf-wash-edge)"></path>
        <g fill="none" stroke={INK2} strokeWidth="1.6" filter="url(#lf-wobble)">
          <path d="M6 19 L32 19 M6 25 L32 25 M32 19 l9 3 l-9 3 M6 19 L6 25"></path>
        </g>
      </g>
    </svg>
  );
}
function SunMotif() {
  return (
    <svg viewBox="0 0 44 44" width="44" height="44">
      <circle cx="22" cy="22" r="9" fill="#EFC85C" opacity="0.95" filter="url(#lf-wash-edge)"></circle>
      <g stroke={INK2} strokeWidth="1.6" filter="url(#lf-wobble)">
        <circle cx="22" cy="22" r="9" fill="none"></circle>
        <path d="M22 6 L22 11 M22 33 L22 38 M6 22 L11 22 M33 22 L38 22 M11 11 L14 14 M30 30 L33 33 M33 11 L30 14 M14 30 L11 33"></path>
      </g>
    </svg>
  );
}
function BridgeMotif() {
  return (
    <svg viewBox="0 0 44 44" width="44" height="44">
      <path d="M6 30 Q 22 16 38 30" fill="none" stroke="#C89A5E" strokeWidth="6" opacity="0.85" filter="url(#lf-wash-edge)"></path>
      <g fill="none" stroke={INK2} strokeWidth="1.6" filter="url(#lf-wobble)">
        <path d="M6 30 Q 22 16 38 30"></path>
        <path d="M8 24 L8 36 M36 24 L36 36"></path>
      </g>
    </svg>
  );
}

/* ---------- simple page-scale arts for the shorter books ---------- */
function MooseSkyArt() {
  return (
    <svg width="100%" viewBox="0 0 300 220" style={{ maxWidth: 340 }}>
      <path d="M60 196 q 4 -60 44 -70 q 44 -10 52 -38 l 18 0 l 0 108 z" fill="#5B4637" opacity="0.8" filter="url(#lf-wash-edge)"></path>
      <g fill="none" stroke={INK2} strokeWidth="2" filter="url(#lf-wobble)">
        <path d="M158 88 q 4 -22 -10 -32 M160 86 q 22 -8 26 -30 M174 62 q 10 3 14 -6"></path>
      </g>
      <g fill="none" stroke="var(--ink-soft)" strokeWidth="2.6" strokeLinecap="round" filter="url(#lf-wobble)" opacity="0.8">
        <path d="M40 60 q 30 -20 58 0"></path>
        <path d="M210 44 q 26 -16 50 0"></path>
      </g>
      <ellipse cx="236" cy="92" rx="9" ry="6" fill="#4E7FA3" opacity="0.9" filter="url(#lf-wash-edge)"></ellipse>
      <path d="M244 88 q 7 -5 10 -1" stroke={INK2} strokeWidth="1.4" fill="none" filter="url(#lf-wobble)"></path>
      <circle cx="233" cy="90" r="1.3" fill={INK2}></circle>
      <circle cx="166" cy="96" r="1.6" fill="#F9F2E3"></circle>
    </svg>
  );
}
function PapaMoonArt() {
  return (
    <svg width="100%" viewBox="0 0 300 220" style={{ maxWidth: 340 }}>
      <path d="M196 30 a 40 40 0 1 0 30 66 a 33 33 0 0 1 -30 -66" fill="#EFC85C" opacity="0.95" filter="url(#lf-wash-edge)"></path>
      <g fill="none" stroke="var(--ink-soft)" strokeWidth="1.8" filter="url(#lf-wobble)" opacity="0.9">
        <path d="M60 200 L96 80 M76 200 L112 80"></path>
        <path d="M70 170 l24 0 M78 144 l24 0 M86 118 l23 0 M94 94 l22 0"></path>
      </g>
      <ellipse cx="92" cy="70" rx="14" ry="10" fill="#5B4B7A" opacity="0.8" filter="url(#lf-wash-edge)"></ellipse>
      <g fill="#F0E6CF">
        <circle cx="48" cy="40" r="1.6"></circle><circle cx="140" cy="26" r="1.3"></circle><circle cx="250" cy="140" r="1.5"></circle><circle cx="30" cy="110" r="1.3"></circle>
      </g>
      <path d="M100 64 q 8 -6 12 -1" stroke={INK2} strokeWidth="1.6" fill="none" filter="url(#lf-wobble)"></path>
      <circle cx="88" cy="68" r="1.5" fill="#F0E6CF"></circle>
    </svg>
  );
}
function CozyRingArt() {
  return (
    <svg width="100%" viewBox="0 0 300 220" style={{ maxWidth: 340 }}>
      <ellipse cx="150" cy="140" rx="104" ry="48" fill="#F3C77A" opacity="0.4" filter="url(#lf-wash-edge)"></ellipse>
      <rect x="138" y="96" width="24" height="34" rx="6" fill="#EFC85C" opacity="0.95" filter="url(#lf-wash-edge)"></rect>
      <g fill="#5B4637" opacity="0.85" filter="url(#lf-wash-edge)">
        <ellipse cx="70" cy="150" rx="20" ry="14"></ellipse>
        <ellipse cx="116" cy="170" rx="17" ry="12"></ellipse>
        <ellipse cx="184" cy="170" rx="17" ry="12"></ellipse>
        <ellipse cx="230" cy="150" rx="20" ry="14"></ellipse>
      </g>
      <ellipse cx="116" cy="166" rx="7" ry="5" fill="#E8D3A8" opacity="0.9" filter="url(#lf-wash-edge)"></ellipse>
      <g fill="none" stroke={INK2} filter="url(#lf-wobble)">
        <rect x="138" y="96" width="24" height="34" rx="6" strokeWidth="2"></rect>
        <path d="M143 96 q 7 -10 14 0" strokeWidth="1.8"></path>
        <circle cx="150" cy="112" r="5" strokeWidth="1.6"></circle>
        <ellipse cx="70" cy="150" rx="20" ry="14" strokeWidth="1.8"></ellipse>
        <ellipse cx="116" cy="170" rx="17" ry="12" strokeWidth="1.8"></ellipse>
        <ellipse cx="184" cy="170" rx="17" ry="12" strokeWidth="1.8"></ellipse>
        <ellipse cx="230" cy="150" rx="20" ry="14" strokeWidth="1.8"></ellipse>
      </g>
      <circle cx="110" cy="166" r="1.4" fill={INK2}></circle>
      <path d="M104 158 l -8 -4 M104 162 l -8 0" stroke={INK2} strokeWidth="1.2" filter="url(#lf-wobble)"></path>
    </svg>
  );
}
function BrambleWaveArt() {
  return (
    <svg width="100%" viewBox="0 0 300 220" style={{ maxWidth: 340 }}>
      <ellipse cx="150" cy="186" rx="96" ry="11" fill="var(--shadow-cool)" filter="url(#lf-wash-edge)"></ellipse>
      <path d="M86 168 q -10 -66 56 -76 q 68 -10 74 52 q 2 26 -22 30 z" fill="#8A6A48" opacity="0.85" filter="url(#lf-wash-edge)"></path>
      <path d="M96 96 l14 -22 M124 84 l10 -26 M154 80 l4 -26 M184 84 l12 -24 M206 98 l18 -18 M220 118 l22 -10" stroke="#5B4637" strokeWidth="7" strokeLinecap="round" opacity="0.8" filter="url(#lf-wash-edge)"></path>
      <ellipse cx="88" cy="140" rx="22" ry="17" fill="#E8D3A8" opacity="0.95" filter="url(#lf-wash-edge)"></ellipse>
      <path d="M64 118 q -14 -14 -8 -30" fill="none" stroke="#8A6A48" strokeWidth="9" strokeLinecap="round" opacity="0.9" filter="url(#lf-wash-edge)"></path>
      <g fill="none" stroke={INK2} strokeWidth="2" filter="url(#lf-wobble)">
        <path d="M86 166 q -10 -64 56 -74 q 68 -10 74 50 q 2 26 -22 30"></path>
        <ellipse cx="88" cy="140" rx="22" ry="17"></ellipse>
        <path d="M64 118 q -14 -14 -8 -30" strokeWidth="2.2"></path>
      </g>
      <circle cx="80" cy="136" r="2.2" fill={INK2}></circle>
      <circle cx="68" cy="146" r="2.6" fill={INK2}></circle>
      <path d="M74 152 q 4 3 8 0" stroke={INK2} strokeWidth="1.8" fill="none" filter="url(#lf-wobble)"></path>
      <path d="M40 78 q 5 -4 9 0 M48 66 q 5 -4 9 0" stroke="var(--ink-soft)" strokeWidth="1.8" fill="none" strokeLinecap="round" filter="url(#lf-wobble)"></path>
    </svg>
  );
}
function AziBhenArt() {
  return (
    <svg width="100%" viewBox="0 0 300 220" style={{ maxWidth: 340 }}>
      <ellipse cx="150" cy="192" rx="100" ry="11" fill="var(--shadow-cool)" filter="url(#lf-wash-edge)"></ellipse>
      <g filter="url(#lf-wash-edge)">
        <circle cx="112" cy="66" r="24" fill="#C9906B" opacity="0.95"></circle>
        <path d="M88 94 q 24 -16 48 0 l 6 66 l -60 0 z" fill="#9B4A6B" opacity="0.8"></path>
        <circle cx="186" cy="96" r="18" fill="#C9906B" opacity="0.95"></circle>
        <path d="M168 118 q 18 -13 36 0 l 5 44 l -46 0 z" fill="#E2A93B" opacity="0.85"></path>
        <path d="M136 118 Q 152 132 166 126" fill="none" stroke="#C9906B" strokeWidth="9" strokeLinecap="round" opacity="0.95"></path>
      </g>
      <g fill="none" stroke={INK2} strokeWidth="2" filter="url(#lf-wobble)">
        <circle cx="112" cy="66" r="24"></circle><circle cx="186" cy="96" r="18"></circle>
        <path d="M136 118 Q 152 132 166 126" strokeWidth="2.2"></path>
        <path d="M96 56 q 16 -10 32 0 M172 88 q 14 -8 28 0" strokeWidth="1.8"></path>
        <path d="M102 160 l -2 30 M122 160 l 2 30 M178 162 l -2 28 M194 162 l 2 28" strokeWidth="2"></path>
      </g>
      <circle cx="104" cy="64" r="2.2" fill={INK2}></circle><circle cx="120" cy="64" r="2.2" fill={INK2}></circle>
      <circle cx="180" cy="94" r="1.8" fill={INK2}></circle><circle cx="192" cy="94" r="1.8" fill={INK2}></circle>
      <path d="M106 74 q 6 4 12 0 M180 102 q 5 3 10 0" stroke={INK2} strokeWidth="1.8" fill="none" filter="url(#lf-wobble)"></path>
    </svg>
  );
}

function MoonInWindow() {
  /* night: the moon takes the sun's place on the glass */
  return (
    <g>
      <circle cx="252" cy="180" r="21" fill="#F5E9C8" opacity="0.95" filter="url(#lf-wash-edge)"></circle>
      <circle cx="252" cy="180" r="34" fill="#F3C77A" opacity="0.28" filter="url(#lf-wash-edge)"></circle>
      <circle cx="245" cy="174" r="3.4" fill="#E3D3AC" opacity="0.8"></circle>
      <circle cx="258" cy="186" r="2.6" fill="#E3D3AC" opacity="0.8"></circle>
      <g fill="#F5E9C8">
        <circle cx="150" cy="150" r="1.6" opacity="0.9"></circle>
        <circle cx="180" cy="210" r="1.3" opacity="0.8"></circle>
        <circle cx="132" cy="250" r="1.5" opacity="0.85"></circle>
        <circle cx="286" cy="140" r="1.3" opacity="0.8"></circle>
        <circle cx="204" cy="168" r="1.2" opacity="0.7"></circle>
        <circle cx="160" cy="308" r="1.4" opacity="0.8"></circle>
        <circle cx="292" cy="300" r="1.5" opacity="0.85"></circle>
      </g>
    </g>
  );
}

Object.assign(window, { BridgeArt, WindArt, RopeArt, StepsArt, BoulderArt, NeckPathArt, MotoPathArt,
  BellyArt, CrossingArt, SingingBridgeArt, CrateArt, DoorEdgeArt, EnvelopeArt, PencilMotif, SunMotif, BridgeMotif, MoonInWindow,
  MooseSkyArt, PapaMoonArt, CozyRingArt, BrambleWaveArt, AziBhenArt });
