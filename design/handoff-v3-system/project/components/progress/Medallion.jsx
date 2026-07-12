import React from "react";

/* Little Fables — a drawn medallion that lives on the shelf.
   Badges accumulate in the room; nothing dims or breaks. */

export function Medallion({ label, pigment = "marigold", size = 96, motif, style }) {
  const color = "var(--pigment-" + pigment + ")";
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 6, ...style }} role="img" aria-label={"medallion: " + (label || "earned")}>
      <svg viewBox="0 0 96 118" width={size} height={Math.round(size * 1.23)} style={{ display: "block", overflow: "visible" }}>
        {/* ribbon tails */}
        <g filter="url(#lf-wash-edge)">
          <path d="M34 4 L30 34 L48 26 L66 34 L62 4 Z" fill={color} opacity="0.5"></path>
        </g>
        <path d="M34 4 L30 34 M62 4 L66 34 M30 34 L48 26 L66 34" fill="none" stroke="var(--ink)" strokeWidth="1.8" filter="url(#lf-wobble)"></path>
        {/* disc */}
        <circle cx="48" cy="66" r="34" fill={color} opacity="0.5" filter="url(#lf-wash-edge)"></circle>
        <circle cx="48" cy="66" r="34" fill="none" stroke="var(--ink)" strokeWidth="2.4" filter="url(#lf-wobble)"></circle>
        <circle cx="48" cy="66" r="26" fill="none" stroke="var(--ink)" strokeWidth="1.4" opacity="0.6" filter="url(#lf-dry)"></circle>
        {motif ? (
          <foreignObject x="26" y="44" width="44" height="44">{motif}</foreignObject>
        ) : (
          <path
            d="M48 50 l4.6 9.4 10.4 1.1 -7.8 7 2.3 10.2 -9.5 -5.3 -9.5 5.3 2.3 -10.2 -7.8 -7 10.4 -1.1 z"
            fill="var(--paper-bright)"
            opacity="0.95"
            stroke="var(--ink)"
            strokeWidth="1.8"
            filter="url(#lf-wobble)"
          ></path>
        )}
      </svg>
      {label && (
        <span style={{ fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 18, color: "var(--ink-soft)", textAlign: "center" }}>{label}</span>
      )}
    </div>
  );
}
