/* Little Fables — THE STORY KITCHEN (v3 R19–R23). The flagship flow.
   Entry: the little writing desk in the room (or saying "make a story").
   The camera walks INTO the desk (continuous zoom — no cut). The buddy runs
   a 2–3 question idea interview (want → why → what-could-go-wrong); every
   answer is acknowledged in the buddy's next line using the child's words;
   silence is fine (the buddy fills in). Read-back, then the writing moment
   (R22a): his words appear onto the little book in watercolor handwriting —
   this IS the generation wait (SIM: story generation + safety QA pipeline,
   ~4s; no progress bar exists). The new book lands on the shelf "by Azad";
   first creation earns the Storyteller medallion.
   Out-of-bounds asks are redirected in-fiction; the daily cap is a resting
   desk, never a sad buddy. */

const KT_NS = window.LittleFablesDesignSystem_d603a2;

function RecipeChip({ label, words, delay }) {
  return (
    <div className="lfp-settle-in" style={{ animationDelay: (delay || 0) + "ms", display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start" }}>
      <span style={{ fontFamily: "var(--font-body)", fontSize: 17, color: "var(--ink-faint)", fontStyle: "italic" }}>{label}</span>
      <div className="lf-drawn-border" style={{
        backgroundColor: "var(--paper-bright)", backgroundImage: "var(--texture-paper)",
        borderRadius: "12px 16px 13px 15px", padding: "8px 16px",
        fontFamily: "var(--font-body)", fontSize: 21, fontStyle: "italic", color: "var(--ink)",
        boxShadow: "0 3px 10px -6px var(--shadow-color)", maxWidth: 250
      }}>
        &ldquo;{words}&rdquo;
      </div>
    </div>
  );
}

/* shared medallion-earn moment (lantern-lit pool of light in the room) */
function MedalMoment({ medalId, nav, onDone }) {
  const { LF_MEDALS, BuddyLine } = window;
  const { Medallion } = KT_NS;
  const m = LF_MEDALS[medalId];
  const Motif = window[m.motif];
  const [settled, setSettled] = React.useState(false);
  React.useEffect(() => {
    const t1 = setTimeout(() => setSettled(true), 2600);
    const t2 = setTimeout(() => {
      nav.patchHistory((h) => ({ medals: h.medals.includes(medalId) ? h.medals : [...h.medals, medalId] }));
      onDone();
    }, 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 30 }} data-screen-label="Medallion earn — storyteller">
      <div aria-hidden="true" className="lfp-fade-in" style={{ position: "absolute", inset: 0, background: "rgba(34,48,74,0.45)" }}></div>
      <div aria-hidden="true" className="lfp-bloom-in" style={{ position: "absolute", left: "50%", top: "50%", width: 760, height: 560, transform: "translate(-50%,-50%)", background: "radial-gradient(ellipse at center, rgba(243,199,122,0.4), transparent 62%)", filter: "url(#lf-wash-edge)" }}></div>
      <window.DustMotes n={7}></window.DustMotes>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22 }}>
        <BuddyLine line={m.line} tail="none" maxWidth={430}></BuddyLine>
        <div className={settled ? "lfp-settle-shelf" : "lfp-bloom-in"} style={{ "--settle-x": "330px", "--settle-y": "170px", filter: "drop-shadow(0 0 34px rgba(243,199,122,0.6))" }}>
          <Medallion pigment={m.pigment} size={150} motif={<Motif></Motif>} label={settled ? undefined : m.label}></Medallion>
        </div>
      </div>
    </div>
  );
}

function KitchenOverlay({ nav }) {
  const { LF_KITCHEN, LF_BOOKS, CreatureSprite, BuddyLine, useMicSim, holdToSpeak } = window;
  const { WritingMoment } = KT_NS;
  const { MicButton } = KT_NS;
  const K = LF_KITCHEN;
  const h = nav.state.history;
  const offline = !nav.state.online;
  const capped = h.kitchenToday;

  /* steps: q1 → (redirect) → q2 → q3 → readback → writing → landing → medal */
  const [step, setStep] = React.useState(offline ? "offline" : capped ? "cap" : "q1");
  const [recipe, setRecipe] = React.useState({ want: null, why: null, wrong: null });

  function back() { nav.setRoute({ screen: "home" }); }

  /* the interview brain (SIM: ASR + interview policy; answers are scripted) */
  const scripts = {
    q1: [K.q1Script[1], K.q1Script[0]],        // first try: out-of-bounds ask → redirect; then the real want
    q2: K.q2Script,
    q3: K.q3Script,
    readback: ["yes yes yes!"]
  };
  const activeQ = ["q1", "redirect", "q2", "q3", "readback"].includes(step) ? (step === "redirect" ? "q1b" : step) : null;
  const mic = useMicSim(step === "redirect" ? [K.q1Script[0]] : scripts[step] || ["…"], 1500);

  React.useEffect(() => {
    if (mic.phase !== "heard") return;
    const heard = mic.heard;
    if (step === "q1") {
      if (/zombie/i.test(heard)) { setStep("redirect"); mic.reset(); return; } // out-of-bounds → in-fiction redirect
      setRecipe((r) => ({ ...r, want: heard })); setStep("q2"); mic.reset();
    } else if (step === "redirect") {
      setRecipe((r) => ({ ...r, want: heard })); setStep("q2"); mic.reset();
    } else if (step === "q2") {
      setRecipe((r) => ({ ...r, why: heard })); setStep("q3"); mic.reset();
    } else if (step === "q3") {
      setRecipe((r) => ({ ...r, wrong: heard })); setStep("readback"); mic.reset();
    } else if (step === "readback") {
      setStep("writing"); mic.reset();
    }
  }, [mic.phase]);

  /* silence is fine — the buddy fills in (never a dead end) */
  function stayQuiet() {
    if (step === "q1" || step === "redirect") { setRecipe((r) => ({ ...r, want: K.fillInWant })); setStep("q2"); }
    else if (step === "q2") { setRecipe((r) => ({ ...r, why: "just because" })); setStep("q3"); }
    else if (step === "q3") { setRecipe((r) => ({ ...r, wrong: "something surprising" })); setStep("readback"); }
    else if (step === "readback") setStep("writing");
  }

  /* the writing moment doubles as the generation wait (SIM: ~4.5s pipeline) */
  React.useEffect(() => {
    if (step !== "writing") return;
    const t = setTimeout(() => {
      nav.patchHistory((hh) => ({ authored: hh.authored.includes("balloon") ? hh.authored : [...hh.authored, "balloon"], kitchenToday: true }));
      setStep("landing");
    }, 5200);
    return () => clearTimeout(t);
  }, [step]);
  React.useEffect(() => {
    if (step !== "landing") return;
    nav.setRoute((r) => ({ ...r, landed: true })); // camera returns home while the book lands
    const t = setTimeout(() => setStep(h.medals.includes("storyteller") ? "done" : "medal"), 2600);
    return () => clearTimeout(t);
  }, [step]);
  React.useEffect(() => { if (step === "done") back(); }, [step]);

  const lines = {
    offline: "The story desk is asleep till the internet comes back — your saved stories still work!",
    cap: K.capLine,
    q1: K.q1,
    redirect: K.redirect,
    q2: K.ack1(recipe.want || ""),
    q3: K.ack2,
    readback: K.readback,
    writing: K.narrate,
    landing: "Look — it's landing on YOUR shelf."
  };
  const line = lines[step];
  const listening = mic.phase === "listening";
  const buddyPose = listening ? "listening" : step === "writing" ? "idle" : step === "landing" ? "pointing" : "idle";

  if (step === "medal") return <MedalMoment medalId="storyteller" nav={nav} onDone={() => setStep("done")}></MedalMoment>;

  /* landing: the room zooms back out (cam→home is driven by main via screen
     change? no — landing keeps screen=kitchen but cam should return; simplest:
     landing renders the new book glowing on the shelf in stage space) */
  return (
    <div data-screen-label="The story kitchen" style={{ position: "absolute", inset: 0, zIndex: 20 }}>
      {/* quiet ink back arrow */}
      <button onClick={back} aria-label="back to the room" className="lf-drawn-border"
        style={{
          position: "absolute", left: 24, top: 24, width: 58, height: 58, borderRadius: "50% 48% 52% 50%",
          backgroundColor: "var(--paper-bright)", backgroundImage: "var(--texture-paper)",
          display: "grid", placeItems: "center", color: "var(--ink)", cursor: "pointer", zIndex: 8
        }}>
        <svg width="28" height="28" viewBox="0 0 30 30" aria-hidden="true">
          <path d="M19 4 L7 15 L19 26" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" filter="url(#lf-wobble)"></path>
        </svg>
      </button>

      {/* the buddy at the desk */}
      {step !== "landing" && (
        <div className="lfp-fade-in" style={{ position: "absolute", left: 120, top: 384 }}>
          <window.CreatureSprite kind={nav.state.buddy || "bear"} pose={buddyPose} size={300}></window.CreatureSprite>
        </div>
      )}

      {/* the buddy's one line for this step */}
      {line && step !== "landing" && (
        <BuddyLine key={step + (recipe.want || "")} line={line} tail="left" maxWidth={430}
          style={{ position: "absolute", left: 300, top: step === "writing" ? 90 : 130, zIndex: 6 }}></BuddyLine>
      )}
      {step === "landing" && (
        <BuddyLine key="landing" line={lines.landing} tail="none" maxWidth={380}
          style={{ position: "absolute", left: 400, top: 90, zIndex: 6 }}></BuddyLine>
      )}

      {/* the recipe so far — his words, kept visible */}
      {(recipe.want || recipe.why || recipe.wrong) && step !== "writing" && step !== "landing" && (
        <div style={{ position: "absolute", right: 46, top: 120, display: "flex", flexDirection: "column", gap: 14, zIndex: 6 }}>
          {recipe.want && <RecipeChip label="the want" words={recipe.want}></RecipeChip>}
          {recipe.why && <RecipeChip label="the why" words={recipe.why} delay={80}></RecipeChip>}
          {recipe.wrong && <RecipeChip label="the uh-oh" words={recipe.wrong} delay={160}></RecipeChip>}
        </div>
      )}

      {/* mic + quiet option (interview steps) */}
      {["q1", "redirect", "q2", "q3", "readback"].includes(step) && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 74, display: "flex", alignItems: "center", justifyContent: "center", gap: 26, zIndex: 6 }}>
          <MicButton active={listening} onPress={() => mic.start()} size={84} label={step === "readback" ? "did I get it right?" : "tell me"}></MicButton>
          {mic.phase === "heard" && (
            <span className="lfp-fade-in" style={{ fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 22, color: "var(--ink)", backgroundColor: "color-mix(in srgb, var(--paper-bright) 82%, transparent)", padding: "6px 14px", borderRadius: 12 }}>
              &ldquo;{mic.heard}&rdquo;
            </span>
          )}
          <button onClick={stayQuiet} aria-label="stay quiet — the buddy will fill in"
            className="lf-drawn-border"
            style={{
              minHeight: 56, padding: "8px 22px", borderRadius: "16px 20px 17px 19px",
              backgroundColor: "var(--paper-bright)", backgroundImage: "var(--texture-paper)",
              fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 24, color: "var(--ink-soft)", cursor: "pointer"
            }}>
            …
          </button>
        </div>
      )}

      {/* offline / daily-cap: one warm path back to reading */}
      {(step === "offline" || step === "cap") && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, display: "grid", placeItems: "center", zIndex: 6 }}>
          <button onClick={back} aria-label="let's read one instead"
            className="lf-drawn-border lf-drawn-border--bold lfp-terra-glow"
            style={{
              minHeight: 72, padding: "12px 38px", borderRadius: "22px 26px 23px 25px",
              backgroundColor: "var(--accent-action)", backgroundImage: "var(--texture-paper)",
              color: "#F9F2E3", fontFamily: "var(--font-display)", fontSize: 28, cursor: "pointer"
            }}>
            Let&rsquo;s read one instead
          </button>
        </div>
      )}

      {/* R22a — the writing moment: his transcribed words appear onto the little
          book in watercolor handwriting while the buddy narrates. This IS the
          wait. Reduced motion: words fade in (no travel). */}
      {step === "writing" && (
        <div className="lfp-fade-in" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", zIndex: 5 }}>
          <div style={{ backgroundColor: "color-mix(in srgb, var(--paper-bright) 55%, transparent)", borderRadius: 30, padding: "10px 26px", backdropFilter: "blur(1px)" }}>
            <WritingMoment words={K.writingWords} inkPigment="berry" width={720} wordMs={320}></WritingMoment>
          </div>
        </div>
      )}

      {/* the new book lands on the shelf, by Azad */}
      {step === "landing" && (() => {
        const { BookCover } = KT_NS;
        const L = window.ROOM_LAYOUT[nav.orientation];
        const idx = (h.authored.indexOf("balloon") !== -1 ? h.authored.indexOf("balloon") : h.authored.length - 1);
        const a = L.authored[Math.min(idx, L.authored.length - 1)];
        const b = LF_BOOKS.balloon;
        return (
          <div className="lfp-bloom-in" style={{ position: "absolute", left: a.x, top: a.y, zIndex: 7, boxShadow: "0 0 40px 12px var(--glow-lamplight)", borderRadius: 8 }}>
            <BookCover title={b.title} pigment={b.pigment} width={L.authoredW} authored art={<window.BalloonCoverArt></window.BalloonCoverArt>}></BookCover>
            <div style={{ textAlign: "center", fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 14, color: "var(--ink-soft)", marginTop: 2 }}>by Azad</div>
          </div>
        );
      })()}
    </div>
  );
}

Object.assign(window, { KitchenOverlay, MedalMoment });
