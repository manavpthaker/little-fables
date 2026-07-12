/* Little Fables — app shell: state store, router, fixed-size stage
   (1180×820 landscape; Home + Reader restack to 820×1180 in portrait),
   scenario presets, and the Tweaks panel.

   There is no spinner anywhere in this app: the endpaper beat is the only
   loading state (see BootEndpaper + Endpaper component). */

const { Endpaper } = window.LittleFablesDesignSystem_d603a2;

const LF_LS_KEY = "lf-proto-v1"; // this prototype's own storage key

const FRESH_HISTORY = {
  chosen: false, suns: 0, words: [], medals: [], authored: [],
  progress: {}, retold: [], kitchenToday: false
};

const LF_PRESETS = {
  arrival: () => ({
    state: { buddy: null, time: "morning", online: true, history: { ...FRESH_HISTORY } },
    route: { screen: "arrival" }
  }),
  morning: () => ({
    state: { buddy: "bear", time: "morning", online: true, history: { ...FRESH_HISTORY, chosen: true, suns: 2, authored: ["bird"] } },
    route: { screen: "home" }
  }),
  midflight: () => ({
    state: {
      buddy: "bear", time: "afternoon", online: true,
      history: {
        ...FRESH_HISTORY, chosen: true, suns: 4, authored: ["bird"],
        words: [{ word: "wobbly", pin: "river" }, { word: "steady", pin: "sage" }],
        medals: ["suns7"],
        progress: { miko: { chapter: 1, page: 2, choice: "neck", pendingRecap: true, done: false } }
      }
    },
    route: { screen: "home" }
  }),
  evening: () => { const p = LF_PRESETS.midflight(); p.state.time = "evening"; return p; },
  quiet: () => { const p = LF_PRESETS.midflight(); p.state.time = "night"; return p; },
  offline: () => { const p = LF_PRESETS.morning(); p.state.online = false; return p; },
  reader: () => { const p = LF_PRESETS.morning(); p.route = { screen: "reader", bookId: "miko", chapter: 0, page: 0 }; return p; },
  resume: () => { const p = LF_PRESETS.midflight(); p.route = { screen: "reader", bookId: "miko", recap: true }; return p; },
  complete: () => { const p = LF_PRESETS.midflight(); p.state.history.progress.miko = { chapter: 2, page: 2, choice: "neck", done: true }; p.route = { screen: "complete", bookId: "miko" }; return p; },
  kitchen: () => { const p = LF_PRESETS.morning(); p.route = { screen: "kitchen" }; return p; },
  words: () => { const p = LF_PRESETS.midflight(); p.state.history.words = window.LF_WALL.map((w) => ({ word: w.word, pin: w.pin })); p.route = { screen: "words" }; return p; },
  parent: () => { const p = LF_PRESETS.midflight(); p.route = { screen: "parent" }; return p; }
};

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(LF_LS_KEY)); } catch (e) { return null; }
}

/* ---------- App ---------- */
function App() {
  const saved = React.useMemo(loadSaved, []);
  const [state, setState] = React.useState(() => (saved && saved.state) || LF_PRESETS.arrival().state);
  const [route, setRouteRaw] = React.useState({ screen: "boot" });
  const [afterBoot] = React.useState(() => (saved && saved.route && saved.route.screen !== "boot" ? saved.route : (saved && saved.state && saved.state.history.chosen ? { screen: "home" } : { screen: "arrival" })));
  const [tweak, setTweak] = React.useState(() => (saved && saved.tweak) || { tts: false, reduce: false });

  const setRoute = React.useCallback((r) => setRouteRaw((prev) => (typeof r === "function" ? r(prev) : r)), []);
  const patchState = React.useCallback((patch) => setState((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) })), []);
  const patchHistory = React.useCallback((patch) => setState((s) => ({ ...s, history: { ...s.history, ...(typeof patch === "function" ? patch(s.history) : patch) } })), []);

  /* boot: the endpaper open beat IS the cold-open loading state */
  React.useEffect(() => {
    const t = setTimeout(() => setRouteRaw(afterBoot), 1600);
    return () => clearTimeout(t);
  }, []);

  /* persist (refresh keeps your place; never touches other apps' storage) */
  React.useEffect(() => {
    if (route.screen === "boot") return;
    try {
      localStorage.setItem(LF_LS_KEY, JSON.stringify({
        state, tweak,
        route: { screen: route.screen, bookId: route.bookId, chapter: route.chapter, page: route.page, recap: route.recap }
      }));
    } catch (e) { }
  }, [state, route, tweak]);

  /* tweak side effects */
  React.useEffect(() => { window.__lfTTSOn = tweak.tts; }, [tweak.tts]);
  React.useEffect(() => {
    const el = document.documentElement;
    if (tweak.reduce) el.setAttribute("data-reduce", ""); else el.removeAttribute("data-reduce");
  }, [tweak.reduce]);

  /* orientation: Home + Reader restack in portrait; all else letterboxes */
  const [vp, setVp] = React.useState({ w: window.innerWidth, h: window.innerHeight });
  React.useEffect(() => {
    const fit = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  const portraitCapable = route.screen === "home" || route.screen === "reader" || route.screen === "quiet";
  const orientation = vp.h > vp.w && portraitCapable ? "portrait" : "landscape";
  const W = orientation === "portrait" ? 820 : 1180;
  const H = orientation === "portrait" ? 1180 : 820;
  const scale = Math.min(vp.w / W, vp.h / H);

  const hour = state.time === "auto" ? window.realTimeOfDay() : state.time;
  const lantern = hour === "night";

  /* navigation helpers */
  const openBook = React.useCallback((bookId, opts = {}) => {
    const prog = state.history.progress[bookId];
    const wantRecap = !opts.skipRecap && prog && prog.pendingRecap && !prog.done && (prog.chapter > 0 || prog.page > 0);
    setRoute({ screen: "home", opening: bookId }); // endpaper lifts from the shelf
    setTimeout(() => {
      const seq = Date.now();
      setRoute(wantRecap
        ? { screen: "reader", bookId, recap: true, seq }
        : { screen: "reader", bookId, chapter: (prog && !prog.done && prog.chapter) || 0, page: (prog && !prog.done && prog.page) || 0, seq });
    }, 980);
  }, [state.history.progress]);

  const closeBook = React.useCallback((bookId) => {
    setRoute({ screen: "home", closing: bookId });
    setTimeout(() => setRoute({ screen: "home" }), 1000);
  }, []);

  const applyPreset = React.useCallback((key) => {
    const p = LF_PRESETS[key]();
    p.route.seq = Date.now();
    setState(p.state);
    setRoute(p.route);
  }, []);

  const nav = { route, setRoute, state, patchState, patchHistory, openBook, closeBook, applyPreset, hour, orientation };
  window.__lfNav = nav; // for verification probing

  const roomVisible = ["arrival", "home", "kitchen", "words", "parent"].includes(route.screen) || route.opening || route.closing;
  const cam = route.screen === "kitchen" && orientation === "landscape" && !route.landed ? "desk" : route.screen === "words" && orientation === "landscape" ? "wall" : "home";

  return (
    <div id="lf-stage" className="lf-paper" style={{ position: "fixed", inset: 0, backgroundColor: lantern ? "#1B2740" : "var(--paper-deep)", overflow: "hidden", transition: "background-color 900ms ease" }}>
      <div id="lf-canvas" data-register={lantern ? "lantern" : undefined}
        style={{ width: W, height: H, position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) scale(" + scale + ")", transformOrigin: "center", overflow: "hidden", backgroundColor: "var(--paper)" }}>

        {roomVisible && (
          <window.Room orientation={orientation} hour={hour} quiet={lantern} cam={cam}>
            {route.screen === "arrival"
              ? <window.ArrivalLayer nav={nav}></window.ArrivalLayer>
              : <window.HomeLayer nav={nav} mode={route.screen === "home" ? "home" : route.screen}></window.HomeLayer>}
          </window.Room>
        )}

        {(route.opening || route.closing) && <window.BookTransition nav={nav}></window.BookTransition>}
        {route.screen === "reader" && <window.ReaderScreen key={"rd" + (route.seq || 0)} nav={nav}></window.ReaderScreen>}
        {route.screen === "complete" && <window.CompleteScreen key={"cp" + (route.seq || 0)} nav={nav}></window.CompleteScreen>}
        {route.screen === "kitchen" && <window.KitchenOverlay key={"kt" + (route.seq || 0)} nav={nav}></window.KitchenOverlay>}
        {route.screen === "words" && <window.WordsOverlay key={"wd" + (route.seq || 0)} nav={nav}></window.WordsOverlay>}
        {route.screen === "parent" && <window.ParentSheet nav={nav}></window.ParentSheet>}

        {route.screen === "boot" && (
          <div data-screen-label="Endpaper open beat (loading)" style={{ position: "absolute", inset: 0, zIndex: 60 }}>
            {/* the app's open beat = its loading state; no spinner exists */}
            <Endpaper pigment="marigold" motif="star" loading style={{ position: "absolute", inset: 0 }}></Endpaper>
          </div>
        )}

        <window.SpokenOverlay></window.SpokenOverlay>

        {/* the grown-ups doorway: touch-only, held like an adult (SIM: real
            entry is a two-finger hold). Not drawn-world; deliberately quiet. */}
        {route.screen === "home" && <GrownupsChip nav={nav}></GrownupsChip>}
      </div>

      <window.LfTweaks nav={nav} tweak={tweak} setTweak={setTweak}></window.LfTweaks>
    </div>
  );
}

/* ---------- grown-ups entry (press and hold ~1s) ---------- */
function GrownupsChip({ nav }) {
  const timer = React.useRef(null);
  const [holding, setHolding] = React.useState(false);
  const start = () => {
    setHolding(true);
    timer.current = setTimeout(() => { setHolding(false); nav.setRoute({ screen: "parent" }); }, 1000);
  };
  const stop = () => { setHolding(false); clearTimeout(timer.current); };
  return (
    <button onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
      aria-label="for grown-ups — press and hold"
      style={{
        position: "absolute", right: 14, bottom: 10, minHeight: 44, padding: "6px 12px",
        fontFamily: "var(--font-parent)", fontSize: 12.5, color: "var(--ink-faint)",
        opacity: holding ? 1 : 0.62, cursor: "pointer", zIndex: 30, borderRadius: 8,
        transition: "opacity 300ms ease"
      }}>
      for grown-ups — hold
    </button>
  );
}

/* ---------- Tweaks (prototype controls live here, not in the app) ---------- */
function LfTweaks({ nav, tweak, setTweak }) {
  const { TweaksPanel, TweakSection, TweakSelect, TweakRadio, TweakToggle, TweakButton } = window;
  const jumpOptions = [
    { v: "arrival", l: "First arrival — meet the buddies" },
    { v: "morning", l: "Home — fresh-start morning" },
    { v: "midflight", l: "Home — mid-flight afternoon" },
    { v: "evening", l: "Home — evening (lantern begins)" },
    { v: "quiet", l: "Quiet mode — night" },
    { v: "offline", l: "Offline — note on the door" },
    { v: "reader", l: "Reader — Miko, chapter one" },
    { v: "resume", l: "Resume — recap strip" },
    { v: "complete", l: "Book complete — celebration" },
    { v: "kitchen", l: "The story kitchen" },
    { v: "words", l: "My Words wall" },
    { v: "parent", l: "Grown-ups (gate)" }
  ];
  const [jump, setJump] = React.useState("");
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Scenario"></TweakSection>
      <TweakSelect label="Jump to moment" value={jump} options={jumpOptions.map((o) => o.l)}
        onChange={(l) => { const o = jumpOptions.find((x) => x.l === l); if (o) { setJump(l); nav.applyPreset(o.v); } }}></TweakSelect>
      <TweakSelect label="Time of day" value={nav.state.time}
        options={["auto", "morning", "afternoon", "evening", "night"]}
        onChange={(v) => nav.patchState({ time: v })}></TweakSelect>
      <TweakSelect label="Buddy" value={nav.state.buddy || "bear"}
        options={["bear", "otter", "anky", "moto", "rocky", "rusty"]}
        onChange={(v) => nav.patchState({ buddy: v, history: { ...nav.state.history, chosen: true } })}></TweakSelect>
      <TweakToggle label="Online" value={nav.state.online} onChange={(v) => nav.patchState({ online: v })}></TweakToggle>
      <TweakSection label="Simulation"></TweakSection>
      <TweakToggle label="Speak lines aloud (browser TTS)" value={tweak.tts} onChange={(v) => setTweak({ ...tweak, tts: v })}></TweakToggle>
      <TweakToggle label="Reduced-motion preview" value={tweak.reduce} onChange={(v) => setTweak({ ...tweak, reduce: v })}></TweakToggle>
      <TweakButton label="Reset the whole journey" onClick={() => { try { localStorage.removeItem(LF_LS_KEY); } catch (e) { } location.reload(); }}></TweakButton>
    </TweaksPanel>
  );
}

Object.assign(window, { App, LfTweaks, LF_PRESETS });
ReactDOM.createRoot(document.getElementById("root")).render(<App></App>);
