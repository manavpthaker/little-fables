/* Little Fables — THE ROOM.
   Composes assets/north-star.svg (the north-star scene) into the living Home:
   - landscape 1180×820 (primary) and a portrait 820×1180 recomposition
     (Home + Reader are the only portrait screens, per spec)
   - real time of day on the window (morning / afternoon / evening / night)
   - lantern register at evening/night (light change, never a cut)
   - a continuous camera (home ↔ writing desk ↔ word wall) — objects and
     camera move; scenes never cut. */

/* ---------- fetch + split the north-star scene once ---------- */
function balancedGroup(src, startIdx) {
  // returns [start, endExclusive] of the <g|rect|defs ...>...</> element at startIdx
  const tag = src.slice(startIdx + 1, src.indexOf(" ", startIdx) > -1 ? Math.min(src.indexOf(" ", startIdx), src.indexOf(">", startIdx)) : src.indexOf(">", startIdx));
  let depth = 0, i = startIdx;
  const open = "<" + tag, close = "</" + tag + ">";
  while (i < src.length) {
    const nextOpen = src.indexOf(open, i);
    const nextClose = src.indexOf(close, i);
    if (nextClose === -1) return [startIdx, src.length];
    if (nextOpen !== -1 && nextOpen < nextClose) {
      // ensure it's a real tag boundary (followed by space or >)
      const c = src[nextOpen + open.length];
      if (c === " " || c === ">" || c === "\n") depth += 1;
      i = nextOpen + open.length;
    } else {
      depth -= 1;
      i = nextClose + close.length;
      if (depth === 0) return [startIdx, i];
    }
  }
  return [startIdx, src.length];
}
function extractById(src, id) {
  const at = src.indexOf('id="' + id + '"');
  if (at === -1) return "";
  const start = src.lastIndexOf("<", at);
  const [s, e] = balancedGroup(src, start);
  return src.slice(s, e);
}
function stripBooks(shelfFrag) {
  // the six drawn covers are replaced by live BookCover components
  let out = shelfFrag;
  ["ns-book-miko", "ns-book-moose", "ns-book-papa", "ns-book-boat", "ns-book-snail", "ns-book-azad"].forEach((id) => {
    const at = out.indexOf('id="' + id + '"');
    if (at === -1) return;
    const start = out.lastIndexOf("<", at);
    const [s, e] = balancedGroup(out, start);
    out = out.slice(0, s) + out.slice(e);
  });
  return out;
}

let __nsPromise = null;
function loadNorthStar() {
  if (!__nsPromise) {
    __nsPromise = fetch("assets/north-star.svg").then((r) => r.text()).then((src) => {
      const defs = extractById(src, "ns-wob").length ? src.slice(src.indexOf("<defs>"), src.indexOf("</defs>") + 7) : "";
      const g = (id) => extractById(src, id);
      return {
        defs,
        wall: g("ns-wall"),
        wallwash: g("ns-wallwash"),
        floor: g("ns-floor"),
        beam: g("ns-beamlight"),
        window: g("ns-window"),
        shelf: stripBooks(g("ns-shelf")),
        rug: g("ns-rug"),
        puzzle: g("ns-puzzle"),
        table: g("ns-table"),
        guitar: g("ns-guitar"),
        motes: g("ns-motes"),
        finish: g("ns-finish")
      };
    });
  }
  return __nsPromise;
}
function useNorthStar() {
  const [frags, setFrags] = React.useState(null);
  React.useEffect(() => { let on = true; loadNorthStar().then((f) => on && setFrags(f)); return () => { on = false; }; }, []);
  return frags;
}

/* ---------- layout maps (stage coordinates per orientation) ---------- */
const ROOM_LAYOUT = {
  landscape: {
    w: 1180, h: 820,
    buddy: { x: 313, y: 444, size: 258 },      // on the rug
    buddyHit: { x: 356, y: 470, w: 190, h: 260 },
    speech: { x: 470, y: 356 },
    suns: { x: 148, y: 384 },
    windowGlass: { x: 110, y: 118, w: 204, h: 294 },
    windowHit: { x: 84, y: 104, w: 256, h: 340 },
    words: [{ x: 452, y: 166 }, { x: 578, y: 196 }, { x: 692, y: 156 }, { x: 500, y: 250 }, { x: 626, y: 268 }],
    wordsHit: { x: 440, y: 140, w: 380, h: 200 },
    shelfSlots: {
      miko: { x: 826, y: 338 }, moose: { x: 920, y: 336 }, papa: { x: 1014, y: 338 },
      cozy: { x: 830, y: 482 }, bramble: { x: 922, y: 480 }, azi: { x: 1016, y: 482 }
    },
    slotW: 82,
    authored: [{ x: 952, y: 200 }, { x: 1034, y: 196 }],
    authoredW: 66,
    medals: { x: 828, y: 606, gap: 64 },
    crate: { x: 648, y: 540 },
    desk: { x: 612, y: 470, w: 180, h: 150 },   // the little writing desk (table + book + cup)
    door: { x: 0, y: 96 },
    doorNote: { x: 10, y: 236 },
    camDesk: "scale(2.1) translate(-405px, -235px)",   // zoom to the desk
    camWall: "scale(2.05) translate(-345px, -30px)"    // zoom to the pinned words
  },
  portrait: {
    w: 820, h: 1180,
    buddy: { x: 240, y: 760, size: 250 },
    buddyHit: { x: 280, y: 790, w: 190, h: 250 },
    speech: { x: 396, y: 690 },
    suns: { x: 96, y: 372 },
    windowGlass: { x: 86, y: 144, w: 204, h: 294 },
    windowHit: { x: 60, y: 130, w: 256, h: 340 },
    words: [{ x: 420, y: 96 }, { x: 546, y: 122 }, { x: 470, y: 190 }, { x: 600, y: 200 }, { x: 380, y: 176 }],
    wordsHit: { x: 370, y: 70, w: 330, h: 200 },
    shelfSlots: {
      miko: { x: 503.4, y: 288.2 }, moose: { x: 588, y: 286.4 }, papa: { x: 672.6, y: 288.2 },
      cozy: { x: 507, y: 417.8 }, bramble: { x: 589.8, y: 416 }, azi: { x: 674.4, y: 417.8 }
    },
    slotW: 73.8,
    authored: [{ x: 620, y: 162 }, { x: 694, y: 158 }],
    authoredW: 60,
    medals: { x: 506, y: 528, gap: 58 },
    crate: { x: 148, y: 806 },
    desk: { x: 112, y: 734, w: 180, h: 150 },
    door: null,
    doorNote: { x: 8, y: 520 },
    camDesk: "none", camWall: "none"
  }
};

/* time-of-day sky + light (the window shows the real hour; the room's one
   honest light source). Registers: day / evening golden / night lantern. */
const SKY = {
  morning:   { top: "#F6E2AC", mid: "#F1C97E", low: "#EDB35E", sun: true, sunY: 330, tint: null },
  afternoon: { top: "#F3E7C0", mid: "#EFCf8E", low: "#E9B769", sun: true, sunY: 240, tint: null },
  evening:   { top: "#E9B769", mid: "#DE9459", low: "#C97455", sun: true, sunY: 372, tint: "rgba(222,148,89,0.10)" },
  night:     { top: "#22304A", mid: "#2A3A5C", low: "#1B2740", sun: false, tint: "rgba(34,48,74,0.42)" }
};

/* ---------- portrait recomposition ---------- */
function portraitSvg(f) {
  const X = (frag, t) => '<g transform="' + t + '">' + frag + "</g>";
  return (
    '<svg viewBox="0 0 820 1180" width="100%" height="100%" style="display:block" font-family="Alegreya, Georgia, serif">' +
    f.defs +
    '<rect width="820" height="1180" fill="url(#ns-wallgrad)"></rect>' +
    X(f.wallwash, "translate(-40 0)") +
    X(f.floor, "translate(-180 296)") +
    '<rect y="1100" width="820" height="80" fill="#C89A5E" opacity="0.46" filter="url(#ns-wash)"></rect>' +
    '<rect y="1100" width="820" height="80" fill="#5B4637" opacity="0.135" filter="url(#ns-washsoft)"></rect>' +
    X(f.beam, "translate(-96 130)") +
    X(f.window, "translate(-24 26)") +
    X(f.shelf, "translate(-240 -16) scale(0.9)") +
    X(f.rug, "translate(-52 316)") +
    X(f.table, "translate(-500 264)") +
    X(f.motes, "translate(-60 180)") +
    '<rect width="820" height="1180" fill="url(#ns-vign)"></rect>' +
    '<rect width="820" height="1180" filter="url(#ns-fiber)"></rect>' +
    '<rect width="820" height="1180" filter="url(#ns-grain)"></rect>' +
    "</svg>"
  );
}
function landscapeSvg(f) {
  return (
    '<svg viewBox="0 0 1180 820" width="100%" height="100%" style="display:block" font-family="Alegreya, Georgia, serif">' +
    f.defs + f.wall + f.wallwash + f.floor + f.beam + f.window + f.shelf + f.rug +
    f.puzzle + f.table + f.guitar + f.motes + f.finish +
    "</svg>"
  );
}

/* ---------- time-of-day overlays (drawn light, never a cut) ---------- */
function WindowWeather({ L, hour }) {
  const sky = SKY[hour] || SKY.morning;
  const g = L.windowGlass;
  const { MoonInWindow } = window;
  if (hour === "morning") return null; // the base painting IS morning
  return (
    <svg viewBox="0 0 340 470" width={340} height={470}
      style={{ position: "absolute", left: L.windowGlass.x - 26, top: L.windowGlass.y - 44, pointerEvents: "none", transition: "opacity 900ms ease" }}
      aria-hidden="true">
      <defs>
        <linearGradient id={"lf-sky-" + hour} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky.top}></stop>
          <stop offset="0.55" stopColor={sky.mid}></stop>
          <stop offset="1" stopColor={sky.low}></stop>
        </linearGradient>
      </defs>
      <g>
        <rect x="26" y="44" width={g.w} height={g.h} fill={"url(#lf-sky-" + hour + ")"} opacity="0.94" filter="url(#lf-wash-edge)"></rect>
        {hour === "night" ? (
          <MoonInWindow></MoonInWindow>
        ) : (
          <g>
            <circle cx="94" cy={sky.sunY} r="25" fill="#F9E7AE" opacity="0.98" filter="url(#lf-wash-edge)"></circle>
            <circle cx="94" cy={sky.sunY} r="44" fill={hour === "evening" ? "#E98E4F" : "#F1BE6B"} opacity="0.5" filter="url(#lf-wash-edge)"></circle>
          </g>
        )}
        <path d={"M26 " + (44 + g.h - 36) + " Q 92 " + (44 + g.h - 58) + " 154 " + (44 + g.h - 42) + " Q 194 " + (44 + g.h - 33) + " 230 " + (44 + g.h - 46) + " L230 " + (44 + g.h) + " L26 " + (44 + g.h) + " Z"} fill={hour === "night" ? "#151F35" : "#5D6A8A"} opacity="0.42" filter="url(#lf-wash-edge)"></path>
        {/* mullions repainted over the new sky */}
        <path d={"M" + (26 + g.w / 2) + " 46 L" + (25 + g.w / 2) + " " + (42 + g.h)} stroke="#46362A" strokeWidth="2.6" fill="none" filter="url(#lf-wobble)"></path>
        <path d={"M28 " + (44 + g.h / 2) + " L" + (24 + g.w) + " " + (46 + g.h / 2)} stroke="#46362A" strokeWidth="2.6" fill="none" filter="url(#lf-wobble)"></path>
      </g>
    </svg>
  );
}

/* room-wide light: evening warms, night goes lantern (deep indigo + gold pools) */
function RoomLight({ L, hour, quiet }) {
  if (hour !== "evening" && hour !== "night") return null;
  const night = hour === "night";
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", transition: "opacity 900ms ease" }}>
      <div style={{
        position: "absolute", inset: 0,
        background: night ? "rgba(26,37,60,0.52)" : "rgba(206,126,70,0.12)",
        mixBlendMode: "multiply"
      }}></div>
      {night && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(34,48,74,0.30)", mixBlendMode: "color" }}></div>
      )}
      {/* lantern pools: the window's moonlight + a small lamp glow by the rug */}
      <svg viewBox={"0 0 " + L.w + " " + L.h} width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        {night && (
          <g>
            <polygon points={L.w === 1180 ? "320,240 332,432 760,806 420,818" : "290,270 300,470 700,1160 380,1176"} fill="#F3C77A" opacity="0.10" filter="url(#lf-wash-edge)"></polygon>
            <ellipse cx={L.buddy.x + 140} cy={L.buddy.y + 240} rx="230" ry="64" fill="#F3C77A" opacity={quiet ? 0.20 : 0.14} filter="url(#lf-wash-edge)"></ellipse>
            <ellipse cx={L.windowGlass.x + 100} cy={L.windowGlass.y + 130} rx="120" ry="140" fill="#F3C77A" opacity="0.12" filter="url(#lf-wash-edge)"></ellipse>
          </g>
        )}
        {!night && (
          <ellipse cx={L.windowGlass.x + 120} cy={L.h - 90} rx="300" ry="70" fill="#E98E4F" opacity="0.10" filter="url(#lf-wash-edge)"></ellipse>
        )}
      </svg>
    </div>
  );
}

/* ---------- the Room ---------- */
/* cam: "home" | "desk" | "wall" — a continuous camera move, never a cut.
   Children render in the same stage coordinate space, above the painting. */
function Room({ orientation = "landscape", hour = "morning", quiet = false, cam = "home", children, style }) {
  const frags = useNorthStar();
  const L = ROOM_LAYOUT[orientation];
  const html = React.useMemo(() => {
    if (!frags) return "";
    return orientation === "portrait" ? portraitSvg(frags) : landscapeSvg(frags);
  }, [frags, orientation]);
  const camT = cam === "desk" ? L.camDesk : cam === "wall" ? L.camWall : "none";
  const { DoorEdgeArt } = window;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", backgroundColor: "var(--paper)", ...style }}>
      <div style={{
        position: "absolute", inset: 0,
        transform: camT === "none" ? undefined : camT,
        transformOrigin: "0 0",
        transition: "transform var(--motion-endpaper, 900ms) var(--ease-drawn)"
      }}>
        {/* the painted scene (while it loads, the paper ground simply sits — no spinner) */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0 }} dangerouslySetInnerHTML={{ __html: html }}></div>
        {/* the door edge, far left (landscape only) */}
        {orientation === "landscape" && frags && (
          <div aria-hidden="true" style={{ position: "absolute", left: L.door.x, top: L.door.y }}>
            <DoorEdgeArt></DoorEdgeArt>
          </div>
        )}
        {frags && <WindowWeather L={L} hour={hour}></WindowWeather>}
        {frags && children}
        {frags && <RoomLight L={L} hour={hour} quiet={quiet}></RoomLight>}
      </div>
    </div>
  );
}

Object.assign(window, { Room, ROOM_LAYOUT, useNorthStar, SKY });
