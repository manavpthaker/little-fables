/* Little Fables — screens C: badge earning, badge shelf, my words, portrait mocks. */
const { useState, useEffect } = React;
const { MagicButton } = window.LittleFablesDesignSystem_36f5e7;
const LF = window.LF;

/* ================= 8a · BADGE EARNING ================= */
function BadgeEarn({ app }) {
  const badge = LF.BADGES.find((b) => b.id === (app.justEarned || 'mikoMaster'));
  return (
    <KidScreen label={`Badge earning — ${badge.name}`}>
      <Confetti n={20} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        <div className="lf-pop-in"><Medallion badge={badge} size={220} /></div>
        <h1 style={{ margin: 0, font: '700 36px var(--font-display)', color: 'var(--lf-espresso)' }}>{badge.name}!</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <BuddyFace buddy={app.buddy} size={68} />
          <SpeechBubble>{LF.cp(badge.earnLine || { b: badge.line, c: badge.line }, app.energy)}</SpeechBubble>
        </div>
        <div style={{ width: 260, marginTop: 6 }}>
          <MagicButton emoji="" onClick={() => app.nav('badges')}>Keep going!</MagicButton>
        </div>
      </div>
    </KidScreen>
  );
}

/* ================= 8b · BADGE SHELF ================= */
function BadgeShelf({ app }) {
  const isEarned = (b) => b.earned || app.earned.includes(b.id);
  return (
    <KidScreen label="Badge shelf">
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '26px 48px 0' }}>
        <RoundBtn glyph="‹" label="Back home" size={52} onClick={() => app.nav('home')} />
        <div>
          <h1 style={{ margin: 0, font: '700 27px var(--font-display)', color: 'var(--lf-espresso)' }}>My badges</h1>
          <p style={{ margin: '2px 0 0', font: '600 14px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
            <span aria-hidden="true">🔊</span> Every badge remembers something you did.
          </p>
        </div>
      </header>
      <div style={{ position: 'absolute', top: 140, left: 48, right: 48, bottom: 90, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 22, alignItems: 'start' }}>
        {LF.BADGES.map((b) => {
          const earned = isEarned(b);
          return (
            <div key={b.id} style={{
              background: 'var(--lf-cream-card)', border: earned ? '1.5px solid var(--lf-cream-line)' : '1.5px dashed var(--lf-cream-line)',
              borderRadius: 'var(--radius-card)', padding: '24px 18px', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              boxShadow: earned ? 'var(--shadow-warm)' : 'none',
            }}>
              <Medallion badge={b} size={116} silhouette={!earned} />
              <div style={{ font: '700 18px var(--font-display)', color: earned ? 'var(--lf-espresso)' : 'var(--lf-espresso-faint)' }}>{b.name}</div>
              <div style={{ font: '600 13.5px/1.5 var(--font-body)', color: 'var(--lf-espresso-soft)', textWrap: 'balance' }}>
                {earned ? b.line || (b.earnLine && LF.cp(b.earnLine, app.energy)) : b.how}
              </div>
            </div>
          );
        })}
      </div>
      <NavPill active="home" nav={app.nav} />
    </KidScreen>
  );
}

/* ================= 9 · MY WORDS ================= */
function MyWords({ app }) {
  const [open, setOpen] = useState(null);
  const openWord = open != null ? LF.WORDS[open] : null;
  return (
    <KidScreen label="My words">
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '26px 48px 0' }}>
        <RoundBtn glyph="‹" label="Back home" size={52} onClick={() => app.nav('home')} />
        <div>
          <h1 style={{ margin: 0, font: '700 27px var(--font-display)', color: 'var(--lf-espresso)' }}>My words</h1>
          <p style={{ margin: '2px 0 0', font: '600 14px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
            <span aria-hidden="true">🔊</span> {LF.WORDS.length} star words — tap one to hear it!
          </p>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 34, filter: 'var(--shadow-emoji)' }} aria-hidden="true">⭐</span>
      </header>

      <div style={{ position: 'absolute', top: 136, left: 48, right: 48, bottom: 90, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: 'min-content', gap: 18 }}>
        {LF.WORDS.map((v, i) => {
          const story = LF.STORIES[v.story];
          return (
            <button key={v.w} type="button" className="lf-press" onClick={() => setOpen(i)} style={{
              background: 'var(--lf-cream-card)', border: '1.5px solid var(--lf-cream-line)', borderRadius: 'var(--radius-card)',
              padding: '18px 16px 14px', cursor: 'pointer', textAlign: 'left', boxShadow: 'var(--shadow-warm)',
              display: 'flex', flexDirection: 'column', gap: 10, minHeight: 44,
            }}>
              <span style={{ font: '700 23px var(--font-display)', color: 'var(--lf-espresso)' }}>
                <span aria-hidden="true" style={{ fontSize: 15, marginRight: 6 }}>⭐</span>{v.w}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <WashScene wash={story.wash} img={story.coverImg} emojis={story.coverEmoji ? [story.coverEmoji] : []} doodle={false}
                  style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0 }} />
                <span style={{ font: '600 12px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>{story.title}</span>
              </span>
            </button>
          );
        })}
      </div>

      {openWord && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'var(--surface-scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setOpen(null)}>
          <div className="lf-pop-in" onClick={(e) => e.stopPropagation()} style={{
            width: 480, background: 'var(--lf-cream)', borderRadius: 'var(--radius-hero)', padding: '30px 34px',
            boxShadow: 'var(--shadow-warm-lg)', textAlign: 'center',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <button type="button" className="lf-press lf-mic-pulse" aria-label={`Hear ${openWord.w}`} style={{
                width: 60, height: 60, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: 'var(--lf-coral)', color: '#fff', fontSize: 24, boxShadow: 'var(--shadow-coral-glow)',
              }}>🔊</button>
            </div>
            <h2 style={{ margin: 0, font: '700 34px var(--font-display)', color: 'var(--lf-espresso)' }}>{openWord.w}</h2>
            <p style={{ margin: '2px 0 8px', font: '600 14px var(--font-body)', color: 'var(--lf-espresso-faint)' }}>say it: {openWord.say}</p>
            <p style={{ margin: 0, font: '600 19px/1.55 var(--font-body)', color: 'var(--lf-espresso)' }}>{openWord.mean}</p>
            <p style={{ margin: '14px 0 0', font: '600 13px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
              from {LF.STORIES[openWord.story].title} · tap anywhere to close
            </p>
          </div>
        </div>
      )}
      <NavPill active="home" nav={app.nav} />
    </KidScreen>
  );
}

/* ================= PORTRAIT MOCKS (820×1180) ================= */
function PortraitHome({ app }) {
  const miko = LF.STORIES.miko;
  return (
    <KidScreen label="Portrait — Home">
      <header style={{ padding: '30px 36px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <BuddyFace buddy={app.buddy} size={84} />
          <SpeechBubble style={{ font: '700 16px/1.45 var(--font-body)' }}>{app.buddy.memory}</SpeechBubble>
        </div>
        <SunRow size={34} style={{ justifyContent: 'center' }} />
      </header>

      <main style={{ position: 'absolute', top: 190, left: 36, right: 36, bottom: 84, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <section style={{ background: 'var(--lf-cream-card)', border: '1.5px solid var(--lf-cream-line)', borderRadius: 'var(--radius-card)', padding: 16, display: 'flex', gap: 16, alignItems: 'center', boxShadow: 'var(--shadow-warm)' }}>
          <WashScene wash={miko.wash} emojis={['🦊', '🌉']} style={{ width: 130, height: 110, borderRadius: 'var(--radius-cover)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ font: '700 11px var(--font-body)', color: 'var(--lf-espresso-faint)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Keep going</div>
            <div style={{ font: '700 20px/1.15 var(--font-display)', color: 'var(--lf-espresso)', margin: '3px 0 5px' }}>{miko.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: '600 13px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>
              <ChapterDots chapters={miko.chapters} /> Ch. 3 · Crossing Day
            </div>
          </div>
          <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
            <ProgressRing value={miko.progress} size={60} stroke={6} />
            <span style={{ position: 'absolute', inset: 7, borderRadius: '50%', background: 'var(--lf-coral)', color: '#fff', fontSize: 19, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-coral-glow)' }} aria-hidden="true">▶</span>
          </div>
        </section>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--lf-pastel-lilac)', borderRadius: 'var(--radius-card)', padding: '10px 14px' }}>
            <span style={{ display: 'flex' }}>
              {LF.BADGES.filter((b) => b.earned).slice(0, 3).map((b, i) => (
                <span key={b.id} style={{ marginLeft: i ? -9 : 0 }}><Medallion badge={b} size={38} /></span>
              ))}
            </span>
            <span style={{ font: '700 14px var(--font-display)', color: 'var(--lf-espresso)' }}>Badges · 2</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--lf-pastel-mint)', borderRadius: 'var(--radius-card)', padding: '10px 14px' }}>
            <span aria-hidden="true" style={{ fontSize: 24 }}>⭐</span>
            <span style={{ font: '700 14px var(--font-display)', color: 'var(--lf-espresso)' }}>Words · {LF.WORDS.length}</span>
          </div>
        </div>

        <section style={{ flex: 1, minHeight: 0 }}>
          <h3 style={{ margin: '4px 0 10px', font: 'var(--text-section)', color: 'var(--lf-espresso)' }}>Chapter books</h3>
          <div style={{ display: 'flex', gap: 14 }}>
            <MatCover story={LF.STORIES.miko} size={140} ring={miko.progress} />
          </div>
          <h3 style={{ margin: '18px 0 10px', font: 'var(--text-section)', color: 'var(--lf-espresso)' }}>Quick stories</h3>
          <div style={{ display: 'flex', gap: 14 }}>
            <MatCover story={LF.STORIES.azi} size={140} />
            <MatCover story={LF.STORIES.jujy} size={140} />
          </div>
          <p style={{ margin: '16px 0 0', font: '600 13px var(--font-body)', color: 'var(--lf-espresso-faint)' }}>
            New stories appear here when Mom and Dad finish making them ✦
          </p>
        </section>
      </main>
      <NavPill active="home" nav={app.nav} />
    </KidScreen>
  );
}

function PortraitMap({ app }) {
  const stops = LF.STORIES.miko.chapters;
  const pos = [ { x: 110, y: 880 }, { x: 420, y: 680 }, { x: 150, y: 430 }, { x: 430, y: 200 } ];
  return (
    <KidScreen label="Portrait — Chapter map">
      <header style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '26px 32px 0' }}>
        <RoundBtn glyph="‹" label="Back" size={50} onClick={() => app.nav('portraitHome')} />
        <h1 style={{ margin: 0, font: '700 23px var(--font-display)', color: 'var(--lf-espresso)' }}>Miko and the Wobbly Bridge</h1>
      </header>
      <svg aria-hidden="true" viewBox="0 0 820 1180" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <path d="M 180 960 C 380 940, 520 850, 490 760 S 260 560, 220 510 S 480 330, 500 280"
          fill="none" stroke="var(--lf-espresso-faint)" strokeWidth="3.5" strokeDasharray="2 14" strokeLinecap="round" opacity=".55"></path>
      </svg>
      {stops.map((ch, i) => {
        const p = pos[i];
        if (ch.status === 'painting') {
          return (
            <div key={i} style={{ position: 'absolute', left: p.x, top: p.y, width: 150, textAlign: 'center' }}>
              <div style={{ width: 104, height: 104, margin: '0 auto', borderRadius: 'var(--radius-cover)', border: '2px dashed var(--lf-cream-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, opacity: .45 }} aria-hidden="true"><span style={{ filter: 'grayscale(1)' }}>📕</span></div>
              <div style={{ marginTop: 8, font: '700 13px var(--font-display)', color: 'var(--lf-espresso-faint)' }}>Not yet…</div>
            </div>
          );
        }
        const current = ch.status === 'current';
        return (
          <div key={i} style={{ position: 'absolute', left: p.x, top: p.y, width: current ? 210 : 160, textAlign: 'center' }}>
            {current && <BuddyFace buddy={app.buddy} size={66} style={{ position: 'absolute', left: -52, bottom: 50, zIndex: 2 }} />}
            <div style={{ position: 'relative', width: current ? 150 : 112, height: current ? 150 : 112, margin: '0 auto', borderRadius: 'var(--radius-cover)', border: '1.5px solid var(--lf-cream-line)', background: 'var(--lf-cream-card)', padding: 7, boxShadow: current ? 'var(--shadow-warm-lg)' : 'var(--shadow-warm)' }}>
              <WashScene wash={ch.wash} emojis={ch.emojis} doodle={false} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
              {ch.status === 'done' && (
                <span style={{ position: 'absolute', top: -8, right: -8, width: 32, height: 32, borderRadius: '50%', background: 'var(--lf-pastel-mint)', border: '2px solid var(--lf-cream-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 15px var(--font-body)', color: 'var(--lf-espresso)' }}>✓</span>
              )}
              {current && (
                <span style={{ position: 'absolute', right: -12, bottom: -12, width: 54, height: 54, borderRadius: '50%', background: 'var(--lf-coral)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: 'var(--shadow-coral-glow)' }} aria-hidden="true">▶</span>
              )}
            </div>
            <div style={{ marginTop: 8, font: `700 ${current ? 16 : 13.5}px var(--font-display)`, color: current ? 'var(--lf-espresso)' : 'var(--lf-espresso-soft)' }}>{i + 1}. {ch.title}</div>
          </div>
        );
      })}
      <NavPill active="home" nav={app.nav} />
    </KidScreen>
  );
}

/* ================= DESIGNER NOTE · BUDDY ART DIRECTION ================= */
function BearSampleSVG({ size = 240 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 240 240" role="img" aria-label="Bear — ink-and-wash style sample">
      <defs>
        <radialGradient id="bw-body" cx="38%" cy="30%" r="85%">
          <stop offset="0%" stopColor="#e8c894" stopOpacity=".9"></stop>
          <stop offset="55%" stopColor="#d9a05b" stopOpacity=".55"></stop>
          <stop offset="100%" stopColor="#b97f3e" stopOpacity=".35"></stop>
        </radialGradient>
        <radialGradient id="bw-muzzle" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#fffdf6" stopOpacity=".95"></stop>
          <stop offset="100%" stopColor="#f0dfbc" stopOpacity=".8"></stop>
        </radialGradient>
        <radialGradient id="bw-scarf" cx="40%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#b9c6ab" stopOpacity=".95"></stop>
          <stop offset="100%" stopColor="#a8b59a" stopOpacity=".7"></stop>
        </radialGradient>
      </defs>
      {/* loose wash spill behind */}
      <ellipse cx="124" cy="140" rx="92" ry="78" fill="#93aebd" opacity=".14"></ellipse>
      {/* body */}
      <path d="M70 168c-6-34 14-62 50-64 38-2 58 26 52 62-4 26-24 40-52 40s-46-16-50-38z" fill="url(#bw-body)"></path>
      <path d="M72 166c-5-32 14-58 48-60 36-2 56 24 50 58-4 25-22 38-50 38s-44-15-48-36z" fill="none" stroke="#1c2527" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="1 0" opacity=".9"></path>
      {/* ears */}
      <circle cx="84" cy="78" r="18" fill="url(#bw-body)"></circle>
      <circle cx="160" cy="74" r="17" fill="url(#bw-body)"></circle>
      <path d="M70 82c-2-12 6-21 15-21m68 16c-1-11 6-19 15-18" fill="none" stroke="#1c2527" strokeWidth="2.6" strokeLinecap="round"></path>
      <circle cx="86" cy="79" r="7" fill="#b97f3e" opacity=".4"></circle>
      <circle cx="158" cy="75" r="6.5" fill="#b97f3e" opacity=".4"></circle>
      {/* head */}
      <path d="M78 110c-4-28 18-46 44-46s48 18 44 46c-3 24-20 36-44 36s-41-12-44-36z" fill="url(#bw-body)"></path>
      <path d="M80 108c-3-26 17-42 42-42s46 16 42 42c-3 22-19 34-42 34s-39-12-42-34z" fill="none" stroke="#1c2527" strokeWidth="2.8" strokeLinecap="round"></path>
      {/* muzzle */}
      <ellipse cx="122" cy="122" rx="26" ry="20" fill="url(#bw-muzzle)"></ellipse>
      <path d="M114 112c6-3 12-3 17 0" stroke="#1c2527" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity=".35"></path>
      {/* face ink */}
      <circle cx="104" cy="102" r="4.2" fill="#1c2527"></circle>
      <circle cx="142" cy="100" r="4.2" fill="#1c2527"></circle>
      <path d="M116 118c4 4 9 4 13 0" stroke="#1c2527" strokeWidth="2.8" fill="none" strokeLinecap="round"></path>
      <path d="M122 118v7" stroke="#1c2527" strokeWidth="2.8" strokeLinecap="round"></path>
      <path d="M115 111a8 6 0 0 1 14 0c-2 4-12 4-14 0z" fill="#1c2527"></path>
      {/* blush */}
      <ellipse cx="96" cy="116" rx="7" ry="4.5" fill="#e88a7a" opacity=".35"></ellipse>
      <ellipse cx="150" cy="114" rx="7" ry="4.5" fill="#e88a7a" opacity=".35"></ellipse>
      {/* scarf */}
      <path d="M92 150c18 12 42 12 60 0l4 12c-21 13-47 13-68 0z" fill="url(#bw-scarf)"></path>
      <path d="M92 150c18 12 42 12 60 0m4 12c-21 13-47 13-68 0" fill="none" stroke="#1c2527" strokeWidth="2.4" strokeLinecap="round" opacity=".85"></path>
      <path d="M138 160l6 26c1 5 8 5 9 0l3-20" fill="url(#bw-scarf)" stroke="#1c2527" strokeWidth="2.2" strokeLinecap="round"></path>
      {/* paws */}
      <path d="M92 196c-8 4-8 12 0 12 6 0 10-3 12-8m36-4c8 4 8 12 0 12-6 0-10-3-12-8" fill="url(#bw-body)" stroke="#1c2527" strokeWidth="2.4" strokeLinecap="round"></path>
      {/* pencil doodles */}
      <path d="M40 60c4-2 8-2 12 0M196 190c4-2 8-2 12 0" stroke="#1c2527" strokeWidth="1.6" opacity=".25" fill="none" strokeLinecap="round"></path>
      <text x="196" y="56" fontSize="15" fill="#1c2527" opacity=".2">✦</text>
    </svg>
  );
}

function ArtNote({ app }) {
  const swatches = [
    ['#f7f1e3', 'cream paper'], ['#1c2527', 'charcoal ink'], ['#a8b59a', 'sage'],
    ['#93aebd', 'dusty blue'], ['#d9a05b', 'ochre'],
  ];
  return (
    <div data-screen-label="Designer note — buddy art direction" className="lf-screen-in" style={{ position: 'absolute', inset: 0, background: 'var(--lf-p-muted)', fontFamily: 'var(--font-ui)', color: 'var(--lf-p-foreground)', overflow: 'auto' }}>
      <header style={{ background: 'var(--lf-p-background)', borderBottom: '1px solid var(--lf-p-border)', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button type="button" onClick={() => app.nav('carousel')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', cursor: 'pointer', font: '500 14px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>‹ Buddy carousel</button>
        <h1 style={{ margin: 0, font: '700 18px var(--font-ui)' }}>Designer note — buddy art direction</h1>
        <span style={{ marginLeft: 'auto', font: '400 12.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>not a product screen</span>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 20, padding: '24px 28px', maxWidth: 1060 }}>
        <div style={{ background: 'var(--lf-p-background)', border: '1px solid var(--lf-p-border)', borderRadius: 12, padding: 22 }}>
          <h2 style={{ margin: '0 0 10px', font: '600 15px var(--font-ui)' }}>Buddies are original watercolor characters</h2>
          <ul style={{ margin: 0, paddingLeft: 18, font: '400 13.5px/1.75 var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
            <li>Every Apple emoji buddy/scene in this prototype is a <strong style={{ color: 'var(--lf-p-foreground)' }}>stand-in</strong>, never the shipped art.</li>
            <li>Target style: soft colored-pencil / watercolor on warm cream — the "Azi's Little Bhen" book pages are the reference.</li>
            <li>Ink: loose charcoal outlines (#1c2527), wobbly and hand-drawn; washes stay inside the heirloom palette below.</li>
            <li>Tender expressions, rounded silhouettes; each buddy reads at 44 px (medallion) and 200 px (carousel).</li>
            <li>Nonliving buddies (Moto, Rocky, Rusty) get painted eyes only — no mouths on machines is FINE; charm over realism.</li>
            <li>Original characters only — never brand/IP lookalikes.</li>
          </ul>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            {swatches.map(([c, n]) => (
              <div key={c} style={{ textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, background: c, border: '1px solid var(--lf-p-border)' }}></div>
                <div style={{ font: '400 11px var(--font-ui)', color: 'var(--lf-p-muted-foreground)', marginTop: 4 }}>{n}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: 'var(--lf-cream)', border: '1px solid var(--lf-p-border)', borderRadius: 12, padding: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <BearSampleSVG size={230} />
          <div style={{ font: '600 13px var(--font-ui)', color: 'var(--lf-p-foreground)' }}>Bear — style sample (vector comp)</div>
          <div style={{ font: '400 12px var(--font-ui)', color: 'var(--lf-p-muted-foreground)', textAlign: 'center' }}>Final buddies are hand-painted. Drop the painted Bear below — slots like this are wired across the app.</div>
          <image-slot id="buddy-bear-painted" shape="rounded" radius="10" placeholder="Drop the painted Bear" style={{ width: 220, height: 140 }}></image-slot>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { BadgeEarn, BadgeShelf, MyWords, PortraitHome, PortraitMap, ArtNote });
