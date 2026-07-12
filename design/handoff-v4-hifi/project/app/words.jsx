/* Little Fables — My Words: the Language Wall.
   Entry: tapping the pinned words in the room — the camera moves INTO the
   wall (continuous), and the wall opens up. Words are grouped by language;
   every card speaks its word + meaning + which story it came from (spoken;
   text is atmosphere). Only earned words hang here — there are no empty
   slots and nothing to miss. Mystery words arrive with a small light bloom. */

function WordsOverlay({ nav }) {
  const { LF_WALL, holdToSpeak, speakTTS, BuddyLine } = window;
  const { StarWord } = window.LittleFablesDesignSystem_d603a2;
  const collected = nav.state.history.words.map((w) => w.word);
  const justFound = React.useRef(window.__lfJustFound);
  React.useEffect(() => { window.__lfJustFound = null; }, []);

  const entries = LF_WALL.filter((w) => collected.includes(w.word));
  const groups = {};
  entries.forEach((w) => { (groups[w.lang] = groups[w.lang] || []).push(w); });
  const order = ["Gujarati", "Hindi", "Spanish", "Creole", "star words"].filter((g) => groups[g]);

  function sayCard(w) {
    speakTTS(w.word + ". " + w.meaning + ". From " + w.from + ".");
  }

  return (
    <div data-screen-label="My Words — the Language Wall" style={{ position: "absolute", inset: 0, zIndex: 20 }}>
      {/* the wall, opened up (a big pinned paper sheet in room light) */}
      <div className="lfp-settle-in lf-paper" data-register="story" style={{
        position: "absolute", left: 90, right: 90, top: 64, bottom: 64,
        backgroundColor: "var(--paper-bright)", backgroundImage: "var(--texture-paper)",
        borderRadius: "18px 24px 20px 22px", boxShadow: "0 18px 60px -20px var(--shadow-cool)",
        padding: "34px 46px", overflow: "hidden"
      }}>
        <div className="lf-drawn-border" style={{ position: "absolute", inset: 6, borderRadius: "inherit", pointerEvents: "none", color: "var(--ink-faint)" }}></div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 42, color: "var(--ink)", margin: 0 }}>My Words</h1>
          <span style={{ fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 21, color: "var(--ink-soft)" }}>{entries.length} words so far — they only ever grow</span>
        </div>

        <div style={{ display: "flex", gap: 44, marginTop: 30, flexWrap: "wrap" }}>
          {order.map((lang) => (
            <div key={lang} style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 150 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--ink-soft)" }}>{lang}</div>
              <hr className="lf-rule" style={{ margin: 0, width: 120, color: "var(--ink-faint)" }} />
              {groups[lang].map((w, i) => {
                const isNew = justFound.current === w.word;
                return (
                  <button key={w.word} onClick={() => sayCard(w)} {...(isNew ? {} : {})}
                    aria-label={w.word + " — " + w.meaning + " — from " + w.from}
                    className={isNew ? "lfp-bloom-in" : "lfp-settle-in"}
                    style={{
                      animationDelay: i * 90 + "ms", cursor: "pointer", background: "none",
                      display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4,
                      borderRadius: 12, padding: 4, minHeight: 56,
                      boxShadow: isNew ? "0 0 34px 8px var(--glow-lamplight)" : undefined
                    }}>
                    <StarWord word={w.word} pin={w.pin} rotate={[-2, 1.6, -1.2][i % 3]} width={148}></StarWord>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 19, color: "var(--ink-soft)", paddingLeft: 6 }}>{w.meaning}</span>
                    <span style={{ fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 15, color: "var(--ink-faint)", paddingLeft: 6 }}>from {w.from}</span>
                  </button>
                );
              })}
            </div>
          ))}
          {entries.length === 0 && (
            <div style={{ fontFamily: "var(--font-body)", fontSize: 25, color: "var(--ink-soft)", fontStyle: "italic" }}>
              Words you find in stories will hang here.
            </div>
          )}
        </div>

        {justFound.current && (
          <div style={{ position: "absolute", right: 40, bottom: 30 }}>
            <BuddyLine line={"A mystery word flew in — " + justFound.current + "!"} tail="none" maxWidth={340}></BuddyLine>
          </div>
        )}
      </div>

      {/* quiet ink back arrow */}
      <button onClick={() => nav.setRoute({ screen: "home" })} aria-label="back to the room" className="lf-drawn-border"
        style={{
          position: "absolute", left: 24, top: 24, width: 58, height: 58, borderRadius: "50% 48% 52% 50%",
          backgroundColor: "var(--paper-bright)", backgroundImage: "var(--texture-paper)",
          display: "grid", placeItems: "center", color: "var(--ink)", cursor: "pointer", zIndex: 8
        }}>
        <svg width="28" height="28" viewBox="0 0 30 30" aria-hidden="true">
          <path d="M19 4 L7 15 L19 26" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" filter="url(#lf-wobble)"></path>
        </svg>
      </button>
    </div>
  );
}

Object.assign(window, { WordsOverlay });
