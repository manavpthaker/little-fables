import React from "react";

/* Little Fables — the buddy. A small bear drawn in the house style
   (same hand as assets/room/north-star.svg). The app's voice and hands:
   drawn, alive, never pleading. */

const STYLE_ID = "lf-buddy-style";
function ensureBuddyStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = [
    "@keyframes lf-buddy-breath { from { transform: scale(1,1); } to { transform: scale(1.02, 1.034); } }",
    "@keyframes lf-buddy-glow { from { opacity: 0.5; } to { opacity: 0.95; } }",
    ".lf-buddy-breath { animation: lf-buddy-breath var(--motion-breath, 2600ms) ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 50% 96%; }",
    ".lf-buddy-glow { animation: lf-buddy-glow calc(var(--motion-breath, 2600ms) * 0.9) ease-in-out infinite alternate; }",
    ".lf-buddy-lean { transform: rotate(-5deg) translateX(-4px); transform-box: fill-box; transform-origin: 50% 92%; }",
    "@media (prefers-reduced-motion: reduce) { .lf-buddy-breath, .lf-buddy-glow { animation: none; } }"
  ].join("\n");
  document.head.appendChild(el);
}

const FUR = "#C89A5E";
const FUR_DEEP = "#B98A50";
const CREAM = "#F3D9A0";
const INK = "var(--ink, #46362A)";

function Arm({ side, pose }) {
  // stroke-drawn arms for expressive poses; wash-shape arms for rest
  if (pose === "pointing" && side === "right") {
    return (
      <g>
        <path d="M154 170 Q 180 150 200 120" fill="none" stroke={FUR_DEEP} strokeWidth="17" strokeLinecap="round" filter="url(#lfb-wash)" opacity="0.85"></path>
        <circle cx="202" cy="117" r="10" fill={FUR} opacity="0.9" filter="url(#lfb-wash)"></circle>
        <path d="M150 175 Q 178 156 197 124 M160 178 Q 184 162 206 130" fill="none" stroke={INK} strokeWidth="2.2" filter="url(#lfb-wob)"></path>
        <circle cx="202" cy="117" r="10" fill="none" stroke={INK} strokeWidth="2.2" filter="url(#lfb-wob)"></circle>
      </g>
    );
  }
  if (pose === "celebrating") {
    const d = side === "left" ? "M86 170 Q 60 142 52 110" : "M154 170 Q 180 142 188 110";
    const px = side === "left" ? 50 : 190, py = 106;
    const ink = side === "left" ? "M90 173 Q 64 146 55 113 M81 167 Q 58 138 47 112" : "M150 173 Q 176 146 185 113 M159 167 Q 182 138 193 112";
    return (
      <g>
        <path d={d} fill="none" stroke={FUR_DEEP} strokeWidth="17" strokeLinecap="round" filter="url(#lfb-wash)" opacity="0.85"></path>
        <circle cx={px} cy={py} r="10" fill={FUR} opacity="0.9" filter="url(#lfb-wash)"></circle>
        <path d={ink} fill="none" stroke={INK} strokeWidth="2.2" filter="url(#lfb-wob)"></path>
        <circle cx={px} cy={py} r="10" fill="none" stroke={INK} strokeWidth="2.2" filter="url(#lfb-wob)"></circle>
      </g>
    );
  }
  // resting arm
  if (side === "left") {
    return (
      <g>
        <path d="M84 165 q -16 18 -6 40 q 8 8 16 2 q -8 -20 -2 -38 z" fill={FUR_DEEP} opacity="0.8" filter="url(#lfb-wash)"></path>
        <path d="M84 165 q -15 18 -6 39 q 8 7 15 2" fill="none" stroke={INK} strokeWidth="2.2" filter="url(#lfb-wob)"></path>
      </g>
    );
  }
  return (
    <g>
      <path d="M154 163 q 16 18 8 42 q -8 8 -16 2 q 6 -22 0 -40 z" fill={FUR_DEEP} opacity="0.8" filter="url(#lfb-wash)"></path>
      <path d="M154 163 q 15 18 7 41 q -8 7 -15 2" fill="none" stroke={INK} strokeWidth="2.2" filter="url(#lfb-wob)"></path>
    </g>
  );
}

export function Buddy({ pose = "idle", size = 200, breathing = true, style }) {
  ensureBuddyStyles();
  const w = Math.round(size * (240 / 260));
  const leanClass = pose === "listening" ? "lf-buddy-lean" : "";
  const breathClass = breathing ? "lf-buddy-breath" : "";
  return (
    <svg
      viewBox="0 0 240 260"
      width={w}
      height={size}
      style={{ display: "block", overflow: "visible", ...style }}
      role="img"
      aria-label={"buddy bear, " + pose}
    >
      <defs>
        <filter id="lfb-wob" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="3" result="n"></feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3.4"></feDisplacementMap>
        </filter>
        <filter id="lfb-wash" x="-15%" y="-15%" width="130%" height="130%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.7" result="b"></feGaussianBlur>
          <feTurbulence type="fractalNoise" baseFrequency="0.032" numOctaves="3" seed="9" result="n"></feTurbulence>
          <feDisplacementMap in="b" in2="n" scale="11"></feDisplacementMap>
        </filter>
      </defs>

      {pose === "celebrating" && (
        <g className="lf-buddy-glow">
          <ellipse cx="120" cy="150" rx="105" ry="98" fill="var(--glow-lamplight, rgba(242,196,96,0.55))" opacity="0.7" filter="url(#lfb-wash)"></ellipse>
          <circle cx="52" cy="70" r="3" fill="#EFC85C"></circle>
          <circle cx="190" cy="62" r="2.5" fill="#F3C77A"></circle>
          <circle cx="120" cy="34" r="3" fill="#EFC85C"></circle>
        </g>
      )}

      <ellipse cx="126" cy="252" rx="62" ry="11" fill="var(--shadow-warm, rgba(91,70,55,0.22))" filter="url(#lfb-wash)"></ellipse>

      <g className={[breathClass, leanClass].filter(Boolean).join(" ")}>
        {/* legs */}
        <g filter="url(#lfb-wash)">
          <ellipse cx="84" cy="233" rx="24" ry="15" fill={FUR_DEEP} opacity="0.75" transform="rotate(-14 84 233)"></ellipse>
          <ellipse cx="156" cy="237" rx="24" ry="15" fill={FUR_DEEP} opacity="0.75" transform="rotate(10 156 237)"></ellipse>
          <ellipse cx="78" cy="236" rx="9" ry="7" fill={CREAM} opacity="0.9" transform="rotate(-14 78 236)"></ellipse>
          <ellipse cx="163" cy="240" rx="9" ry="7" fill={CREAM} opacity="0.9" transform="rotate(10 163 240)"></ellipse>
          {/* body */}
          <path d="M80 223 q -10 -52 18 -74 q 22 -16 44 2 q 26 24 14 72 q -38 14 -76 0" fill={FUR} opacity="0.85"></path>
          <ellipse cx="119" cy="195" rx="24" ry="30" fill={CREAM} opacity="0.85"></ellipse>
        </g>
        <Arm side="left" pose={pose}></Arm>
        <Arm side="right" pose={pose}></Arm>
        {/* head */}
        <g filter="url(#lfb-wash)">
          <circle cx="118" cy="121" r="35" fill={FUR} opacity="0.9"></circle>
          <circle cx="92" cy="92" r="11.5" fill={FUR} opacity="0.95"></circle>
          <circle cx="144" cy="92" r="11.5" fill={FUR} opacity="0.95"></circle>
          <circle cx="92" cy="93" r="5" fill={CREAM} opacity="0.9"></circle>
          <circle cx="144" cy="93" r="5" fill={CREAM} opacity="0.9"></circle>
          <ellipse cx="118" cy="133" rx="14" ry="10" fill={CREAM} opacity="0.95"></ellipse>
          <path d="M90 97 q -8 14 -4 30 q 2 10 10 16 q -16 -22 -6 -46" fill="#F3C77A" opacity="0.55"></path>
        </g>
        {/* ink */}
        <g fill="none" stroke={INK} strokeWidth="2.2" filter="url(#lfb-wob)">
          <path d="M86 219 q -12 -50 16 -71 q 22 -16 44 2 q 26 24 13 69"></path>
          <ellipse cx="84" cy="233" rx="24" ry="15" transform="rotate(-14 84 233)"></ellipse>
          <ellipse cx="156" cy="237" rx="24" ry="15" transform="rotate(10 156 237)"></ellipse>
          <path d="M89 141 A 35 35 0 1 1 147 141"></path>
          <circle cx="92" cy="92" r="11.5"></circle>
          <circle cx="144" cy="92" r="11.5"></circle>
          <path d="M110 138 q 8 6 16 0" strokeWidth="2"></path>
        </g>
        <ellipse cx="118" cy="128" rx="4.5" ry="3.4" fill={INK}></ellipse>
        <circle cx="105" cy="117" r="2.7" fill={INK}></circle>
        <circle cx="131" cy="117" r="2.7" fill={INK}></circle>
        <path d="M100 129 q 3 2 6 0 M128 129 q 3 2 6 0" stroke="#D95B43" strokeWidth="2" opacity="0.4" fill="none" filter="url(#lfb-wob)"></path>
      </g>
    </svg>
  );
}
