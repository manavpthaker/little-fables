/* @ds-bundle: {"format":4,"namespace":"LittleFablesDesignSystem_d603a2","components":[{"name":"Buddy","sourcePath":"components/buddy/Buddy.jsx"},{"name":"AskCard","sourcePath":"components/moments/AskCard.jsx"},{"name":"BreatheCircle","sourcePath":"components/moments/BreatheCircle.jsx"},{"name":"ChoiceCards","sourcePath":"components/moments/ChoiceCards.jsx"},{"name":"ParentSurface","sourcePath":"components/parent/ParentSurface.jsx"},{"name":"ParentRow","sourcePath":"components/parent/ParentSurface.jsx"},{"name":"ParentToggle","sourcePath":"components/parent/ParentSurface.jsx"},{"name":"Medallion","sourcePath":"components/progress/Medallion.jsx"},{"name":"ReadingSuns","sourcePath":"components/progress/ReadingSuns.jsx"},{"name":"StarWord","sourcePath":"components/progress/StarWord.jsx"},{"name":"MicButton","sourcePath":"components/reading/ReadingPage.jsx"},{"name":"ReadingPage","sourcePath":"components/reading/ReadingPage.jsx"},{"name":"RecapStrip","sourcePath":"components/recap/RecapStrip.jsx"},{"name":"BookCover","sourcePath":"components/shelf/BookCover.jsx"},{"name":"SpeechBalloon","sourcePath":"components/speech/SpeechBalloon.jsx"},{"name":"Endpaper","sourcePath":"components/transitions/Endpaper.jsx"},{"name":"WritingMoment","sourcePath":"components/writing/WritingMoment.jsx"},{"name":"RoomScene","sourcePath":"ui_kits/home/RoomScene.jsx"}],"sourceHashes":{"assets/lf-filters.js":"4f912ca5d9a7","components/buddy/Buddy.jsx":"484eee748d51","components/moments/AskCard.jsx":"590e98210fab","components/moments/BreatheCircle.jsx":"30e6e068007c","components/moments/ChoiceCards.jsx":"290981cb2956","components/parent/ParentSurface.jsx":"cd74d7b4800b","components/progress/Medallion.jsx":"68b68f6bc744","components/progress/ReadingSuns.jsx":"f07b80a70585","components/progress/StarWord.jsx":"0f79523a70e4","components/reading/ReadingPage.jsx":"64dd4f8200b4","components/recap/RecapStrip.jsx":"d1fe8f9dd9e7","components/shelf/BookCover.jsx":"71f754fce868","components/speech/SpeechBalloon.jsx":"8dc97be2e8e8","components/transitions/Endpaper.jsx":"069f1a54ebd7","components/writing/WritingMoment.jsx":"f21b6ab97cb6","ui_kits/home/Home.jsx":"8b94eb2e8bf2","ui_kits/home/RoomScene.jsx":"b63551bc0316"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.LittleFablesDesignSystem_d603a2 = window.LittleFablesDesignSystem_d603a2 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// assets/lf-filters.js
try { (() => {
/* Little Fables — shared SVG filter defs, injected once per page.
   <script src="assets/lf-filters.js"></script>  (path-relative)
   Provides: #lf-wobble  — hand-drawn wobble for borders/lines (static)
             #lf-wobble-bold — heavier wobble for big edges
             #lf-wash-edge   — watercolor bleed for pigment fields
             #lf-dry         — dry-brush breakup for rules/accents
             #lf-boil        — 2s / 3-frame line boil (skipped when
                               prefers-reduced-motion)                    */
(function () {
  if (document.getElementById("lf-filter-defs")) return;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var boilAnim = reduced ? "" : '<animate attributeName="seed" values="3;7;12" dur="2s" calcMode="discrete" repeatCount="indefinite"/>';
  var svg = '<svg id="lf-filter-defs" width="0" height="0" style="position:absolute" aria-hidden="true">' + '<defs>' + '<filter id="lf-wobble" x="-8%" y="-8%" width="116%" height="116%">' + '<feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="2" seed="3" result="n"/>' + '<feDisplacementMap in="SourceGraphic" in2="n" scale="4.5"/>' + '</filter>' + '<filter id="lf-wobble-bold" x="-12%" y="-12%" width="124%" height="124%">' + '<feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="7" result="n"/>' + '<feDisplacementMap in="SourceGraphic" in2="n" scale="8"/>' + '</filter>' + '<filter id="lf-wash-edge" x="-15%" y="-15%" width="130%" height="130%">' + '<feGaussianBlur in="SourceGraphic" stdDeviation="0.6" result="b"/>' + '<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="9" result="n"/>' + '<feDisplacementMap in="b" in2="n" scale="13"/>' + '</filter>' + '<filter id="lf-dry" x="-15%" y="-40%" width="130%" height="180%">' + '<feTurbulence type="fractalNoise" baseFrequency="0.3 0.05" numOctaves="2" seed="8" result="n"/>' + '<feDisplacementMap in="SourceGraphic" in2="n" scale="5" result="d"/>' + '<feTurbulence type="fractalNoise" baseFrequency="0.14 0.4" numOctaves="2" seed="5" result="m"/>' + '<feColorMatrix in="m" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1.7 -0.3" result="mask"/>' + '<feComposite in="d" in2="mask" operator="in"/>' + '</filter>' + '<filter id="lf-boil" x="-8%" y="-8%" width="116%" height="116%">' + '<feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="2" seed="3" result="n">' + boilAnim + '</feTurbulence>' + '<feDisplacementMap in="SourceGraphic" in2="n" scale="4.5"/>' + '</filter>' + '</defs>' + '</svg>';
  var host = document.createElement("div");
  host.innerHTML = svg;
  var el = host.firstChild;
  function mount() {
    document.body.insertBefore(el, document.body.firstChild);
  }
  if (document.body) mount();else document.addEventListener("DOMContentLoaded", mount);
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/lf-filters.js", error: String((e && e.message) || e) }); }

// components/buddy/Buddy.jsx
try { (() => {
/* Little Fables — the buddy. A small bear drawn in the house style
   (same hand as assets/room/north-star.svg). The app's voice and hands:
   drawn, alive, never pleading. */

const STYLE_ID = "lf-buddy-style";
function ensureBuddyStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = ["@keyframes lf-buddy-breath { from { transform: scale(1,1); } to { transform: scale(1.02, 1.034); } }", "@keyframes lf-buddy-glow { from { opacity: 0.5; } to { opacity: 0.95; } }", ".lf-buddy-breath { animation: lf-buddy-breath var(--motion-breath, 2600ms) ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 50% 96%; }", ".lf-buddy-glow { animation: lf-buddy-glow calc(var(--motion-breath, 2600ms) * 0.9) ease-in-out infinite alternate; }", ".lf-buddy-lean { transform: rotate(-5deg) translateX(-4px); transform-box: fill-box; transform-origin: 50% 92%; }", "@media (prefers-reduced-motion: reduce) { .lf-buddy-breath, .lf-buddy-glow { animation: none; } }"].join("\n");
  document.head.appendChild(el);
}
const FUR = "#C89A5E";
const FUR_DEEP = "#B98A50";
const CREAM = "#F3D9A0";
const INK = "var(--ink, #46362A)";
function Arm({
  side,
  pose
}) {
  // stroke-drawn arms for expressive poses; wash-shape arms for rest
  if (pose === "pointing" && side === "right") {
    return /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
      d: "M154 170 Q 180 150 200 120",
      fill: "none",
      stroke: FUR_DEEP,
      strokeWidth: "17",
      strokeLinecap: "round",
      filter: "url(#lfb-wash)",
      opacity: "0.85"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "202",
      cy: "117",
      r: "10",
      fill: FUR,
      opacity: "0.9",
      filter: "url(#lfb-wash)"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M150 175 Q 178 156 197 124 M160 178 Q 184 162 206 130",
      fill: "none",
      stroke: INK,
      strokeWidth: "2.2",
      filter: "url(#lfb-wob)"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "202",
      cy: "117",
      r: "10",
      fill: "none",
      stroke: INK,
      strokeWidth: "2.2",
      filter: "url(#lfb-wob)"
    }));
  }
  if (pose === "celebrating") {
    const d = side === "left" ? "M86 170 Q 60 142 52 110" : "M154 170 Q 180 142 188 110";
    const px = side === "left" ? 50 : 190,
      py = 106;
    const ink = side === "left" ? "M90 173 Q 64 146 55 113 M81 167 Q 58 138 47 112" : "M150 173 Q 176 146 185 113 M159 167 Q 182 138 193 112";
    return /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
      d: d,
      fill: "none",
      stroke: FUR_DEEP,
      strokeWidth: "17",
      strokeLinecap: "round",
      filter: "url(#lfb-wash)",
      opacity: "0.85"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: px,
      cy: py,
      r: "10",
      fill: FUR,
      opacity: "0.9",
      filter: "url(#lfb-wash)"
    }), /*#__PURE__*/React.createElement("path", {
      d: ink,
      fill: "none",
      stroke: INK,
      strokeWidth: "2.2",
      filter: "url(#lfb-wob)"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: px,
      cy: py,
      r: "10",
      fill: "none",
      stroke: INK,
      strokeWidth: "2.2",
      filter: "url(#lfb-wob)"
    }));
  }
  // resting arm
  if (side === "left") {
    return /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
      d: "M84 165 q -16 18 -6 40 q 8 8 16 2 q -8 -20 -2 -38 z",
      fill: FUR_DEEP,
      opacity: "0.8",
      filter: "url(#lfb-wash)"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M84 165 q -15 18 -6 39 q 8 7 15 2",
      fill: "none",
      stroke: INK,
      strokeWidth: "2.2",
      filter: "url(#lfb-wob)"
    }));
  }
  return /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
    d: "M154 163 q 16 18 8 42 q -8 8 -16 2 q 6 -22 0 -40 z",
    fill: FUR_DEEP,
    opacity: "0.8",
    filter: "url(#lfb-wash)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M154 163 q 15 18 7 41 q -8 7 -15 2",
    fill: "none",
    stroke: INK,
    strokeWidth: "2.2",
    filter: "url(#lfb-wob)"
  }));
}
function Buddy({
  pose = "idle",
  size = 200,
  breathing = true,
  style
}) {
  ensureBuddyStyles();
  const w = Math.round(size * (240 / 260));
  const leanClass = pose === "listening" ? "lf-buddy-lean" : "";
  const breathClass = breathing ? "lf-buddy-breath" : "";
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 240 260",
    width: w,
    height: size,
    style: {
      display: "block",
      overflow: "visible",
      ...style
    },
    role: "img",
    "aria-label": "buddy bear, " + pose
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("filter", {
    id: "lfb-wob",
    x: "-8%",
    y: "-8%",
    width: "116%",
    height: "116%"
  }, /*#__PURE__*/React.createElement("feTurbulence", {
    type: "fractalNoise",
    baseFrequency: "0.018",
    numOctaves: "2",
    seed: "3",
    result: "n"
  }), /*#__PURE__*/React.createElement("feDisplacementMap", {
    in: "SourceGraphic",
    in2: "n",
    scale: "3.4"
  })), /*#__PURE__*/React.createElement("filter", {
    id: "lfb-wash",
    x: "-15%",
    y: "-15%",
    width: "130%",
    height: "130%"
  }, /*#__PURE__*/React.createElement("feGaussianBlur", {
    in: "SourceGraphic",
    stdDeviation: "0.7",
    result: "b"
  }), /*#__PURE__*/React.createElement("feTurbulence", {
    type: "fractalNoise",
    baseFrequency: "0.032",
    numOctaves: "3",
    seed: "9",
    result: "n"
  }), /*#__PURE__*/React.createElement("feDisplacementMap", {
    in: "b",
    in2: "n",
    scale: "11"
  }))), pose === "celebrating" && /*#__PURE__*/React.createElement("g", {
    className: "lf-buddy-glow"
  }, /*#__PURE__*/React.createElement("ellipse", {
    cx: "120",
    cy: "150",
    rx: "105",
    ry: "98",
    fill: "var(--glow-lamplight, rgba(242,196,96,0.55))",
    opacity: "0.7",
    filter: "url(#lfb-wash)"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "52",
    cy: "70",
    r: "3",
    fill: "#EFC85C"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "190",
    cy: "62",
    r: "2.5",
    fill: "#F3C77A"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "120",
    cy: "34",
    r: "3",
    fill: "#EFC85C"
  })), /*#__PURE__*/React.createElement("ellipse", {
    cx: "126",
    cy: "252",
    rx: "62",
    ry: "11",
    fill: "var(--shadow-warm, rgba(91,70,55,0.22))",
    filter: "url(#lfb-wash)"
  }), /*#__PURE__*/React.createElement("g", {
    className: [breathClass, leanClass].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("g", {
    filter: "url(#lfb-wash)"
  }, /*#__PURE__*/React.createElement("ellipse", {
    cx: "84",
    cy: "233",
    rx: "24",
    ry: "15",
    fill: FUR_DEEP,
    opacity: "0.75",
    transform: "rotate(-14 84 233)"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "156",
    cy: "237",
    rx: "24",
    ry: "15",
    fill: FUR_DEEP,
    opacity: "0.75",
    transform: "rotate(10 156 237)"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "78",
    cy: "236",
    rx: "9",
    ry: "7",
    fill: CREAM,
    opacity: "0.9",
    transform: "rotate(-14 78 236)"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "163",
    cy: "240",
    rx: "9",
    ry: "7",
    fill: CREAM,
    opacity: "0.9",
    transform: "rotate(10 163 240)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M80 223 q -10 -52 18 -74 q 22 -16 44 2 q 26 24 14 72 q -38 14 -76 0",
    fill: FUR,
    opacity: "0.85"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "119",
    cy: "195",
    rx: "24",
    ry: "30",
    fill: CREAM,
    opacity: "0.85"
  })), /*#__PURE__*/React.createElement(Arm, {
    side: "left",
    pose: pose
  }), /*#__PURE__*/React.createElement(Arm, {
    side: "right",
    pose: pose
  }), /*#__PURE__*/React.createElement("g", {
    filter: "url(#lfb-wash)"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "118",
    cy: "121",
    r: "35",
    fill: FUR,
    opacity: "0.9"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "92",
    cy: "92",
    r: "11.5",
    fill: FUR,
    opacity: "0.95"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "144",
    cy: "92",
    r: "11.5",
    fill: FUR,
    opacity: "0.95"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "92",
    cy: "93",
    r: "5",
    fill: CREAM,
    opacity: "0.9"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "144",
    cy: "93",
    r: "5",
    fill: CREAM,
    opacity: "0.9"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "118",
    cy: "133",
    rx: "14",
    ry: "10",
    fill: CREAM,
    opacity: "0.95"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M90 97 q -8 14 -4 30 q 2 10 10 16 q -16 -22 -6 -46",
    fill: "#F3C77A",
    opacity: "0.55"
  })), /*#__PURE__*/React.createElement("g", {
    fill: "none",
    stroke: INK,
    strokeWidth: "2.2",
    filter: "url(#lfb-wob)"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M86 219 q -12 -50 16 -71 q 22 -16 44 2 q 26 24 13 69"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "84",
    cy: "233",
    rx: "24",
    ry: "15",
    transform: "rotate(-14 84 233)"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "156",
    cy: "237",
    rx: "24",
    ry: "15",
    transform: "rotate(10 156 237)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M89 141 A 35 35 0 1 1 147 141"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "92",
    cy: "92",
    r: "11.5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "144",
    cy: "92",
    r: "11.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M110 138 q 8 6 16 0",
    strokeWidth: "2"
  })), /*#__PURE__*/React.createElement("ellipse", {
    cx: "118",
    cy: "128",
    rx: "4.5",
    ry: "3.4",
    fill: INK
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "105",
    cy: "117",
    r: "2.7",
    fill: INK
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "131",
    cy: "117",
    r: "2.7",
    fill: INK
  }), /*#__PURE__*/React.createElement("path", {
    d: "M100 129 q 3 2 6 0 M128 129 q 3 2 6 0",
    stroke: "#D95B43",
    strokeWidth: "2",
    opacity: "0.4",
    fill: "none",
    filter: "url(#lfb-wob)"
  })));
}
Object.assign(__ds_scope, { Buddy });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buddy/Buddy.jsx", error: String((e && e.message) || e) }); }

// components/moments/BreatheCircle.jsx
try { (() => {
/* Little Fables — breathe-along circle: an ink circle that swells like
   a wash bloom. The cadence is spoken/breathed by the buddy's voice;
   the circle is the visual anchor. */

const STYLE_ID = "lf-breathe-style";
function ensureBreatheStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = ["@keyframes lf-breathe { 0%, 100% { transform: scale(1); } 45% { transform: scale(1.26); } 60% { transform: scale(1.26); } }", "@keyframes lf-breathe-echo { 0%, 100% { transform: scale(1); opacity: 0.5; } 45% { transform: scale(1.38); opacity: 0.15; } 60% { transform: scale(1.38); opacity: 0.15; } }", ".lf-breathe-main { animation: lf-breathe 5600ms ease-in-out infinite; transform-box: fill-box; transform-origin: center; }", ".lf-breathe-echo { animation: lf-breathe-echo 5600ms ease-in-out infinite; transform-box: fill-box; transform-origin: center; }", "@media (prefers-reduced-motion: reduce) { .lf-breathe-main, .lf-breathe-echo { animation: none; } }"].join("\n");
  document.head.appendChild(el);
}
function BreatheCircle({
  size = 260,
  pigment = "teal",
  running = true,
  style
}) {
  ensureBreatheStyles();
  const color = "var(--pigment-" + pigment + ")";
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 300 300",
    width: size,
    height: size,
    style: {
      display: "block",
      overflow: "visible",
      ...style
    },
    role: "img",
    "aria-label": "breathe along"
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("filter", {
    id: "lf-breathe-wash",
    x: "-25%",
    y: "-25%",
    width: "150%",
    height: "150%"
  }, /*#__PURE__*/React.createElement("feGaussianBlur", {
    in: "SourceGraphic",
    stdDeviation: "1.4",
    result: "b"
  }), /*#__PURE__*/React.createElement("feTurbulence", {
    type: "fractalNoise",
    baseFrequency: "0.03",
    numOctaves: "3",
    seed: "9",
    result: "n"
  }), /*#__PURE__*/React.createElement("feDisplacementMap", {
    in: "b",
    in2: "n",
    scale: "14"
  }))), /*#__PURE__*/React.createElement("g", {
    className: running ? "lf-breathe-echo" : ""
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "150",
    cy: "150",
    r: "96",
    fill: "none",
    stroke: color,
    strokeWidth: "3",
    opacity: "0.45",
    filter: "url(#lf-breathe-wash)"
  })), /*#__PURE__*/React.createElement("g", {
    className: running ? "lf-breathe-main" : ""
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "150",
    cy: "150",
    r: "88",
    fill: color,
    opacity: "0.22",
    filter: "url(#lf-breathe-wash)"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "150",
    cy: "150",
    r: "88",
    fill: color,
    opacity: "0.14",
    filter: "url(#lf-breathe-wash)",
    transform: "scale(0.82)",
    style: {
      transformBox: "fill-box",
      transformOrigin: "center"
    }
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "150",
    cy: "150",
    r: "88",
    fill: "none",
    stroke: "var(--ink)",
    strokeWidth: "2.6",
    filter: "url(#lf-breathe-wash)"
  })));
}
Object.assign(__ds_scope, { BreatheCircle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/moments/BreatheCircle.jsx", error: String((e && e.message) || e) }); }

// components/moments/ChoiceCards.jsx
try { (() => {
/* Little Fables — choice cards: 2–3 drawn objects to pick up.
   Every card is spoken aloud when offered; picking = picking the object up. */

const STYLE_ID = "lf-choice-style";
function ensureChoiceStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = [".lf-choice { transition: transform var(--motion-settle, 260ms) var(--ease-settle, ease), box-shadow var(--motion-settle, 260ms) ease; }", ".lf-choice:hover { transform: translateY(-3px); }", ".lf-choice:active { transform: translateY(1px); }", ".lf-choice-picked { box-shadow: 0 0 30px 6px var(--glow-lamplight) !important; }", "@media (prefers-reduced-motion: reduce) { .lf-choice, .lf-choice:hover, .lf-choice:active { transform: none; } }"].join("\n");
  document.head.appendChild(el);
}
const CHOICE_PIGMENTS = ["sage", "river", "marigold"];
function ChoiceCards({
  choices = [],
  onPick,
  picked,
  size = 168,
  style
}) {
  ensureChoiceStyles();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 24,
      alignItems: "stretch",
      ...style
    }
  }, choices.slice(0, 3).map(function (c, i) {
    const pig = c.pigment || CHOICE_PIGMENTS[i % CHOICE_PIGMENTS.length];
    const isPicked = picked === c.id;
    return /*#__PURE__*/React.createElement("button", {
      key: c.id,
      className: "lf-drawn-border lf-choice" + (isPicked ? " lf-choice-picked" : ""),
      onClick: onPick ? function () {
        onPick(c.id);
      } : undefined,
      "aria-label": c.label + " — say it or tap it",
      "aria-pressed": isPicked,
      style: {
        width: size,
        minHeight: size,
        borderRadius: "18px 22px 20px 21px",
        backgroundColor: "color-mix(in srgb, var(--pigment-" + pig + ") 26%, var(--paper-bright))",
        backgroundImage: "var(--texture-paper)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: 16,
        boxSizing: "border-box",
        color: "var(--ink)",
        boxShadow: "0 5px 18px -10px var(--shadow-color)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        placeItems: "center",
        flex: 1
      }
    }, c.art), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-label, 24px)"
      }
    }, c.label), /*#__PURE__*/React.createElement("svg", {
      width: "18",
      height: "18",
      viewBox: "0 0 26 26",
      "aria-hidden": "true"
    }, /*#__PURE__*/React.createElement("g", {
      fill: "none",
      stroke: "var(--ink-soft)",
      strokeWidth: "2.4",
      strokeLinecap: "round",
      filter: "url(#lf-wobble)"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M4 16 q 3 2 6 0"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M3 11 q 6 4 12 0"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M2 6 q 9 6 18 0"
    })))));
  }));
}
Object.assign(__ds_scope, { ChoiceCards });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/moments/ChoiceCards.jsx", error: String((e && e.message) || e) }); }

// components/parent/ParentSurface.jsx
try { (() => {
/* Little Fables — parent surfaces. The grown-up boundary: quiet neutral
   panels, Inter, plain sentence case. The drawn world does not cross
   this line, and this styling never leaks into the child's room. */

function ParentSurface({
  title,
  children,
  width = 360,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: width,
      backgroundColor: "#FFFFFF",
      border: "1px solid #E4E4E7",
      borderRadius: 10,
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      fontFamily: "var(--font-parent)",
      color: "#18181B",
      overflow: "hidden",
      ...style
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 16px",
      borderBottom: "1px solid #F4F4F5",
      fontSize: 14,
      fontWeight: 600
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 0"
    }
  }, children));
}
function ParentRow({
  label,
  value,
  control
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: "9px 16px",
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#3F3F46"
    }
  }, label), control || /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#71717A",
      fontVariantNumeric: "tabular-nums"
    }
  }, value));
}
function ParentToggle({
  on = false,
  onChange
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onChange ? function () {
      onChange(!on);
    } : undefined,
    "aria-pressed": on,
    style: {
      width: 44,
      height: 24,
      borderRadius: 999,
      background: on ? "#18181B" : "#E4E4E7",
      position: "relative",
      transition: "background 150ms ease",
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 2,
      left: on ? 22 : 2,
      width: 20,
      height: 20,
      borderRadius: "50%",
      background: "#FFFFFF",
      boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
      transition: "left 150ms ease"
    }
  }));
}
Object.assign(__ds_scope, { ParentSurface, ParentRow, ParentToggle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/parent/ParentSurface.jsx", error: String((e && e.message) || e) }); }

// components/progress/Medallion.jsx
try { (() => {
/* Little Fables — a drawn medallion that lives on the shelf.
   Badges accumulate in the room; nothing dims or breaks. */

function Medallion({
  label,
  pigment = "marigold",
  size = 96,
  motif,
  style
}) {
  const color = "var(--pigment-" + pigment + ")";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      ...style
    },
    role: "img",
    "aria-label": "medallion: " + (label || "earned")
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 96 118",
    width: size,
    height: Math.round(size * 1.23),
    style: {
      display: "block",
      overflow: "visible"
    }
  }, /*#__PURE__*/React.createElement("g", {
    filter: "url(#lf-wash-edge)"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M34 4 L30 34 L48 26 L66 34 L62 4 Z",
    fill: color,
    opacity: "0.5"
  })), /*#__PURE__*/React.createElement("path", {
    d: "M34 4 L30 34 M62 4 L66 34 M30 34 L48 26 L66 34",
    fill: "none",
    stroke: "var(--ink)",
    strokeWidth: "1.8",
    filter: "url(#lf-wobble)"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "48",
    cy: "66",
    r: "34",
    fill: color,
    opacity: "0.5",
    filter: "url(#lf-wash-edge)"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "48",
    cy: "66",
    r: "34",
    fill: "none",
    stroke: "var(--ink)",
    strokeWidth: "2.4",
    filter: "url(#lf-wobble)"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "48",
    cy: "66",
    r: "26",
    fill: "none",
    stroke: "var(--ink)",
    strokeWidth: "1.4",
    opacity: "0.6",
    filter: "url(#lf-dry)"
  }), motif ? /*#__PURE__*/React.createElement("foreignObject", {
    x: "26",
    y: "44",
    width: "44",
    height: "44"
  }, motif) : /*#__PURE__*/React.createElement("path", {
    d: "M48 50 l4.6 9.4 10.4 1.1 -7.8 7 2.3 10.2 -9.5 -5.3 -9.5 5.3 2.3 -10.2 -7.8 -7 10.4 -1.1 z",
    fill: "var(--paper-bright)",
    opacity: "0.95",
    stroke: "var(--ink)",
    strokeWidth: "1.8",
    filter: "url(#lf-wobble)"
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-body)",
      fontStyle: "italic",
      fontSize: 18,
      color: "var(--ink-soft)",
      textAlign: "center"
    }
  }, label));
}
Object.assign(__ds_scope, { Medallion });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/progress/Medallion.jsx", error: String((e && e.message) || e) }); }

// components/progress/ReadingSuns.jsx
try { (() => {
/* Little Fables — reading-day suns: drawn suns accumulating on the sill.
   Progress only accumulates; there are no empty slots, nothing pending,
   nothing dims. */

const STYLE_ID = "lf-suns-style";
function ensureSunStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = ["@keyframes lf-sun-glow { from { opacity: 0.35; } to { opacity: 0.8; } }", ".lf-sun-glow { animation: lf-sun-glow var(--motion-breath, 2600ms) ease-in-out infinite alternate; }", "@media (prefers-reduced-motion: reduce) { .lf-sun-glow { animation: none; opacity: 0.6; } }"].join("\n");
  document.head.appendChild(el);
}
function Sun({
  size,
  latest,
  seed
}) {
  const rot = seed * 37 % 14 - 7;
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 64 64",
    width: size,
    height: size,
    style: {
      display: "block",
      overflow: "visible",
      transform: "rotate(" + rot + "deg)"
    }
  }, latest && /*#__PURE__*/React.createElement("circle", {
    className: "lf-sun-glow",
    cx: "32",
    cy: "32",
    r: "27",
    fill: "var(--glow-lamplight)",
    filter: "url(#lf-wash-edge)"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "32",
    cy: "32",
    r: "14",
    fill: "#EFC85C",
    opacity: "0.9",
    filter: "url(#lf-wash-edge)"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "32",
    cy: "32",
    r: "14",
    fill: "#E2A93B",
    opacity: "0.4",
    filter: "url(#lf-wash-edge)"
  }), /*#__PURE__*/React.createElement("g", {
    fill: "none",
    stroke: "var(--ink)",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    filter: "url(#lf-wobble)"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "32",
    cy: "32",
    r: "14"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M32 8 L32 15 M32 49 L32 56 M8 32 L15 32 M49 32 L56 32 M15 15 L20 20 M44 44 L49 49 M49 15 L44 20 M20 44 L15 49"
  })));
}
function ReadingSuns({
  count = 1,
  size = 44,
  sill = true,
  style
}) {
  ensureSunStyles();
  const suns = [];
  for (let i = 0; i < count; i++) suns.push(i);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      flexDirection: "column",
      ...style
    },
    role: "img",
    "aria-label": count + " reading days"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: Math.round(size * 0.28),
      alignItems: "flex-end",
      padding: "6px 10px"
    }
  }, suns.map(function (i) {
    return /*#__PURE__*/React.createElement(Sun, {
      key: i,
      size: size,
      seed: i,
      latest: i === count - 1
    });
  })), sill && /*#__PURE__*/React.createElement("svg", {
    width: "100%",
    height: "14",
    preserveAspectRatio: "none",
    viewBox: "0 0 100 14",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0",
    y: "3",
    width: "100",
    height: "8",
    fill: "#C89A5E",
    opacity: "0.55",
    filter: "url(#lf-wash-edge)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M0 3 L100 3 M1 11 L99 11",
    stroke: "var(--ink)",
    strokeWidth: "1.6",
    fill: "none",
    filter: "url(#lf-wobble)"
  })));
}
Object.assign(__ds_scope, { ReadingSuns });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/progress/ReadingSuns.jsx", error: String((e && e.message) || e) }); }

// components/progress/StarWord.jsx
try { (() => {
/* Little Fables — a star word pinned to the Language Wall, like a postcard. */

function StarWord({
  word,
  pin = "berry",
  rotate = 0,
  width = 132,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: width,
      transform: "rotate(" + rotate + "deg)",
      position: "relative",
      display: "inline-block",
      ...style
    },
    role: "img",
    "aria-label": "star word: " + word
  }, /*#__PURE__*/React.createElement("div", {
    className: "lf-drawn-border",
    style: {
      backgroundColor: "var(--paper-bright)",
      backgroundImage: "var(--texture-paper)",
      borderRadius: "6px 8px 7px 6px",
      padding: "18px 12px 14px",
      textAlign: "center",
      color: "var(--ink)",
      boxShadow: "0 4px 10px -6px var(--shadow-color)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-body)",
      fontStyle: "italic",
      fontSize: "var(--text-label, 24px)"
    }
  }, word)), /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 14 14",
    style: {
      position: "absolute",
      top: -5,
      left: "50%",
      marginLeft: -7
    },
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "7",
    r: "4.6",
    fill: "var(--pigment-" + pin + ")",
    filter: "url(#lf-wobble)"
  })));
}
Object.assign(__ds_scope, { StarWord });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/progress/StarWord.jsx", error: String((e && e.message) || e) }); }

// components/reading/ReadingPage.jsx
try { (() => {
const {
  useEffect,
  useState
} = React;
/* Little Fables — the spread inside a book. Art + text panel on paper.
   Word highlight = warm lamplight glow moving across words (never
   marker-yellow blocks). Mic affordance >=56px, drawn, terracotta when live. */
const STYLE_ID = "lf-reading-style";
function ensureReadingStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = ["@keyframes lf-mic-pulse { from { box-shadow: 0 0 14px 2px var(--glow-lamplight); } to { box-shadow: 0 0 30px 8px var(--glow-lamplight); } }", ".lf-mic-active { animation: lf-mic-pulse 1.6s ease-in-out infinite alternate; }", ".lf-word { border-radius: 8px; padding: 0 3px; margin: 0 -3px; transition: background 220ms ease, text-shadow 220ms ease; }", ".lf-word-lit { background: radial-gradient(ellipse 110% 130% at 50% 55%, var(--glow-lamplight), transparent 78%); text-shadow: 0 0 12px rgba(242, 196, 96, 0.5); }", "@media (prefers-reduced-motion: reduce) { .lf-mic-active { animation: none; box-shadow: 0 0 22px 5px var(--glow-lamplight); } }"].join("\n");
  document.head.appendChild(el);
}
function MicButton({
  active = false,
  onPress,
  size = 64,
  label = "talk to me"
}) {
  ensureReadingStyles();
  return /*#__PURE__*/React.createElement("button", {
    className: "lf-drawn-border" + (active ? " lf-mic-active" : ""),
    onClick: onPress,
    "aria-label": label,
    "aria-pressed": active,
    style: {
      width: size,
      height: size,
      minWidth: 56,
      minHeight: 56,
      borderRadius: "50% 48% 50% 52%",
      backgroundColor: active ? "color-mix(in srgb, var(--accent-action) 42%, var(--paper-bright))" : "var(--paper-bright)",
      backgroundImage: "var(--texture-paper)",
      display: "grid",
      placeItems: "center",
      color: active ? "var(--accent-action-deep)" : "var(--ink)",
      transition: "background-color var(--motion-settle, 260ms) ease"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size * 0.56,
    height: size * 0.56,
    viewBox: "0 0 48 48",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("g", {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.6",
    strokeLinecap: "round",
    filter: "url(#lf-wobble)"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "17",
    y: "6",
    width: "14",
    height: "22",
    rx: "7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M11 24 q 1 12 13 12 q 12 0 13 -12"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M24 36 L24 42"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M17 42 L31 42"
  }))));
}
function ReadingPage({
  art,
  text = "",
  highlightIndex,
  autoHighlight = false,
  highlightMs = 460,
  micActive = false,
  onMic,
  onNext,
  pageLabel,
  width = 1000,
  style
}) {
  ensureReadingStyles();
  const words = text.split(/\s+/).filter(Boolean);
  const [autoIdx, setAutoIdx] = useState(-1);
  useEffect(function () {
    if (!autoHighlight) return undefined;
    if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const t = setInterval(function () {
      setAutoIdx(function (i) {
        return i >= words.length + 2 ? -1 : i + 1;
      });
    }, highlightMs);
    return function () {
      clearInterval(t);
    };
  }, [autoHighlight, highlightMs, words.length]);
  const lit = autoHighlight ? autoIdx : highlightIndex;
  return /*#__PURE__*/React.createElement("div", {
    "data-register": "story",
    style: {
      width: width,
      aspectRatio: "1000 / 640",
      backgroundColor: "var(--paper-bright)",
      backgroundImage: "var(--texture-paper)",
      borderRadius: "var(--radius-page, 22px)",
      boxShadow: "0 8px 30px -14px var(--shadow-warm)",
      display: "grid",
      gridTemplateColumns: "47% 53%",
      position: "relative",
      overflow: "hidden",
      boxSizing: "border-box",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      left: "47%",
      top: 18,
      bottom: 18,
      width: 1,
      background: "linear-gradient(to bottom, transparent, var(--ink-faint) 22%, var(--ink-faint) 78%, transparent)",
      opacity: 0.5
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      placeItems: "center",
      padding: "5%"
    }
  }, art), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: "6% 7% 6% 6%",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-reading, 28px)",
      lineHeight: "var(--leading-reading, 1.52)",
      color: "var(--ink)",
      textWrap: "pretty"
    }
  }, words.map(function (w, i) {
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, /*#__PURE__*/React.createElement("span", {
      className: "lf-word" + (i === lit ? " lf-word-lit" : "")
    }, w), i < words.length - 1 ? " " : "");
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(MicButton, {
    active: micActive,
    onPress: onMic
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), pageLabel && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-body)",
      fontStyle: "italic",
      fontSize: 20,
      color: "var(--ink-faint)"
    }
  }, pageLabel))), onNext && /*#__PURE__*/React.createElement("button", {
    onClick: onNext,
    "aria-label": "turn the page",
    style: {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: 76,
      height: 76,
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "58",
    height: "58",
    viewBox: "0 0 58 58",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M56 2 L56 56 L2 56 Q 40 48 56 2",
    fill: "var(--paper-deep)",
    opacity: "0.85",
    filter: "url(#lf-wash-edge)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M54 6 Q 40 46 6 54",
    fill: "none",
    stroke: "var(--ink)",
    strokeWidth: "2",
    filter: "url(#lf-wobble)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M34 40 l10 -2 -4 9",
    fill: "none",
    stroke: "var(--ink)",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    filter: "url(#lf-wobble)"
  }))));
}
Object.assign(__ds_scope, { MicButton, ReadingPage });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/reading/ReadingPage.jsx", error: String((e && e.message) || e) }); }

// components/moments/AskCard.jsx
try { (() => {
/* Little Fables — the ask card. The buddy poses a spoken question;
   the card shows it and offers the mic (the screen's one terracotta). */

function AskCard({
  question,
  micActive = false,
  onMic,
  width = 420,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "lf-drawn-border",
    style: {
      width: width,
      boxSizing: "border-box",
      backgroundColor: "var(--surface-card)",
      backgroundImage: "var(--texture-paper)",
      borderRadius: "22px 26px 24px 25px",
      padding: "26px 30px 24px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 20,
      color: "var(--ink)",
      boxShadow: "0 6px 22px -12px var(--shadow-color)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      alignSelf: "stretch"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "26",
    height: "26",
    viewBox: "0 0 26 26",
    style: {
      flex: "none",
      marginTop: 6
    },
    "aria-label": "spoken aloud"
  }, /*#__PURE__*/React.createElement("g", {
    fill: "none",
    stroke: "var(--ink-soft)",
    strokeWidth: "2",
    strokeLinecap: "round",
    filter: "url(#lf-wobble)"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M4 16 q 3 2 6 0"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 11 q 6 4 12 0"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 6 q 9 6 18 0"
  }))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-speech, 26px)",
      lineHeight: "var(--leading-speech, 1.35)",
      margin: 0,
      textWrap: "pretty"
    }
  }, question)), /*#__PURE__*/React.createElement(__ds_scope.MicButton, {
    active: micActive,
    onPress: onMic,
    size: 68,
    label: "tell me"
  }));
}
Object.assign(__ds_scope, { AskCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/moments/AskCard.jsx", error: String((e && e.message) || e) }); }

// components/recap/RecapStrip.jsx
try { (() => {
/* Little Fables — recap strip: "Last time…" as three small hand-drawn
   comic panels, one caption each. The comic grammar's home. */

function RecapStrip({
  panels = [],
  panelWidth = 190,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 22,
      alignItems: "flex-start",
      ...style
    }
  }, panels.slice(0, 3).map(function (p, i) {
    return /*#__PURE__*/React.createElement("figure", {
      key: i,
      style: {
        margin: 0,
        width: panelWidth,
        display: "flex",
        flexDirection: "column",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "lf-drawn-border",
      style: {
        height: Math.round(panelWidth * 0.78),
        borderRadius: "10px 13px 11px 12px",
        backgroundColor: "var(--paper-bright)",
        backgroundImage: "var(--texture-paper)",
        display: "grid",
        placeItems: "center",
        color: "var(--ink)",
        boxShadow: "0 4px 12px -8px var(--shadow-color)",
        transform: "rotate(" + (i === 1 ? 0.8 : i === 2 ? -0.5 : -0.9) + "deg)"
      }
    }, p.art), /*#__PURE__*/React.createElement("figcaption", {
      style: {
        fontFamily: "var(--font-body)",
        fontStyle: "italic",
        fontSize: 20,
        lineHeight: 1.3,
        color: "var(--ink-soft)",
        textAlign: "center",
        textWrap: "balance"
      }
    }, p.caption));
  }));
}
Object.assign(__ds_scope, { RecapStrip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/recap/RecapStrip.jsx", error: String((e && e.message) || e) }); }

// components/shelf/BookCover.jsx
try { (() => {
/* Little Fables — face-out book on the shelf. Real cover art framed in a
   drawn cover; progress as a drawn ribbon; the child's own books carry a
   star spine mark; unfinished art shows as pencil sketch. */

const STYLE_ID = "lf-book-style";
function ensureBookStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = ["@keyframes lf-book-beacon { from { box-shadow: 0 0 22px 2px var(--glow-lamplight); } to { box-shadow: 0 0 40px 10px var(--glow-lamplight); } }", ".lf-book-beacon { animation: lf-book-beacon var(--motion-breath, 2600ms) ease-in-out infinite alternate; }", ".lf-book:active { transform: translateY(2px); }", "@media (prefers-reduced-motion: reduce) { .lf-book-beacon { animation: none; box-shadow: 0 0 30px 6px var(--glow-lamplight); } }"].join("\n");
  document.head.appendChild(el);
}
const LIGHT_PIGMENTS = ["marigold", "butter"];
function BookCover({
  title,
  pigment = "river",
  width = 150,
  art,
  progress,
  authored = false,
  sketch = false,
  beacon = false,
  onOpen,
  style
}) {
  ensureBookStyles();
  const height = Math.round(width * 1.38);
  const dark = !LIGHT_PIGMENTS.includes(pigment) && !sketch;
  const titleColor = sketch ? "var(--ink)" : dark ? "#F9F2E3" : "var(--ink)";
  const bg = sketch ? "var(--paper-bright)" : "color-mix(in srgb, var(--pigment-" + pigment + ") 58%, var(--paper-bright))";
  const ribbonH = progress != null ? Math.max(0.12, Math.min(progress, 1)) * height * 0.72 : 0;
  return /*#__PURE__*/React.createElement("div", {
    className: "lf-book lf-drawn-border" + (beacon ? " lf-book-beacon lf-drawn-border--bold" : ""),
    role: onOpen ? "button" : undefined,
    "aria-label": onOpen ? "open " + title : title,
    tabIndex: onOpen ? 0 : undefined,
    onClick: onOpen,
    onKeyDown: onOpen ? function (e) {
      if (e.key === "Enter" || e.key === " ") onOpen(e);
    } : undefined,
    style: {
      width: width,
      height: height,
      borderRadius: "6px 8px 7px 6px",
      backgroundColor: bg,
      backgroundImage: "var(--texture-paper)",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
      padding: Math.round(width * 0.08),
      cursor: onOpen ? "pointer" : "default",
      color: "var(--ink)",
      boxShadow: beacon ? undefined : "0 4px 14px -7px var(--shadow-color)",
      transition: "transform var(--motion-settle, 260ms) var(--ease-settle, ease)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: Math.max(13, Math.round(width * 0.105)),
      lineHeight: 1.18,
      textAlign: "center",
      color: titleColor,
      textWrap: "balance"
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "grid",
      placeItems: "center",
      filter: sketch ? "grayscale(0.9) opacity(0.55)" : undefined
    }
  }, art), sketch && /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 100 138",
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none"
    },
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M8 130 l10 -10 M14 132 l12 -12 M78 14 l12 -6 M80 20 l14 -8",
    stroke: "var(--ink-faint)",
    strokeWidth: "1.3",
    fill: "none",
    filter: "url(#lf-dry)"
  })), progress != null && /*#__PURE__*/React.createElement("svg", {
    width: Math.round(width * 0.15),
    height: ribbonH + 12,
    viewBox: "0 0 22 " + (ribbonH + 12),
    style: {
      position: "absolute",
      top: -5,
      right: Math.round(width * 0.1),
      overflow: "visible"
    },
    "aria-label": "progress " + Math.round((progress || 0) * 100) + "%"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2 2 L20 2 L20 " + ribbonH + " L11 " + (ribbonH - 8) + " L2 " + ribbonH + " Z",
    fill: "var(--accent-action)",
    opacity: "0.85",
    filter: "url(#lf-wash-edge)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 2 L20 2 L20 " + ribbonH + " L11 " + (ribbonH - 8) + " L2 " + ribbonH + " Z",
    fill: "none",
    stroke: "var(--ink)",
    strokeWidth: "1.6",
    filter: "url(#lf-wobble)"
  })), authored && /*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "22",
    viewBox: "0 0 22 22",
    style: {
      position: "absolute",
      top: 7,
      left: 7
    },
    "aria-label": "made by the child"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M11 1.5 l2.6 5.4 5.9 .6 -4.4 4 1.3 5.8 -5.4 -3 -5.4 3 1.3 -5.8 -4.4 -4 5.9 -.6 z",
    fill: "var(--accent-action)",
    opacity: "0.9",
    filter: "url(#lf-wobble)"
  })));
}
Object.assign(__ds_scope, { BookCover });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/shelf/BookCover.jsx", error: String((e && e.message) || e) }); }

// components/speech/SpeechBalloon.jsx
try { (() => {
/* Little Fables — hand-drawn speech balloon for buddy speech.
   The balloon appears WITH a spoken line; on-screen text is atmosphere,
   audio carries the meaning. */

const STYLE_ID = "lf-speech-style";
function ensureSpeechStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = ["@keyframes lf-balloon-in { from { transform: scale(0.94) rotate(-1.2deg); opacity: 0; } to { transform: scale(1) rotate(0deg); opacity: 1; } }", "@keyframes lf-balloon-rock { 0%, 100% { transform: rotate(-0.7deg); } 50% { transform: rotate(0.8deg); } }", "@keyframes lf-speak-arc { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.9; } }", ".lf-balloon-calm { animation: lf-balloon-in var(--motion-settle, 260ms) var(--ease-settle, cubic-bezier(0.22,1,0.36,1)) both; }", ".lf-balloon-bouncy { animation: lf-balloon-in 340ms cubic-bezier(0.34, 1.45, 0.44, 1) both; }", ".lf-balloon-rock { animation: lf-balloon-rock 2.8s ease-in-out infinite; }", ".lf-speak-arc { animation: lf-speak-arc 1.4s ease-in-out infinite; }", "@media (prefers-reduced-motion: reduce) { .lf-balloon-calm, .lf-balloon-bouncy, .lf-balloon-rock, .lf-speak-arc { animation: none; opacity: 1; } }"].join("\n");
  document.head.appendChild(el);
}
function SpeechBalloon({
  children,
  variant = "calm",
  tail = "left",
  speaking = false,
  maxWidth = 360,
  style
}) {
  ensureSpeechStyles();
  const rockClass = variant === "bouncy" ? "lf-balloon-rock" : "";
  const inClass = variant === "bouncy" ? "lf-balloon-bouncy" : "lf-balloon-calm";
  const tailLeft = tail !== "right";
  return /*#__PURE__*/React.createElement("div", {
    className: inClass,
    style: {
      position: "relative",
      display: "inline-block",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lf-drawn-border " + rockClass,
    style: {
      backgroundColor: "var(--surface-card)",
      backgroundImage: "var(--texture-paper)",
      borderRadius: "20px 26px 22px 25px",
      padding: "16px 24px",
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-speech, 26px)",
      lineHeight: "var(--leading-speech, 1.35)",
      color: "var(--ink)",
      maxWidth: maxWidth,
      boxShadow: "0 4px 16px -8px var(--shadow-color)"
    }
  }, children), tail !== "none" && /*#__PURE__*/React.createElement("svg", {
    width: "44",
    height: "30",
    viewBox: "0 0 44 30",
    style: {
      position: "absolute",
      bottom: -24,
      left: tailLeft ? 36 : "auto",
      right: tailLeft ? "auto" : 36,
      transform: tailLeft ? "none" : "scaleX(-1)",
      overflow: "visible"
    },
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 1 Q 14 14 4 26 Q 22 20 34 2 Z",
    fill: "var(--surface-card)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 3 Q 14 14 4 26 M4 26 Q 22 20 34 4",
    fill: "none",
    stroke: "var(--ink)",
    strokeWidth: "2",
    strokeLinecap: "round",
    filter: "url(#lf-wobble)"
  }), speaking && /*#__PURE__*/React.createElement("g", {
    fill: "none",
    stroke: "var(--ink-soft)",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    className: "lf-speak-arc",
    d: "M6 30 q 4 3 8 0",
    style: {
      animationDelay: "0ms"
    }
  }), /*#__PURE__*/React.createElement("path", {
    className: "lf-speak-arc",
    d: "M3 34 q 7 5 14 0",
    style: {
      animationDelay: "220ms"
    }
  }), /*#__PURE__*/React.createElement("path", {
    className: "lf-speak-arc",
    d: "M0 38 q 10 7 20 0",
    style: {
      animationDelay: "440ms"
    }
  }))));
}
Object.assign(__ds_scope, { SpeechBalloon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/speech/SpeechBalloon.jsx", error: String((e && e.message) || e) }); }

// components/transitions/Endpaper.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Little Fables — endpaper: a wash-color field with a tiny motif.
   The open/close beat of every book, and the app's ONLY loading state.
   There is no spinner anywhere. */

const STYLE_ID = "lf-endpaper-style";
function ensureEndpaperStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = ["@keyframes lf-endpaper-bloom { from { transform: scale(1); opacity: 0.85; } to { transform: scale(1.12); opacity: 1; } }", ".lf-endpaper-bloom { animation: lf-endpaper-bloom var(--motion-breath, 2600ms) ease-in-out infinite alternate; transform-box: fill-box; transform-origin: center; }", "@media (prefers-reduced-motion: reduce) { .lf-endpaper-bloom { animation: none; } }"].join("\n");
  document.head.appendChild(el);
}
function Motif({
  kind
}) {
  const stroke = {
    fill: "none",
    stroke: "#F9F2E3",
    strokeWidth: 2.6,
    strokeLinecap: "round",
    filter: "url(#lf-endpaper-wob)"
  };
  if (kind === "moon") {
    return /*#__PURE__*/React.createElement("path", _extends({
      d: "M56 24 a 24 24 0 1 0 16 40 a 19 19 0 0 1 -16 -40"
    }, stroke));
  }
  if (kind === "leaf") {
    return /*#__PURE__*/React.createElement("g", stroke, /*#__PURE__*/React.createElement("path", {
      d: "M50 22 q 26 14 2 56 q -26 -14 -2 -56 z"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M51 30 L51 70",
      strokeWidth: "1.8"
    }));
  }
  if (kind === "boat") {
    return /*#__PURE__*/React.createElement("g", stroke, /*#__PURE__*/React.createElement("path", {
      d: "M26 58 q 24 10 48 0 l -6 14 q -18 6 -36 0 z"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M50 54 L50 26 q 10 8 0 14"
    }));
  }
  return /*#__PURE__*/React.createElement("path", _extends({
    d: "M50 22 l7 14.6 16 1.7 -12 10.8 3.4 15.9 -14.4 -8.1 -14.4 8.1 3.4 -15.9 -12 -10.8 16 -1.7 z"
  }, stroke));
}
function Endpaper({
  pigment = "plum",
  motif = "star",
  loading = false,
  children,
  style
}) {
  ensureEndpaperStyles();
  const color = "var(--pigment-" + pigment + ")";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "grid",
      placeItems: "center",
      backgroundColor: "color-mix(in srgb, " + color + " 78%, var(--paper-deep))",
      backgroundImage: "var(--texture-paper)",
      overflow: "hidden",
      width: "100%",
      height: "100%",
      minHeight: 120,
      ...style
    },
    role: loading ? "status" : undefined,
    "aria-label": loading ? "the next page is being painted" : undefined
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      inset: "-12%",
      background: "radial-gradient(ellipse 88% 78% at 50% 46%, transparent 58%, color-mix(in srgb, " + color + " 55%, #2A2233) 130%)",
      opacity: 0.55,
      filter: "url(#lf-wash-edge)"
    }
  }), /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 100 100",
    width: "110",
    height: "110",
    style: {
      position: "relative",
      overflow: "visible"
    },
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("filter", {
    id: "lf-endpaper-wob",
    x: "-10%",
    y: "-10%",
    width: "120%",
    height: "120%"
  }, /*#__PURE__*/React.createElement("feTurbulence", {
    type: "fractalNoise",
    baseFrequency: "0.02",
    numOctaves: "2",
    seed: "5",
    result: "n"
  }), /*#__PURE__*/React.createElement("feDisplacementMap", {
    in: "SourceGraphic",
    in2: "n",
    scale: "3.6"
  }))), /*#__PURE__*/React.createElement("g", {
    className: loading ? "lf-endpaper-bloom" : "",
    opacity: "0.9"
  }, /*#__PURE__*/React.createElement(Motif, {
    kind: motif
  }))), children);
}
Object.assign(__ds_scope, { Endpaper });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/transitions/Endpaper.jsx", error: String((e && e.message) || e) }); }

// components/writing/WritingMoment.jsx
try { (() => {
/* Little Fables — the writing moment: the generation-wait scene.
   A little open book on the buddy's table; the child's own words appear
   in watercolor handwriting. This is the ONE place hand-drawn text is
   allowed — they are his words, not UI. */

const STYLE_ID = "lf-writing-style";
function ensureWritingStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = ["@keyframes lf-word-in { from { opacity: 0; filter: blur(4px); transform: translateY(4px); } 60% { opacity: 1; filter: blur(0.6px); } to { opacity: 1; filter: blur(0); transform: translateY(0); } }", ".lf-word-in { animation: lf-word-in 900ms var(--ease-settle, ease) both; }", "@media (prefers-reduced-motion: reduce) { .lf-word-in { animation: none; opacity: 1; } }"].join("\n");
  document.head.appendChild(el);
}
function WritingMoment({
  words = "",
  inkPigment = "river",
  width = 460,
  wordMs = 650,
  style
}) {
  ensureWritingStyles();
  const list = words.split(/\s+/).filter(Boolean);
  const h = Math.round(width * 0.62);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: width,
      position: "relative",
      ...style
    },
    role: "img",
    "aria-label": "his words being written: " + words
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 460 285",
    width: width,
    height: h,
    style: {
      display: "block",
      overflow: "visible"
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("filter", {
    id: "lf-writing-wash",
    x: "-15%",
    y: "-15%",
    width: "130%",
    height: "130%"
  }, /*#__PURE__*/React.createElement("feGaussianBlur", {
    in: "SourceGraphic",
    stdDeviation: "0.7",
    result: "b"
  }), /*#__PURE__*/React.createElement("feTurbulence", {
    type: "fractalNoise",
    baseFrequency: "0.032",
    numOctaves: "3",
    seed: "9",
    result: "n"
  }), /*#__PURE__*/React.createElement("feDisplacementMap", {
    in: "b",
    in2: "n",
    scale: "11"
  })), /*#__PURE__*/React.createElement("filter", {
    id: "lf-writing-wob",
    x: "-8%",
    y: "-8%",
    width: "116%",
    height: "116%"
  }, /*#__PURE__*/React.createElement("feTurbulence", {
    type: "fractalNoise",
    baseFrequency: "0.018",
    numOctaves: "2",
    seed: "3",
    result: "n"
  }), /*#__PURE__*/React.createElement("feDisplacementMap", {
    in: "SourceGraphic",
    in2: "n",
    scale: "3.4"
  }))), /*#__PURE__*/React.createElement("g", {
    filter: "url(#lf-writing-wash)"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "20",
    y: "212",
    width: "420",
    height: "16",
    rx: "4",
    fill: "#C89A5E",
    opacity: "0.65"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M52 228 l-8 52 h12 l8 -52 z M408 228 l8 50 h-12 l-8 -50 z",
    fill: "#B98A50",
    opacity: "0.6"
  })), /*#__PURE__*/React.createElement("g", {
    fill: "none",
    stroke: "var(--ink)",
    filter: "url(#lf-writing-wob)"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "20",
    y: "212",
    width: "420",
    height: "16",
    rx: "4",
    strokeWidth: "2.4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M52 228 l-8 52 M64 228 l-8 50 M408 228 l8 52 M396 228 l8 50",
    strokeWidth: "2.2"
  })), /*#__PURE__*/React.createElement("g", {
    transform: "translate(90 96)"
  }, /*#__PURE__*/React.createElement("g", {
    filter: "url(#lf-writing-wash)"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M0 46 q 70 -30 138 -12 l0 74 q -66 -18 -138 12 z",
    fill: "var(--paper-bright)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M276 46 q -70 -30 -138 -12 l0 74 q 66 -18 138 12 z",
    fill: "var(--paper-bright)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M0 46 l0 74 q 72 -30 138 -12 q 66 -18 138 12 l0 -74 l-6 4 l0 62 q -64 -14 -132 10 q -68 -24 -132 -10 l0 -62 z",
    fill: "var(--paper-deep)",
    opacity: "0.7"
  })), /*#__PURE__*/React.createElement("g", {
    fill: "none",
    stroke: "var(--ink)",
    filter: "url(#lf-writing-wob)"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M0 46 q 70 -30 138 -12 q 68 -18 138 12 M0 46 l0 74 q 72 -30 138 -12 q 66 -18 138 12 l0 -74 M138 34 l0 74",
    strokeWidth: "2.2"
  }))), /*#__PURE__*/React.createElement("g", {
    transform: "translate(320 190) rotate(14)"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M0 0 L58 0",
    stroke: "#E2A93B",
    strokeWidth: "7",
    strokeLinecap: "round",
    filter: "url(#lf-writing-wash)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M58 0 l12 3 l-12 4",
    fill: "#F3D9A0",
    filter: "url(#lf-writing-wash)"
  }), /*#__PURE__*/React.createElement("g", {
    fill: "none",
    stroke: "var(--ink)",
    strokeWidth: "1.8",
    filter: "url(#lf-writing-wob)"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M0 -3 L58 -3 M0 5 L58 5 M58 -3 l14 6.5 l-14 6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M68 2 l4 1.6",
    strokeWidth: "2.4"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "24%",
      top: "39%",
      width: "52%",
      textAlign: "center",
      transform: "rotate(-2deg)",
      fontFamily: "Caveat, cursive",
      fontSize: Math.max(22, Math.round(width * 0.062)),
      lineHeight: 1.25,
      color: "color-mix(in srgb, var(--pigment-" + inkPigment + ") 82%, var(--ink))",
      textShadow: "0 0 6px color-mix(in srgb, var(--pigment-" + inkPigment + ") 30%, transparent)"
    }
  }, list.map(function (w, i) {
    return /*#__PURE__*/React.createElement("span", {
      key: i,
      className: "lf-word-in",
      style: {
        animationDelay: i * wordMs + "ms",
        display: "inline-block",
        marginRight: "0.28em"
      }
    }, w);
  })));
}
Object.assign(__ds_scope, { WritingMoment });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/writing/WritingMoment.jsx", error: String((e && e.message) || e) }); }

// ui_kits/home/Home.jsx
try { (() => {
/* Little Fables — Home (the acceptance test).
   The north-star room as the actual Home screen with real UI applied. */

const NS = window.LittleFablesDesignSystem_d603a2;
const {
  Buddy,
  SpeechBalloon,
  ReadingPage,
  ReadingSuns,
  Endpaper
} = NS;
const RoomScene = window.RoomScene;

/* ---------- story + shelf data (scene coordinates, 1180×820) ---------- */

function BridgeArt() {
  return /*#__PURE__*/React.createElement("svg", {
    width: "100%",
    viewBox: "0 0 300 220",
    style: {
      maxWidth: 340
    }
  }, /*#__PURE__*/React.createElement("ellipse", {
    cx: "150",
    cy: "196",
    rx: "120",
    ry: "12",
    fill: "var(--shadow-cool)",
    filter: "url(#lf-wash-edge)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M30 150 Q 150 90 270 150",
    fill: "none",
    stroke: "#C89A5E",
    strokeWidth: "16",
    opacity: "0.75",
    filter: "url(#lf-wash-edge)"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "150",
    cy: "120",
    rx: "26",
    ry: "18",
    fill: "#E2A93B",
    opacity: "0.9",
    filter: "url(#lf-wash-edge)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M168 112 q 12 -8 16 -2 q -4 8 -14 8",
    fill: "#E2A93B",
    opacity: "0.85",
    filter: "url(#lf-wash-edge)"
  }), /*#__PURE__*/React.createElement("g", {
    fill: "none",
    stroke: "var(--ink)",
    filter: "url(#lf-wobble)"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M30 150 Q 150 90 270 150",
    strokeWidth: "2.2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M36 128 L36 172 M264 128 L264 172",
    strokeWidth: "2.6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M62 138 l0 10 M92 128 l0 10 M122 121 l0 10 M150 118 l0 10 M180 121 l0 10 M210 128 l0 10 M240 137 l0 10",
    strokeWidth: "1.6"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "150",
    cy: "120",
    rx: "26",
    ry: "18",
    strokeWidth: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M138 110 q -3 -8 4 -10 M158 108 q 2 -8 -4 -10",
    strokeWidth: "1.8"
  })), /*#__PURE__*/React.createElement("circle", {
    cx: "142",
    cy: "116",
    r: "1.8",
    fill: "var(--ink)"
  }));
}
function WindArt() {
  return /*#__PURE__*/React.createElement("svg", {
    width: "100%",
    viewBox: "0 0 300 220",
    style: {
      maxWidth: 340
    }
  }, /*#__PURE__*/React.createElement("g", {
    fill: "none",
    stroke: "var(--ink-soft)",
    strokeWidth: "3",
    strokeLinecap: "round",
    filter: "url(#lf-wobble)"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M30 70 q 40 -26 76 0 q -22 18 -48 9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M90 130 q 50 -30 94 0 q -26 22 -62 11"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M170 62 q 36 -22 66 0"
  })), /*#__PURE__*/React.createElement("ellipse", {
    cx: "76",
    cy: "172",
    rx: "22",
    ry: "15",
    fill: "#E2A93B",
    opacity: "0.9",
    filter: "url(#lf-wash-edge)"
  }), /*#__PURE__*/React.createElement("g", {
    fill: "none",
    stroke: "var(--ink)",
    strokeWidth: "2",
    filter: "url(#lf-wobble)"
  }, /*#__PURE__*/React.createElement("ellipse", {
    cx: "76",
    cy: "172",
    rx: "22",
    ry: "15"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M92 164 q 10 -6 14 -2",
    strokeWidth: "1.8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M60 150 L60 132 M84 148 L86 132",
    strokeWidth: "1.6"
  })), /*#__PURE__*/React.createElement("circle", {
    cx: "70",
    cy: "168",
    r: "2",
    fill: "var(--ink)"
  }));
}
function StepsArt() {
  return /*#__PURE__*/React.createElement("svg", {
    width: "100%",
    viewBox: "0 0 300 220",
    style: {
      maxWidth: 340
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M20 180 q 70 -12 120 -40 q 60 -34 140 -44",
    fill: "none",
    stroke: "#C89A5E",
    strokeWidth: "14",
    opacity: "0.7",
    filter: "url(#lf-wash-edge)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M20 180 q 70 -12 120 -40 q 60 -34 140 -44",
    fill: "none",
    stroke: "var(--ink)",
    strokeWidth: "2",
    filter: "url(#lf-wobble)"
  }), /*#__PURE__*/React.createElement("g", {
    fill: "#E2A93B",
    opacity: "0.95"
  }, /*#__PURE__*/React.createElement("ellipse", {
    cx: "80",
    cy: "160",
    rx: "9",
    ry: "6",
    filter: "url(#lf-wash-edge)"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "130",
    cy: "138",
    rx: "9",
    ry: "6",
    filter: "url(#lf-wash-edge)"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "180",
    cy: "112",
    rx: "9",
    ry: "6",
    filter: "url(#lf-wash-edge)"
  })), /*#__PURE__*/React.createElement("path", {
    d: "M226 78 q 16 -12 30 -4 q -2 12 -18 14 q 10 2 20 -2",
    fill: "#7C9A62",
    opacity: "0.7",
    filter: "url(#lf-wash-edge)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M238 96 l4.6 9.4 10.4 1.1 -7.8 7 2.3 10.2 -9.5 -5.3 -9.5 5.3 2.3 -10.2 -7.8 -7 10.4 -1.1 z",
    fill: "#EFC85C",
    filter: "url(#lf-wobble)"
  }));
}
const BOOKS = {
  miko: {
    title: "Miko and the Wobbly Bridge",
    rect: {
      left: 826,
      top: 338,
      width: 82,
      height: 114
    },
    pigment: "river",
    motif: "boat",
    pages: [{
      text: "The bridge swung under Miko's paws. It felt wobbly, like a boat made of rope.",
      art: BridgeArt
    }, {
      text: "The wind hummed in the ropes. Miko held on tight and listened.",
      art: WindArt
    }, {
      text: "One small step. Then another. The other side was closer than it looked.",
      art: StepsArt
    }]
  },
  moose: {
    title: "The Moose Who Knew About Bigness",
    rect: {
      left: 920,
      top: 336,
      width: 82,
      height: 116
    },
    pigment: "sage",
    motif: "leaf",
    pages: [{
      text: "Bigness is not how tall you are, said the moose. It is how much sky you can love.",
      art: WindArt
    }]
  },
  papa: {
    title: "Papa Gets the Moon",
    rect: {
      left: 1014,
      top: 338,
      width: 82,
      height: 114
    },
    pigment: "plum",
    motif: "moon",
    pages: [{
      text: "Papa climbed and climbed. The moon was patient. Moons usually are.",
      art: StepsArt
    }]
  },
  boat: {
    title: "A Boat of Leaves",
    rect: {
      left: 830,
      top: 482,
      width: 82,
      height: 112
    },
    pigment: "teal",
    motif: "boat",
    pages: [{
      text: "One leaf. Two leaves. A whole boat of leaves, waiting for a puddle big enough.",
      art: BridgeArt
    }]
  },
  snail: {
    title: "The Quiet Snail",
    rect: {
      left: 922,
      top: 480,
      width: 82,
      height: 114
    },
    pigment: "marigold",
    motif: "leaf",
    pages: [{
      text: "The snail said nothing at all. The garden said everything for him.",
      art: WindArt
    }]
  },
  azad: {
    title: "Azad's Bird Book",
    rect: {
      left: 1016,
      top: 482,
      width: 82,
      height: 112
    },
    pigment: "butter",
    motif: "star",
    pages: [{
      text: "The bird flew over my house and waved with one wing. I waved back with one hand.",
      art: StepsArt
    }]
  }
};
const SPEECH_LINES = [{
  text: "Shall we see what Miko does next?",
  pose: "idle"
}, {
  text: "The wobbly bridge is waiting for us.",
  pose: "pointing"
}, {
  text: "You have four suns already.",
  pose: "celebrating"
}, {
  text: "Or we could just sit a while.",
  pose: "idle"
}];

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
      requestAnimationFrame(function () {
        setExpanded(true);
      });
    });
    setTimeout(function () {
      setView("reading");
    }, 950);
  }
  function closeBook() {
    setView("closing");
    setExpanded(false);
    setTimeout(function () {
      setView("room");
      setBookId(null);
    }, 950);
  }
  const overlayActive = view !== "room";
  const endpaperStyle = book ? expanded ? {
    left: 0,
    top: 0,
    width: 1180,
    height: 820,
    borderRadius: 0
  } : {
    left: book.rect.left,
    top: book.rect.top,
    width: book.rect.width,
    height: book.rect.height,
    borderRadius: 6
  } : null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "Home \u2014 the room",
    style: {
      position: "absolute",
      inset: 0
    },
    "aria-hidden": overlayActive
  }, /*#__PURE__*/React.createElement(RoomScene, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 313,
      top: 444
    }
  }, /*#__PURE__*/React.createElement(Buddy, {
    pose: line.pose,
    size: 258
  })), /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      setLineIdx(lineIdx + 1);
    },
    "aria-label": "the buddy \u2014 hear another idea",
    style: {
      position: "absolute",
      left: 360,
      top: 480,
      width: 180,
      height: 250,
      cursor: "pointer",
      borderRadius: 30
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 470,
      top: 372,
      maxWidth: 400
    }
  }, /*#__PURE__*/React.createElement(SpeechBalloon, {
    speaking: true,
    tail: "left",
    maxWidth: 330,
    key: lineIdx
  }, line.text)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 186,
      top: 382
    }
  }, /*#__PURE__*/React.createElement(ReadingSuns, {
    count: 4,
    size: 32,
    sill: false
  })), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    className: "lf-home-beacon",
    style: {
      position: "absolute",
      left: BOOKS.miko.rect.left - 2,
      top: BOOKS.miko.rect.top - 2,
      width: BOOKS.miko.rect.width + 4,
      height: BOOKS.miko.rect.height + 4,
      borderRadius: 8,
      pointerEvents: "none"
    }
  }), Object.keys(BOOKS).map(function (id) {
    const r = BOOKS[id].rect;
    return /*#__PURE__*/React.createElement("button", {
      key: id,
      onClick: function () {
        openBook(id);
      },
      "aria-label": "open " + BOOKS[id].title,
      style: {
        position: "absolute",
        left: r.left - 6,
        top: r.top - 6,
        width: r.width + 12,
        height: r.height + 12,
        borderRadius: 10,
        cursor: "pointer"
      }
    });
  }))), overlayActive && book && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0
    },
    "data-screen-label": "Reading — " + book.title
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      overflow: "hidden",
      boxShadow: "0 10px 40px -12px var(--shadow-warm)",
      transition: "left var(--motion-endpaper, 900ms) var(--ease-drawn), top var(--motion-endpaper, 900ms) var(--ease-drawn), width var(--motion-endpaper, 900ms) var(--ease-drawn), height var(--motion-endpaper, 900ms) var(--ease-drawn), border-radius var(--motion-endpaper, 900ms) var(--ease-drawn)",
      ...endpaperStyle
    }
  }, /*#__PURE__*/React.createElement(Endpaper, {
    pigment: book.pigment,
    motif: book.motif,
    loading: view !== "reading",
    style: {
      position: "absolute",
      inset: 0
    }
  }), view === "reading" && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      width: book.pages.length * 1180,
      transform: "translateX(" + -pageIdx * 1180 + "px)",
      transition: "transform var(--motion-kamishibai, 520ms) var(--ease-slide)"
    }
  }, book.pages.map(function (p, i) {
    const Art = p.art;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        width: 1180,
        height: 820,
        flex: "none",
        display: "grid",
        placeItems: "center"
      }
    }, /*#__PURE__*/React.createElement(ReadingPage, {
      width: 960,
      art: /*#__PURE__*/React.createElement(Art, null),
      text: p.text,
      autoHighlight: i === pageIdx,
      micActive: micOn && i === pageIdx,
      onMic: function () {
        setMicOn(!micOn);
      },
      onNext: i < book.pages.length - 1 ? function () {
        setPageIdx(i + 1);
        setMicOn(false);
      } : undefined,
      pageLabel: "page " + (i + 1)
    }));
  })), /*#__PURE__*/React.createElement("button", {
    onClick: closeBook,
    "aria-label": "put the book back on the shelf",
    className: "lf-drawn-border",
    style: {
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
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "30",
    height: "30",
    viewBox: "0 0 30 30",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("g", {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.6",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    filter: "url(#lf-wobble)"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M19 4 L7 15 L19 26"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 30,
      left: 0,
      right: 0,
      textAlign: "center",
      fontFamily: "var(--font-display)",
      fontSize: 26,
      color: "rgba(249,242,227,0.85)",
      pointerEvents: "none"
    }
  }, book.title)))));
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
    return function () {
      window.removeEventListener("resize", fit);
    };
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "lf-paper",
    style: {
      position: "fixed",
      inset: 0,
      display: "grid",
      placeItems: "center",
      backgroundColor: "var(--paper-deep)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1180,
      height: 820,
      position: "relative",
      flex: "none",
      transform: "scale(" + scale + ")",
      transformOrigin: "center"
    }
  }, /*#__PURE__*/React.createElement(Home, null)));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(Stage, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/home/Home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/home/RoomScene.jsx
try { (() => {
const {
  useEffect,
  useRef,
  useState
} = React;
/* The room — inlines assets/room/north-star.svg as the living background.
   Children render in the same 1180×820 coordinate space on top. */
function RoomScene({
  children,
  hideBuddy = true,
  hideWords = false
}) {
  const [svg, setSvg] = useState(null);
  const ref = useRef(null);
  useEffect(function () {
    fetch("../../assets/room/north-star.svg").then(function (r) {
      return r.text();
    }).then(setSvg);
  }, []);
  useEffect(function () {
    if (!svg || !ref.current) return;
    const root = ref.current;
    const b = root.querySelector("#ns-buddy");
    if (b) b.style.display = hideBuddy ? "none" : "";
    const w = root.querySelector("#ns-words");
    if (w) w.style.display = hideWords ? "none" : "";
    const s = root.querySelector("svg");
    if (s) {
      s.style.width = "100%";
      s.style.height = "100%";
      s.style.display = "block";
    }
  }, [svg, hideBuddy, hideWords]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      position: "absolute",
      inset: 0
    },
    dangerouslySetInnerHTML: {
      __html: svg || ""
    }
  }), children);
}
window.RoomScene = RoomScene;
Object.assign(__ds_scope, { RoomScene });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/home/RoomScene.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Buddy = __ds_scope.Buddy;

__ds_ns.AskCard = __ds_scope.AskCard;

__ds_ns.BreatheCircle = __ds_scope.BreatheCircle;

__ds_ns.ChoiceCards = __ds_scope.ChoiceCards;

__ds_ns.ParentSurface = __ds_scope.ParentSurface;

__ds_ns.ParentRow = __ds_scope.ParentRow;

__ds_ns.ParentToggle = __ds_scope.ParentToggle;

__ds_ns.Medallion = __ds_scope.Medallion;

__ds_ns.ReadingSuns = __ds_scope.ReadingSuns;

__ds_ns.StarWord = __ds_scope.StarWord;

__ds_ns.MicButton = __ds_scope.MicButton;

__ds_ns.ReadingPage = __ds_scope.ReadingPage;

__ds_ns.RecapStrip = __ds_scope.RecapStrip;

__ds_ns.BookCover = __ds_scope.BookCover;

__ds_ns.SpeechBalloon = __ds_scope.SpeechBalloon;

__ds_ns.Endpaper = __ds_scope.Endpaper;

__ds_ns.WritingMoment = __ds_scope.WritingMoment;

__ds_ns.RoomScene = __ds_scope.RoomScene;

})();
