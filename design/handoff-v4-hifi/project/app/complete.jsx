/* Little Fables — book complete → tell it back → badge.
   Celebration is LIGHT, not confetti: the lantern register, glow blooms,
   drifting dust motes. Star words are tapped (each speaks word + meaning,
   then flies to the wall pins). Tell-it-back records a retelling
   (SIM: audio capture + upload → Parent Corner "Retellings"). If a badge
   triggered, the medallion earn moment follows, and the medallion settles
   onto the shelf edge. */

const CP_NS = window.LittleFablesDesignSystem_d603a2;

(function ensureCelebrationStyles() {
  if (document.getElementById("lfp-celebrate-style")) return;
  const el = document.createElement("style");
  el.id = "lfp-celebrate-style";
  el.textContent = `
    @keyframes lfp-mote { 0% { transform: translateY(14px); opacity: 0; } 20% { opacity: 0.8; } 80% { opacity: 0.7; } 100% { transform: translateY(-46px); opacity: 0; } }
    .lfp-mote { animation: lfp-mote 7s linear infinite; }
    @keyframes lfp-bloom-in { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: scale(1); } }
    .lfp-bloom-in { animation: lfp-bloom-in 1200ms var(--ease-settle) both; }
    @keyframes lfp-star-fly { to { transform: translate(-260px, -340px) scale(0.5) rotate(-6deg); opacity: 0; } }
    .lfp-star-fly { animation: lfp-star-fly 1200ms var(--ease-drawn) both; }
    @keyframes lfp-record-bloom { from { transform: scale(1); opacity: 0.55; } to { transform: scale(1.55); opacity: 0; } }
    .lfp-record-bloom { animation: lfp-record-bloom 2s ease-out infinite; }
    @keyframes lfp-settle-shelf { to { transform: translate(var(--settle-x, 240px), var(--settle-y, 300px)) scale(0.42); } }
    .lfp-settle-shelf { animation: lfp-settle-shelf 1500ms var(--ease-drawn) both; }
    @media (prefers-reduced-motion: reduce) {
      .lfp-mote, .lfp-record-bloom { animation: none; opacity: 0.4; }
      .lfp-bloom-in { animation: none; opacity: 1; }
      .lfp-star-fly { animation: none; opacity: 0; }
      .lfp-settle-shelf { animation: none; transform: translate(var(--settle-x,240px), var(--settle-y,300px)) scale(0.42); }
    }
    [data-reduce] .lfp-mote, [data-reduce] .lfp-record-bloom { animation: none; opacity: 0.4; }
    [data-reduce] .lfp-bloom-in { animation: none; opacity: 1; }
    [data-reduce] .lfp-star-fly { animation: none; opacity: 0; }
  `;
  document.head.appendChild(el);
})();

function DustMotes({ n = 9 }) {
  const motes = React.useMemo(() => Array.from({ length: n }, (_, i) => ({
    x: 8 + (i * 83) % 88, y: 20 + (i * 37) % 60, d: (i * 0.9) % 6, s: 2 + (i % 3)
  })), [n]);
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {motes.map((m, i) => (
        <div key={i} className="lfp-mote" style={{
          position: "absolute", left: m.x + "%", top: m.y + "%", width: m.s * 2, height: m.s * 2,
          borderRadius: "50%", background: "var(--lantern-gold)", opacity: 0.7, animationDelay: m.d + "s",
          boxShadow: "0 0 8px 2px rgba(243,199,122,0.5)"
        }}></div>
      ))}
    </div>
  );
}

/* the drawn record affordance — breathing when idle, wash-bloom while recording */
function RecordButton({ recording, onPress, secs }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ position: "relative", width: 150, height: 150, display: "grid", placeItems: "center" }}>
        {recording && (
          <React.Fragment>
            <div className="lfp-record-bloom" style={{ position: "absolute", inset: 8, borderRadius: "50%", background: "color-mix(in srgb, var(--accent-action) 34%, transparent)", filter: "url(#lf-wash-edge)" }}></div>
            <div className="lfp-record-bloom" style={{ position: "absolute", inset: 8, borderRadius: "50%", background: "color-mix(in srgb, var(--accent-action) 26%, transparent)", filter: "url(#lf-wash-edge)", animationDelay: "1s" }}></div>
          </React.Fragment>
        )}
        <button onClick={onPress} aria-label={recording ? "finish telling" : "tell it back — start talking"}
          className={"lf-drawn-border lf-drawn-border--bold" + (recording ? "" : " lfp-breath")}
          style={{
            width: 118, height: 118, borderRadius: "50% 48% 52% 50%",
            backgroundColor: recording ? "color-mix(in srgb, var(--accent-action) 62%, var(--paper-bright))" : "var(--accent-action)",
            backgroundImage: "var(--texture-paper)",
            display: "grid", placeItems: "center", cursor: "pointer", color: "#F9F2E3", position: "relative", zIndex: 2
          }}>
          <svg width="52" height="52" viewBox="0 0 48 48" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" filter="url(#lf-wobble)">
              <rect x="17" y="6" width="14" height="22" rx="7"></rect>
              <path d="M11 24 q 1 12 13 12 q 12 0 13 -12"></path>
              <path d="M24 36 L24 42 M17 42 L31 42"></path>
            </g>
          </svg>
        </button>
      </div>
      {/* soft timer — quiet, drawn-adjacent, never a countdown */}
      {recording && (
        <span style={{ fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 22, color: "var(--text-soft)" }}>
          0:{String(secs).padStart(2, "0")}
        </span>
      )}
    </div>
  );
}

function CompleteScreen({ nav }) {
  const { LF_BOOKS, LF_MEDALS, CreatureSprite, BuddyLine, EnvelopeArt, speakTTS } = window;
  const { StarWord, Medallion } = CP_NS;
  const book = LF_BOOKS[nav.route.bookId] || LF_BOOKS.miko;
  const words = book.starWords;
  const medal = book.id === "miko" ? LF_MEDALS.bridge : null;

  const [phase, setPhase] = React.useState("celebrate"); // celebrate | tellback | saved | badge
  const [flown, setFlown] = React.useState([]);
  const [recording, setRecording] = React.useState(false);
  const [secs, setSecs] = React.useState(0);
  const [settled, setSettled] = React.useState(false);
  const doneOnce = React.useRef(false);

  /* completing = things accumulate in the room (never the reverse) */
  React.useEffect(() => {
    if (doneOnce.current) return;
    doneOnce.current = true;
    nav.patchHistory((h) => ({
      suns: h.suns + 1,
      progress: { ...h.progress, [book.id]: { ...(h.progress[book.id] || {}), done: true, pendingRecap: false } }
    }));
  }, []);

  /* SIM: audio capture. The soft timer ticks while "recording". */
  React.useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  function tapWord(w) {
    if (flown.includes(w.word)) return;
    speakTTS(w.word + " — " + w.meaning);
    setFlown((f) => [...f, w.word]);
    nav.patchHistory((h) => ({ words: h.words.some((x) => x.word === w.word) ? h.words : [...h.words, { word: w.word, pin: w.pin }] }));
  }
  function toggleRecord() {
    if (!recording) { setRecording(true); setSecs(0); }
    else {
      setRecording(false);
      nav.patchHistory((h) => ({ retold: [...h.retold, book.id] }));
      setPhase("saved");
      setTimeout(() => setPhase(medal && !nav.state.history.medals.includes(medal.id) ? "badge" : "done"), 2600);
    }
  }
  React.useEffect(() => {
    if (phase === "badge") {
      const t1 = setTimeout(() => setSettled(true), 2400);
      const t2 = setTimeout(() => {
        nav.patchHistory((h) => ({ medals: h.medals.includes(medal.id) ? h.medals : [...h.medals, medal.id] }));
      }, 3600);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    if (phase === "done") {
      const t = setTimeout(() => nav.closeBook(book.id), 400);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const allWords = flown.length >= words.length;
  const MedalMotif = medal ? window[LF_MEDALS[medal.id].motif] : null;

  return (
    <div data-register="lantern" data-screen-label={"Book complete — " + book.title} className="lf-paper"
      style={{ position: "absolute", inset: 0, zIndex: 42, backgroundColor: "var(--surface-ground)", overflow: "hidden" }}>
      {/* lantern pools — the light does the celebrating */}
      <div aria-hidden="true" className="lfp-bloom-in" style={{ position: "absolute", left: "50%", top: "56%", width: 900, height: 620, transform: "translate(-50%,-50%)", background: "radial-gradient(ellipse at center, rgba(243,199,122,0.30), transparent 62%)", filter: "url(#lf-wash-edge)" }}></div>
      <div aria-hidden="true" className="lfp-bloom-in" style={{ position: "absolute", left: "18%", top: "18%", width: 380, height: 300, background: "radial-gradient(ellipse at center, rgba(243,199,122,0.16), transparent 60%)", animationDelay: "400ms" }}></div>
      <DustMotes></DustMotes>

      {phase === "celebrate" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 18 }}>
            <CreatureSprite kind={nav.state.buddy || "bear"} pose="celebrating" size={190}></CreatureSprite>
            <BuddyLine line={book.chapters[book.chapters.length - 1].cheer} tail="left" maxWidth={380} variant="bouncy"></BuddyLine>
          </div>
          {words.length > 0 && (
            <div data-register="story" style={{ display: "flex", gap: 30, alignItems: "center" }}>
              {words.map((w, i) => (
                <div key={w.word} style={{ position: "relative" }}>
                  {!flown.includes(w.word) ? (
                    <button onClick={() => tapWord(w)} aria-label={"star word: " + w.word + " — " + w.meaning}
                      className="lfp-bloom-in" style={{ animationDelay: i * 260 + "ms", cursor: "pointer", background: "none", borderRadius: 10, boxShadow: "0 0 26px 6px var(--glow-lamplight)" }}>
                      <StarWord word={w.word} pin={w.pin} rotate={[-2.4, 1.8, -1.2][i % 3]} width={150}></StarWord>
                    </button>
                  ) : (
                    <div className="lfp-star-fly" aria-hidden="true">
                      <StarWord word={w.word} pin={w.pin} width={150}></StarWord>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div style={{ fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 21, color: "var(--text-soft)" }}>
            {allWords ? "every word is on your wall now" : "tap a word to keep it"}
          </div>
          <button onClick={() => setPhase("tellback")} aria-label="tell it back"
            className={"lf-drawn-border lf-drawn-border--bold" + (allWords ? " lfp-terra-glow" : "")}
            style={{
              minHeight: 72, padding: "12px 40px", borderRadius: "22px 26px 23px 25px",
              backgroundColor: "var(--accent-action)", backgroundImage: "var(--texture-paper)",
              color: "#F9F2E3", fontFamily: "var(--font-display)", fontSize: 29, cursor: "pointer"
            }}>
            Tell it back
          </button>
        </div>
      )}

      {(phase === "tellback" || phase === "saved") && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 18 }}>
            <CreatureSprite kind={nav.state.buddy || "bear"} pose={recording ? "listening" : "idle"} size={160}></CreatureSprite>
            <BuddyLine key={phase} line={phase === "saved" ? "Saved for Mama and Papa." : "Tell it back to me — how did Miko's story go?"} tail="left" maxWidth={400}></BuddyLine>
          </div>
          {phase === "tellback" && <RecordButton recording={recording} onPress={toggleRecord} secs={secs}></RecordButton>}
          {phase === "saved" && (
            <div className="lfp-settle-shelf" data-register="story" style={{ "--settle-x": "330px", "--settle-y": "260px" }}>
              {/* the drawn envelope goes onto the shelf (→ Parent Corner, Retellings) */}
              <EnvelopeArt size={140}></EnvelopeArt>
            </div>
          )}
        </div>
      )}

      {phase === "badge" && medal && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
          <BuddyLine line={LF_MEDALS[medal.id].line} tail="none" maxWidth={430}></BuddyLine>
          <div className={settled ? "lfp-settle-shelf" : "lfp-bloom-in"} style={{ "--settle-x": "300px", "--settle-y": "270px", filter: "drop-shadow(0 0 34px rgba(243,199,122,0.55))" }}>
            <Medallion pigment={LF_MEDALS[medal.id].pigment} size={150} motif={<MedalMotif></MedalMotif>} label={settled ? undefined : LF_MEDALS[medal.id].label}></Medallion>
          </div>
          {settled && (
            <button onClick={() => setPhase("done")} aria-label="back to the room"
              className="lf-drawn-border lf-drawn-border--bold lfp-terra-glow"
              style={{
                minHeight: 68, padding: "10px 36px", borderRadius: "22px 26px 23px 25px",
                backgroundColor: "var(--accent-action)", backgroundImage: "var(--texture-paper)",
                color: "#F9F2E3", fontFamily: "var(--font-display)", fontSize: 27, cursor: "pointer"
              }}>
              Back to the room
            </button>
          )}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { CompleteScreen, RecordButton, DustMotes });
