// Reader — the core screen. States: reading (word highlight), ask (question →
// listening → praise/hint), choice (→ "changing the story…" → branch page),
// emoji-on-gradient AND full-bleed watercolor art variants.
const { StatusBar, CircleBtn } = window;
const { AskBubble, ChoiceCards } = window.LittleFablesDesignSystem_36f5e7;

const EMOJI_SIZES = [96, 72, 60, 52, 44];

function ReaderScreen({ story, askOutcome = 'praise', onExit, onEnd }) {
  const [pageIdx, setPageIdx] = React.useState(0);
  const [branch, setBranch] = React.useState(null);
  const [chosen, setChosen] = React.useState(null);
  const [choiceGen, setChoiceGen] = React.useState(false);
  const [askState, setAskState] = React.useState('question');
  const [listening, setListening] = React.useState(false);
  const [reading, setReading] = React.useState(true);
  const [word, setWord] = React.useState(-1);
  const scrollRef = React.useRef(null);

  const page = branch || story.pages[pageIdx];
  const total = story.pages.length;
  const words = page.text.split(/\s+/).filter(Boolean);

  // Read-aloud word tracking (timer stands in for speechSynthesis boundaries)
  React.useEffect(() => {
    if (!reading) { setWord(-1); return; }
    let i = -1;
    setWord(-1);
    const t = setInterval(() => {
      i += 1;
      if (i >= words.length) { clearInterval(t); setWord(-1); return; }
      setWord(i);
    }, 240);
    return () => clearInterval(t);
  }, [page, reading]);

  const resetPageState = () => { setAskState('question'); setListening(false); setChosen(null); setChoiceGen(false); };

  const answered = askState === 'praise' || askState === 'hint';
  const blocked = (page.ask && !answered) || (page.choice && !branch && !chosen) || choiceGen;

  const goNext = () => {
    if (blocked) return;
    if (pageIdx >= total - 1) { onEnd(); return; }
    setBranch(null); resetPageState(); setPageIdx(pageIdx + 1);
    scrollRef.current && scrollRef.current.scrollTo({ top: 0 });
  };
  const goPrev = () => {
    if (branch) { setBranch(null); resetPageState(); return; }
    if (pageIdx > 0) { resetPageState(); setPageIdx(pageIdx - 1); }
  };
  const handleMic = () => {
    setListening(true);
    setTimeout(() => { setListening(false); setAskState(askOutcome); }, 1500);
  };
  const handleChoose = (o) => {
    setChosen(o.label);
    setTimeout(() => setChoiceGen(true), 650);
    setTimeout(() => { setChoiceGen(false); setBranch(o.page); }, 2550);
  };

  const progress = (pageIdx + (branch ? 0.5 : 0)) / total;
  const glow = askState === 'praise'
    ? '0 0 0 3px rgba(52, 211, 153, .55), 0 12px 30px rgba(52, 211, 153, .22)'
    : askState === 'hint'
      ? '0 0 0 3px rgba(251, 191, 36, .55), 0 12px 30px rgba(251, 191, 36, .22)'
      : 'none';

  const stateLabel = page.choice && !branch ? 'choice' : page.ask ? 'ask — ' + askState : 'reading';

  return (
    <div data-screen-label={'Reader — ' + story.title + ' (' + stateLabel + ')'} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />

      {/* Top bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 52px', alignItems: 'center', padding: '14px 32px 12px' }}>
        <CircleBtn label="Back to bookshelf" onClick={onExit}>‹</CircleBtn>
        <span style={{ font: '700 22px var(--font-display)', textAlign: 'center' }}>Story time</span>
        <CircleBtn label={reading ? 'Pause read-aloud' : 'Read aloud'} onClick={() => setReading(!reading)} style={{ color: reading ? 'var(--lf-espresso-soft)' : 'var(--lf-espresso-faint)' }}>
          <span aria-hidden="true">{reading ? '🔊' : '🔇'}</span>
        </CircleBtn>
      </div>

      {/* Art + reading card */}
      <div ref={scrollRef} className="sw-screen" style={{ flex: 1 }}>
        {page.image ? (
          <img src={page.image} alt="" style={{ width: '100%', height: 480, objectFit: 'cover', display: 'block', borderRadius: '0 0 var(--radius-hero) var(--radius-hero)', boxShadow: 'var(--shadow-warm-lg)' }} />
        ) : (
          <div aria-hidden="true" style={{ margin: '0 32px', height: 'calc(100% - 260px)', minHeight: 440, borderRadius: 'var(--radius-hero)', background: page.scene.bg, boxShadow: 'var(--shadow-warm-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap', padding: '20px 24px', boxSizing: 'border-box' }}>
            {page.scene.emojis.slice(0, 5).map((e, i) => (
              <span key={i} style={{ fontSize: EMOJI_SIZES[i] || 44, lineHeight: 1.1, filter: 'var(--shadow-emoji)' }}>{e}</span>
            ))}
          </div>
        )}

        {/* Reading card */}
        <div data-comment-anchor="sw-reading-card" style={{ position: 'relative', margin: page.image ? '-30px 32px 0' : '20px 32px 0', background: 'var(--lf-cream-card)', border: '1.5px solid var(--lf-cream-line)', borderRadius: 'var(--radius-card)', padding: '26px 30px', boxShadow: glow, transition: 'box-shadow 300ms var(--ease-out)' }}>
          <p style={{ margin: 0, font: 'var(--text-story-page)', color: 'var(--lf-espresso)', textWrap: 'pretty' }}>
            {words.map((w, i) => (
              <span key={i} style={i === word ? { background: 'var(--lf-pastel-peach)', borderBottom: '3px solid var(--lf-coral)', borderRadius: 4, padding: '0 3px' } : undefined}>{w}{' '}</span>
            ))}
          </p>

          {/* Ask — teaching moment */}
          {page.ask ? (
            <div style={{ marginTop: 18, borderTop: '1.5px dashed var(--lf-cream-line)', paddingTop: 18 }}>
              <div className="sw-zoom">
                <AskBubble
                  question={listening ? 'I\u2019m listening…' : page.ask.question}
                  praise={page.ask.praise}
                  hint={page.ask.hint}
                  skill={page.ask.skill}
                  state={askState}
                  listening={listening}
                  onMicTap={handleMic}
                />
              </div>
            </div>
          ) : null}

          {/* Choice point */}
          {page.choice && !branch ? (
            <div style={{ marginTop: 18, borderTop: '1.5px dashed var(--lf-cream-line)', paddingTop: 18 }}>
              {choiceGen ? (
                <div className="sw-fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '10px 0 6px', textAlign: 'center' }}>
                  <span aria-hidden="true" style={{ fontSize: 44, filter: 'var(--shadow-emoji)' }}>✨</span>
                  <span style={{ font: '700 22px var(--font-display)' }}>Your choice is changing the story…</span>
                  <div style={{ display: 'flex', gap: 8 }} aria-hidden="true">
                    <span className="sw-dot" style={{ width: 10, height: 10 }}></span>
                    <span className="sw-dot" style={{ width: 10, height: 10, animationDelay: '.18s' }}></span>
                    <span className="sw-dot" style={{ width: 10, height: 10, animationDelay: '.36s' }}></span>
                  </div>
                </div>
              ) : (
                <div className="sw-zoom">
                  <ChoiceCards prompt={page.choice.prompt} options={page.choice.options} chosen={chosen} onChoose={handleChoose} />
                  <div style={{ font: '600 13px var(--font-body)', color: 'var(--lf-espresso-soft)', textAlign: 'center', marginTop: 10 }}>Say it out loud — or tap it!</div>
                </div>
              )}
            </div>
          ) : null}
        </div>
        <div style={{ height: 20 }}></div>
      </div>

      {/* Progress */}
      <div style={{ padding: '10px 42px 0', flexShrink: 0 }}>
        <div style={{ height: 7, borderRadius: 999, background: 'var(--lf-cream-line)', position: 'relative' }}>
          <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: (progress * 100) + '%', borderRadius: 999, background: 'var(--lf-coral)', transition: 'width 300ms var(--ease-out)' }}></span>
          <span style={{ position: 'absolute', left: (progress * 100) + '%', top: '50%', transform: 'translate(-50%,-50%)', width: 18, height: 18, borderRadius: '50%', background: 'var(--lf-coral)', boxShadow: '0 0 0 4px var(--lf-cream)', transition: 'left 300ms var(--ease-out)' }}></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', font: '600 14px var(--font-body)', color: 'var(--lf-espresso-soft)', marginTop: 8 }}>
          <span>{branch ? 'bonus page!' : 'page ' + (pageIdx + 1) + ' of ' + total}</span>
          <span>{story.title}</span>
        </div>
      </div>

      {/* Controls — next ▶ is THE coral action (recedes while the mic or a choice is) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26, padding: '10px 0 22px', flexShrink: 0 }}>
        <CircleBtn label="Previous page" onClick={goPrev} size={56} style={{ opacity: pageIdx === 0 && !branch ? 0.4 : 1 }}>‹</CircleBtn>
        <button type="button" aria-label="Next page" onClick={goNext} disabled={blocked} className="lf-press"
          style={{ width: 76, height: 76, borderRadius: '50%', border: 'none', background: blocked ? 'var(--lf-cream-line)' : 'var(--lf-coral)', boxShadow: blocked ? 'none' : 'var(--shadow-coral-glow)', color: blocked ? 'var(--lf-espresso-faint)' : 'var(--sw-on-action)', fontSize: 28, cursor: blocked ? 'default' : 'pointer', paddingLeft: 5, boxSizing: 'border-box', transition: 'background 200ms, box-shadow 200ms' }}>▶</button>
        <CircleBtn label="Read this page again" onClick={() => { setReading(false); setTimeout(() => setReading(true), 60); }} size={56}>↺</CircleBtn>
      </div>
    </div>
  );
}
window.ReaderScreen = ReaderScreen;
