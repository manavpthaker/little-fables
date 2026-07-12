import React from "react";

/* Little Fables — the writing moment: the generation-wait scene.
   A little open book on the buddy's table; the child's own words appear
   in watercolor handwriting. This is the ONE place hand-drawn text is
   allowed — they are his words, not UI. */

const STYLE_ID = "lf-writing-style";
function ensureWritingStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = [
    "@keyframes lf-word-in { from { opacity: 0; filter: blur(4px); transform: translateY(4px); } 60% { opacity: 1; filter: blur(0.6px); } to { opacity: 1; filter: blur(0); transform: translateY(0); } }",
    ".lf-word-in { animation: lf-word-in 900ms var(--ease-settle, ease) both; }",
    "@media (prefers-reduced-motion: reduce) { .lf-word-in { animation: none; opacity: 1; } }"
  ].join("\n");
  document.head.appendChild(el);
}

export function WritingMoment({ words = "", inkPigment = "river", width = 460, wordMs = 650, style }) {
  ensureWritingStyles();
  const list = words.split(/\s+/).filter(Boolean);
  const h = Math.round(width * 0.62);
  return (
    <div style={{ width: width, position: "relative", ...style }} role="img" aria-label={"his words being written: " + words}>
      <svg viewBox="0 0 460 285" width={width} height={h} style={{ display: "block", overflow: "visible" }}>
        <defs>
          <filter id="lf-writing-wash" x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.7" result="b"></feGaussianBlur>
            <feTurbulence type="fractalNoise" baseFrequency="0.032" numOctaves="3" seed="9" result="n"></feTurbulence>
            <feDisplacementMap in="b" in2="n" scale="11"></feDisplacementMap>
          </filter>
          <filter id="lf-writing-wob" x="-8%" y="-8%" width="116%" height="116%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="3" result="n"></feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="n" scale="3.4"></feDisplacementMap>
          </filter>
        </defs>
        {/* table */}
        <g filter="url(#lf-writing-wash)">
          <rect x="20" y="212" width="420" height="16" rx="4" fill="#C89A5E" opacity="0.65"></rect>
          <path d="M52 228 l-8 52 h12 l8 -52 z M408 228 l8 50 h-12 l-8 -50 z" fill="#B98A50" opacity="0.6"></path>
        </g>
        <g fill="none" stroke="var(--ink)" filter="url(#lf-writing-wob)">
          <rect x="20" y="212" width="420" height="16" rx="4" strokeWidth="2.4"></rect>
          <path d="M52 228 l-8 52 M64 228 l-8 50 M408 228 l8 52 M396 228 l8 50" strokeWidth="2.2"></path>
        </g>
        {/* open book */}
        <g transform="translate(90 96)">
          <g filter="url(#lf-writing-wash)">
            <path d="M0 46 q 70 -30 138 -12 l0 74 q -66 -18 -138 12 z" fill="var(--paper-bright)"></path>
            <path d="M276 46 q -70 -30 -138 -12 l0 74 q 66 -18 138 12 z" fill="var(--paper-bright)"></path>
            <path d="M0 46 l0 74 q 72 -30 138 -12 q 66 -18 138 12 l0 -74 l-6 4 l0 62 q -64 -14 -132 10 q -68 -24 -132 -10 l0 -62 z" fill="var(--paper-deep)" opacity="0.7"></path>
          </g>
          <g fill="none" stroke="var(--ink)" filter="url(#lf-writing-wob)">
            <path d="M0 46 q 70 -30 138 -12 q 68 -18 138 12 M0 46 l0 74 q 72 -30 138 -12 q 66 -18 138 12 l0 -74 M138 34 l0 74" strokeWidth="2.2"></path>
          </g>
        </g>
        {/* pencil resting beside */}
        <g transform="translate(320 190) rotate(14)">
          <path d="M0 0 L58 0" stroke="#E2A93B" strokeWidth="7" strokeLinecap="round" filter="url(#lf-writing-wash)"></path>
          <path d="M58 0 l12 3 l-12 4" fill="#F3D9A0" filter="url(#lf-writing-wash)"></path>
          <g fill="none" stroke="var(--ink)" strokeWidth="1.8" filter="url(#lf-writing-wob)">
            <path d="M0 -3 L58 -3 M0 5 L58 5 M58 -3 l14 6.5 l-14 6"></path>
            <path d="M68 2 l4 1.6" strokeWidth="2.4"></path>
          </g>
        </g>
      </svg>
      {/* his words, appearing in watercolor handwriting (Caveat — the one allowed hand text) */}
      <div
        style={{
          position: "absolute",
          left: "24%",
          top: "39%",
          width: "52%",
          textAlign: "center",
          transform: "rotate(-2deg)",
          fontFamily: "Caveat, cursive",
          fontSize: Math.max(22, Math.round(width * 0.062)),
          lineHeight: 1.25,
          color: "color-mix(in srgb, var(--pigment-" + inkPigment + ") 82%, var(--ink))",
          textShadow: "0 0 6px color-mix(in srgb, var(--pigment-" + inkPigment + ") 30%, transparent)"
        }}
      >
        {list.map(function (w, i) {
          return (
            <span key={i} className="lf-word-in" style={{ animationDelay: i * wordMs + "ms", display: "inline-block", marginRight: "0.28em" }}>
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
}
