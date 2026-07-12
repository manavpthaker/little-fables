import React from "react";

/* Little Fables — a star word pinned to the Language Wall, like a postcard. */

export function StarWord({ word, pin = "berry", rotate = 0, width = 132, style }) {
  return (
    <div
      style={{
        width: width,
        transform: "rotate(" + rotate + "deg)",
        position: "relative",
        display: "inline-block",
        ...style
      }}
      role="img"
      aria-label={"star word: " + word}
    >
      <div
        className="lf-drawn-border"
        style={{
          backgroundColor: "var(--paper-bright)",
          backgroundImage: "var(--texture-paper)",
          borderRadius: "6px 8px 7px 6px",
          padding: "18px 12px 14px",
          textAlign: "center",
          color: "var(--ink)",
          boxShadow: "0 4px 10px -6px var(--shadow-color)"
        }}
      >
        <span style={{ fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: "var(--text-label, 24px)" }}>{word}</span>
      </div>
      <svg width="14" height="14" viewBox="0 0 14 14" style={{ position: "absolute", top: -5, left: "50%", marginLeft: -7 }} aria-hidden="true">
        <circle cx="7" cy="7" r="4.6" fill={"var(--pigment-" + pin + ")"} filter="url(#lf-wobble)"></circle>
      </svg>
    </div>
  );
}
