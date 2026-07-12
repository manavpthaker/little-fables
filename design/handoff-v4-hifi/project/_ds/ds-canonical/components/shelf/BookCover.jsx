import React from "react";

/* Little Fables — face-out book on the shelf. Real cover art framed in a
   drawn cover; progress as a drawn ribbon; the child's own books carry a
   star spine mark; unfinished art shows as pencil sketch. */

const STYLE_ID = "lf-book-style";
function ensureBookStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = [
    "@keyframes lf-book-beacon { from { box-shadow: 0 0 22px 2px var(--glow-lamplight); } to { box-shadow: 0 0 40px 10px var(--glow-lamplight); } }",
    ".lf-book-beacon { animation: lf-book-beacon var(--motion-breath, 2600ms) ease-in-out infinite alternate; }",
    ".lf-book:active { transform: translateY(2px); }",
    "@media (prefers-reduced-motion: reduce) { .lf-book-beacon { animation: none; box-shadow: 0 0 30px 6px var(--glow-lamplight); } }"
  ].join("\n");
  document.head.appendChild(el);
}

const LIGHT_PIGMENTS = ["marigold", "butter"];

export function BookCover({
  title,
  pigment = "river",
  width = 150,
  art,
  progress,
  authored = false,
  sketch = false,
  beacon = false,
  onOpen,
  style
}) {
  ensureBookStyles();
  const height = Math.round(width * 1.38);
  const dark = !LIGHT_PIGMENTS.includes(pigment) && !sketch;
  const titleColor = sketch ? "var(--ink)" : dark ? "#F9F2E3" : "var(--ink)";
  const bg = sketch
    ? "var(--paper-bright)"
    : "color-mix(in srgb, var(--pigment-" + pigment + ") 58%, var(--paper-bright))";
  const ribbonH = progress != null ? Math.max(0.12, Math.min(progress, 1)) * height * 0.72 : 0;

  return (
    <div
      className={"lf-book lf-drawn-border" + (beacon ? " lf-book-beacon lf-drawn-border--bold" : "")}
      role={onOpen ? "button" : undefined}
      aria-label={onOpen ? "open " + title : title}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={onOpen ? function (e) { if (e.key === "Enter" || e.key === " ") onOpen(e); } : undefined}
      style={{
        width: width,
        height: height,
        borderRadius: "6px 8px 7px 6px",
        backgroundColor: bg,
        backgroundImage: "var(--texture-paper)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        padding: Math.round(width * 0.08),
        cursor: onOpen ? "pointer" : "default",
        color: "var(--ink)",
        boxShadow: beacon ? undefined : "0 4px 14px -7px var(--shadow-color)",
        transition: "transform var(--motion-settle, 260ms) var(--ease-settle, ease)",
        ...style
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: Math.max(13, Math.round(width * 0.105)),
          lineHeight: 1.18,
          textAlign: "center",
          color: titleColor,
          textWrap: "balance"
        }}
      >
        {title}
      </div>
      <div
        style={{
          flex: 1,
          display: "grid",
          placeItems: "center",
          filter: sketch ? "grayscale(0.9) opacity(0.55)" : undefined
        }}
      >
        {art}
      </div>

      {sketch && (
        <svg viewBox="0 0 100 138" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} aria-hidden="true">
          <path d="M8 130 l10 -10 M14 132 l12 -12 M78 14 l12 -6 M80 20 l14 -8" stroke="var(--ink-faint)" strokeWidth="1.3" fill="none" filter="url(#lf-dry)"></path>
        </svg>
      )}

      {progress != null && (
        <svg
          width={Math.round(width * 0.15)}
          height={ribbonH + 12}
          viewBox={"0 0 22 " + (ribbonH + 12)}
          style={{ position: "absolute", top: -5, right: Math.round(width * 0.1), overflow: "visible" }}
          aria-label={"progress " + Math.round((progress || 0) * 100) + "%"}
        >
          <path
            d={"M2 2 L20 2 L20 " + ribbonH + " L11 " + (ribbonH - 8) + " L2 " + ribbonH + " Z"}
            fill="var(--accent-action)"
            opacity="0.85"
            filter="url(#lf-wash-edge)"
          ></path>
          <path
            d={"M2 2 L20 2 L20 " + ribbonH + " L11 " + (ribbonH - 8) + " L2 " + ribbonH + " Z"}
            fill="none"
            stroke="var(--ink)"
            strokeWidth="1.6"
            filter="url(#lf-wobble)"
          ></path>
        </svg>
      )}

      {authored && (
        <svg width="22" height="22" viewBox="0 0 22 22" style={{ position: "absolute", top: 7, left: 7 }} aria-label="made by the child">
          <path
            d="M11 1.5 l2.6 5.4 5.9 .6 -4.4 4 1.3 5.8 -5.4 -3 -5.4 3 1.3 -5.8 -4.4 -4 5.9 -.6 z"
            fill="var(--accent-action)"
            opacity="0.9"
            filter="url(#lf-wobble)"
          ></path>
        </svg>
      )}
    </div>
  );
}
