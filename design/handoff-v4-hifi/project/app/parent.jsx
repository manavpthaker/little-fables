/* Little Fables — GROWN-UPS. The system boundary, exactly per the parent-
   surface rule: shadcn-style neutrals, Inter, sentence case, no drawn
   elements, no buddy voice — and none of it leaks back into the room.

   PARENT_GATE: voice can never reach these surfaces. The voice intent
   grammar (home.jsx) grounds only to child-world room objects; there is no
   spoken route here. Entry is touch + the 3-answer multiplication gate.
   (SIM: in the real app the entry gesture is a two-finger hold.) */

const PR_NS = window.LittleFablesDesignSystem_d603a2;

(function ensureParentStyles() {
  if (document.getElementById("lfp-parent-style")) return;
  const el = document.createElement("style");
  el.id = "lfp-parent-style";
  el.textContent = `
    @keyframes lfp-gate-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-7px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(3px); } }
    .lfp-gate-shake { animation: lfp-gate-shake 360ms ease; }
    .lfp-pill { display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 999px; font-size: 12px; font-weight: 500; }
    .lfp-parent-tab { width: 100%; text-align: left; padding: 8px 12px; border-radius: 7px; font-size: 13.5px; color: #3F3F46; cursor: pointer; }
    .lfp-parent-tab:hover { background: #F4F4F5; }
    .lfp-parent-tab[data-on="true"] { background: #F4F4F5; font-weight: 600; color: #18181B; }
    @media (prefers-reduced-motion: reduce) { .lfp-gate-shake { animation: none; } }
  `;
  document.head.appendChild(el);
})();

/* ---------- the gate ---------- */
function GateView({ onPass, onBack }) {
  const QUESTIONS = [
    { q: "7 × 4", a: 28, opts: [24, 28, 32] },
    { q: "6 × 8", a: 48, opts: [42, 48, 54] },
    { q: "9 × 3", a: 27, opts: [21, 27, 33] }
  ];
  const [qi, setQi] = React.useState(0);
  const [shake, setShake] = React.useState(false);
  const Q = QUESTIONS[qi % QUESTIONS.length];
  function answer(v) {
    if (v === Q.a) onPass();
    else { setShake(true); setTimeout(() => { setShake(false); setQi(qi + 1); }, 420); }
  }
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
      <div className={shake ? "lfp-gate-shake" : ""} style={{ width: 360, background: "#FFFFFF", border: "1px solid #E4E4E7", borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", padding: 28, textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#18181B" }}>For grown-ups</div>
        <div style={{ fontSize: 13, color: "#71717A", marginTop: 6 }}>Solve to continue</div>
        <div style={{ fontSize: 34, fontWeight: 600, color: "#18181B", margin: "18px 0 6px", fontVariantNumeric: "tabular-nums" }}>{Q.q} = ?</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
          {Q.opts.map((o) => (
            <button key={o} onClick={() => answer(o)} style={{ minWidth: 74, minHeight: 44, borderRadius: 8, border: "1px solid #E4E4E7", background: "#FAFAFA", fontSize: 16, fontWeight: 500, color: "#18181B", cursor: "pointer" }}>{o}</button>
          ))}
        </div>
        <button onClick={onBack} style={{ marginTop: 20, fontSize: 13, color: "#71717A", cursor: "pointer", background: "none" }}>Back to the room</button>
      </div>
    </div>
  );
}

/* ---------- corner panes ---------- */
function Pill({ tone, children }) {
  const tones = {
    green: { bg: "#F0FDF4", fg: "#15803D", bd: "#BBF7D0" },
    amber: { bg: "#FFFBEB", fg: "#B45309", bd: "#FDE68A" },
    gray: { bg: "#F4F4F5", fg: "#52525B", bd: "#E4E4E7" }
  }[tone || "gray"];
  return <span className="lfp-pill" style={{ background: tones.bg, color: tones.fg, border: "1px solid " + tones.bd }}>{children}</span>;
}

function StoriesPane({ nav }) {
  const { LF_BOOKS, LF_SHELF_ORDER } = window;
  const rows = [...LF_SHELF_ORDER.map((id) => LF_BOOKS[id]), ...nav.state.history.authored.map((id) => LF_BOOKS[id])].filter(Boolean);
  const prog = nav.state.history.progress;
  return (
    <div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", color: "#71717A", fontSize: 12 }}>
            <th style={{ padding: "6px 8px", fontWeight: 500 }}>Story</th>
            <th style={{ padding: "6px 8px", fontWeight: 500 }}>Source</th>
            <th style={{ padding: "6px 8px", fontWeight: 500 }}>QA</th>
            <th style={{ padding: "6px 8px", fontWeight: 500 }}>Progress</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => {
            const p = prog[b.id];
            return (
              <tr key={b.id} style={{ borderTop: "1px solid #F4F4F5", color: "#18181B" }}>
                <td style={{ padding: "9px 8px", fontWeight: 500 }}>{b.title}</td>
                <td style={{ padding: "9px 8px", color: "#52525B" }}>{b.authored ? "Made by Azad" : "Curated library"}</td>
                <td style={{ padding: "9px 8px" }}>
                  {b.madeInKitchen ? <Pill tone="green">Passed · created today</Pill> : b.authored ? <Pill tone="green">Passed</Pill> : <Pill tone="gray">Curated</Pill>}
                </td>
                <td style={{ padding: "9px 8px", color: "#52525B", fontVariantNumeric: "tabular-nums" }}>
                  {p && p.done ? "Finished" : p ? "Chapter " + (p.chapter + 1) + " of " + b.chapters.length : "Not started"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RetellingsPane() {
  const { LF_RETELLINGS } = window;
  const [playing, setPlaying] = React.useState(null);
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    if (playing == null) return;
    const iv = setInterval(() => setT((x) => {
      const dur = LF_RETELLINGS[playing].secs;
      if (x >= dur) { setPlaying(null); return 0; }
      return x + 1;
    }), 1000);
    return () => clearInterval(iv);
  }, [playing]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {LF_RETELLINGS.map((r, i) => (
        <div key={i} style={{ border: "1px solid #E4E4E7", borderRadius: 10, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* SIM: audio player — plays the captured retelling */}
            <button onClick={() => { setPlaying(playing === i ? null : i); setT(0); }}
              aria-label={playing === i ? "pause" : "play retelling"}
              style={{ width: 36, height: 36, borderRadius: "50%", background: "#18181B", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer", flex: "none" }}>
              {playing === i ? (
                <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 1h3v10H2zM7 1h3v10H7z" fill="currentColor"></path></svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 1l9 5-9 5z" fill="currentColor"></path></svg>
              )}
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "#18181B" }}>{r.book}</div>
              <div style={{ fontSize: 12, color: "#71717A" }}>{r.date} · 0:{String(r.secs).padStart(2, "0")}</div>
            </div>
          </div>
          <div style={{ height: 4, background: "#F4F4F5", borderRadius: 2, margin: "10px 0" }}>
            <div style={{ height: 4, width: (playing === i ? (t / r.secs) * 100 : 0) + "%", background: "#18181B", borderRadius: 2, transition: "width 1s linear" }}></div>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.55, color: "#3F3F46", background: "#FAFAFA", border: "1px solid #F4F4F5", borderRadius: 8, padding: "10px 12px" }}>
            “{r.transcript}”
          </div>
        </div>
      ))}
    </div>
  );
}

function MadePane({ nav }) {
  const { LF_INTERVIEW_LOG, LF_KITCHEN } = window;
  const { ParentToggle } = PR_NS;
  const [kept, setKept] = React.useState(true);
  const created = nav.state.history.authored.includes("balloon");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ border: "1px solid #E4E4E7", borderRadius: 10, padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#18181B" }}>Peter and the Runaway Balloon</div>
            <div style={{ fontSize: 12, color: "#71717A" }}>{created ? "Created today at the story desk" : "Most recent — created at the story desk"} · <Pill tone="green">Passed safety QA</Pill></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#3F3F46" }}>
            Keep on shelf <ParentToggle on={kept} onChange={setKept}></ParentToggle>
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: "#71717A", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Interview transcript</div>
        <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
          {LF_INTERVIEW_LOG.map((x, i) => (
            <div key={i} style={{ fontSize: 13, color: "#3F3F46" }}>
              <span style={{ color: "#71717A" }}>{x.q}</span> — “{x.a}”
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: "#71717A", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Recipe</div>
        <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Pill tone="gray">want: a big red balloon</Pill>
          <Pill tone="gray">why: a present for his bhen</Pill>
          <Pill tone="gray">obstacle: the wind takes it</Pill>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: "#71717A", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Generated opening</div>
        <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.55, color: "#3F3F46", background: "#FAFAFA", border: "1px solid #F4F4F5", borderRadius: 8, padding: "10px 12px" }}>
          Peter found a big red balloon, round as the moon. It was for his bhen — the best present ever…
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button style={{ fontSize: 12.5, padding: "6px 12px", borderRadius: 7, border: "1px solid #E4E4E7", background: "#FFFFFF", color: "#3F3F46", cursor: "pointer" }}>Archive</button>
          <button style={{ fontSize: 12.5, padding: "6px 12px", borderRadius: 7, border: "1px solid #E4E4E7", background: "#FFFFFF", color: "#3F3F46", cursor: "pointer" }}>Download PDF</button>
        </div>
      </div>
      <div style={{ fontSize: 12, color: "#A1A1AA" }}>Out-of-bounds asks are redirected in-story and logged here. Today: “a zombie eats the moon” → redirected to a Peter trick.</div>
    </div>
  );
}

function ProfilePane() {
  const { ParentSurface, ParentRow, ParentToggle } = PR_NS;
  const [cap, setCap] = React.useState(1);
  const [driveMode, setDriveMode] = React.useState(false);
  const themes = ["bridges", "being brave", "little sisters", "the moon", "kind tricksters"];
  const cast = ["Miko", "Boulder", "Peter the otter", "wildcard slot", "wildcard slot"];
  const excluded = ["zombies", "guns", "scary clowns"];
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
      <ParentSurface title="Profile" width={300}>
        <ParentRow label="Reader" value="Azad, 4"></ParentRow>
        <ParentRow label="Reading days this week" value="4"></ParentRow>
        <ParentRow label="New words this week" value="3"></ParentRow>
        <ParentRow label="Drive mode" control={<ParentToggle on={driveMode} onChange={setDriveMode}></ParentToggle>}></ParentRow>
      </ParentSurface>
      <ParentSurface title="Creative guardrails" width={392}>
        <div style={{ padding: "10px 16px", fontSize: 13 }}>
          <div style={{ fontSize: 12, color: "#71717A", marginBottom: 6 }}>Themes</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {themes.map((t) => <Pill key={t} tone="gray">{t}</Pill>)}
          </div>
          <div style={{ fontSize: 12, color: "#71717A", margin: "12px 0 6px" }}>Cast</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {cast.map((c, i) => <Pill key={i} tone={c.includes("wildcard") ? "amber" : "gray"}>{c}</Pill>)}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "14px 0 0" }}>
            <span style={{ color: "#3F3F46" }}>Daily story cap</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setCap(Math.max(0, cap - 1))} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #E4E4E7", background: "#FAFAFA", cursor: "pointer" }}>−</button>
              <span style={{ fontVariantNumeric: "tabular-nums", minWidth: 46, textAlign: "center" }}>{cap} / day</span>
              <button onClick={() => setCap(Math.min(3, cap + 1))} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #E4E4E7", background: "#FAFAFA", cursor: "pointer" }}>+</button>
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#71717A", margin: "14px 0 6px" }}>Excluded terms</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {excluded.map((x) => <Pill key={x} tone="amber">{x} ✕</Pill>)}
            <span style={{ fontSize: 12, color: "#A1A1AA", alignSelf: "center" }}>+ add term</span>
          </div>
        </div>
      </ParentSurface>
    </div>
  );
}

/* ---------- the sheet ---------- */
function ParentSheet({ nav }) {
  const [passed, setPassed] = React.useState(false);
  const [tab, setTab] = React.useState("Stories");
  const tabs = ["Stories", "Retellings", "Made by Azad", "Profile & guardrails"];
  function close() { nav.setRoute({ screen: "home" }); }
  return (
    <div data-screen-label={passed ? "Parent Corner" : "Grown-ups gate"} style={{ position: "absolute", inset: 0, zIndex: 55, background: "#FAFAFA", fontFamily: "var(--font-parent)", overflow: "hidden" }}>
      {!passed ? (
        <GateView onPass={() => setPassed(true)} onBack={close}></GateView>
      ) : (
        <div style={{ position: "absolute", inset: 0, display: "flex" }}>
          <div style={{ width: 218, borderRight: "1px solid #E4E4E7", background: "#FFFFFF", padding: 14, display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#18181B", padding: "6px 12px 14px" }}>Parent corner</div>
            {tabs.map((t) => (
              <button key={t} className="lfp-parent-tab" data-on={tab === t} onClick={() => setTab(t)}>{t}</button>
            ))}
            <div style={{ flex: 1 }}></div>
            <div style={{ fontSize: 11.5, color: "#A1A1AA", padding: "0 12px 8px", lineHeight: 1.5 }}>
              Voice never reaches these pages. Azad's room can't link here.
            </div>
            <button onClick={close} style={{ margin: 12, padding: "8px 12px", borderRadius: 7, border: "1px solid #E4E4E7", background: "#FFFFFF", fontSize: 13, color: "#18181B", cursor: "pointer" }}>
              ← Back to Little Fables
            </button>
          </div>
          <div style={{ flex: 1, padding: 22, overflow: "auto" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#18181B", marginBottom: 14 }}>{tab}</div>
            {tab === "Stories" && <StoriesPane nav={nav}></StoriesPane>}
            {tab === "Retellings" && <RetellingsPane></RetellingsPane>}
            {tab === "Made by Azad" && <MadePane nav={nav}></MadePane>}
            {tab === "Profile & guardrails" && <ProfilePane></ProfilePane>}
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ParentSheet });
