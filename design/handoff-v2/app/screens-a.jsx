/* Little Fables — screens A: buddy carousel, buddy arrival, home, chapter map. */
const { useState, useEffect, useRef } = React;
const { MagicButton } = window.LittleFablesDesignSystem_36f5e7;
const LF = window.LF;

/* ================= 1 · BUDDY CAROUSEL ================= */
function BuddyCarousel({ app }) {
  const [idx, setIdx] = useState(Math.max(0, LF.BUDDIES.findIndex((b) => b.id === app.buddy.id)));
  const total = LF.BUDDIES.length + 1; // + arrival crate
  const isCrate = idx === LF.BUDDIES.length;
  const CARD_W = 340;

  return (
    <KidScreen label="Buddy carousel">
      <header style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 30, gap: 4 }}>
        <img src="assets/logo-tree-ink.png" alt="Little Fables" style={{ height: 44, opacity: .85 }} />
        <h1 style={{ margin: '6px 0 0', font: 'var(--text-greeting)', color: 'var(--lf-espresso)' }}>Pick your story buddy!</h1>
        <p style={{ margin: 0, font: '600 15px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
          <span aria-hidden="true">🔊</span> Tap a friend to hear them say hello.
        </p>
      </header>

      <div style={{ position: 'absolute', top: 128, left: 0, right: 0, bottom: 60, overflow: 'hidden' }}>
        <div style={{
          display: 'flex', gap: 28, alignItems: 'stretch', position: 'absolute', top: 108, left: '50%',
          transform: `translateX(${-CARD_W / 2 - idx * (CARD_W + 28)}px)`,
          transition: 'transform 380ms var(--ease-out)',
        }}>
          {LF.BUDDIES.map((b, i) => (
            <BuddyCard key={b.id} buddy={b} centered={i === idx} app={app} onFocus={() => setIdx(i)} w={CARD_W} />
          ))}
          <CrateCard centered={isCrate} onFocus={() => setIdx(LF.BUDDIES.length)} w={CARD_W} />
        </div>
      </div>

      <RoundBtn glyph="‹" label="Previous buddy" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}
        style={{ position: 'absolute', left: 40, top: '48%' }} />
      <RoundBtn glyph="›" label="Next buddy" onClick={() => setIdx(Math.min(total - 1, idx + 1))} disabled={idx === total - 1}
        style={{ position: 'absolute', right: 40, top: '48%' }} />

      <div style={{ position: 'absolute', bottom: 32, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 9 }}>
        {Array.from({ length: total }).map((_, i) => (
          <button key={i} type="button" aria-label={i === total - 1 ? 'Coming soon' : LF.BUDDIES[i].name} onClick={() => setIdx(i)} style={{
            width: 12, height: 12, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
            background: i === idx ? 'var(--lf-espresso-soft)' : 'var(--lf-cream-line)',
          }}></button>
        ))}
      </div>
    </KidScreen>
  );
}

function BuddyCard({ buddy, centered, app, onFocus, w }) {
  return (
    <div onClick={onFocus} style={{
      width: w, borderRadius: 'var(--radius-hero)', background: 'var(--lf-cream-card)',
      border: '1.5px solid var(--lf-cream-line)', boxShadow: centered ? 'var(--shadow-warm-lg)' : 'none',
      padding: '86px 26px 26px', position: 'relative', textAlign: 'center', cursor: 'pointer',
      opacity: centered ? 1 : .5, transform: centered ? 'scale(1)' : 'scale(.92)',
      transition: 'opacity 300ms, transform 300ms', display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {centered && (
        <SpeechBubble tail="bottom" style={{ position: 'absolute', top: -66, left: 18, right: 18, maxWidth: 'none', textAlign: 'left', font: '700 14.5px/1.4 var(--font-body)', zIndex: 5 }}>
          {LF.cp(buddy.intro, app.energy)}
        </SpeechBubble>
      )}
      <BuddyFace buddy={buddy} size={128} />
      <h2 style={{ margin: '14px 0 2px', font: '700 26px var(--font-display)', color: 'var(--lf-espresso)' }}>{buddy.name}</h2>
      <p style={{ margin: '0 0 10px', font: '600 14px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>{buddy.trait}</p>
      <NatureTag nature={buddy.nature} />
      <div style={{ marginTop: 16, width: 200, visibility: centered ? 'visible' : 'hidden' }}>
        <MagicButton emoji="" size="sm" onClick={() => app.pickBuddy(buddy)} style={{ padding: '13px 20px' }}>Pick me!</MagicButton>
      </div>
    </div>
  );
}

function CrateCard({ centered, onFocus, w }) {
  return (
    <div onClick={onFocus} style={{
      width: w, borderRadius: 'var(--radius-hero)', background: 'var(--lf-cream-card)',
      border: '1.5px dashed var(--lf-cream-line)', padding: '86px 26px 26px', textAlign: 'center',
      opacity: centered ? 1 : .5, transform: centered ? 'scale(1)' : 'scale(.92)',
      transition: 'opacity 300ms, transform 300ms', cursor: 'pointer', position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {centered && (
        <SpeechBubble tail="bottom" style={{ position: 'absolute', top: -48, left: 40, right: 40, maxWidth: 'none', font: '700 14.5px/1.4 var(--font-body)', zIndex: 5 }}>
          Shhh… something is inside!
        </SpeechBubble>
      )}
      <div className="lf-wiggle" style={{ fontSize: 108, lineHeight: 1, filter: 'var(--shadow-emoji)' }} aria-hidden="true">📦</div>
      <h2 style={{ margin: '18px 0 4px', font: '700 22px var(--font-display)', color: 'var(--lf-espresso)' }}>A new buddy is coming</h2>
      <p style={{ margin: 0, font: '600 15px/1.5 var(--font-body)', color: 'var(--lf-espresso-soft)' }}>Read 2 more days!</p>
      <div style={{ marginTop: 14, display: 'inline-flex', gap: 6 }}>
        {[1, 2].map((i) => (
          <span key={i} style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px solid var(--lf-cream-line)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, opacity: .35 }} aria-hidden="true">☀️</span>
        ))}
      </div>
    </div>
  );
}

/* ================= 2 · BUDDY ARRIVAL (three beats) ================= */
function BuddyArrival({ app }) {
  const [beat, setBeat] = useState(0);
  const newBuddy = LF.BUDDIES.find((b) => b.id === 'rusty');
  const beats = [
    { bubble: 'Something is bumping around in there…', cta: "What's inside?" },
    { bubble: 'CRACK! One more reading day did it!', cta: 'Open it up!' },
    { bubble: LF.cp(newBuddy.intro, app.energy), cta: 'Say hi, Rusty!' },
  ];
  return (
    <KidScreen label={`Buddy arrival — beat ${beat + 1}`}>
      {beat === 2 && <Confetti n={16} />}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 2 }} aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i <= beat ? 'var(--lf-espresso-soft)' : 'var(--lf-cream-line)' }}></span>
          ))}
        </div>

        <div style={{ position: 'relative', height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {beat < 2 ? (
            <div className={beat === 0 ? 'lf-wiggle' : 'lf-shudder'} style={{ fontSize: 190, lineHeight: 1, filter: 'var(--shadow-emoji)', position: 'relative' }} aria-hidden="true">
              📦
              {beat === 1 && <span style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', fontSize: 60 }}>⚡</span>}
            </div>
          ) : (
            <div className="lf-pop-in"><BuddyFace buddy={newBuddy} size={200} tag /></div>
          )}
        </div>

        {beat === 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ font: '700 14px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>Reading days</span>
            {[1, 2].map((i) => (
              <span key={i} style={{ fontSize: 22, opacity: 1 }} aria-hidden="true">☀️</span>
            ))}
            <span style={{ font: '700 14px var(--font-body)', color: 'var(--lf-espresso)' }}>2 of 2 — it's time!</span>
          </div>
        )}

        <SpeechBubble tail="bottom" big style={{ textAlign: 'center', maxWidth: 520 }}>
          {beat === 2 && <strong style={{ display: 'block', font: '700 24px var(--font-display)', marginBottom: 4 }}>Rusty is here!</strong>}
          {beats[beat].bubble}
        </SpeechBubble>

        <div style={{ width: 280 }}>
          <MagicButton emoji="" onClick={() => (beat < 2 ? setBeat(beat + 1) : app.nav('home'))}>{beats[beat].cta}</MagicButton>
        </div>
      </div>
    </KidScreen>
  );
}

/* ================= 3 · HOME ================= */
function Home({ app }) {
  const miko = LF.STORIES.miko;
  const shelfEmpty = app.t.emptyShelf;
  return (
    <KidScreen label="Home">
      {app.t.offline && (
        <div className="lf-screen-in" style={{
          position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 40,
          background: 'var(--lf-pastel-peach)', borderRadius: 'var(--radius-pill)', padding: '9px 20px',
          font: '700 14px var(--font-body)', color: 'var(--lf-espresso)', boxShadow: 'var(--shadow-warm)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span aria-hidden="true">☁️</span> No internet — your saved stories still work!
        </div>
      )}

      {/* (a) Buddy header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '30px 48px 0' }}>
        <button type="button" className="lf-press" aria-label="Change buddy" onClick={() => app.nav('carousel')}
          style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>
          <BuddyFace buddy={app.buddy} size={92} />
        </button>
        <SpeechBubble style={{ font: '700 17px/1.45 var(--font-body)' }}>{app.buddy.memory}</SpeechBubble>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ font: '700 13px var(--font-body)', color: 'var(--lf-espresso-soft)', marginBottom: 6 }}>My reading suns</div>
          <SunRow />
        </div>
      </header>

      <main style={{ position: 'absolute', top: 150, left: 48, right: 48, bottom: 80, display: 'grid', gridTemplateColumns: '1fr 340px', gridTemplateRows: 'auto 1fr', gap: '18px 22px' }}>
        {/* (b) Continue */}
        <section aria-label="Continue reading" style={{
          background: 'var(--lf-cream-card)', border: '1.5px solid var(--lf-cream-line)', borderRadius: 'var(--radius-card)',
          padding: 18, display: 'flex', gap: 20, alignItems: 'center', boxShadow: 'var(--shadow-warm)',
        }}>
          <WashScene wash={miko.wash} emojis={['🦊', '🌉']} slot="miko-cover" slotLabel="Square cover" style={{ width: 190, height: 150, borderRadius: 'var(--radius-cover)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: '700 12px var(--font-body)', color: 'var(--lf-espresso-faint)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Keep going</div>
            <h2 style={{ margin: '4px 0 6px', font: '700 25px/1.15 var(--font-display)', color: 'var(--lf-espresso)' }}>{miko.title}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, font: '600 14px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
              <ChapterDots chapters={miko.chapters} />
              Chapter 3 · Crossing Day
            </div>
            <p style={{ margin: '10px 0 0', font: '600 14px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>{LF.cp(LF.quest, app.energy)}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative', width: 64, height: 64 }}>
              <ProgressRing value={miko.progress} size={64} stroke={6} />
              <button type="button" className="lf-press" aria-label="Continue the story" onClick={() => app.nav('recap')} style={{
                position: 'absolute', inset: 7, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: 'var(--lf-coral)', color: '#fff', fontSize: 21, boxShadow: 'var(--shadow-coral-glow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>▶</button>
            </div>
            <span style={{ font: '700 12.5px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>Read!</span>
          </div>
        </section>

        {/* (c) My World strip */}
        <section aria-label="My world" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button type="button" className="lf-press" onClick={() => app.nav('badges')} style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left',
            background: 'var(--lf-cream-card)', border: '1.5px solid var(--lf-cream-line)', borderRadius: 'var(--radius-card)',
            padding: '8px 14px 8px 8px', boxShadow: 'var(--shadow-warm)',
          }}>
            <span style={{ width: 54, height: 54, borderRadius: 16, background: 'var(--lf-pastel-lilac)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Medallion badge={LF.BADGES[0]} size={40} />
            </span>
            <span style={{ font: '700 15px var(--font-display)', color: 'var(--lf-espresso)' }}>
              My badges <span style={{ font: '600 13px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>· {2 + app.earned.length}</span>
            </span>
            <span aria-hidden="true" style={{ marginLeft: 'auto', color: 'var(--lf-espresso-faint)', fontSize: 18 }}>›</span>
          </button>
          <button type="button" className="lf-press" onClick={() => app.nav('words')} style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left',
            background: 'var(--lf-cream-card)', border: '1.5px solid var(--lf-cream-line)', borderRadius: 'var(--radius-card)',
            padding: '8px 14px 8px 8px', boxShadow: 'var(--shadow-warm)',
          }}>
            <span style={{ width: 54, height: 54, borderRadius: 16, background: 'var(--lf-pastel-mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 26, filter: 'var(--shadow-emoji)' }} aria-hidden="true">⭐</span>
            <span style={{ font: '700 15px var(--font-display)', color: 'var(--lf-espresso)' }}>
              My words <span style={{ font: '600 13px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>· {LF.WORDS.length}</span>
            </span>
            <span aria-hidden="true" style={{ marginLeft: 'auto', color: 'var(--lf-espresso-faint)', fontSize: 18 }}>›</span>
          </button>
        </section>

        {/* (d) Bookshelf */}
        <section aria-label="Bookshelf" style={{ gridColumn: '1 / -1', minHeight: 0 }}>
          {shelfEmpty ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, border: '1.5px dashed var(--lf-cream-line)', borderRadius: 'var(--radius-card)' }}>
              <span aria-hidden="true" style={{ fontSize: 54, filter: 'var(--shadow-emoji)' }}>📚</span>
              <p style={{ margin: 0, font: '700 17px var(--font-display)', color: 'var(--lf-espresso)' }}>Your shelf is warming up</p>
              <p style={{ margin: 0, font: '600 14px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>New stories appear here when Mom and Dad finish making them ✦</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'min-content min-content', gap: '10px 22px', height: '100%', alignContent: 'start' }}>
              <div>
                <h3 style={{ margin: '0 0 10px', font: 'var(--text-section)', color: 'var(--lf-espresso)' }}>Chapter books</h3>
                <div style={{ display: 'flex', gap: 16 }}>
                  <MatCover story={LF.STORIES.miko} ring={LF.STORIES.miko.progress} onClick={() => app.nav('map')} />
                  <div aria-label="A story being written" style={{
                    border: '1.5px dashed var(--lf-cream-line)', borderRadius: 'var(--radius-cover)', padding: 9,
                    display: 'flex', flexDirection: 'column', flexShrink: 0,
                  }}>
                    <div style={{ width: 128, height: 128, borderRadius: 12, background: 'var(--lf-cream-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <span aria-hidden="true" style={{ fontSize: 34, opacity: .5 }}>✎</span>
                      <span className="lf-writing-dots" style={{ display: 'inline-flex', gap: 4 }} aria-hidden="true">
                        {[0, 1, 2].map((i) => <span key={i} className="lf-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--lf-espresso-faint)', animationDelay: `${i * .25}s` }}></span>)}
                      </span>
                    </div>
                    <div style={{ width: 128, marginTop: 7 }}>
                      <div style={{ font: '700 14px/1.25 var(--font-display)', color: 'var(--lf-espresso-faint)' }}>The Cave Door</div>
                      <div style={{ font: 'var(--text-meta)', color: 'var(--lf-espresso-faint)', marginTop: 2 }}>Mom is writing it… ✦</div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 style={{ margin: '0 0 10px', font: 'var(--text-section)', color: 'var(--lf-espresso)' }}>Quick stories</h3>
                <div style={{ display: 'flex', gap: 16 }}>
                  <MatCover story={LF.STORIES.azi} onClick={() => app.openQuick('azi')} />
                  <MatCover story={LF.STORIES.jujy} onClick={() => app.openQuick('jujy')} />
                </div>
              </div>
              <p style={{ gridColumn: '1 / -1', margin: 0, font: '600 13.5px var(--font-body)', color: 'var(--lf-espresso-faint)' }}>
                New stories appear here when Mom and Dad finish making them ✦
              </p>
            </div>
          )}
        </section>
      </main>

      <NavPill active="home" nav={app.nav} />

      {app.t.storyError && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'var(--surface-scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="lf-pop-in" data-screen-label="Story error" style={{
            background: 'var(--lf-cream)', borderRadius: 'var(--radius-hero)', padding: '34px 40px',
            width: 460, textAlign: 'center', boxShadow: 'var(--shadow-warm-lg)',
          }}>
            <span aria-hidden="true" style={{ fontSize: 64, filter: 'var(--shadow-emoji)' }}>🫧</span>
            <h2 style={{ margin: '12px 0 6px', font: '700 24px var(--font-display)', color: 'var(--lf-espresso)' }}>The story machine hiccuped.</h2>
            <p style={{ margin: '0 0 20px', font: '600 16px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
              <span aria-hidden="true">🔊</span> Hic! Let's give it one more try.
            </p>
            <div style={{ width: 240, margin: '0 auto' }}>
              <MagicButton emoji="" onClick={() => app.setTweak('storyError', false)}>Try again!</MagicButton>
            </div>
          </div>
        </div>
      )}
    </KidScreen>
  );
}

/* ================= 4 · CHAPTER MAP ================= */
function ChapterMap({ app }) {
  const miko = LF.STORIES.miko;
  const stops = miko.chapters;
  const pos = [ { x: 130, y: 430 }, { x: 420, y: 250 }, { x: 700, y: 430 }, { x: 985, y: 260 } ];
  return (
    <KidScreen label="Chapter map">
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '26px 44px 0' }}>
        <RoundBtn glyph="‹" label="Back home" size={52} onClick={() => app.nav('home')} />
        <div>
          <h1 style={{ margin: 0, font: '700 27px var(--font-display)', color: 'var(--lf-espresso)' }}>{miko.title}</h1>
          <p style={{ margin: '2px 0 0', font: '600 14px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
            <span aria-hidden="true">🔊</span> Tap a story stop. Finished ones love a re-read!
          </p>
        </div>
        <span style={{ marginLeft: 'auto' }}><ChapterDots chapters={stops} style={{ fontSize: 16 }} /></span>
      </header>

      <svg aria-hidden="true" viewBox="0 0 1180 820" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <path d={`M ${pos[0].x + 60} ${pos[0].y + 40} C 240 560, 330 300, ${pos[1].x + 60} ${pos[1].y + 60} S 620 560, ${pos[2].x + 60} ${pos[2].y + 40} S 940 300, ${pos[3].x + 50} ${pos[3].y + 70}`}
          fill="none" stroke="var(--lf-espresso-faint)" strokeWidth="3.5" strokeDasharray="2 14" strokeLinecap="round" opacity=".55"></path>
      </svg>

      {stops.map((ch, i) => {
        const p = pos[i];
        if (ch.status === 'painting') {
          return (
            <div key={i} style={{ position: 'absolute', left: p.x, top: p.y, width: 150, textAlign: 'center' }}>
              <div style={{ width: 110, height: 110, margin: '0 auto', borderRadius: 'var(--radius-cover)', border: '2px dashed var(--lf-cream-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, opacity: .45 }} aria-hidden="true">
                <span style={{ filter: 'grayscale(1)' }}>📕</span>
              </div>
              <div style={{ marginTop: 8, font: '700 14px var(--font-display)', color: 'var(--lf-espresso-faint)' }}>Not yet…</div>
              <div style={{ font: '600 12px/1.4 var(--font-body)', color: 'var(--lf-espresso-faint)' }}>Mom is still painting this one ✦</div>
            </div>
          );
        }
        const current = ch.status === 'current';
        return (
          <div key={i} style={{ position: 'absolute', left: p.x, top: p.y, width: current ? 190 : 150, textAlign: 'center' }}>
            {current && <BuddyFace buddy={app.buddy} size={72} style={{ position: 'absolute', left: -62, bottom: 42, zIndex: 2 }} />}
            <button type="button" className="lf-press" onClick={() => app.openChapter(i)} style={{
              position: 'relative', width: current ? 150 : 110, height: current ? 150 : 110, margin: '0 auto',
              borderRadius: 'var(--radius-cover)', border: '1.5px solid var(--lf-cream-line)', cursor: 'pointer',
              background: 'var(--lf-cream-card)', padding: 7, boxShadow: current ? 'var(--shadow-warm-lg)' : 'var(--shadow-warm)', display: 'block',
            }}>
              <WashScene wash={ch.wash} emojis={ch.emojis} slot={ch.slot} slotLabel={ch.title} doodle={false} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
              {ch.status === 'done' && (
                <span style={{ position: 'absolute', top: -8, right: -8, width: 34, height: 34, borderRadius: '50%', background: 'var(--lf-pastel-mint)', border: '2px solid var(--lf-cream-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 16px var(--font-body)', color: 'var(--lf-espresso)' }}>✓</span>
              )}
              {current && (
                <span className="lf-mic-pulse" style={{ position: 'absolute', right: -14, bottom: -14, width: 58, height: 58, borderRadius: '50%', background: 'var(--lf-coral)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: 'var(--shadow-coral-glow)' }} aria-hidden="true">▶</span>
              )}
            </button>
            <div style={{ marginTop: 10, font: `700 ${current ? 17 : 14.5}px var(--font-display)`, color: current ? 'var(--lf-espresso)' : 'var(--lf-espresso-soft)' }}>
              {i + 1}. {ch.title}
            </div>
            {current && <div style={{ font: '600 12.5px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>You are here!</div>}
          </div>
        );
      })}

      <NavPill active="home" nav={app.nav} />
    </KidScreen>
  );
}

Object.assign(window, { BuddyCarousel, BuddyArrival, Home, ChapterMap });
