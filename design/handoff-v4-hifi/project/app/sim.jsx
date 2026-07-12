/* Little Fables — SIMULATION LAYER
   Every "live system" in the real product is stood in for here, on timers.
   Each stand-in is marked with a SIM: comment naming the real system.

   SIM index:
   - speakTTS()      → real system: recorded buddy voice / child-tuned neural TTS.
                       Prototype default = silent (balloon + sound-arcs only);
                       optional browser speechSynthesis via the Tweaks panel.
   - useMicSim()     → real system: on-device ASR + LLM intent resolution.
                       Here: "listening" resolves after ~1.5s with a scripted
                       transcript from a per-context script queue.
   - WordGlow        → real system: narration-aligned karaoke (forced-alignment
                       word timings from the TTS engine). Here: a fixed ms/word timer.
   - foley()         → real system: foley sample playback (page-brush, pencil,
                       lantern hum — see tokens/sound.css). Here: a no-op note.
*/

const LFNS = window.LittleFablesDesignSystem_d603a2;

/* ---------- shared prototype styles (injected once) ---------- */
(function ensureSimStyles() {
  if (document.getElementById("lfp-sim-style")) return;
  const el = document.createElement("style");
  el.id = "lfp-sim-style";
  el.textContent = `
    @keyframes lfp-breath { from { transform: scale(1,1); } to { transform: scale(1.02,1.035); } }
    .lfp-breath { animation: lfp-breath var(--motion-breath, 2600ms) ease-in-out infinite alternate; transform-origin: 50% 96%; }
    .lfp-word { border-radius: 8px; padding: 0 3px; margin: 0 -3px; transition: background 220ms ease, text-shadow 220ms ease; }
    .lfp-word-lit { background: radial-gradient(ellipse 110% 130% at 50% 55%, var(--glow-lamplight), transparent 78%); text-shadow: 0 0 12px rgba(242,196,96,0.5); }
    @keyframes lfp-glow-breathe { from { box-shadow: 0 0 20px 3px var(--glow-lamplight); } to { box-shadow: 0 0 42px 13px var(--glow-lamplight); } }
    .lfp-beacon { animation: lfp-glow-breathe var(--motion-breath, 2600ms) ease-in-out infinite alternate; }
    @keyframes lfp-terra-glow { from { box-shadow: 0 0 18px 2px rgba(217,91,67,0.42); } to { box-shadow: 0 0 36px 10px rgba(217,91,67,0.6); } }
    .lfp-terra-glow { animation: lfp-terra-glow 1.5s ease-in-out infinite alternate; }
    @keyframes lfp-fade-in { from { opacity: 0; } to { opacity: 1; } }
    .lfp-fade-in { animation: lfp-fade-in 480ms ease both; }
    @keyframes lfp-settle-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .lfp-settle-in { animation: lfp-settle-in var(--motion-settle,260ms) var(--ease-settle) both; }
    /* reduced-motion variants: hold resting frames / quiet dissolves */
    @media (prefers-reduced-motion: reduce) {
      .lfp-breath, .lfp-beacon, .lfp-terra-glow { animation: none; }
      .lfp-beacon { box-shadow: 0 0 32px 8px var(--glow-lamplight); }
      .lfp-terra-glow { box-shadow: 0 0 28px 6px rgba(217,91,67,0.5); }
    }
    [data-reduce] .lfp-breath, [data-reduce] .lfp-beacon, [data-reduce] .lfp-terra-glow,
    [data-reduce] .lfp-fade-in, [data-reduce] .lfp-settle-in { animation: none; }
    [data-reduce] .lfp-beacon { box-shadow: 0 0 32px 8px var(--glow-lamplight); }
  `;
  document.head.appendChild(el);
})();

/* ---------- spoken audio (SIM: recorded buddy voice / child-tuned TTS) ---------- */
function speakTTS(text) {
  try {
    if (!window.__lfTTSOn || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text).replace(/\*/g, ""));
    u.rate = 0.95; u.pitch = 1.15;
    window.speechSynthesis.speak(u);
  } catch (e) { /* silent */ }
}
function speechMs(text) {
  const words = String(text).split(/\s+/).filter(Boolean).length;
  return 900 + words * 330;
}

/* ---------- the buddy's one line per screen visit ----------
   Balloon appears WITH the spoken line; arcs pulse while "audio" plays,
   then the balloon stays as quiet atmosphere. */
function BuddyLine({ line, tail = "left", maxWidth = 340, variant = "calm", delay = 0, onSpoken, style }) {
  const { SpeechBalloon } = LFNS;
  const [phase, setPhase] = React.useState(delay > 0 ? "wait" : "speaking");
  React.useEffect(() => {
    let t1, t2;
    setPhase(delay > 0 ? "wait" : "speaking");
    t1 = setTimeout(() => {
      setPhase("speaking");
      speakTTS(line);
      t2 = setTimeout(() => { setPhase("said"); onSpoken && onSpoken(); }, speechMs(line));
    }, delay);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [line]);
  if (phase === "wait") return null;
  return (
    <div style={style}>
      <SpeechBalloon speaking={phase === "speaking"} tail={tail} maxWidth={maxWidth} variant={variant} key={line}>
        {line}
      </SpeechBalloon>
    </div>
  );
}

/* ---------- press-and-hold: everything speaks ----------
   Any labeled object, held ~half a second, says its own name in the buddy's
   voice. (SIM: spoken audio; the small balloon is the visual trace.) */
const lfHoldBus = { fns: new Set(), emit(v) { this.fns.forEach((f) => f(v)); }, sub(f) { this.fns.add(f); return () => this.fns.delete(f); } };
let lfHoldSeq = 0;

function stagePoint(e) {
  const canvas = document.getElementById("lf-canvas");
  if (!canvas) return { x: 590, y: 700 };
  const r = canvas.getBoundingClientRect();
  const sx = r.width / canvas.offsetWidth;
  return { x: (e.clientX - r.left) / sx, y: (e.clientY - r.top) / sx };
}

/* returns props to spread on any element: hold ≥480ms → it speaks its label. */
function holdToSpeak(label, onTap) {
  let timer = null, spoke = false;
  return {
    onPointerDown: (e) => {
      spoke = false;
      const pt = stagePoint(e);
      timer = setTimeout(() => {
        spoke = true;
        speakTTS(label);
        lfHoldBus.emit({ id: ++lfHoldSeq, label, x: pt.x, y: pt.y });
      }, 480);
    },
    onPointerUp: () => { clearTimeout(timer); },
    onPointerLeave: () => { clearTimeout(timer); },
    onPointerCancel: () => { clearTimeout(timer); },
    onClick: (e) => { if (spoke) { e.preventDefault(); e.stopPropagation(); spoke = false; return; } onTap && onTap(e); },
    onContextMenu: (e) => e.preventDefault()
  };
}

/* mounted once at canvas root: shows the little spoken-name balloon */
function SpokenOverlay() {
  const [item, setItem] = React.useState(null);
  React.useEffect(() => lfHoldBus.sub((v) => setItem(v)), []);
  React.useEffect(() => {
    if (!item) return;
    const t = setTimeout(() => setItem(null), Math.max(1500, speechMs(item.label)));
    return () => clearTimeout(t);
  }, [item]);
  if (!item) return null;
  const x = Math.min(Math.max(item.x, 120), 1060);
  const y = Math.max(item.y - 96, 30);
  return (
    <div key={item.id} className="lfp-settle-in" style={{ position: "absolute", left: x, top: y, transform: "translateX(-50%)", zIndex: 90, pointerEvents: "none" }}>
      <div className="lf-drawn-border" style={{
        backgroundColor: "var(--surface-card)", backgroundImage: "var(--texture-paper)",
        borderRadius: "16px 20px 17px 19px", padding: "10px 18px",
        fontFamily: "var(--font-body)", fontSize: 24, fontStyle: "italic", color: "var(--ink)",
        boxShadow: "0 4px 14px -8px var(--shadow-color)", whiteSpace: "nowrap"
      }}>
        {item.label}
        <svg width="20" height="20" viewBox="0 0 26 26" aria-hidden="true" style={{ marginLeft: 8, verticalAlign: "-3px" }}>
          <g fill="none" stroke="var(--ink-soft)" strokeWidth="2.2" strokeLinecap="round" filter="url(#lf-wobble)">
            <path d="M4 16 q 3 2 6 0"></path><path d="M3 11 q 6 4 12 0"></path><path d="M2 6 q 9 6 18 0"></path>
          </g>
        </svg>
      </div>
    </div>
  );
}

/* ---------- the mic (SIM: on-device ASR + LLM intent resolution) ----------
   start() → "listening" (the buddy leans in; no red dots anywhere) →
   after ~resolveMs the next scripted utterance in the queue "is heard". */
function useMicSim(script, resolveMs = 1500) {
  const [phase, setPhase] = React.useState("idle"); // idle | listening | heard
  const [heard, setHeard] = React.useState(null);
  const idx = React.useRef(0);
  const timer = React.useRef(null);
  const start = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setPhase("listening");
    setHeard(null);
    timer.current = setTimeout(() => {
      const utterance = script[Math.min(idx.current, script.length - 1)];
      idx.current += 1;
      setHeard(utterance);
      setPhase("heard");
    }, resolveMs); // SIM: real ASR resolves on end-of-speech detection
  }, [script, resolveMs]);
  const reset = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    idx.current = 0; setPhase("idle"); setHeard(null);
  }, []);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  return { phase, heard, start, reset };
}

/* ---------- word highlight (SIM: narration-aligned karaoke) ----------
   A warm lamplight glow crossing the words on a timer. Real system: word
   timings from forced alignment; reduced motion: no sweep, text just sits. */
function WordGlow({ text, ms = 430, active = true, size = "var(--text-reading, 28px)", style, onDone }) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const [lit, setLit] = React.useState(-1);
  React.useEffect(() => {
    setLit(-1);
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.hasAttribute("data-reduce")) {
      onDone && setTimeout(onDone, 600);
      return;
    }
    const t = setInterval(() => {
      setLit((i) => {
        if (i >= words.length + 1) { clearInterval(t); onDone && onDone(); return -1; }
        return i + 1;
      });
    }, ms);
    return () => clearInterval(t);
  }, [text, active]);
  return (
    <p style={{ fontFamily: "var(--font-body)", fontSize: size, lineHeight: "var(--leading-reading,1.52)", color: "var(--ink)", textWrap: "pretty", margin: 0, ...style }}>
      {words.map((w, i) => {
        const star = w.startsWith("*") && w.replace(/[^*]/g, "").length >= 2;
        const clean = w.replace(/\*/g, "");
        return (
          <React.Fragment key={i}>
            <span className={"lfp-word" + (i === lit ? " lfp-word-lit" : "")} style={star ? { fontStyle: "italic" } : undefined}>{clean}</span>
            {i < words.length - 1 ? " " : ""}
          </React.Fragment>
        );
      })}
    </p>
  );
}

/* ---------- foley (SIM: sample playback per tokens/sound.css) ---------- */
function foley(name) { /* SIM: real system plays the named foley sample (e.g. "page-brush", "pencil", "lantern"). The prototype is silent by design. */ }

/* ---------- tiny time helpers ---------- */
function useTimeout(fn, ms, deps) {
  React.useEffect(() => { const t = setTimeout(fn, ms); return () => clearTimeout(t); }, deps || []);
}
function realTimeOfDay() {
  const h = new Date().getHours();
  if (h < 11) return "morning";
  if (h < 17) return "afternoon";
  if (h < 20) return "evening";
  return "night";
}

Object.assign(window, { speakTTS, speechMs, BuddyLine, holdToSpeak, SpokenOverlay, useMicSim, WordGlow, foley, useTimeout, realTimeOfDay });
