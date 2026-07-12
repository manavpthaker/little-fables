import React from "react";

/* Little Fables — hand-drawn speech balloon for buddy speech.
   The balloon appears WITH a spoken line; on-screen text is atmosphere,
   audio carries the meaning. */

const STYLE_ID = "lf-speech-style";
function ensureSpeechStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = [
    "@keyframes lf-balloon-in { from { transform: scale(0.94) rotate(-1.2deg); opacity: 0; } to { transform: scale(1) rotate(0deg); opacity: 1; } }",
    "@keyframes lf-balloon-rock { 0%, 100% { transform: rotate(-0.7deg); } 50% { transform: rotate(0.8deg); } }",
    "@keyframes lf-speak-arc { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.9; } }",
    ".lf-balloon-calm { animation: lf-balloon-in var(--motion-settle, 260ms) var(--ease-settle, cubic-bezier(0.22,1,0.36,1)) both; }",
    ".lf-balloon-bouncy { animation: lf-balloon-in 340ms cubic-bezier(0.34, 1.45, 0.44, 1) both; }",
    ".lf-balloon-rock { animation: lf-balloon-rock 2.8s ease-in-out infinite; }",
    ".lf-speak-arc { animation: lf-speak-arc 1.4s ease-in-out infinite; }",
    "@media (prefers-reduced-motion: reduce) { .lf-balloon-calm, .lf-balloon-bouncy, .lf-balloon-rock, .lf-speak-arc { animation: none; opacity: 1; } }"
  ].join("\n");
  document.head.appendChild(el);
}

export function SpeechBalloon({ children, variant = "calm", tail = "left", speaking = false, maxWidth = 360, style }) {
  ensureSpeechStyles();
  const rockClass = variant === "bouncy" ? "lf-balloon-rock" : "";
  const inClass = variant === "bouncy" ? "lf-balloon-bouncy" : "lf-balloon-calm";
  const tailLeft = tail !== "right";
  return (
    <div className={inClass} style={{ position: "relative", display: "inline-block", ...style }}>
      <div
        className={"lf-drawn-border " + rockClass}
        style={{
          backgroundColor: "var(--surface-card)",
          backgroundImage: "var(--texture-paper)",
          borderRadius: "20px 26px 22px 25px",
          padding: "16px 24px",
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-speech, 26px)",
          lineHeight: "var(--leading-speech, 1.35)",
          color: "var(--ink)",
          maxWidth: maxWidth,
          boxShadow: "0 4px 16px -8px var(--shadow-color)"
        }}
      >
        {children}
      </div>
      {tail !== "none" && (
        <svg
          width="44" height="30" viewBox="0 0 44 30"
          style={{
            position: "absolute", bottom: -24,
            left: tailLeft ? 36 : "auto", right: tailLeft ? "auto" : 36,
            transform: tailLeft ? "none" : "scaleX(-1)",
            overflow: "visible"
          }}
          aria-hidden="true"
        >
          <path d="M6 1 Q 14 14 4 26 Q 22 20 34 2 Z" fill="var(--surface-card)"></path>
          <path d="M6 3 Q 14 14 4 26 M4 26 Q 22 20 34 4" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" filter="url(#lf-wobble)"></path>
          {speaking && (
            <g fill="none" stroke="var(--ink-soft)" strokeWidth="2" strokeLinecap="round">
              <path className="lf-speak-arc" d="M6 30 q 4 3 8 0" style={{ animationDelay: "0ms" }}></path>
              <path className="lf-speak-arc" d="M3 34 q 7 5 14 0" style={{ animationDelay: "220ms" }}></path>
              <path className="lf-speak-arc" d="M0 38 q 10 7 20 0" style={{ animationDelay: "440ms" }}></path>
            </g>
          )}
        </svg>
      )}
    </div>
  );
}
