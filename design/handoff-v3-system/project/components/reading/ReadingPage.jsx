import React, { useEffect, useState } from "react";

/* Little Fables — the spread inside a book. Art + text panel on paper.
   Word highlight = warm lamplight glow moving across words (never
   marker-yellow blocks). Mic affordance >=56px, drawn, terracotta when live. */

const STYLE_ID = "lf-reading-style";
function ensureReadingStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = [
    "@keyframes lf-mic-pulse { from { box-shadow: 0 0 14px 2px var(--glow-lamplight); } to { box-shadow: 0 0 30px 8px var(--glow-lamplight); } }",
    ".lf-mic-active { animation: lf-mic-pulse 1.6s ease-in-out infinite alternate; }",
    ".lf-word { border-radius: 8px; padding: 0 3px; margin: 0 -3px; transition: background 220ms ease, text-shadow 220ms ease; }",
    ".lf-word-lit { background: radial-gradient(ellipse 110% 130% at 50% 55%, var(--glow-lamplight), transparent 78%); text-shadow: 0 0 12px rgba(242, 196, 96, 0.5); }",
    "@media (prefers-reduced-motion: reduce) { .lf-mic-active { animation: none; box-shadow: 0 0 22px 5px var(--glow-lamplight); } }"
  ].join("\n");
  document.head.appendChild(el);
}

export function MicButton({ active = false, onPress, size = 64, label = "talk to me" }) {
  ensureReadingStyles();
  return (
    <button
      className={"lf-drawn-border" + (active ? " lf-mic-active" : "")}
      onClick={onPress}
      aria-label={label}
      aria-pressed={active}
      style={{
        width: size,
        height: size,
        minWidth: 56,
        minHeight: 56,
        borderRadius: "50% 48% 50% 52%",
        backgroundColor: active
          ? "color-mix(in srgb, var(--accent-action) 42%, var(--paper-bright))"
          : "var(--paper-bright)",
        backgroundImage: "var(--texture-paper)",
        display: "grid",
        placeItems: "center",
        color: active ? "var(--accent-action-deep)" : "var(--ink)",
        transition: "background-color var(--motion-settle, 260ms) ease"
      }}
    >
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 48 48" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" filter="url(#lf-wobble)">
          <rect x="17" y="6" width="14" height="22" rx="7"></rect>
          <path d="M11 24 q 1 12 13 12 q 12 0 13 -12"></path>
          <path d="M24 36 L24 42"></path>
          <path d="M17 42 L31 42"></path>
        </g>
      </svg>
    </button>
  );
}

export function ReadingPage({
  art,
  text = "",
  highlightIndex,
  autoHighlight = false,
  highlightMs = 460,
  micActive = false,
  onMic,
  onNext,
  pageLabel,
  width = 1000,
  style
}) {
  ensureReadingStyles();
  const words = text.split(/\s+/).filter(Boolean);
  const [autoIdx, setAutoIdx] = useState(-1);
  useEffect(
    function () {
      if (!autoHighlight) return undefined;
      if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
      const t = setInterval(function () {
        setAutoIdx(function (i) { return i >= words.length + 2 ? -1 : i + 1; });
      }, highlightMs);
      return function () { clearInterval(t); };
    },
    [autoHighlight, highlightMs, words.length]
  );
  const lit = autoHighlight ? autoIdx : highlightIndex;

  return (
    <div
      data-register="story"
      style={{
        width: width,
        aspectRatio: "1000 / 640",
        backgroundColor: "var(--paper-bright)",
        backgroundImage: "var(--texture-paper)",
        borderRadius: "var(--radius-page, 22px)",
        boxShadow: "0 8px 30px -14px var(--shadow-warm)",
        display: "grid",
        gridTemplateColumns: "47% 53%",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        ...style
      }}
    >
      {/* center gutter */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "47%",
          top: 18,
          bottom: 18,
          width: 1,
          background: "linear-gradient(to bottom, transparent, var(--ink-faint) 22%, var(--ink-faint) 78%, transparent)",
          opacity: 0.5
        }}
      ></div>

      {/* art panel */}
      <div style={{ display: "grid", placeItems: "center", padding: "5%" }}>{art}</div>

      {/* text panel */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "6% 7% 6% 6%", gap: 24 }}>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-reading, 28px)",
            lineHeight: "var(--leading-reading, 1.52)",
            color: "var(--ink)",
            textWrap: "pretty"
          }}
        >
          {words.map(function (w, i) {
            return (
              <React.Fragment key={i}>
                <span className={"lf-word" + (i === lit ? " lf-word-lit" : "")}>{w}</span>
                {i < words.length - 1 ? " " : ""}
              </React.Fragment>
            );
          })}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <MicButton active={micActive} onPress={onMic}></MicButton>
          <div style={{ flex: 1 }}></div>
          {pageLabel && (
            <span style={{ fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 20, color: "var(--ink-faint)" }}>{pageLabel}</span>
          )}
        </div>
      </div>

      {/* child-initiated page turn: drawn corner */}
      {onNext && (
        <button
          onClick={onNext}
          aria-label="turn the page"
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: 76,
            height: 76,
            display: "grid",
            placeItems: "center"
          }}
        >
          <svg width="58" height="58" viewBox="0 0 58 58" aria-hidden="true">
            <path d="M56 2 L56 56 L2 56 Q 40 48 56 2" fill="var(--paper-deep)" opacity="0.85" filter="url(#lf-wash-edge)"></path>
            <path d="M54 6 Q 40 46 6 54" fill="none" stroke="var(--ink)" strokeWidth="2" filter="url(#lf-wobble)"></path>
            <path d="M34 40 l10 -2 -4 9" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#lf-wobble)"></path>
          </svg>
        </button>
      )}
    </div>
  );
}
