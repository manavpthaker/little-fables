/* Little Fables — screens B: recap-on-resume, reader spread, chapter end, book complete. */
const { useState, useEffect, useRef } = React;
const { MagicButton, ChoiceCards, VocabStar } = window.LittleFablesDesignSystem_36f5e7;
const LF = window.LF;

/* ================= 10 · RECAP ON RESUME ================= */
function Recap({ app }) {
  const miko = LF.STORIES.miko;
  return (
    <KidScreen label="Recap on resume">
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 620, background: 'var(--lf-cream-card)', border: '1.5px solid var(--lf-cream-line)', borderRadius: 'var(--radius-hero)', boxShadow: 'var(--shadow-warm-lg)', padding: '34px 40px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}><BuddyFace buddy={app.buddy} size={96} /></div>
          <h1 style={{ margin: '14px 0 10px', font: '700 28px var(--font-display)', color: 'var(--lf-espresso)' }}>Last time…</h1>
          <p style={{ margin: '0 auto', maxWidth: 460, font: '600 18px/1.6 var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
            <span aria-hidden="true">🔊</span> {miko.recap.lines[0]}<br />{miko.recap.lines[1]}
          </p>
          <div style={{ margin: '18px 0 24px', display: 'inline-block', background: 'var(--lf-pastel-peach)', border: '2px solid var(--lf-coral)', borderRadius: 'var(--radius-pill)', padding: '10px 22px', font: '700 17px var(--font-display)', color: 'var(--lf-espresso)' }}>
            {miko.recap.choice}
          </div>
          <div style={{ width: 300, margin: '0 auto' }}>
            <MagicButton emoji="▶" onClick={() => app.openChapter(2)}>Keep going!</MagicButton>
          </div>
        </div>
      </div>
    </KidScreen>
  );
}

/* ================= 5 · READER (picture-book spread) ================= */
function Reader({ app }) {
  const { story, chapterIdx } = app.reading;
  const chapter = chapterIdx != null ? story.chapters[chapterIdx] : null;
  const pages = chapter ? chapter.pages : story.pages;
  const [pageIdx, setPageIdx] = useState(0);
  const [replayN, setReplayN] = useState(0);
  const page = pages[pageIdx];

  const words = page.text.split(' ');
  const [wordIdx, setWordIdx] = useState(-1);
  const [askState, setAskState] = useState('question'); // question | listening | hint | praise
  const [chosen, setChosen] = useState(null);
  const [changing, setChanging] = useState(false);
  const [readAloud, setReadAloud] = useState(true);
  const [breatheDone, setBreatheDone] = useState(false);
  const doneReading = wordIdx >= words.length;

  // word-by-word highlight tracking narration
  useEffect(() => {
    setAskState('question'); setChosen(null); setChanging(false); setBreatheDone(false);
    if (!readAloud) { setWordIdx(words.length + 1); return; }
    setWordIdx(-1);
    let i = -1;
    const iv = setInterval(() => {
      i += 1;
      if (i >= words.length + 1) { clearInterval(iv); }
      setWordIdx(i);
    }, app.t.reduceMotion ? 80 : 300);
    return () => clearInterval(iv);
  }, [pageIdx, replayN, readAloud]);

  const teachActive = (page.ask && askState !== 'praise') || (page.choice && !chosen) || (page.breathe && !breatheDone);
  const nextHot = !teachActive && !changing;

  const goNext = () => {
    if (pageIdx < pages.length - 1) { setPageIdx(pageIdx + 1); return; }
    if (chapter && chapterIdx < 2) app.nav('chapterEnd');
    else app.finishBook();
  };
  const onMic = () => {
    if (askState !== 'question' && askState !== 'hint') return;
    setAskState('listening');
    setTimeout(() => setAskState('praise'), app.t.reduceMotion ? 400 : 1500);
  };
  const onChoose = (opt) => {
    if (chosen) return;
    setChosen(opt.label);
    setTimeout(() => setChanging(true), 700);
    setTimeout(() => goNext(), app.t.reduceMotion ? 1400 : 2600);
  };

  const art = (
    <WashScene wash={page.wash} img={page.img} emojis={page.emojis || []} slot={page.slot} slotLabel={page.slotLabel}
      style={page.fullBleed ? { position: 'absolute', inset: 0 } : { position: 'absolute', inset: 0, borderRadius: 'var(--radius-hero)', boxShadow: 'var(--shadow-warm-lg)' }} />
  );

  const readingCard = (
    <div style={{
      background: page.fullBleed ? 'rgba(255,253,247,.95)' : 'var(--lf-cream-card)',
      border: '1.5px solid var(--lf-cream-line)', borderRadius: 'var(--radius-card)',
      boxShadow: page.fullBleed ? 'var(--shadow-warm-lg)' : 'none',
      padding: '30px 34px', display: 'flex', flexDirection: 'column', gap: 18, minHeight: 0, height: '100%',
    }}>
      <p style={{ margin: 0, font: '600 26px/1.65 var(--font-body)', color: 'var(--lf-espresso)', textWrap: 'pretty' }}>
        {words.map((w, i) => (
          <span key={i} style={{
            padding: '0 3px', borderRadius: 6, transition: 'background 120ms',
            background: i === wordIdx ? 'var(--lf-pastel-peach)' : 'transparent',
            boxShadow: i === wordIdx ? 'inset 0 -3px 0 var(--lf-coral)' : 'none',
          }}>{w}{' '}</span>
        ))}
      </p>
      {page.star && doneReading && (
        <span className="lf-screen-in" style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(251,191,36,.16)', border: '1.5px solid rgba(251,191,36,.5)', borderRadius: 'var(--radius-pill)', padding: '5px 14px', font: '700 13.5px var(--font-body)', color: 'var(--lf-espresso)' }}>
          ⭐ Star word: <strong>{page.star}</strong>
        </span>
      )}

      {(page.ask || page.choice || page.breathe) && (
        <div style={{ borderTop: '1.5px dashed var(--lf-cream-line)', paddingTop: 16, marginTop: 'auto' }}>
          {page.breathe && <BreatheAlong done={breatheDone} onDone={() => setBreatheDone(true)} rm={app.t.reduceMotion} />}
          {page.ask && <ReaderAsk ask={page.ask} state={askState} onMic={onMic} onHint={() => setAskState('hint')} />}
          {page.choice && (
            <div>
              {!chosen && (
                <p style={{ margin: '0 0 10px', font: '700 14px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
                  <span aria-hidden="true">🎤</span> Say it out loud — or tap it!
                </p>
              )}
              <ChoiceCards prompt={page.choice.prompt} options={page.choice.options} chosen={chosen} onChoose={onChoose} />
              {changing && (
                <div className="lf-screen-in" style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, font: '700 15px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
                  <Dots /> Your choice is changing the story…
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <KidScreen label={chapter ? `Reader — ${chapter.title}` : `Reader — ${story.title}`}>
      {/* spread */}
      {page.fullBleed ? (
        <div style={{ position: 'absolute', inset: 0 }}>
          {page.slot ? (
            <div style={{ position: 'absolute', inset: 0, background: washBg(page.wash) }}>
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 540 }}>
                <WashScene wash={page.wash} emojis={[]} slot={page.slot} slotLabel={page.slotLabel} doodle={false} style={{ position: 'absolute', inset: 0 }} />
              </div>
            </div>
          ) : art}
          <div style={{ position: 'absolute', top: 90, right: 56, bottom: 120, width: 460 }}>{readingCard}</div>
        </div>
      ) : (
        <div style={{ position: 'absolute', top: 84, left: 48, right: 48, bottom: 112, display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 26 }}>
          <div style={{ position: 'relative' }}>{art}</div>
          {readingCard}
        </div>
      )}

      {/* top chrome */}
      <div style={{ position: 'absolute', top: 18, left: 48, right: 48, display: 'flex', alignItems: 'center', gap: 14, zIndex: 10 }}>
        <RoundBtn glyph="‹" label="Back" size={50} onClick={() => (chapter ? app.nav('map') : app.nav('home'))} />
        <span style={{ background: 'var(--lf-cream-card)', border: '1.5px solid var(--lf-cream-line)', borderRadius: 'var(--radius-pill)', padding: '8px 18px', font: '700 14.5px var(--font-display)', color: 'var(--lf-espresso)' }}>
          {chapter ? `Chapter ${chapterIdx + 1} · ${chapter.title}` : story.title}
        </span>
        <span style={{ marginLeft: 'auto', font: '600 13px var(--font-body)', color: 'var(--lf-espresso-soft)', background: 'var(--lf-cream-card)', border: '1.5px solid var(--lf-cream-line)', borderRadius: 'var(--radius-pill)', padding: '8px 14px' }}>
          Page {pageIdx + 1} of {pages.length}
        </span>
        <RoundBtn glyph={readAloud ? '🔊' : '🔇'} label={readAloud ? 'Read-aloud is on' : 'Read-aloud is off'} size={50}
          onClick={() => setReadAloud(!readAloud)} style={{ fontSize: 19 }} />
      </div>

      {/* bottom controls */}
      <div style={{ position: 'absolute', bottom: 22, left: 48, right: 48, display: 'flex', alignItems: 'center', gap: 18, zIndex: 10 }}>
        <RoundBtn glyph="‹" label="Previous page" onClick={() => setPageIdx(Math.max(0, pageIdx - 1))} disabled={pageIdx === 0} />
        <RoundBtn glyph="↻" label="Read it again" onClick={() => setReplayN(replayN + 1)} />
        <div style={{ flex: 1, position: 'relative', height: 12, background: 'var(--lf-cream-card)', border: '1.5px solid var(--lf-cream-line)', borderRadius: 'var(--radius-pill)' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${((pageIdx + 1) / pages.length) * 100}%`, background: 'var(--lf-pastel-peach)', borderRadius: 'var(--radius-pill)', transition: 'width 300ms var(--ease-out)' }}></div>
          <div style={{ position: 'absolute', top: '50%', left: `${((pageIdx + 1) / pages.length) * 100}%`, transform: 'translate(-50%,-50%)', width: 22, height: 22, borderRadius: '50%', background: 'var(--lf-cream-card)', border: '2.5px solid var(--lf-espresso-faint)', transition: 'left 300ms var(--ease-out)' }}></div>
        </div>
        <button type="button" className="lf-press" onClick={goNext} style={{
          display: 'flex', alignItems: 'center', gap: 10, border: 'none', cursor: 'pointer',
          minHeight: 56, padding: '14px 30px', borderRadius: 'var(--radius-pill)',
          background: nextHot ? 'var(--lf-coral)' : 'var(--lf-cream-card)',
          color: nextHot ? '#fff' : 'var(--lf-espresso-faint)',
          border: nextHot ? 'none' : '1.5px solid var(--lf-cream-line)',
          boxShadow: nextHot ? 'var(--shadow-coral-glow)' : 'none',
          font: '700 18px var(--font-display)', transition: 'background 250ms, color 250ms, box-shadow 250ms',
        }}>
          Next <span aria-hidden="true">▶</span>
        </button>
      </div>
    </KidScreen>
  );
}

/* Breathe-along teaching moment — no mic; completes on its own */
function BreatheAlong({ done, onDone, rm }) {
  const [phase, setPhase] = useState('in');
  useEffect(() => {
    if (rm) { const t = setTimeout(onDone, 600); return () => clearTimeout(t); }
    let n = 0;
    const iv = setInterval(() => {
      n += 1;
      setPhase((p) => (p === 'in' ? 'out' : 'in'));
      if (n >= 4) { clearInterval(iv); onDone(); }
    }, 2600);
    return () => clearInterval(iv);
  }, []);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <div className={done ? '' : 'lf-breathe-slow'} style={{
        width: 96, height: 96, borderRadius: '50%', flexShrink: 0,
        background: 'var(--lf-pastel-mint)', border: '1.5px solid var(--lf-cream-line)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, filter: 'var(--shadow-emoji)',
      }} aria-hidden="true">🫧</div>
      <div>
        <div style={{ font: '700 11px var(--font-body)', color: 'var(--lf-espresso-faint)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>breathe along</div>
        <div style={{ font: '700 21px var(--font-display)', color: 'var(--lf-espresso)' }}>
          {done ? 'Ahhh. All calm.' : phase === 'in' ? 'In…' : 'and out…'}
        </div>
        <div style={{ font: '600 13.5px var(--font-body)', color: 'var(--lf-espresso-soft)', marginTop: 3 }}>
          {done ? 'Miko feels better. You will too.' : 'Follow the circle with your belly.'}
        </div>
      </div>
    </div>
  );
}

/* Teaching moment inside the reading card — mic ≥56px */
function ReaderAsk({ ask, state, onMic, onHint }) {
  if (state === 'praise') {
    return (
      <div className="lf-screen-in" style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--lf-pastel-mint)', borderRadius: 14, padding: '14px 16px' }}>
        <span aria-hidden="true" style={{ fontSize: 26 }}>🎉</span>
        <span style={{ font: '700 17px/1.4 var(--font-body)', color: 'var(--lf-espresso)' }}>{ask.praise}</span>
      </div>
    );
  }
  return (
    <div>
      <div style={{ font: '700 11px var(--font-body)', color: 'var(--lf-espresso-faint)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>{ask.skill}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <BigMic listening={state === 'listening'} onTap={onMic} size={62} />
        <div style={{ flex: 1 }}>
          <div style={{ font: '700 18px/1.4 var(--font-body)', color: 'var(--lf-espresso)' }}>{ask.question}</div>
          {state === 'listening' ? (
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, font: '700 14px var(--font-body)', color: 'var(--lf-coral-deep)' }}>
              <Dots /> Listening…
            </div>
          ) : state === 'hint' ? (
            <div className="lf-screen-in" style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(251,191,36,.18)', borderRadius: 10, padding: '7px 12px', font: '700 14.5px var(--font-body)', color: 'var(--lf-espresso)' }}>
              <span aria-hidden="true">💡</span> {ask.hint}
            </div>
          ) : (
            <button type="button" className="lf-press" onClick={onHint} style={{
              marginTop: 8, border: '1.5px solid var(--lf-cream-line)', background: 'var(--lf-cream-card)', cursor: 'pointer',
              borderRadius: 'var(--radius-pill)', padding: '10px 18px', minHeight: 44,
              font: '700 14px var(--font-body)', color: 'var(--lf-espresso-soft)', display: 'inline-flex', alignItems: 'center', gap: 7,
            }}>
              <span aria-hidden="true">💡</span> Need a little hint?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= 6 · CHAPTER END ================= */
function ChapterEnd({ app }) {
  const { story, chapterIdx } = app.reading;
  const chapter = story.chapters[chapterIdx];
  const recaps = [
    { q: 'How many planks were missing?', praise: 'YES! THREE planks. Great remembering!' },
    { q: 'What held the new bridge up?', praise: "YES! TARA'S WEB — so sturdy!" },
  ];
  const recap = recaps[chapterIdx] || recaps[0];
  const [state, setState] = useState('question');
  const onMic = () => { if (state === 'question') { setState('listening'); setTimeout(() => setState('praise'), app.t.reduceMotion ? 400 : 1500); } };

  return (
    <KidScreen label={`Chapter end — ${chapter.title}`}>
      <Confetti n={10} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18 }}>
          <BuddyFace buddy={app.buddy} size={116} />
          <SpeechBubble big style={{ marginBottom: 18 }}>
            {LF.cp({ b: `WOOHOO! Chapter ${chapterIdx + 1} — done!`, c: `Chapter ${chapterIdx + 1} — done. Lovely reading.` }, app.energy)}
          </SpeechBubble>
        </div>

        <div style={{ width: 620, background: 'var(--lf-cream-card)', border: '1.5px solid var(--lf-cream-line)', borderRadius: 'var(--radius-card)', padding: '20px 24px' }}>
          <ReaderAsk ask={{ skill: 'tell me back', question: recap.q, praise: recap.praise, hint: 'Count with me… one, two…?' }} state={state} onMic={onMic} onHint={() => {}} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, font: '600 15px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
          <span aria-hidden="true">🔊</span> {LF.cp(chapter.hook, app.energy)}
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
          <div style={{ width: 300, opacity: state === 'praise' ? 1 : .45, transition: 'opacity 300ms' }}>
            <MagicButton emoji="" onClick={() => app.openChapter(chapterIdx + 1)}>Next chapter ▶</MagicButton>
          </div>
          <button type="button" className="lf-press" onClick={() => app.nav('home')} style={{
            minHeight: 56, padding: '14px 30px', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
            background: 'var(--lf-cream-card)', border: '1.5px solid var(--lf-cream-line)',
            color: 'var(--lf-espresso-soft)', font: '700 18px var(--font-display)',
          }}>All done for now</button>
        </div>
      </div>
    </KidScreen>
  );
}

/* ================= 7 · BOOK COMPLETE ================= */
function BookComplete({ app }) {
  const { story } = app.reading;
  const isMiko = story.id === 'miko';
  const vocab = LF.WORDS.filter((w) => w.story === story.id);
  const [activeWord, setActiveWord] = useState(null);
  const [rec, setRec] = useState('idle'); // idle | recording | saved
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (rec !== 'recording') return;
    const iv = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(iv);
  }, [rec]);

  return (
    <KidScreen label={`Book complete — ${story.title}`}>
      <Confetti n={22} />
      <div style={{ position: 'absolute', inset: 0, padding: '36px 56px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div className="lf-pop-in" style={{ position: 'relative' }}>
            <span aria-hidden="true" className="lf-mic-pulse" style={{ position: 'absolute', inset: -8, borderRadius: '50%' }}></span>
            <BuddyFace buddy={app.buddy} size={92} />
          </div>
          <div>
            <h1 style={{ margin: 0, font: '700 32px var(--font-display)', color: 'var(--lf-espresso)' }}>
              <span aria-hidden="true" style={{ marginRight: 8 }}>✨</span>
              {LF.cp({ b: 'You read the WHOLE book!', c: 'You read the whole book.' }, app.energy)}
              <span aria-hidden="true" style={{ marginLeft: 8 }}>✨</span>
            </h1>
            <p style={{ margin: '4px 0 0', font: '600 16px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
              <span aria-hidden="true">🔊</span> {story.title} — every single page!
            </p>
          </div>
          <SpeechBubble style={{ marginLeft: 'auto', maxWidth: 300 }}>
            {LF.cp({ b: 'WOOHOO! You read it ALL! I knew you could!', c: 'You read it all. I am so proud of you.' }, app.energy)}
          </SpeechBubble>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 22, flex: 1, minHeight: 0 }}>
          {/* vocab stars */}
          <section style={{ background: 'var(--lf-cream-card)', border: '1.5px solid var(--lf-cream-line)', borderRadius: 'var(--radius-card)', padding: 22 }}>
            <h2 style={{ margin: '0 0 4px', font: 'var(--text-section)', color: 'var(--lf-espresso)' }}>Your star words</h2>
            <p style={{ margin: '0 0 14px', font: '600 13.5px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
              <span aria-hidden="true">🔊</span> Tap a star to hear its word.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {vocab.map((v) => (
                <VocabStar key={v.w} word={v.w} active={activeWord === v.w} onTap={() => setActiveWord(activeWord === v.w ? null : v.w)} />
              ))}
            </div>
            {activeWord && (
              <div className="lf-screen-in" style={{ marginTop: 16, background: 'rgba(251,191,36,.14)', borderRadius: 14, padding: '12px 16px', font: '600 16px/1.5 var(--font-body)', color: 'var(--lf-espresso)' }}>
                <span aria-hidden="true">🔊</span> <strong>{activeWord}</strong> — {vocab.find((v) => v.w === activeWord).mean}
              </div>
            )}
          </section>

          {/* tell it back */}
          <section style={{ background: 'var(--lf-cream-card)', border: '1.5px solid var(--lf-cream-line)', borderRadius: 'var(--radius-card)', padding: 22, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ margin: '0 0 4px', font: 'var(--text-section)', color: 'var(--lf-espresso)' }}>Tell it back!</h2>
            <p style={{ margin: '0 0 10px', font: '600 13.5px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
              <span aria-hidden="true">🔊</span> Tell the story in YOUR words. Mom and Dad will listen tonight.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(isMiko ? ['Who wobbled?', 'What held the bridge?', 'How did Miko say thank you?'] : ['Who was the story about?', 'What was your favorite part?']).map((p) => (
                <span key={p} style={{ background: 'var(--lf-pastel-lilac)', borderRadius: 'var(--radius-scallop)', padding: '6px 13px', font: '700 13px var(--font-body)', color: 'var(--lf-espresso)' }}>{p}</span>
              ))}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
              {rec === 'saved' ? (
                <div className="lf-pop-in" style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--lf-pastel-mint)', borderRadius: 14, padding: '16px 22px', font: '700 18px var(--font-body)', color: 'var(--lf-espresso)' }}>
                  <span aria-hidden="true" style={{ fontSize: 26 }}>💌</span> Saved for Mom and Dad!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{ position: 'relative', width: 96, height: 96 }}>
                    {rec === 'recording' && <span className="lf-ring" style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '3px solid var(--lf-coral)' }}></span>}
                    <button type="button" className={`lf-press ${rec === 'idle' ? 'lf-breathe' : ''}`} aria-label={rec === 'idle' ? 'Start recording' : 'Stop recording'}
                      onClick={() => (rec === 'idle' ? (setSecs(0), setRec('recording')) : setRec('saved'))} style={{
                        width: 96, height: 96, borderRadius: '50%', border: 'none', cursor: 'pointer',
                        background: rec === 'recording' ? 'var(--lf-coral-deep)' : 'var(--lf-coral)', color: '#fff',
                        fontSize: 38, boxShadow: 'var(--shadow-coral-glow)',
                      }}>{rec === 'recording' ? '◼' : '🎙'}</button>
                  </div>
                  <span style={{ font: '700 15px var(--font-body)', color: rec === 'recording' ? 'var(--lf-coral-deep)' : 'var(--lf-espresso-soft)' }}>
                    {rec === 'recording' ? `Recording… 0:${String(secs).padStart(2, '0')}` : 'Tap to tell it!'}
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* badge handoff / done */}
        <footer style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center', minHeight: 64 }}>
          {isMiko ? (
            <>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, font: '700 16px var(--font-display)', color: 'var(--lf-espresso)' }}>
                <Medallion badge={LF.BADGES.find((b) => b.id === 'mikoMaster')} size={46} /> A badge is waiting for you…
              </span>
              <div style={{ width: 250, opacity: rec === 'saved' ? 1 : .45, transition: 'opacity 300ms' }}>
                <MagicButton emoji="" onClick={() => app.earnBadge('mikoMaster')}>Get my badge!</MagicButton>
              </div>
            </>
          ) : (
            <div style={{ width: 250, opacity: rec === 'saved' ? 1 : .45, transition: 'opacity 300ms' }}>
              <MagicButton emoji="" onClick={() => app.nav('home')}>All done!</MagicButton>
            </div>
          )}
        </footer>
      </div>
    </KidScreen>
  );
}

Object.assign(window, { Recap, Reader, ChapterEnd, BookComplete });
