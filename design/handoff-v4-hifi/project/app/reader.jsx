/* Little Fables — the Reader. data-register="story": the page IS the screen.
   Art + text on paper; chrome reduced to ink (drawn folio corner, quiet back
   arrow). Word highlight = lamplight crossing words (SIM: narration-aligned
   karaoke — here a timer). Page turns are child-initiated (drawn corner) or
   spoken ("next page!" — SIM: reader voice intents next / back / again).
   Kamishibai side-slide between pages; endpaper beat between chapters.
   Portrait: the spread restacks (art above text) — Reader is one of the two
   portrait-capable screens. */

const RD_NS = window.LittleFablesDesignSystem_d603a2;

(function ensureReaderStyles() {
  if (document.getElementById("lfp-reader-style")) return;
  const el = document.createElement("style");
  el.id = "lfp-reader-style";
  el.textContent = `
    @keyframes lfp-ink-in { from { opacity: 0; filter: blur(5px); transform: translateY(3px); } 60% { opacity: 1; filter: blur(0.8px); } to { opacity: 1; filter: blur(0); transform: none; } }
    .lfp-ink-in { animation: lfp-ink-in 850ms var(--ease-settle) both; }
    .lfp-choice-dim button[aria-pressed="false"] { opacity: 0.42; filter: saturate(0.6); transition: opacity 500ms ease, filter 500ms ease; }
    @keyframes lfp-word-found { 0% { transform: none; opacity: 1; } 100% { transform: translate(-120px, -260px) scale(0.55) rotate(-5deg); opacity: 0; } }
    .lfp-word-found { animation: lfp-word-found 1300ms var(--ease-drawn) both; }
    @media (prefers-reduced-motion: reduce) {
      .lfp-ink-in { animation: none; opacity: 1; }
      .lfp-word-found { animation: none; opacity: 0; }
    }
    [data-reduce] .lfp-ink-in { animation: none; opacity: 1; }
    [data-reduce] .lfp-word-found { animation: none; opacity: 0; }
  `;
  document.head.appendChild(el);
})();

/* ---------- shared page chrome ---------- */
function Folio({ n }) {
  return (
    <div aria-hidden="true" style={{ position: "absolute", right: 22, bottom: 14, width: 44, height: 40, pointerEvents: "none" }}>
      <svg width="44" height="40" viewBox="0 0 44 40">
        <path d="M4 38 Q 22 30 40 6 L40 38 Z" fill="var(--paper-deep)" opacity="0.6" filter="url(#lf-wash-edge)"></path>
      </svg>
      <span style={{ position: "absolute", right: 8, bottom: 4, fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 19, color: "var(--ink-soft)" }}>{n}</span>
    </div>
  );
}
function CornerTurn({ dir = "next", onPress, glow }) {
  const flip = dir === "prev";
  return (
    <button onClick={onPress} aria-label={flip ? "turn back" : "turn the page"}
      className={glow ? "lfp-beacon" : ""}
      style={{ position: "absolute", [flip ? "left" : "right"]: 0, bottom: 0, width: 78, height: 78, display: "grid", placeItems: "center", cursor: "pointer", borderRadius: flip ? "0 22px 0 22px" : "22px 0 22px 0", zIndex: 5 }}>
      <svg width="56" height="56" viewBox="0 0 58 58" aria-hidden="true" style={{ transform: flip ? "scaleX(-1)" : "none" }}>
        <path d="M56 2 L56 56 L2 56 Q 40 48 56 2" fill="var(--paper-deep)" opacity="0.85" filter="url(#lf-wash-edge)"></path>
        <path d="M54 6 Q 40 46 6 54" fill="none" stroke="var(--ink)" strokeWidth="2" filter="url(#lf-wobble)"></path>
        <path d="M34 40 l10 -2 -4 9" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#lf-wobble)"></path>
      </svg>
    </button>
  );
}
function PageFrame({ orientation, art, children, folio, onNext, onPrev, nextGlow }) {
  const portrait = orientation === "portrait";
  return (
    <div data-register="story" className="lf-paper" style={{
      position: "absolute", inset: 26, borderRadius: "var(--radius-page)",
      backgroundColor: "var(--paper-bright)", backgroundImage: "var(--texture-paper)",
      boxShadow: "0 8px 30px -14px var(--shadow-warm)", overflow: "hidden",
      display: "grid",
      gridTemplateColumns: portrait ? "1fr" : "46% 54%",
      gridTemplateRows: portrait ? "38% 62%" : "1fr"
    }}>
      {!portrait && (
        <div aria-hidden="true" style={{ position: "absolute", left: "46%", top: 18, bottom: 18, width: 1, background: "linear-gradient(to bottom, transparent, var(--ink-faint) 22%, var(--ink-faint) 78%, transparent)", opacity: 0.5 }}></div>
      )}
      <div style={{ display: "grid", placeItems: "center", padding: portrait ? "5% 8% 0" : "4% 5%" }}>{art}</div>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: portrait ? "3% 9% 12%" : "5% 7% 5% 6%", gap: 22, minHeight: 0 }}>{children}</div>
      {onPrev && <CornerTurn dir="prev" onPress={onPrev}></CornerTurn>}
      {onNext && <CornerTurn dir="next" onPress={onNext} glow={nextGlow}></CornerTurn>}
      {folio != null && <Folio n={folio}></Folio>}
    </div>
  );
}

/* ---------- page types ---------- */
function ReadPage({ page, active, folio, onNext, onPrev, orientation, nav }) {
  const { MicButton } = RD_NS;
  const { WordGlow, useMicSim } = window;
  const Art = window[page.art] || window.BridgeArt;
  const mic = useMicSim(["next page!"]); // SIM: reader voice intents (next/back/again)
  const [found, setFound] = React.useState(false);
  React.useEffect(() => {
    if (mic.phase === "heard" && active) { const t = setTimeout(() => { mic.reset(); onNext && onNext(); }, 700); return () => clearTimeout(t); }
  }, [mic.phase]);

  const mystery = page.mystery;
  const alreadyFound = mystery && nav.state.history.words.some((w) => w.word === mystery.word);
  const text = page.text;

  function findWord() {
    if (found || alreadyFound) return;
    setFound(true);
    window.speakTTS(mystery.word + " — " + mystery.meaning);
    setTimeout(() => {
      nav.patchHistory((h) => ({ words: h.words.some((w) => w.word === mystery.word) ? h.words : [...h.words, { word: mystery.word, pin: mystery.pin }] }));
    }, 1200);
  }

  return (
    <PageFrame orientation={orientation} folio={folio} onNext={onNext} onPrev={onPrev}
      art={<Art></Art>}>
      <WordGlow text={text} active={active} ms={430}></WordGlow>
      {/* Mystery Word: the word itself is the treasure — tap it and it flies to the wall */}
      {mystery && !alreadyFound && !found && (
        <button onClick={findWord} aria-label={"a mystery word: " + mystery.word}
          className="lfp-beacon"
          style={{
            alignSelf: "flex-start", minHeight: 48, padding: "6px 18px",
            borderRadius: "14px 18px 15px 17px", backgroundColor: "var(--paper-bright)", backgroundImage: "var(--texture-paper)",
            fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 26, color: "var(--ink)", cursor: "pointer"
          }}>
          {mystery.word} <span style={{ fontSize: 19, color: "var(--ink-soft)" }}>— a mystery word!</span>
        </button>
      )}
      {mystery && found && (
        <div className="lfp-word-found" style={{ alignSelf: "flex-start", position: "relative" }}>
          <div className="lf-drawn-border" style={{ padding: "8px 18px", borderRadius: "14px 18px 15px 17px", backgroundColor: "var(--paper-bright)", fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 26, color: "var(--ink)", boxShadow: "0 0 30px 8px var(--glow-lamplight)" }}>
            {mystery.word}
          </div>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <MicButton active={mic.phase === "listening"} onPress={() => mic.start()} label="talk to me"></MicButton>
        {mic.phase === "heard" && (
          <span className="lfp-fade-in" style={{ fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 21, color: "var(--ink-soft)" }}>&ldquo;{mic.heard}&rdquo;</span>
        )}
      </div>
    </PageFrame>
  );
}

function AskPage({ page, active, folio, onNext, onPrev, orientation }) {
  const { AskCard } = RD_NS;
  const { useMicSim, BuddyLine } = window;
  const mic = useMicSim(page.script); // SIM: ASR — two soft misses, then success
  const [misses, setMisses] = React.useState(0);
  const [praised, setPraised] = React.useState(null);
  React.useEffect(() => {
    if (mic.phase !== "heard" || !active) return;
    const soft = mic.heard.includes("…") || mic.heard.startsWith("(");
    if (soft) setMisses((m) => m + 1);
    else setPraised(page.praise(mic.heard));
  }, [mic.phase, mic.heard]);
  const Art = window[page.art] || window.RopeArt;
  const line = praised || (misses >= 2 ? page.hint : misses === 1 ? "One more time — right into my ear?" : null);
  return (
    <PageFrame orientation={orientation} folio={folio} onNext={onNext} onPrev={onPrev} nextGlow={!!praised}
      art={<Art></Art>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center", justifyContent: "center" }}>
        <AskCard question={page.question} micActive={mic.phase === "listening"} onMic={() => mic.start()} width={orientation === "portrait" ? 520 : 470}></AskCard>
        {mic.phase === "heard" && !praised && (
          <span style={{ fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 20, color: "var(--ink-faint)" }}>&ldquo;{mic.heard}&rdquo;</span>
        )}
        {line && (
          <BuddyLine key={line} line={line} tail="none" maxWidth={430}></BuddyLine>
        )}
      </div>
    </PageFrame>
  );
}

function ChoicePage({ page, active, folio, onNext, onPrev, orientation, nav, bookId }) {
  const { ChoiceCards } = RD_NS;
  const { useMicSim } = window;
  const prog = nav.state.history.progress[bookId];
  const [picked, setPicked] = React.useState((prog && prog.choice) || null);
  const [heardIdea, setHeardIdea] = React.useState(null);
  const mic = useMicSim(page.ideaScript); // SIM: freeform idea → safety-checked story branch
  React.useEffect(() => {
    if (mic.phase === "heard") { setHeardIdea(mic.heard); pick("idea"); }
  }, [mic.phase]);
  function pick(id) {
    setPicked(id);
    window.foley("choice-settle");
    nav.patchHistory((h) => ({ progress: { ...h.progress, [bookId]: { ...(h.progress[bookId] || {}), choice: id } } }));
  }
  const choices = page.choices.map((c) => ({ ...c, art: React.createElement(window[c.art]) }));
  const inkLine = picked ? page.ink[picked] : null;
  const { MicButton } = RD_NS;
  return (
    <PageFrame orientation={orientation} folio={folio} onNext={onNext} onPrev={onPrev} nextGlow={!!picked}
      art={
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 28, lineHeight: 1.4, color: "var(--ink)", textAlign: "center", margin: 0, textWrap: "pretty" }}>{page.prompt}</p>
          <div className={picked ? "lfp-choice-dim" : ""}>
            <ChoiceCards choices={choices} picked={picked} onPick={pick} size={orientation === "portrait" ? 150 : 164}></ChoiceCards>
          </div>
        </div>
      }>
      {/* the spoken third path — freeform */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: picked && picked !== "idea" ? 0.45 : 1, transition: "opacity 500ms ease" }}>
        <MicButton active={mic.phase === "listening"} onPress={() => mic.start()} label="tell me your idea"></MicButton>
        <span style={{ fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 25, color: "var(--ink)" }}>{page.freeform}</span>
      </div>
      {heardIdea && (
        <span className="lfp-fade-in" style={{ fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 21, color: "var(--ink-soft)" }}>&ldquo;{heardIdea}&rdquo;</span>
      )}
      {/* the story rewrites itself in ink across the page bottom — never dots.
          SIM: branch continuation is pre-scripted; real system = generation + QA. */}
      {picked && (
        <div style={{ marginTop: 6 }}>
          <div style={{ fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 19, color: "var(--ink-faint)", marginBottom: 8 }}>your choice is changing the story…</div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 27, lineHeight: 1.5, color: "var(--ink)", margin: 0 }}>
            {inkLine.split(" ").map((w, i) => (
              <span key={picked + i} className="lfp-ink-in" style={{ animationDelay: i * 240 + "ms", display: "inline-block", marginRight: "0.3em" }}>{w}</span>
            ))}
          </p>
        </div>
      )}
    </PageFrame>
  );
}

function BreathePage({ page, active, folio, onNext, onPrev, orientation }) {
  const { BreatheCircle } = RD_NS;
  const { WordGlow } = window;
  const Art = window[page.art] || window.BellyArt;
  return (
    <PageFrame orientation={orientation} folio={folio} onNext={onNext} onPrev={onPrev}
      art={
        <div style={{ position: "relative" }}>
          <Art></Art>
          {/* the breath lives on Miko's belly — a wash bloom that swells.
              The buddy's voice carries the cadence (SIM: "in… and out"). */}
          <div style={{ position: "absolute", left: "50%", top: "64%", transform: "translate(-50%,-50%)", opacity: 0.9 }}>
            <BreatheCircle pigment="teal" size={170} running={active}></BreatheCircle>
          </div>
        </div>
      }>
      <WordGlow text={page.text} active={active} ms={620}></WordGlow>
      <div style={{ fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 21, color: "var(--ink-faint)" }}>breathe along with Miko…</div>
    </PageFrame>
  );
}

/* ---------- chapter end ---------- */
function ChapterEndPanel({ book, chapter, isLast, orientation, nav, onNextChapter, onAllDone, onFinish }) {
  const ch = book.chapters[chapter];
  const { AskCard } = RD_NS;
  const { useMicSim, BuddyLine, CreatureSprite } = window;
  const mic = useMicSim(ch.recapScript); // SIM: spoken recap answer
  const [praise, setPraise] = React.useState(null);
  React.useEffect(() => { if (mic.phase === "heard") setPraise(ch.recapPraise(mic.heard)); }, [mic.phase]);
  const micLive = mic.phase === "listening";
  return (
    <div data-register="story" className="lf-paper" style={{
      position: "absolute", inset: 26, borderRadius: "var(--radius-page)",
      backgroundColor: "var(--paper-bright)", backgroundImage: "var(--texture-paper)",
      boxShadow: "0 8px 30px -14px var(--shadow-warm)", overflow: "hidden",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: "3% 6%"
    }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
        <CreatureSprite kind={nav.state.buddy || "bear"} pose="celebrating" size={150}></CreatureSprite>
        <BuddyLine line={praise || ch.cheer} key={praise || ch.cheer} tail="left" maxWidth={400} variant="bouncy"></BuddyLine>
      </div>
      {!praise && <AskCard question={ch.recapQ} micActive={micLive} onMic={() => mic.start()} width={orientation === "portrait" ? 540 : 500}></AskCard>}
      {ch.hook && <div style={{ fontFamily: "var(--font-display)", fontSize: 27, color: "var(--ink-soft)", fontStyle: "normal" }}>{ch.hook}</div>}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginTop: 4 }}>
        {/* the one terracotta action — recedes while the mic is live */}
        <button
          onClick={isLast ? onFinish : onNextChapter}
          className={"lf-drawn-border lf-drawn-border--bold" + (micLive ? "" : " lfp-terra-glow")}
          aria-label={isLast ? "the end — hooray" : "next chapter"}
          style={{
            minHeight: 76, minWidth: 320, padding: "14px 44px",
            borderRadius: "22px 26px 23px 25px",
            backgroundColor: micLive ? "color-mix(in srgb, var(--accent-action) 30%, var(--paper-bright))" : "var(--accent-action)",
            backgroundImage: "var(--texture-paper)",
            color: micLive ? "var(--ink)" : "#F9F2E3",
            fontFamily: "var(--font-display)", fontSize: 31, cursor: "pointer",
            opacity: micLive ? 0.55 : 1, transition: "opacity 400ms ease, background-color 400ms ease"
          }}>
          {isLast ? "The end — hooray!" : "Next chapter"}
        </button>
        <button onClick={onAllDone} aria-label="all done for now"
          style={{ minHeight: 48, padding: "8px 22px", fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 23, color: "var(--ink-soft)", cursor: "pointer", borderRadius: 12 }}>
          all done for now
        </button>
      </div>
    </div>
  );
}

/* ---------- resume recap ---------- */
function RecapView({ book, nav, onPlay, orientation }) {
  const { RecapStrip } = RD_NS;
  const prog = nav.state.history.progress[book.id] || {};
  const choiceCap = prog.choice === "moto" ? "YOU chose Miko's moto!" : prog.choice === "idea" ? "YOU made up the cloud way!" : "YOU chose Boulder's long neck!";
  const ChoiceArt = prog.choice === "moto" ? window.MotoPathArt : window.NeckPathArt;
  const panels = [
    { art: <window.BridgeArt></window.BridgeArt>, caption: "Miko found the wobbly bridge" },
    { art: <ChoiceArt></ChoiceArt>, caption: choiceCap },
    { art: <window.BellyArt></window.BellyArt>, caption: "one brave belly breath…" }
  ];
  const pw = orientation === "portrait" ? 200 : 236;
  return (
    <div data-register="story" className="lf-paper" style={{
      position: "absolute", inset: 26, borderRadius: "var(--radius-page)",
      backgroundColor: "var(--paper-bright)", backgroundImage: "var(--texture-paper)",
      boxShadow: "0 8px 30px -14px var(--shadow-warm)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30
    }} data-screen-label="Resume — last time…">
      <div style={{ fontFamily: "var(--font-display)", fontSize: 40, color: "var(--ink)" }}>Last time…</div>
      <div style={{ position: "relative" }}>
        {/* his own choice is the highlighted panel */}
        <div aria-hidden="true" style={{ position: "absolute", left: pw + 28, top: -10, width: pw, height: "calc(100% + 20px)", borderRadius: 16, boxShadow: "0 0 36px 10px var(--glow-lamplight)", pointerEvents: "none" }}></div>
        <RecapStrip panels={panels} panelWidth={pw}></RecapStrip>
      </div>
      <button onClick={onPlay} className="lf-drawn-border lf-drawn-border--bold lfp-terra-glow" aria-label="keep going"
        style={{
          width: 96, height: 96, borderRadius: "50% 48% 52% 50%",
          backgroundColor: "var(--accent-action)", backgroundImage: "var(--texture-paper)",
          display: "grid", placeItems: "center", cursor: "pointer", color: "#F9F2E3"
        }}>
        <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
          <path d="M12 7 L33 20 L12 33 Z" fill="currentColor" filter="url(#lf-wobble)"></path>
        </svg>
      </button>
    </div>
  );
}

/* ---------- the Reader screen ---------- */
function ReaderScreen({ nav }) {
  const { Endpaper } = RD_NS;
  const { LF_BOOKS } = window;
  const book = LF_BOOKS[nav.route.bookId] || LF_BOOKS.miko;
  const orientation = nav.orientation;
  const W = orientation === "portrait" ? 820 : 1180;
  const H = orientation === "portrait" ? 1180 : 820;

  const [recap, setRecap] = React.useState(!!nav.route.recap);
  const prog0 = nav.state.history.progress[nav.route.bookId] || {};
  const [chapter, setChapter] = React.useState(nav.route.chapter != null ? nav.route.chapter : (nav.route.recap && prog0.chapter) || 0);
  const [page, setPage] = React.useState(nav.route.page != null ? nav.route.page : (nav.route.recap && prog0.page) || 0);
  const [wait, setWait] = React.useState(false); // endpaper beat between chapters

  const ch = book.chapters[Math.min(chapter, book.chapters.length - 1)];
  const frames = ch.pages.length + 1; // + chapter-end panel

  /* refresh keeps the place */
  React.useEffect(() => {
    nav.setRoute((r) => ({ ...r, chapter, page, recap: false }));
    nav.patchHistory((h) => ({
      progress: { ...h.progress, [book.id]: { ...(h.progress[book.id] || {}), chapter, page, pendingRecap: true, done: (h.progress[book.id] || {}).done || false } }
    }));
  }, [chapter, page, recap]);

  function go(p) { setPage(Math.max(0, Math.min(p, frames - 1))); window.foley("page-brush"); }
  function nextChapter() {
    setWait(true);
    setTimeout(() => { setChapter(chapter + 1); setPage(0); setWait(false); }, 1300); // endpaper beat, not a spinner
  }
  function allDone() {
    nav.patchHistory((h) => ({ progress: { ...h.progress, [book.id]: { ...(h.progress[book.id] || {}), pendingRecap: true } } }));
    nav.closeBook(book.id);
  }
  function finishBook() {
    nav.setRoute({ screen: "complete", bookId: book.id });
  }

  return (
    <div data-screen-label={"Reader — " + book.title} style={{ position: "absolute", inset: 0, zIndex: 40 }}>
      <Endpaper pigment={book.pigment} motif={book.motif} loading={wait} style={{ position: "absolute", inset: 0 }}></Endpaper>

      {!wait && recap && <RecapView book={book} nav={nav} orientation={orientation} onPlay={() => { setRecap(false); }}></RecapView>}

      {!wait && !recap && (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <div style={{
            position: "absolute", inset: 0, display: "flex", width: frames * W,
            transform: "translateX(" + -page * W + "px)",
            transition: "transform var(--motion-kamishibai, 520ms) var(--ease-slide)"
          }}>
            {ch.pages.map((p, i) => {
              const shared = {
                page: p, active: i === page, folio: i + 1, orientation, nav,
                onNext: () => go(i + 1),
                onPrev: i > 0 ? () => go(i - 1) : undefined
              };
              return (
                <div key={chapter + "-" + i} style={{ width: W, height: H, flex: "none", position: "relative" }}>
                  {p.type === "read" && <ReadPage {...shared}></ReadPage>}
                  {p.type === "ask" && <AskPage {...shared}></AskPage>}
                  {p.type === "choice" && <ChoicePage {...shared} bookId={book.id}></ChoicePage>}
                  {p.type === "breathe" && <BreathePage {...shared}></BreathePage>}
                </div>
              );
            })}
            <div style={{ width: W, height: H, flex: "none", position: "relative" }}>
              {page === frames - 1 && (
                <ChapterEndPanel book={book} chapter={chapter} isLast={chapter === book.chapters.length - 1}
                  orientation={orientation} nav={nav}
                  onNextChapter={nextChapter} onAllDone={allDone} onFinish={finishBook}></ChapterEndPanel>
              )}
            </div>
          </div>

          {/* quiet ink back arrow — puts the book away */}
          <button onClick={allDone} aria-label="put the book back on the shelf" className="lf-drawn-border"
            style={{
              position: "absolute", left: 24, top: 24, width: 58, height: 58, borderRadius: "50% 48% 52% 50%",
              backgroundColor: "var(--paper-bright)", backgroundImage: "var(--texture-paper)",
              display: "grid", placeItems: "center", color: "var(--ink)", cursor: "pointer", zIndex: 8
            }}>
            <svg width="28" height="28" viewBox="0 0 30 30" aria-hidden="true">
              <path d="M19 4 L7 15 L19 26" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" filter="url(#lf-wobble)"></path>
            </svg>
          </button>

          {/* book + chapter — quiet ink, atmosphere only */}
          <div style={{ position: "absolute", top: 34, left: 0, right: 0, textAlign: "center", fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 19, color: "var(--ink-faint)", pointerEvents: "none", zIndex: 6 }}>
            {book.title}{book.chapters.length > 1 ? " — " + ch.title : ""}
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ReaderScreen, PageFrame, CornerTurn });
