/* Little Fables — Home: the room, living.
   ≤5 child decision points: (1) the buddy — who is also the mic,
   (2) the glowing next-best book, (3) the rest of the shelf, (4) the little
   writing desk, (5) the pinned words. Everything else speaks when pressed
   and held, and navigates nowhere.

   VOICE (v3 R16–R18) — the buddy IS the mic. SIM: wake-word + on-device ASR
   + intent grounding against the room's objects. The intent grammar contains
   ONLY child-world objects; parent surfaces are not in the grammar, so voice
   can never reach them (see parent.jsx). No red dots exist: listening is the
   buddy leaning in, breathing. */

const HOME_NS = window.LittleFablesDesignSystem_d603a2;

function bookRect(L, bookId, authoredList) {
  const slot = L.shelfSlots[bookId];
  if (slot) return { x: slot.x, y: slot.y, w: L.slotW, h: Math.round(L.slotW * 1.38) };
  const ai = (authoredList || []).indexOf(bookId);
  const a = L.authored[Math.max(0, ai)] || L.authored[0];
  return { x: a.x, y: a.y, w: L.authoredW, h: Math.round(L.authoredW * 1.38) };
}

function greetingLine(hour, history, buddyName) {
  const prog = history.progress.miko;
  if (prog && prog.choice && !prog.done) return "That long-neck bridge you picked is still standing!"; // world-memory callback (only when history exists)
  if (hour === "night") return "Shh… the moon is up. One cozy story?";
  if (hour === "evening") return "The lamp is warm. One more story?";
  if (hour === "afternoon") return "You're back! The bridge is waiting.";
  return "Good morning. Shall we meet Miko today?";
}

/* ---------- the door note (offline state) ----------
   SIM: connectivity watcher. No loss language — saved stories still work. */
function DoorNote({ L }) {
  return (
    <div className="lfp-settle-in" data-register="story" {...window.holdToSpeak("No internet — your saved stories still work")}
      role="note" aria-label="No internet — your saved stories still work"
      style={{ position: "absolute", left: L.doorNote.x, top: L.doorNote.y, width: 196, transform: "rotate(-2.5deg)", cursor: "pointer", zIndex: 6 }}>
      <div className="lf-drawn-border" style={{
        backgroundColor: "var(--paper-bright)", backgroundImage: "var(--texture-paper)",
        borderRadius: "8px 12px 9px 10px", padding: "16px 16px 14px",
        boxShadow: "0 5px 14px -7px var(--shadow-color)", color: "var(--ink)"
      }}>
        <svg width="30" height="20" viewBox="0 0 30 20" style={{ display: "block", margin: "0 auto 6px" }} aria-hidden="true">
          <g fill="none" stroke="var(--ink-soft)" strokeWidth="2" strokeLinecap="round" filter="url(#lf-wobble)">
            <path d="M4 10 q 11 -10 22 0"></path><path d="M9 14 q 6 -6 12 0"></path>
          </g>
          <circle cx="15" cy="17" r="1.8" fill="var(--ink-soft)"></circle>
          <path d="M24 3 L6 17" stroke="var(--ink)" strokeWidth="2" filter="url(#lf-wobble)"></path>
        </svg>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 18, lineHeight: 1.35, textAlign: "center", color: "var(--ink-soft)" }}>
          No internet — your saved stories still work
        </div>
      </div>
      <svg width="14" height="14" viewBox="0 0 14 14" style={{ position: "absolute", top: -5, left: "50%", marginLeft: -7 }} aria-hidden="true">
        <circle cx="7" cy="7" r="4.6" fill="var(--pigment-dusk)" filter="url(#lf-wobble)"></circle>
      </svg>
    </div>
  );
}

/* ---------- HomeLayer ---------- */
function HomeLayer({ nav, mode = "home" }) {
  const { BookCover, ReadingSuns, Medallion, StarWord } = HOME_NS;
  const { CreatureSprite, BuddyLine, holdToSpeak, CrateArt, LF_BOOKS, LF_SHELF_ORDER, LF_MEDALS, LF_VOICE_SCRIPT, ROOM_LAYOUT } = window;
  const L = ROOM_LAYOUT[nav.orientation];
  const h = nav.state.history;
  const hour = nav.hour;
  const interactive = mode === "home";

  /* --- voice state machine: idle → listening → success | lowconf → fallback → kitchen --- */
  const [voice, setVoice] = React.useState({ phase: "idle", step: window.__lfVoiceStep || 0 });
  React.useEffect(() => { window.__lfVoiceStep = voice.step; }, [voice.step]);
  React.useEffect(() => {
    if (voice.phase !== "listening") return;
    const script = LF_VOICE_SCRIPT[Math.min(voice.step, LF_VOICE_SCRIPT.length - 1)];
    const t = setTimeout(() => {
      /* SIM: ASR resolves after ~1.5s of "speech" */
      if (script.kind === "success" || script.kind === "kitchen") {
        setVoice({ phase: script.kind === "kitchen" ? "gokitchen" : "success", step: voice.step + 1, script });
      } else if (script.kind === "lowconf") {
        setVoice({ phase: "lowconf", step: voice.step + 1, script });
      } else {
        setVoice({ phase: "fallback", step: 0, script });
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [voice]);
  React.useEffect(() => {
    if (voice.phase !== "success") return;
    const t = setTimeout(() => { setVoice({ phase: "idle", step: voice.step }); nav.openBook(voice.script.targetBook); }, 2100);
    return () => clearTimeout(t);
  }, [voice.phase]);
  React.useEffect(() => {
    if (voice.phase !== "gokitchen") return;
    const t = setTimeout(() => { setVoice({ phase: "idle", step: voice.step }); nav.setRoute({ screen: "kitchen" }); }, 2100);
    return () => clearTimeout(t);
  }, [voice.phase]);

  const voiceActive = voice.phase !== "idle";
  const buddyPose = voice.phase === "listening" ? "listening" : voice.phase === "fallback" ? "pointing" : "idle";

  /* the ONE glowing next-best thing (squint test) — recedes to ink while the mic is live */
  const inProgress = Object.keys(h.progress).find((id) => h.progress[id] && !h.progress[id].done);
  const beaconBook = hour === "night" ? "cozy" : inProgress || (h.progress.miko && h.progress.miko.done ? "moose" : "miko");
  const showBeacons = !voiceActive;

  /* the buddy's one line for this screen visit */
  const line =
    voice.phase === "listening" ? null :
    voice.phase === "success" ? voice.script.line :
    voice.phase === "gokitchen" ? voice.script.line :
    voice.phase === "lowconf" ? voice.script.line :
    voice.phase === "fallback" ? voice.script.line :
    greetingLine(hour, h, nav.state.buddy);

  const speechPos = L.speech;
  const shelfBooks = LF_SHELF_ORDER;
  const authoredHere = h.authored;

  const openFromShelf = (id) => { if (interactive) nav.openBook(id); };

  return (
    <div data-screen-label={hour === "night" ? "Quiet mode — the room at night" : "Home — the room"} style={{ position: "absolute", inset: 0 }}>

      {/* reading suns on the sill — lit suns never unlight */}
      {h.suns > 0 && (
        <div data-register="story" {...holdToSpeak(h.suns + " reading suns")} style={{ position: "absolute", left: L.suns.x, top: L.suns.y, cursor: "pointer" }} aria-label={h.suns + " reading suns on the sill"}>
          <ReadingSuns count={h.suns} size={30} sill={false}></ReadingSuns>
        </div>
      )}

      {/* star words pinned on the wall (decision point: the Language Wall) */}
      {h.words.length > 0 && (
        <div data-register="story" {...holdToSpeak("your words", () => interactive && nav.setRoute({ screen: "words" }))}
          role="button" aria-label="your words — open the Language Wall"
          style={{ position: "absolute", left: L.wordsHit.x, top: L.wordsHit.y, width: L.wordsHit.w, height: L.wordsHit.h, cursor: "pointer" }}>
          {h.words.slice(0, 5).map((w, i) => {
            const p = L.words[i % L.words.length];
            return <StarWord key={w.word} word={w.word} pin={w.pin} rotate={[-2, 1.6, -1.2, 2, -1.6][i % 5]} width={116}
              style={{ position: "absolute", left: p.x - L.wordsHit.x, top: p.y - L.wordsHit.y }}></StarWord>;
          })}
        </div>
      )}

      {/* the shelf — six real books + his own authored books on top */}
      {shelfBooks.map((id) => {
        const b = LF_BOOKS[id];
        const r = bookRect(L, id, authoredHere);
        const prog = h.progress[id];
        const Art = window[b.coverArt];
        const softLit = hour === "night" && b.windDown && id !== beaconBook; // wind-down books, softly lit
        return (
          <div key={id} data-register="story" style={{ position: "absolute", left: r.x, top: r.y, boxShadow: softLit ? "0 0 26px 5px var(--glow-lamplight)" : undefined, borderRadius: 8 }}>
            <BookCover title={b.title} pigment={b.pigment} width={r.w}
              art={<Art></Art>}
              progress={prog && !prog.done ? (prog.chapter + 1) / b.chapters.length * 0.8 : undefined}
              beacon={showBeacons && interactive && id === beaconBook}
              onOpen={() => openFromShelf(id)}></BookCover>
          </div>
        );
      })}
      {authoredHere.map((id, i) => {
        const b = LF_BOOKS[id];
        if (!b) return null;
        const a = L.authored[i] || L.authored[0];
        const Art = window[b.coverArt];
        return (
          <div key={id} data-register="story" style={{ position: "absolute", left: a.x, top: a.y, transform: "rotate(" + (i === 0 ? -2 : 2.4) + "deg)" }}>
            <BookCover title={b.title} pigment={b.pigment} width={L.authoredW} authored
              art={<Art></Art>} onOpen={() => openFromShelf(id)}></BookCover>
            <div style={{ textAlign: "center", fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 13, color: "var(--ink-soft)", marginTop: 2 }}>{b.byline}</div>
          </div>
        );
      })}

      {/* badge medallions on the shelf edge — they accumulate, never dim */}
      {h.medals.map((mid, i) => {
        const m = LF_MEDALS[mid];
        const Motif = window[m.motif];
        return (
          <div key={mid} data-register="story" {...holdToSpeak(m.label)} aria-label={"medallion: " + m.label}
            style={{ position: "absolute", left: L.medals.x + i * L.medals.gap, top: L.medals.y, cursor: "pointer" }}>
            <Medallion pigment={m.pigment} size={46} motif={<Motif></Motif>}></Medallion>
          </div>
        );
      })}

      {/* the wrapped crate under the table — someone new is coming */}
      <div data-register="story" {...holdToSpeak("Someone new is coming — read two more days!")}
        role="note" aria-label="a wrapped crate: someone new is coming — read two more days"
        style={{ position: "absolute", left: L.crate.x, top: L.crate.y, cursor: "pointer" }}>
        <CrateArt></CrateArt>
      </div>

      {/* the little writing desk (decision point: the story kitchen) */}
      <button {...holdToSpeak("the story desk", () => interactive && nav.setRoute({ screen: "kitchen" }))}
        aria-label="the story desk — make a story"
        style={{ position: "absolute", left: L.desk.x, top: L.desk.y, width: L.desk.w, height: L.desk.h, cursor: "pointer", borderRadius: 16 }}></button>

      {/* quiet speaking objects (not decisions): window, toy */}
      <div {...holdToSpeak(hour === "night" ? "the moon in the window" : "the window")} style={{ position: "absolute", left: L.windowHit.x, top: L.windowHit.y, width: L.windowHit.w, height: L.windowHit.h }} aria-label="the window"></div>

      {/* offline: a drawn paper note on the door */}
      {!nav.state.online && <DoorNote L={L}></DoorNote>}

      {/* the buddy — breathing on the rug; tapping = the mic */}
      <div style={{ position: "absolute", left: L.buddy.x, top: L.buddy.y }}>
        {voiceActive && voice.phase === "listening" && (
          <div aria-hidden="true" className="lfp-terra-glow" style={{ position: "absolute", left: 30, bottom: -6, width: L.buddy.size * 0.75, height: 40, borderRadius: "50%", opacity: 0.9 }}></div>
        )}
        <CreatureSprite kind={nav.state.buddy || "bear"} pose={buddyPose} size={L.buddy.size}></CreatureSprite>
      </div>
      <button
        onClick={() => { if (!interactive) return; if (voice.phase === "lowconf" || voice.phase === "fallback") setVoice({ phase: "listening", step: voice.step }); else if (voice.phase === "idle") setVoice({ phase: "listening", step: voice.step }); }}
        aria-label="the buddy — talk to me"
        style={{ position: "absolute", left: L.buddyHit.x, top: L.buddyHit.y, width: L.buddyHit.w, height: L.buddyHit.h, cursor: "pointer", borderRadius: 40 }}></button>

      {/* one buddy line per screen visit (spoken; text is atmosphere) */}
      {interactive && line && (
        <window.BuddyLine key={line + hour} line={line} tail="left" maxWidth={330}
          style={{ position: "absolute", left: speechPos.x, top: speechPos.y, maxWidth: 400, zIndex: 5 }}></window.BuddyLine>
      )}

      {/* voice: intent target glows terracotta (the screen's one action) */}
      {voice.phase === "success" && (() => {
        const r = bookRect(L, voice.script.targetBook, authoredHere);
        return <div aria-hidden="true" className="lfp-terra-glow" style={{ position: "absolute", left: r.x - 4, top: r.y - 4, width: r.w + 8, height: r.h + 8, borderRadius: 10, zIndex: 4 }}></div>;
      })()}
      {voice.phase === "gokitchen" && (
        <div aria-hidden="true" className="lfp-terra-glow" style={{ position: "absolute", left: L.desk.x, top: L.desk.y, width: L.desk.w, height: L.desk.h, borderRadius: 16, zIndex: 4 }}></div>
      )}

      {/* voice: low-confidence misfire — two concrete spoken options from the room */}
      {voice.phase === "lowconf" && (
        <div className="lfp-settle-in" style={{ position: "absolute", left: L.speech.x, top: L.speech.y + 120, display: "flex", gap: 16, zIndex: 6 }}>
          {voice.script.options.map((o) => (
            <button key={o.book} {...holdToSpeak(o.label, () => { setVoice({ phase: "idle", step: voice.step }); nav.openBook(o.book); })}
              className="lf-drawn-border" aria-label={o.label + " — say it or tap it"}
              style={{
                minHeight: 58, padding: "10px 20px", borderRadius: "16px 20px 17px 19px",
                backgroundColor: "var(--paper-bright)", backgroundImage: "var(--texture-paper)",
                fontFamily: "var(--font-body)", fontSize: 24, color: "var(--ink)", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 14px -8px var(--shadow-color)"
              }}>
              {o.label}
              <svg width="18" height="18" viewBox="0 0 26 26" aria-hidden="true">
                <g fill="none" stroke="var(--ink-soft)" strokeWidth="2.4" strokeLinecap="round" filter="url(#lf-wobble)">
                  <path d="M4 16 q 3 2 6 0"></path><path d="M3 11 q 6 4 12 0"></path><path d="M2 6 q 9 6 18 0"></path>
                </g>
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* voice: two-miss fallback — the buddy points; the tap path lights up */}
      {voice.phase === "fallback" && (() => {
        const r = bookRect(L, beaconBook, authoredHere);
        return (
          <React.Fragment>
            <svg viewBox={"0 0 " + L.w + " " + L.h} width={L.w} height={L.h} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 4 }} aria-hidden="true">
              <path d={"M" + (L.buddy.x + L.buddy.size * 0.8) + " " + (L.buddy.y + 60) + " Q " + ((L.buddy.x + r.x) / 2 + 60) + " " + (L.buddy.y - 120) + " " + (r.x + r.w / 2) + " " + (r.y - 14)}
                fill="none" stroke="var(--ink-soft)" strokeWidth="3" strokeDasharray="2 14" strokeLinecap="round" filter="url(#lf-wobble)" opacity="0.8"></path>
            </svg>
            <div aria-hidden="true" className="lfp-beacon" style={{ position: "absolute", left: r.x - 4, top: r.y - 4, width: r.w + 8, height: r.h + 8, borderRadius: 10, zIndex: 3 }}></div>
          </React.Fragment>
        );
      })()}
    </div>
  );
}

/* ---------- BookTransition: the endpaper lifts from the shelf ---------- */
function BookTransition({ nav }) {
  const { Endpaper } = HOME_NS;
  const { LF_BOOKS, ROOM_LAYOUT } = window;
  const L = ROOM_LAYOUT[nav.orientation];
  const opening = !!nav.route.opening;
  const bookId = nav.route.opening || nav.route.closing;
  const book = LF_BOOKS[bookId];
  const r = bookRect(L, bookId, nav.state.history.authored);
  const [expanded, setExpanded] = React.useState(!opening);
  React.useEffect(() => {
    if (opening) requestAnimationFrame(() => requestAnimationFrame(() => setExpanded(true)));
    else requestAnimationFrame(() => requestAnimationFrame(() => setExpanded(false)));
  }, [opening]);
  const style = expanded
    ? { left: 0, top: 0, width: L.w, height: L.h, borderRadius: 0 }
    : { left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 6 };
  return (
    <div aria-hidden="true" style={{
      position: "absolute", overflow: "hidden", zIndex: 50,
      boxShadow: "0 10px 40px -12px var(--shadow-warm)",
      transition: "left var(--motion-endpaper,900ms) var(--ease-drawn), top var(--motion-endpaper,900ms) var(--ease-drawn), width var(--motion-endpaper,900ms) var(--ease-drawn), height var(--motion-endpaper,900ms) var(--ease-drawn), border-radius var(--motion-endpaper,900ms) var(--ease-drawn)",
      ...style
    }}>
      <Endpaper pigment={book.pigment} motif={book.motif} loading style={{ position: "absolute", inset: 0 }}></Endpaper>
    </div>
  );
}

Object.assign(window, { HomeLayer, BookTransition, bookRect });
