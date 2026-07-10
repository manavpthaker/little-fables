// Story World — router, device frame, tweaks wiring.
const { HomeScreen, MakerScreen, ReaderScreen, EndScreen, GateScreen, ParentScreen } = window;
const { useTweaks, TweaksPanel, TweakSection, TweakSlider, TweakToggle, TweakRadio } = window;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "askOutcome": "praise",
  "storyTextPx": 24,
  "offline": false,
  "storyMachineHiccup": false
}/*EDITMODE-END*/;

const SW_STATE_KEY = 'sw-state-v1';

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(SW_STATE_KEY) || '{}');
    if (s && typeof s === 'object') return s;
  } catch (e) { /* fresh start */ }
  return {};
}

// ---- iPad-portrait device frame, scaled to fit the viewport ----
const DEV_W = 820, DEV_H = 1180, BEZEL = 21;
function DeviceFrame({ children }) {
  const outerW = DEV_W + BEZEL * 2, outerH = DEV_H + BEZEL * 2;
  const calc = () => Math.min((window.innerWidth - 36) / outerW, (window.innerHeight - 36) / outerH, 1);
  const [scale, setScale] = React.useState(calc);
  React.useEffect(() => {
    const onR = () => setScale(calc());
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center' }}>
      <div style={{ width: outerW * scale, height: outerH * scale }}>
        <div style={{ width: outerW, height: outerH, transform: 'scale(' + scale + ')', transformOrigin: 'top left', background: '#191410', borderRadius: 50, padding: BEZEL, boxSizing: 'border-box', boxShadow: '0 34px 90px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.06) inset' }}>
          <div style={{ width: DEV_W, height: DEV_H, borderRadius: 30, overflow: 'hidden', position: 'relative' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function StoryWorldApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const saved = React.useMemo(loadState, []);
  const [route, setRoute] = React.useState(saved.route || 'home');       // home | maker | reader | end | gate | parent
  const [storyId, setStoryId] = React.useState(saved.storyId || 'miko-bridge');
  const [bedtime, setBedtime] = React.useState(!!saved.bedtime);
  const [madeRocket, setMadeRocket] = React.useState(!!saved.madeRocket);

  React.useEffect(() => {
    localStorage.setItem(SW_STATE_KEY, JSON.stringify({ route, storyId, bedtime, madeRocket }));
  }, [route, storyId, bedtime, madeRocket]);

  const story = window.SW_STORIES[storyId] || window.SW_STORIES['miko-bridge'];
  const openStory = (id) => { setStoryId(id); setRoute('reader'); };

  let screen = null;
  if (route === 'maker') {
    screen = <MakerScreen hiccup={t.storyMachineHiccup} onBack={() => setRoute('home')}
      onMade={() => { setMadeRocket(true); openStory('rocket-roar'); }} />;
  } else if (route === 'reader') {
    screen = <ReaderScreen key={storyId} story={story} askOutcome={t.askOutcome}
      onExit={() => setRoute('home')} onEnd={() => setRoute('end')} />;
  } else if (route === 'end') {
    screen = <EndScreen story={story} onHome={() => setRoute('home')} />;
  } else if (route === 'gate') {
    screen = <GateScreen onBack={() => setRoute('home')} onPass={() => setRoute('parent')} />;
  } else if (route === 'parent') {
    screen = <ParentScreen onBack={() => setRoute('home')} />;
  } else {
    screen = <HomeScreen bedtime={bedtime} offline={t.offline} madeRocket={madeRocket}
      onToggleBedtime={() => setBedtime(!bedtime)}
      onOpenStory={openStory}
      onCreate={() => setRoute('maker')}
      onGrownups={() => setRoute('gate')} />;
  }

  const kidSurface = route !== 'gate' && route !== 'parent';

  return (
    <React.Fragment>
      <DeviceFrame>
        <div className={'sw-app' + (bedtime && kidSurface ? ' sw-bedtime' : '')}
          style={{ height: '100%', ['--text-story-page']: '600 ' + t.storyTextPx + 'px/1.65 var(--font-body)' }}>
          {screen}
        </div>
      </DeviceFrame>

      <TweaksPanel>
        <TweakSection label="Reader" />
        <TweakRadio label="Ask outcome" value={t.askOutcome} options={['praise', 'hint']}
          onChange={(v) => setTweak('askOutcome', v)} />
        <TweakSlider label="Story text" value={t.storyTextPx} min={22} max={26} step={1} unit="px"
          onChange={(v) => setTweak('storyTextPx', v)} />
        <TweakSection label="Edge states" />
        <TweakToggle label="Offline" value={t.offline} onChange={(v) => setTweak('offline', v)} />
        <TweakToggle label="Story machine hiccup" value={t.storyMachineHiccup} onChange={(v) => setTweak('storyMachineHiccup', v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<StoryWorldApp />);
