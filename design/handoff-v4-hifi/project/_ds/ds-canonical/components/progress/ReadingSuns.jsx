import React from "react";

/* Little Fables — reading-day suns: drawn suns accumulating on the sill.
   Progress only accumulates; there are no empty slots, nothing pending,
   nothing dims. */

const STYLE_ID = "lf-suns-style";
function ensureSunStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = [
    "@keyframes lf-sun-glow { from { opacity: 0.35; } to { opacity: 0.8; } }",
    ".lf-sun-glow { animation: lf-sun-glow var(--motion-breath, 2600ms) ease-in-out infinite alternate; }",
    "@media (prefers-reduced-motion: reduce) { .lf-sun-glow { animation: none; opacity: 0.6; } }"
  ].join("\n");
  document.head.appendChild(el);
}

function Sun({ size, latest, seed }) {
  const rot = ((seed * 37) % 14) - 7;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{ display: "block", overflow: "visible", transform: "rotate(" + rot + "deg)" }}>
      {latest && <circle className="lf-sun-glow" cx="32" cy="32" r="27" fill="var(--glow-lamplight)" filter="url(#lf-wash-edge)"></circle>}
      <circle cx="32" cy="32" r="14" fill="#EFC85C" opacity="0.9" filter="url(#lf-wash-edge)"></circle>
      <circle cx="32" cy="32" r="14" fill="#E2A93B" opacity="0.4" filter="url(#lf-wash-edge)"></circle>
      <g fill="none" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" filter="url(#lf-wobble)">
        <circle cx="32" cy="32" r="14"></circle>
        <path d="M32 8 L32 15 M32 49 L32 56 M8 32 L15 32 M49 32 L56 32 M15 15 L20 20 M44 44 L49 49 M49 15 L44 20 M20 44 L15 49"></path>
      </g>
    </svg>
  );
}

export function ReadingSuns({ count = 1, size = 44, sill = true, style }) {
  ensureSunStyles();
  const suns = [];
  for (let i = 0; i < count; i++) suns.push(i);
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", ...style }} role="img" aria-label={count + " reading days"}>
      <div style={{ display: "flex", gap: Math.round(size * 0.28), alignItems: "flex-end", padding: "6px 10px" }}>
        {suns.map(function (i) {
          return <Sun key={i} size={size} seed={i} latest={i === count - 1}></Sun>;
        })}
      </div>
      {sill && (
        <svg width="100%" height="14" preserveAspectRatio="none" viewBox="0 0 100 14" aria-hidden="true">
          <rect x="0" y="3" width="100" height="8" fill="#C89A5E" opacity="0.55" filter="url(#lf-wash-edge)"></rect>
          <path d="M0 3 L100 3 M1 11 L99 11" stroke="var(--ink)" strokeWidth="1.6" fill="none" filter="url(#lf-wobble)"></path>
        </svg>
      )}
    </div>
  );
}
