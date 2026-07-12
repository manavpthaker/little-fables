import React from "react";

/* Little Fables — recap strip: "Last time…" as three small hand-drawn
   comic panels, one caption each. The comic grammar's home. */

export function RecapStrip({ panels = [], panelWidth = 190, style }) {
  return (
    <div style={{ display: "flex", gap: 22, alignItems: "flex-start", ...style }}>
      {panels.slice(0, 3).map(function (p, i) {
        return (
          <figure key={i} style={{ margin: 0, width: panelWidth, display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              className="lf-drawn-border"
              style={{
                height: Math.round(panelWidth * 0.78),
                borderRadius: "10px 13px 11px 12px",
                backgroundColor: "var(--paper-bright)",
                backgroundImage: "var(--texture-paper)",
                display: "grid",
                placeItems: "center",
                color: "var(--ink)",
                boxShadow: "0 4px 12px -8px var(--shadow-color)",
                transform: "rotate(" + (i === 1 ? 0.8 : i === 2 ? -0.5 : -0.9) + "deg)"
              }}
            >
              {p.art}
            </div>
            <figcaption
              style={{
                fontFamily: "var(--font-body)",
                fontStyle: "italic",
                fontSize: 20,
                lineHeight: 1.3,
                color: "var(--ink-soft)",
                textAlign: "center",
                textWrap: "balance"
              }}
            >
              {p.caption}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
