import React from "react";

/* Little Fables — endpaper: a wash-color field with a tiny motif.
   The open/close beat of every book, and the app's ONLY loading state.
   There is no spinner anywhere. */

const STYLE_ID = "lf-endpaper-style";
function ensureEndpaperStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = [
    "@keyframes lf-endpaper-bloom { from { transform: scale(1); opacity: 0.85; } to { transform: scale(1.12); opacity: 1; } }",
    ".lf-endpaper-bloom { animation: lf-endpaper-bloom var(--motion-breath, 2600ms) ease-in-out infinite alternate; transform-box: fill-box; transform-origin: center; }",
    "@media (prefers-reduced-motion: reduce) { .lf-endpaper-bloom { animation: none; } }"
  ].join("\n");
  document.head.appendChild(el);
}

function Motif({ kind }) {
  const stroke = { fill: "none", stroke: "#F9F2E3", strokeWidth: 2.6, strokeLinecap: "round", filter: "url(#lf-endpaper-wob)" };
  if (kind === "moon") {
    return <path d="M56 24 a 24 24 0 1 0 16 40 a 19 19 0 0 1 -16 -40" {...stroke}></path>;
  }
  if (kind === "leaf") {
    return (
      <g {...stroke}>
        <path d="M50 22 q 26 14 2 56 q -26 -14 -2 -56 z"></path>
        <path d="M51 30 L51 70" strokeWidth="1.8"></path>
      </g>
    );
  }
  if (kind === "boat") {
    return (
      <g {...stroke}>
        <path d="M26 58 q 24 10 48 0 l -6 14 q -18 6 -36 0 z"></path>
        <path d="M50 54 L50 26 q 10 8 0 14"></path>
      </g>
    );
  }
  return <path d="M50 22 l7 14.6 16 1.7 -12 10.8 3.4 15.9 -14.4 -8.1 -14.4 8.1 3.4 -15.9 -12 -10.8 16 -1.7 z" {...stroke}></path>;
}

export function Endpaper({ pigment = "plum", motif = "star", loading = false, children, style }) {
  ensureEndpaperStyles();
  const color = "var(--pigment-" + pigment + ")";
  return (
    <div
      style={{
        position: "relative",
        display: "grid",
        placeItems: "center",
        backgroundColor: "color-mix(in srgb, " + color + " 78%, var(--paper-deep))",
        backgroundImage: "var(--texture-paper)",
        overflow: "hidden",
        width: "100%",
        height: "100%",
        minHeight: 120,
        ...style
      }}
      role={loading ? "status" : undefined}
      aria-label={loading ? "the next page is being painted" : undefined}
    >
      {/* pooled wash edges */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "-12%",
          background:
            "radial-gradient(ellipse 88% 78% at 50% 46%, transparent 58%, color-mix(in srgb, " + color + " 55%, #2A2233) 130%)",
          opacity: 0.55,
          filter: "url(#lf-wash-edge)"
        }}
      ></div>
      <svg viewBox="0 0 100 100" width="110" height="110" style={{ position: "relative", overflow: "visible" }} aria-hidden="true">
        <defs>
          <filter id="lf-endpaper-wob" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="5" result="n"></feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="n" scale="3.6"></feDisplacementMap>
          </filter>
        </defs>
        <g className={loading ? "lf-endpaper-bloom" : ""} opacity="0.9">
          <Motif kind={motif}></Motif>
        </g>
      </svg>
      {children}
    </div>
  );
}
