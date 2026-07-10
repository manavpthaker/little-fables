// Story Maker — kid-facing creation: hero picker, place picker, mic moment,
// listening state, full-screen "Making your story..." + hiccup edge state.
// The ONE coral action: the mic.
const { StatusBar, Doodles, CircleBtn, BigMic } = window;
const { MagicButton } = window.LittleFablesDesignSystem_36f5e7;

function PickCard({ emoji, label, selected, onTap, pill = false }) {
  return (
    <button type="button" className="lf-press" onClick={onTap} aria-pressed={selected}
      style={{
        display: 'flex', flexDirection: pill ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: pill ? 10 : 8,
        background: selected ? 'var(--lf-pastel-peach)' : 'var(--lf-cream-card)',
        border: selected ? '2.5px solid var(--lf-espresso)' : '2px solid var(--lf-cream-line)',
        borderRadius: pill ? 'var(--radius-pill)' : 'var(--radius-cover)',
        padding: pill ? '13px 22px' : '18px 10px 14px',
        cursor: 'pointer', color: 'var(--lf-espresso)', minHeight: 56, boxSizing: 'border-box',
      }}>
      <span aria-hidden="true" style={{ fontSize: pill ? 24 : 54, filter: 'var(--shadow-emoji)', lineHeight: 1.1 }}>{emoji}</span>
      <span style={{ font: pill ? '700 17px var(--font-display)' : '700 19px var(--font-display)' }}>{label}</span>
    </button>
  );
}

function MakerScreen({ hiccup, onBack, onMade }) {
  const M = window.SW_MAKER;
  const [hero, setHero] = React.useState('Miko');
  const [place, setPlace] = React.useState('Star Garage');
  const [phase, setPhase] = React.useState('pick'); // pick | listening | making | error
  const [lineIdx, setLineIdx] = React.useState(0);

  // Listening: hear the idea, then start making
  React.useEffect(() => {
    if (phase !== 'listening') return;
    const t = setTimeout(() => setPhase('making'), 2400);
    return () => clearTimeout(t);
  }, [phase]);

  // Making: rotate playful progress copy, then done (or hiccup)
  React.useEffect(() => {
    if (phase !== 'making') return;
    setLineIdx(0);
    const rot = setInterval(() => setLineIdx((i) => (i + 1) % M.makingLines.length), 1300);
    const t = setTimeout(() => { hiccup ? setPhase('error') : onMade(); }, 4600);
    return () => { clearInterval(rot); clearTimeout(t); };
  }, [phase, hiccup]);

  // ---- Full-screen: making ----
  if (phase === 'making') {
    return (
      <div className="sw-screen" data-screen-label="Story Maker — making your story" style={{ display: 'flex', flexDirection: 'column' }}>
        <Doodles />
        <StatusBar />
        <div className="sw-fade-up" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, padding: '0 60px 80px', textAlign: 'center' }}>
          <span aria-hidden="true" style={{ fontSize: 100, filter: 'var(--shadow-emoji)' }}>📖</span>
          <h1 style={{ margin: 0, font: '700 34px/1.2 var(--font-display)' }}>Making your story…</h1>
          <div style={{ font: '600 20px/1.5 var(--font-body)', color: 'var(--lf-espresso-soft)', minHeight: 30 }}>{M.makingLines[lineIdx]}</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }} aria-hidden="true">
            <span className="sw-dot"></span>
            <span className="sw-dot" style={{ animationDelay: '.18s' }}></span>
            <span className="sw-dot" style={{ animationDelay: '.36s' }}></span>
          </div>
        </div>
      </div>
    );
  }

  // ---- Full-screen: the story machine hiccuped (edge state) ----
  if (phase === 'error') {
    return (
      <div className="sw-screen" data-screen-label="Story Maker — error" style={{ display: 'flex', flexDirection: 'column' }}>
        <Doodles />
        <StatusBar />
        <div className="sw-fade-up" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '0 60px 80px', textAlign: 'center' }}>
          <span aria-hidden="true" style={{ fontSize: 96, filter: 'var(--shadow-emoji)' }}>🫧</span>
          <h1 style={{ margin: 0, font: '700 32px/1.25 var(--font-display)' }}>The story machine hiccuped. Try again!</h1>
          <div style={{ font: '600 19px/1.5 var(--font-body)', color: 'var(--lf-espresso-soft)', maxWidth: 440 }}>Your idea is safe — let&rsquo;s give it one more go.</div>
          <div className="sw-zoom" style={{ width: 300, marginTop: 10 }}>
            <MagicButton emoji="✨" onClick={() => setPhase('making')}>Try again</MagicButton>
          </div>
          <button type="button" className="lf-press" onClick={onBack} style={{ border: 'none', background: 'none', cursor: 'pointer', font: '700 18px var(--font-display)', color: 'var(--lf-espresso-soft)', padding: 12 }}>
            Back to my bookshelf
          </button>
        </div>
      </div>
    );
  }

  // ---- Pick + mic moment ----
  const listening = phase === 'listening';
  return (
    <div className="sw-screen" data-screen-label={'Story Maker' + (listening ? ' — listening' : '')}>
      <Doodles />
      <StatusBar />

      <header style={{ display: 'grid', gridTemplateColumns: '52px 1fr 52px', alignItems: 'center', padding: '18px 32px 0' }}>
        <CircleBtn label="Back to home" onClick={onBack}>‹</CircleBtn>
        <h1 style={{ margin: 0, font: '700 28px var(--font-display)', textAlign: 'center' }}>Make a New Story!</h1>
        <span></span>
      </header>

      {/* Hero picker */}
      <section style={{ padding: '26px 32px 0' }}>
        <div style={{ font: 'var(--text-section)', marginBottom: 14 }}>Who is the hero?</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          {M.heroes.map((h) => (
            <PickCard key={h.label} emoji={h.emoji} label={h.label} selected={hero === h.label} onTap={() => setHero(h.label)} />
          ))}
        </div>
      </section>

      {/* Place picker */}
      <section style={{ padding: '26px 32px 0' }}>
        <div style={{ font: 'var(--text-section)', marginBottom: 14 }}>Where does it happen?</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {M.places.map((p) => (
            <PickCard key={p.label} pill emoji={p.emoji} label={p.label} selected={place === p.label} onTap={() => setPlace(p.label)} />
          ))}
        </div>
      </section>

      {/* Mic moment — THE coral action */}
      <section style={{ padding: '30px 32px 40px' }}>
        <div data-comment-anchor="sw-maker-mic" style={{ background: 'var(--lf-cream-card)', border: '1.5px solid var(--lf-cream-line)', borderRadius: 'var(--radius-hero)', padding: '34px 40px 38px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <h2 style={{ margin: 0, font: '700 30px var(--font-display)' }}>{listening ? 'I\u2019m listening…' : 'Tell me your idea!'}</h2>
          <BigMic size={116} listening={listening} onTap={() => setPhase(listening ? 'making' : 'listening')} label="Tell me your idea" />
          {listening ? (
            <div className="sw-fade-up" style={{ font: '600 22px/1.5 var(--font-body)', color: 'var(--lf-espresso)', minHeight: 34 }}>{M.heardIdea}</div>
          ) : (
            <div style={{ font: '600 18px/1.5 var(--font-body)', color: 'var(--lf-espresso-soft)', maxWidth: 400 }}>
              Press the button and say your idea out loud — {hero} is ready in the {place}!
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
window.MakerScreen = MakerScreen;
