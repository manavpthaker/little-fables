/* Little Fables — Home (the acceptance test).
   The north-star room as the actual Home screen with real UI applied. */

const NS = window.LittleFablesDesignSystem_d603a2;
const { Buddy, SpeechBalloon, ReadingPage, ReadingSuns, Endpaper } = NS;
const RoomScene = window.RoomScene;

/* ---------- story + shelf data (scene coordinates, 1180×820) ---------- */

function BridgeArt() {
  return (
    <svg width="100%" viewBox="0 0 300 220" style={{ maxWidth: 340 }}>
      <ellipse cx="150" cy="196" rx="120" ry="12" fill="var(--shadow-cool)" filter="url(#lf-wash-edge)"></ellipse>
      <path d="M30 150 Q 150 90 270 150" fill="none" stroke="#C89A5E" strokeWidth="16" opacity="0.75" filter="url(#lf-wash-edge)"></path>
      <ellipse cx="150" cy="120" rx="26" ry="18" fill="#E2A93B" opacity="0.9" filter="url(#lf-wash-edge)"></ellipse>
      <path d="M168 112 q 12 -8 16 -2 q -4 8 -14 8" fill="#E2A93B" opacity="0.85" filter="url(#lf-wash-edge)"></path>
      <g fill="none" stroke="var(--ink)" filter="url(#lf-wobble)">
        <path d="M30 150 Q 150 90 270 150" strokeWidth="2.2"></path>
        <path d="M36 128 L36 172 M264 128 L264 172" strokeWidth="2.6"></path>
        <path d="M62 138 l0 10 M92 128 l0 10 M122 121 l0 10 M150 118 l0 10 M180 121 l0 10 M210 128 l0 10 M240 137 l0 10" strokeWidth="1.6"></path>
        <ellipse cx="150" cy="120" rx="26" ry="18" strokeWidth="2"></ellipse>
        <path d="M138 110 q -3 -8 4 -10 M158 108 q 2 -8 -4 -10" strokeWidth="1.8"></path>
      </g>
      <circle cx="142" cy="116" r="1.8" fill="var(--ink)"></circle>
    </svg>
  );
}
function WindArt() {
  return (
    <svg width="100%" viewBox="0 0 300 220" style={{ maxWidth: 340 }}>
      <g fill="none" stroke="var(--ink-soft)" strokeWidth="3" strokeLinecap="round" filter="url(#lf-wobble)">
        <path d="M30 70 q 40 -26 76 0 q -22 18 -48 9"></path>
        <path d="M90 130 q 50 -30 94 0 q -26 22 -62 11"></path>
        <path d="M170 62 q 36 -22 66 0"></path>
      </g>
      <ellipse cx="76" cy="172" rx="22" ry="15" fill="#E2A93B" opacity="0.9" filter="url(#lf-wash-edge)"></ellipse>
      <g fill="none" stroke="var(--ink)" strokeWidth="2" filter="url(#lf-wobble)">
        <ellipse cx="76" cy="172" rx="22" ry="15"></ellipse>
        <path d="M92 164 q 10 -6 14 -2" strokeWidth="1.8"></path>
        <path d="M60 150 L60 132 M84 148 L86 132" strokeWidth="1.6"></path>
      </g>
      <circle cx="70" cy="168" r="2" fill="var(--ink)"></circle>
    </svg>
  );
}
function StepsArt() {
  return (
    <svg width="100%" viewBox="0 0 300 220" style={{ maxWidth: 340 }}>
      <path d="M20 180 q 70 -12 120 -40 q 60 -34 140 -44" fill="none" stroke="#C89A5E" strokeWidth="14" opacity="0.7" filter="url(#lf-wash-edge)"></path>
      <path d="M20 180 q 70 -12 120 -40 q 60 -34 140 -44" fill="none" stroke="var(--ink)" strokeWidth="2" filter="url(#lf-wobble)"></path>
      <g fill="#E2A93B" opacity="0.95">
        <ellipse cx="80" cy="160" rx="9" ry="6" filter="url(#lf-wash-edge)"></ellipse>
        <ellipse cx="130" cy="138" rx="9" ry="6" filter="url(#lf-wash-edge)"></ellipse>
        <ellipse cx="180" cy="112" rx="9" ry="6" filter="url(#lf-wash-edge)"></ellipse>
      </g>
      <path d="M226 78 q 16 -12 30 -4 q -2 12 -18 14 q 10 2 20 -2" fill="#7C9A62" opacity="0.7" filter="url(#lf-wash-edge)"></path>
      <path d="M238 96 l4.6 9.4 10.4 1.1 -7.8 7 2.3 10.2 -9.5 -5.3 -9.5 5.3 2.3 -10.2 -7.8 -7 10.4 -1.1 z" fill="#EFC85C" filter="url(#lf-wobble)"></path>
    </svg>
  );
}

const BOOKS = {
  miko: {
    title: "Miko and the Wobbly Bridge",
    rect: { left: 826, top: 338, width: 82, height: 114 },
    pigment: "river", motif: "boat",
    pages: [
      { text: "The bridge swung under Miko's paws. It felt wobbly, like a boat made of rope.", art: BridgeArt },
      { text: "The wind hummed in the ropes. Miko held on tight and listened.", art: WindArt },
      { text: "One small step. Then another. The other side was closer than it looked.", art: StepsArt }
    ]
  },
  moose: {
    title: "The Moose Who Knew About Bigness",
    rect: { left: 920, top: 336, width: 82, height: 116 },
    pigment: "sage", motif: "leaf",
    pages: [{ text: "Bigness is not how tall you are, said the moose. It is how much sky you can love.", art: WindArt }]
  },
  papa: {
    title: "Papa Gets the Moon",
    rect: { left: 1014, top: 338, width: 82, height: 114 },
    pigment: "plum", motif: "moon",
    pages: [{ text: "Papa climbed and climbed. The moon was patient. Moons usually are.", art: StepsArt }]
  },
  boat: {
    title: "A Boat of Leaves",
    rect: { left: 830, top: 482, width: 82, height: 112 },
    pigment: "teal", motif: "boat",
    pages: [{ text: "One leaf. Two leaves. A whole boat of leaves, waiting for a puddle big enough.", art: BridgeArt }]
  },
  snail: {
    title: "The Quiet Snail",
    rect: { left: 922, top: 480, width: 82, height: 114 },
    pigment: "marigold", motif: "leaf",
    pages: [{ text: "The snail said nothing at all. The garden said everything for him.", art: WindArt }]
  },
  azad: {
    title: "Azad's Bird Book",
    rect: { left: 1016, top: 482, width: 82, height: 112 },
    pigment: "butter", motif: "star",
    pages: [{ text: "The bird flew over my house and waved with one wing. I waved back with one hand.", art: StepsArt }]
  }
};

const SPEECH_LINES = [
  { text: "Shall we see what Miko does next?", pose: "idle" },
  { text: "The wobbly bridge is waiting for us.", pose: "pointing" },
  { text: "You have four suns already.", pose: "celebrating" },
  { text: "Or we could just sit a while.", pose: "idle" }
];

/* ---------- Home ---------- */

function Home() {
  const [view, setView] = React.useState("room"); // room | opening | reading | closing
  const [bookId, setBookId] = React.useState(null);
  const [expanded, setExpanded] = React.useState(false);
  const [pageIdx, setPageIdx] = React.useState(0);
  const [micOn, setMicOn] = React.useState(false);
  const [lineIdx, setLineIdx] = React.useState(0);

  const book = bookId ? BOOKS[bookId] : null;
  const line = SPEECH_LINES[lineIdx % SPEECH_LINES.length];

  function openBook(id) {
    setBookId(id);
    setPageIdx(0);
    setMicOn(false);
    setView("opening");
    setExpanded(false);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { setExpanded(true); });
    });
    setTimeout(function () { setView("reading"); }, 950);
  }
  function closeBook() {
    setView("closing");
    setExpanded(false);
    setTimeout(function () { setView("room"); setBookId(null); }, 950);
  }

  const overlayActive = view !== "room";
  const endpaperStyle = book
    ? expanded
      ? { left: 0, top: 0, width: 1180, height: 820, borderRadius: 0 }
      : { left: book.rect.left, top: book.rect.top, width: book.rect.width, height: book.rect.height, borderRadius: 6 }
    : null;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* ---- the room ---- */}
      <div data-screen-label="Home — the room" style={{ position: "absolute", inset: 0 }} aria-hidden={overlayActive}>
        <RoomScene>
          {/* the buddy, alive */}
          <div style={{ position: "absolute", left: 313, top: 444 }}>
            <Buddy pose={line.pose} size={258}></Buddy>
          </div>
          <button
            onClick={function () { setLineIdx(lineIdx + 1); }}
            aria-label="the buddy — hear another idea"
            style={{ position: "absolute", left: 360, top: 480, width: 180, height: 250, cursor: "pointer", borderRadius: 30 }}
          ></button>

          {/* buddy speech (spoken aloud; text is atmosphere) */}
          <div style={{ position: "absolute", left: 470, top: 372, maxWidth: 400 }}>
            <SpeechBalloon speaking={true} tail="left" maxWidth={330} key={lineIdx}>
              {line.text}
            </SpeechBalloon>
          </div>

          {/* reading-day suns on the sill */}
          <div style={{ position: "absolute", left: 186, top: 382 }}>
            <ReadingSuns count={4} size={32} sill={false}></ReadingSuns>
          </div>

          {/* Continue beacon on Miko (the one glowing next thing) */}
          <div
            aria-hidden="true"
            className="lf-home-beacon"
            style={{
              position: "absolute",
              left: BOOKS.miko.rect.left - 2,
              top: BOOKS.miko.rect.top - 2,
              width: BOOKS.miko.rect.width + 4,
              height: BOOKS.miko.rect.height + 4,
              borderRadius: 8,
              pointerEvents: "none"
            }}
          ></div>

          {/* book hotspots */}
          {Object.keys(BOOKS).map(function (id) {
            const r = BOOKS[id].rect;
            return (
              <button
                key={id}
                onClick={function () { openBook(id); }}
                aria-label={"open " + BOOKS[id].title}
                style={{
                  position: "absolute",
                  left: r.left - 6,
                  top: r.top - 6,
                  width: r.width + 12,
                  height: r.height + 12,
                  borderRadius: 10,
                  cursor: "pointer"
                }}
              ></button>
            );
          })}
        </RoomScene>
      </div>

      {/* ---- endpaper transition + reading ---- */}
      {overlayActive && book && (
        <div style={{ position: "absolute", inset: 0 }} data-screen-label={"Reading — " + book.title}>
          <div
            style={{
              position: "absolute",
              overflow: "hidden",
              boxShadow: "0 10px 40px -12px var(--shadow-warm)",
              transition:
                "left var(--motion-endpaper, 900ms) var(--ease-drawn), top var(--motion-endpaper, 900ms) var(--ease-drawn), width var(--motion-endpaper, 900ms) var(--ease-drawn), height var(--motion-endpaper, 900ms) var(--ease-drawn), border-radius var(--motion-endpaper, 900ms) var(--ease-drawn)",
              ...endpaperStyle
            }}
          >
            <Endpaper pigment={book.pigment} motif={book.motif} loading={view !== "reading"} style={{ position: "absolute", inset: 0 }}></Endpaper>

            {view === "reading" && (
              <div style={{ position: "absolute", inset: 0 }}>
                {/* kamishibai track */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    width: book.pages.length * 1180,
                    transform: "translateX(" + -pageIdx * 1180 + "px)",
                    transition: "transform var(--motion-kamishibai, 520ms) var(--ease-slide)"
                  }}
                >
                  {book.pages.map(function (p, i) {
                    const Art = p.art;
                    return (
                      <div key={i} style={{ width: 1180, height: 820, flex: "none", display: "grid", placeItems: "center" }}>
                        <ReadingPage
                          width={960}
                          art={<Art></Art>}
                          text={p.text}
                          autoHighlight={i === pageIdx}
                          micActive={micOn && i === pageIdx}
                          onMic={function () { setMicOn(!micOn); }}
                          onNext={i < book.pages.length - 1 ? function () { setPageIdx(i + 1); setMicOn(false); } : undefined}
                          pageLabel={"page " + (i + 1)}
                        ></ReadingPage>
                      </div>
                    );
                  })}
                </div>

                {/* close = put the book back (drawn, >=56px) */}
                <button
                  onClick={closeBook}
                  aria-label="put the book back on the shelf"
                  className="lf-drawn-border"
                  style={{
                    position: "absolute",
                    left: 26,
                    top: 26,
                    width: 60,
                    height: 60,
                    borderRadius: "50% 48% 52% 50%",
                    backgroundColor: "var(--paper-bright)",
                    backgroundImage: "var(--texture-paper)",
                    display: "grid",
                    placeItems: "center",
                    color: "var(--ink)",
                    cursor: "pointer"
                  }}
                >
                  <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
                    <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" filter="url(#lf-wobble)">
                      <path d="M19 4 L7 15 L19 26"></path>
                    </g>
                  </svg>
                </button>

                {/* book title, quiet, top center */}
                <div
                  style={{
                    position: "absolute",
                    top: 30,
                    left: 0,
                    right: 0,
                    textAlign: "center",
                    fontFamily: "var(--font-display)",
                    fontSize: 26,
                    color: "rgba(249,242,227,0.85)",
                    pointerEvents: "none"
                  }}
                >
                  {book.title}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- fixed-canvas stage (1180×820 letterboxed on warm paper) ---------- */

function Stage() {
  const [scale, setScale] = React.useState(1);
  React.useEffect(function () {
    function fit() {
      setScale(Math.min(window.innerWidth / 1180, window.innerHeight / 820));
    }
    fit();
    window.addEventListener("resize", fit);
    return function () { window.removeEventListener("resize", fit); };
  }, []);
  return (
    <div
      className="lf-paper"
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        backgroundColor: "var(--paper-deep)",
        overflow: "hidden"
      }}
    >
      <div style={{ width: 1180, height: 820, position: "relative", flex: "none", transform: "scale(" + scale + ")", transformOrigin: "center" }}>
        <Home></Home>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Stage></Stage>);
