import React from "react";
import { MicButton } from "../reading/ReadingPage.jsx";

/* Little Fables — the ask card. The buddy poses a spoken question;
   the card shows it and offers the mic (the screen's one terracotta). */

export function AskCard({ question, micActive = false, onMic, width = 420, style }) {
  return (
    <div
      className="lf-drawn-border"
      style={{
        width: width,
        boxSizing: "border-box",
        backgroundColor: "var(--surface-card)",
        backgroundImage: "var(--texture-paper)",
        borderRadius: "22px 26px 24px 25px",
        padding: "26px 30px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        color: "var(--ink)",
        boxShadow: "0 6px 22px -12px var(--shadow-color)",
        ...style
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, alignSelf: "stretch" }}>
        {/* spoken-cue mark: this question is said aloud */}
        <svg width="26" height="26" viewBox="0 0 26 26" style={{ flex: "none", marginTop: 6 }} aria-label="spoken aloud">
          <g fill="none" stroke="var(--ink-soft)" strokeWidth="2" strokeLinecap="round" filter="url(#lf-wobble)">
            <path d="M4 16 q 3 2 6 0"></path>
            <path d="M3 11 q 6 4 12 0"></path>
            <path d="M2 6 q 9 6 18 0"></path>
          </g>
        </svg>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-speech, 26px)",
            lineHeight: "var(--leading-speech, 1.35)",
            margin: 0,
            textWrap: "pretty"
          }}
        >
          {question}
        </p>
      </div>
      <MicButton active={micActive} onPress={onMic} size={68} label="tell me"></MicButton>
    </div>
  );
}
