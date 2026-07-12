import React from "react";

/* Little Fables — choice cards: 2–3 drawn objects to pick up.
   Every card is spoken aloud when offered; picking = picking the object up. */

const STYLE_ID = "lf-choice-style";
function ensureChoiceStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = [
    ".lf-choice { transition: transform var(--motion-settle, 260ms) var(--ease-settle, ease), box-shadow var(--motion-settle, 260ms) ease; }",
    ".lf-choice:hover { transform: translateY(-3px); }",
    ".lf-choice:active { transform: translateY(1px); }",
    ".lf-choice-picked { box-shadow: 0 0 30px 6px var(--glow-lamplight) !important; }",
    "@media (prefers-reduced-motion: reduce) { .lf-choice, .lf-choice:hover, .lf-choice:active { transform: none; } }"
  ].join("\n");
  document.head.appendChild(el);
}

const CHOICE_PIGMENTS = ["sage", "river", "marigold"];

export function ChoiceCards({ choices = [], onPick, picked, size = 168, style }) {
  ensureChoiceStyles();
  return (
    <div style={{ display: "flex", gap: 24, alignItems: "stretch", ...style }}>
      {choices.slice(0, 3).map(function (c, i) {
        const pig = c.pigment || CHOICE_PIGMENTS[i % CHOICE_PIGMENTS.length];
        const isPicked = picked === c.id;
        return (
          <button
            key={c.id}
            className={"lf-drawn-border lf-choice" + (isPicked ? " lf-choice-picked" : "")}
            onClick={onPick ? function () { onPick(c.id); } : undefined}
            aria-label={c.label + " — say it or tap it"}
            aria-pressed={isPicked}
            style={{
              width: size,
              minHeight: size,
              borderRadius: "18px 22px 20px 21px",
              backgroundColor: "color-mix(in srgb, var(--pigment-" + pig + ") 26%, var(--paper-bright))",
              backgroundImage: "var(--texture-paper)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: 16,
              boxSizing: "border-box",
              color: "var(--ink)",
              boxShadow: "0 5px 18px -10px var(--shadow-color)"
            }}
          >
            <div style={{ display: "grid", placeItems: "center", flex: 1 }}>{c.art}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-label, 24px)" }}>{c.label}</span>
              <svg width="18" height="18" viewBox="0 0 26 26" aria-hidden="true">
                <g fill="none" stroke="var(--ink-soft)" strokeWidth="2.4" strokeLinecap="round" filter="url(#lf-wobble)">
                  <path d="M4 16 q 3 2 6 0"></path>
                  <path d="M3 11 q 6 4 12 0"></path>
                  <path d="M2 6 q 9 6 18 0"></path>
                </g>
              </svg>
            </div>
          </button>
        );
      })}
    </div>
  );
}
