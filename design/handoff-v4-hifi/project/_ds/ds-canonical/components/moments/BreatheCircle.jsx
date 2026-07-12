import React from "react";

/* Little Fables — breathe-along circle: an ink circle that swells like
   a wash bloom. The cadence is spoken/breathed by the buddy's voice;
   the circle is the visual anchor. */

const STYLE_ID = "lf-breathe-style";
function ensureBreatheStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = [
    "@keyframes lf-breathe { 0%, 100% { transform: scale(1); } 45% { transform: scale(1.26); } 60% { transform: scale(1.26); } }",
    "@keyframes lf-breathe-echo { 0%, 100% { transform: scale(1); opacity: 0.5; } 45% { transform: scale(1.38); opacity: 0.15; } 60% { transform: scale(1.38); opacity: 0.15; } }",
    ".lf-breathe-main { animation: lf-breathe 5600ms ease-in-out infinite; transform-box: fill-box; transform-origin: center; }",
    ".lf-breathe-echo { animation: lf-breathe-echo 5600ms ease-in-out infinite; transform-box: fill-box; transform-origin: center; }",
    "@media (prefers-reduced-motion: reduce) { .lf-breathe-main, .lf-breathe-echo { animation: none; } }"
  ].join("\n");
  document.head.appendChild(el);
}

export function BreatheCircle({ size = 260, pigment = "teal", running = true, style }) {
  ensureBreatheStyles();
  const color = "var(--pigment-" + pigment + ")";
  return (
    <svg viewBox="0 0 300 300" width={size} height={size} style={{ display: "block", overflow: "visible", ...style }} role="img" aria-label="breathe along">
      <defs>
        <filter id="lf-breathe-wash" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" result="b"></feGaussianBlur>
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="9" result="n"></feTurbulence>
          <feDisplacementMap in="b" in2="n" scale="14"></feDisplacementMap>
        </filter>
      </defs>
      <g className={running ? "lf-breathe-echo" : ""}>
        <circle cx="150" cy="150" r="96" fill="none" stroke={color} strokeWidth="3" opacity="0.45" filter="url(#lf-breathe-wash)"></circle>
      </g>
      <g className={running ? "lf-breathe-main" : ""}>
        <circle cx="150" cy="150" r="88" fill={color} opacity="0.22" filter="url(#lf-breathe-wash)"></circle>
        <circle cx="150" cy="150" r="88" fill={color} opacity="0.14" filter="url(#lf-breathe-wash)" transform="scale(0.82)" style={{ transformBox: "fill-box", transformOrigin: "center" }}></circle>
        <circle cx="150" cy="150" r="88" fill="none" stroke="var(--ink)" strokeWidth="2.6" filter="url(#lf-breathe-wash)"></circle>
      </g>
    </svg>
  );
}
