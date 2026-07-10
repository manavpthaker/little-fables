// Story end — landscape: celebration + star words on the left page,
// tell-it-back recording on the right. THE coral action: the record button.
const { StatusBar, Doodles } = window;
const { VocabStar } = window.LittleFablesDesignSystem_36f5e7;

function EndScreen({ story, onHome }) {
  const [activeVocab, setActiveVocab] = React.useState(null);
  const [recState, setRecState] = React.useState('idle'); // idle | recording | saved
  const [secs, setSecs] = React.useState(0);

  React.useEffect(() => {
    if (recState !== 'recording') return;
    setSecs(0);
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recState]);

  const meaning = story.vocab.find((v) => v.word === activeVocab);
  const fmt = (s) => '0:' + String(s).padStart(2, '0');

  return (
    <div className="sw-screen" data-screen-label={'Story end — ' + story.title + (recState !== 'idle' ? ' (' + recState + ')' : '')} style={{ display: 'flex', flexDirection: 'column' }}>
      <Doodles />
      <StatusBar />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', padding: '0 64px 26px' }}>

        {/* Left: celebration + star words */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <span aria-hidden="true" style={{ position: 'relative', fontSize: 92, filter: 'var(--shadow-emoji)' }}>
            🎉
            <span style={{ position: 'absolute', top: -6, left: -44, fontSize: 32 }}>✨</span>
            <span style={{ position: 'absolute', bottom: 2, right: -44, fontSize: 28 }}>⭐</span>
          </span>
          <h1 style={{ margin: 0, font: '700 34px/1.2 var(--font-display)' }}>The end! Great reading!</h1>
          <div style={{ font: '600 17px var(--font-body)', color: 'var(--lf-espresso-soft)', marginTop: -6 }}>{story.title}</div>

          <div style={{ marginTop: 10 }}>
            <div className="sw-zoom" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {story.vocab.map((v) => (
                <VocabStar key={v.word} word={v.word} active={activeVocab === v.word} onTap={() => setActiveVocab(activeVocab === v.word ? null : v.word)} />
              ))}
            </div>
            <div style={{ font: '600 18px/1.5 var(--font-body)', color: 'var(--lf-espresso-soft)', minHeight: 54, marginTop: 12 }}>
              {meaning ? <span className="sw-fade-up" style={{ display: 'inline-block' }}>&ldquo;{meaning.word}&rdquo; means {meaning.meaning}</span> : 'Tap a star word to hear it'}
            </div>
          </div>

          <button type="button" className="lf-press" onClick={onHome}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'var(--lf-cream-card)', border: '1.5px solid var(--lf-cream-line)', borderRadius: 'var(--radius-pill)', padding: '15px 30px', font: '700 20px var(--font-display)', color: 'var(--lf-espresso)', cursor: 'pointer', minHeight: 56 }}>
            <span aria-hidden="true">📚</span> Back to the Bookshelf
          </button>
        </div>

        {/* Right: tell it back */}
        <div data-comment-anchor="sw-tell-it-back" style={{ background: 'var(--lf-cream-card)', border: '1.5px solid var(--lf-cream-line)', borderRadius: 'var(--radius-hero)', padding: '28px 36px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ font: '700 14px var(--font-body)', color: 'var(--lf-espresso-faint)', textTransform: 'uppercase', letterSpacing: '.08em', whiteSpace: 'nowrap' }}>Tell it back 🎤</div>
          <div style={{ textAlign: 'left', width: '100%' }}>
            {story.retellPrompts.map((r, i) => (
              <div key={i} style={{ font: '600 19px/1.6 var(--font-body)', color: 'var(--lf-espresso)' }}>{r}</div>
            ))}
          </div>

          <span style={{ position: 'relative', display: 'inline-flex', width: 96, height: 96, marginTop: 6, flexShrink: 0 }}>
            {recState === 'recording' ? (
              <React.Fragment>
                <span className="sw-ring"></span>
                <span className="sw-ring sw-ring2"></span>
                <span className="sw-ring sw-ring3"></span>
              </React.Fragment>
            ) : null}
            <button type="button" aria-label={recState === 'recording' ? 'Finish recording' : 'Record your story'} className={'lf-press' + (recState === 'recording' ? '' : ' sw-breathe')}
              onClick={() => setRecState(recState === 'recording' ? 'saved' : 'recording')}
              style={{ position: 'relative', width: 96, height: 96, borderRadius: '50%', border: 'none', cursor: 'pointer', background: recState === 'recording' ? 'var(--lf-coral-deep)' : 'var(--lf-coral)', boxShadow: 'var(--shadow-coral-glow)', fontSize: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <span aria-hidden="true">{recState === 'recording' ? '⏸' : '🎤'}</span>
            </button>
          </span>

          {recState === 'recording' ? (
            <div className="sw-fade-up" style={{ font: '700 20px var(--font-display)', color: 'var(--lf-espresso)' }}>
              I&rsquo;m listening… {fmt(secs)}
            </div>
          ) : recState === 'saved' ? (
            <div className="sw-fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'var(--lf-pastel-mint)', borderRadius: 'var(--radius-pill)', padding: '12px 22px', font: '700 19px var(--font-display)', color: 'var(--lf-espresso)' }}>
              <span aria-hidden="true">✓</span> Saved for Mom and Dad!
            </div>
          ) : (
            <div style={{ font: '600 17px/1.4 var(--font-body)', color: 'var(--lf-espresso-soft)', textAlign: 'center' }}>Tell the story back in your own words — press to record</div>
          )}
        </div>
      </div>
    </div>
  );
}
window.EndScreen = EndScreen;
