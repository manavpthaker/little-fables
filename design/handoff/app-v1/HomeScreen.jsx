// Home / Library — evolved from ui_kits/story-world/LibraryScreen.jsx.
// The ONE coral action on this screen: the voice-search mic.
const { StatusBar, Doodles, CircleBtn, BigMic, OfflineBanner, PillNav } = window;

const HOME_CHIPS = [
  { emoji: '🏍️', label: 'Motos', tint: 'var(--lf-pastel-peach)' },
  { emoji: '⚽', label: 'Soccer', tint: 'var(--lf-pastel-mint)' },
  { emoji: '🚀', label: 'Space', tint: 'var(--lf-pastel-lilac)' },
  { emoji: '🦕', label: 'Dinos', tint: 'var(--lf-pastel-blush)' },
];

// Bookshelf cover — every cover sits in the same cream mat so watercolor art
// and gradient-emoji placeholders read as one family.
function ShelfCover({ story, onOpen }) {
  return (
    <button type="button" className="lf-press" onClick={onOpen}
      style={{ display: 'block', width: '100%', border: 'none', padding: 0, background: 'none', textAlign: 'left', cursor: 'pointer', color: 'inherit', fontFamily: 'var(--font-display)' }}>
      <span style={{ display: 'block', background: 'var(--lf-cream-card)', border: '1.5px solid var(--lf-cream-line)', borderRadius: 'var(--radius-cover)', padding: 10, boxShadow: 'var(--shadow-warm)' }}>
        {story.coverImage ? (
          <img src={story.coverImage} alt="" style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 12, display: 'block' }} />
        ) : (
          <span style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 12, background: story.coverBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span aria-hidden="true" style={{ fontSize: 72, filter: 'var(--shadow-emoji)' }}>{story.coverEmoji}</span>
          </span>
        )}
      </span>
      <span style={{ display: 'block', font: 'var(--text-cover-title)', marginTop: 10 }}>{story.title}</span>
      <span style={{ display: 'block', font: 'var(--text-meta)', color: 'var(--lf-espresso-soft)', marginTop: 2 }}>{story.meta}</span>
    </button>
  );
}

function HomeScreen({ bedtime, offline, madeRocket, onToggleBedtime, onOpenStory, onCreate, onGrownups, focusShelf }) {
  const scrollRef = React.useRef(null);
  const shelfRef = React.useRef(null);

  React.useEffect(() => {
    if (focusShelf && scrollRef.current && shelfRef.current) {
      scrollRef.current.scrollTo({ top: shelfRef.current.offsetTop - 20, behavior: 'smooth' });
    }
  }, [focusShelf]);

  const stories = window.SW_STORIES;
  const tonight = stories['miko-bridge'];

  return (
    <div className="sw-screen" ref={scrollRef} data-screen-label={'Home / Library' + (bedtime ? ' — bedtime' : '')}>
      <Doodles />
      {offline ? <OfflineBanner /> : null}
      <StatusBar />

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={bedtime ? 'assets/logo-tree-white.png' : 'assets/logo-tree-ink.png'} alt="Little Fables" style={{ width: 46, height: 46 }} />
          <span style={{ font: '700 23px var(--font-display)' }}>Little Fables</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ background: 'var(--lf-pastel-peach)', borderRadius: 'var(--radius-pill)', padding: '9px 16px', font: 'var(--text-label)', fontFamily: 'var(--font-display)' }}>⭐ 12</span>
          <CircleBtn label={bedtime ? 'Lights on' : 'Bedtime mode'} onClick={onToggleBedtime} size={48} style={{ fontSize: 21 }} data-comment-anchor="sw-bedtime-toggle">
            <span aria-hidden="true">{bedtime ? '☀️' : '🌙'}</span>
          </CircleBtn>
          <span style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--lf-pastel-lilac)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: '700 19px var(--font-display)' }}>A</span>
        </div>
      </header>

      {/* Greeting */}
      <div style={{ padding: '22px 32px 0' }}>
        <div style={{ font: '600 17px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>Welcome back,</div>
        <div style={{ font: 'var(--text-greeting)', marginTop: 2 }}>Azad! What&rsquo;s tonight&rsquo;s story?</div>
      </div>

      {/* Voice search — THE coral action */}
      <div className="lf-press" onClick={onCreate}
        style={{ margin: '20px 32px 0', background: 'var(--lf-cream-card)', border: '1.5px solid var(--lf-cream-line)', borderRadius: 'var(--radius-pill)', padding: '7px 7px 7px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
        <span style={{ font: '600 19px var(--font-body)', color: 'var(--lf-espresso-faint)' }}>⌕&nbsp;&nbsp;Tell me your story idea…</span>
        <BigMic size={56} onTap={onCreate} label="Tell me your story idea" />
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', gap: 16, padding: '24px 32px 0' }}>
        {HOME_CHIPS.map((c) => (
          <div key={c.label} className="lf-press" style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}>
            <span aria-hidden="true" style={{ fontSize: 36, filter: 'var(--shadow-emoji)' }}>{c.emoji}</span>
            <div style={{ background: c.tint, borderRadius: 'var(--radius-scallop)', padding: '9px 0 11px', font: 'var(--text-label)', marginTop: 6 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Tonight's story — arch hero */}
      <div style={{ padding: '28px 32px 0' }}>
        <div style={{ font: 'var(--text-section)', marginBottom: 14 }}>Tonight&rsquo;s story</div>
        <div className="lf-press" onClick={() => onOpenStory('miko-bridge')} style={{ position: 'relative', cursor: 'pointer' }} data-comment-anchor="sw-tonight-hero">
          <div aria-hidden="true" style={{ width: '100%', height: 295, borderRadius: 'var(--radius-arch)', background: tonight.coverBg, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: 'var(--shadow-warm-lg)' }}>
            <span style={{ fontSize: 108, filter: 'var(--shadow-emoji)' }}>🦊</span>
            <span style={{ fontSize: 72, filter: 'var(--shadow-emoji)' }}>🌉</span>
          </div>
          <span aria-hidden="true" style={{ position: 'absolute', right: 22, bottom: -16, width: 64, height: 64, borderRadius: '50%', background: 'var(--lf-espresso)', boxShadow: 'var(--shadow-warm)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--lf-cream)', fontSize: 24, paddingLeft: 4, boxSizing: 'border-box' }}>▶</span>
        </div>
        <div style={{ font: '700 24px var(--font-display)', marginTop: 20 }}>{tonight.title}</div>
        <div style={{ font: 'var(--text-meta)', color: 'var(--lf-espresso-soft)', marginTop: 2 }}>{tonight.meta}</div>
      </div>

      {/* Bookshelf */}
      <section ref={shelfRef} style={{ padding: '30px 32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ font: 'var(--text-section)' }}>Bookshelf</span>
          <span className="lf-press" style={{ font: '700 16px var(--font-body)', color: 'var(--lf-espresso-soft)', cursor: 'pointer' }}>See all</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
          {window.SW_SHELF.map((id) => (
            <ShelfCover key={id} story={stories[id]} onOpen={() => onOpenStory(id)} />
          ))}
          {madeRocket ? (
            <ShelfCover story={stories['rocket-roar']} onOpen={() => onOpenStory('rocket-roar')} />
          ) : null}
        </div>
        {!madeRocket ? (
          <div data-comment-anchor="sw-writing-slot" style={{ marginTop: 18, border: '2px dashed var(--lf-cream-line)', borderRadius: 'var(--radius-cover)', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14, background: 'transparent' }}>
            <span className="sw-pen" style={{ fontSize: 24, color: 'var(--lf-espresso-faint)' }} aria-hidden="true">✎</span>
            <span style={{ font: '700 18px var(--font-display)' }}>The Rocket That Wouldn&rsquo;t Roar</span>
            <span style={{ font: 'var(--text-meta)', color: 'var(--lf-espresso-soft)', marginLeft: 'auto' }}>writing itself…</span>
          </div>
        ) : null}
      </section>

      <div style={{ height: 130 }}></div>
      <PillNav active="home" onNav={(id) => {
        if (id === 'create') onCreate();
        else if (id === 'grownups') onGrownups();
        else if (id === 'library' && scrollRef.current && shelfRef.current) scrollRef.current.scrollTo({ top: shelfRef.current.offsetTop - 20, behavior: 'smooth' });
        else if (id === 'home') scrollRef.current && scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }} />
    </div>
  );
}
window.HomeScreen = HomeScreen;
