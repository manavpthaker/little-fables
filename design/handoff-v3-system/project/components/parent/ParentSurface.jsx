import React from "react";

/* Little Fables — parent surfaces. The grown-up boundary: quiet neutral
   panels, Inter, plain sentence case. The drawn world does not cross
   this line, and this styling never leaks into the child's room. */

export function ParentSurface({ title, children, width = 360, style }) {
  return (
    <div
      style={{
        width: width,
        backgroundColor: "#FFFFFF",
        border: "1px solid #E4E4E7",
        borderRadius: 10,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        fontFamily: "var(--font-parent)",
        color: "#18181B",
        overflow: "hidden",
        ...style
      }}
    >
      {title && (
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #F4F4F5", fontSize: 14, fontWeight: 600 }}>{title}</div>
      )}
      <div style={{ padding: "8px 0" }}>{children}</div>
    </div>
  );
}

export function ParentRow({ label, value, control }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "9px 16px", fontSize: 14 }}>
      <span style={{ color: "#3F3F46" }}>{label}</span>
      {control || <span style={{ color: "#71717A", fontVariantNumeric: "tabular-nums" }}>{value}</span>}
    </div>
  );
}

export function ParentToggle({ on = false, onChange }) {
  return (
    <button
      onClick={onChange ? function () { onChange(!on); } : undefined}
      aria-pressed={on}
      style={{
        width: 44,
        height: 24,
        borderRadius: 999,
        background: on ? "#18181B" : "#E4E4E7",
        position: "relative",
        transition: "background 150ms ease",
        flex: "none"
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: on ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#FFFFFF",
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
          transition: "left 150ms ease"
        }}
      ></span>
    </button>
  );
}
