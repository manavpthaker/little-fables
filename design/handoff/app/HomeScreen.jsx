// Home / Library — landscape iPad. The child's library of family-made stories.
// The ONE coral action on this screen: play tonight's story.
const { StatusBar, Doodles, CircleBtn, OfflineBanner, PillNav } = window;

const HOME_CHIPS = [
  { emoji: '🏍️', label: 'Motos', tint: 'var(--lf-pastel-peach)' },
  { emoji: '⚽', label: 'Soccer', tint: 'var(--lf-pastel-mint)' },
  { emoji: '🚀', label: 'Space', tint: 'var(--lf-pastel-lilac)' },
  { emoji: '🦕', label: 'Dinos', tint: 'var(--lf-pastel-blush)' },
];

// Every cover sits in the same cream mat so all the art reads as one family.
function ShelfCover({ story, onOpen }) {
  return (
    <button type="button" className="lf-press" onClick={onOpen}
      style={{ display: 'block', width: '100%', border: 'none', padding: 0, background: 'none', textAlign: 'left', cursor: 'pointer', color: 'inherit', fontFamily: 'var(--font-display)' }}>
      <span style={{ display: 'block', background: 'var(--lf-cream-card)', border: '1.5px solid var(--lf-cream-line)', borderRadius: 'var(--radius-cover)', padding: 9, boxShadow: 'var(--shadow-warm)' }}>
        <img src={story.coverImage} alt="" style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 11, display: 'block' }} />
      </span>
      <span style={{ display: 'block', font: 'var(--text-cover-title)', marginTop: 9 }}>{story.title}</span>
      <span style={{ display: 'block', font: 'var(--text-meta)', color: 'var(--lf-espresso-soft)', marginTop: 2 }}>{story.meta}</span>
    </button>
  );
}

function HomeScreen({ bedtime, offline, onToggleBedtime, onOpenStory, onGrownups }) {
  const stories = window.SW_STORIES;
  const tonight = stories['miko-bridge'];

  return (
    <div className="sw-screen" data-screen-label={'Home / Library' + (bedtime ? ' — bedtime' : '')}>
      <Doodles />
      {offline ? <OfflineBanner /> : null}
      <StatusBar />

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 44px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={bedtime ? 'assets/logo-tree-white.png' : 'assets/logo-tree-ink.png'} alt="Little Fables" style={{ width: 44, height: 44 }} />
          <span style={{ font: '700 22px var(--font-display)' }}>Little Fables</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ background: 'var(--lf-pastel-peach)', borderRadius: 'var(--radius-pill)', padding: '9px 16px', font: 'var(--text-label)', fontFamily: 'var(--font-display)' }}>⭐ 12</span>
          <CircleBtn label={bedtime ? 'Lights on' : 'Bedtime mode'} onClick={onToggleBedtime} size={46} style={{ fontSize: 20 }} data-comment-anchor="sw-bedtime-toggle">
            <span aria-hidden="true">{bedtime ? '☀️' : '🌙'}</span>
          </CircleBtn>
          <span style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--lf-pastel-lilac)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: '700 18px var(--font-display)' }}>A</span>
        </div>
      </header>

      {/* Two-page spread: tonight's story | bookshelf */}
      <div style={{ display: 'grid', gridTemplateColumns: '480px 1fr', gap: 44, padding: '18px 44px 0', alignItems: 'start' }}>

        {/* Left: greeting + arch hero */}
        <div>
          <div style={{ font: '600 16px var(--font-body)', color: 'var(--lf-espresso-soft)' }}>Welcome back,</div>
          <div style={{ font: 'var(--text-greeting)', marginTop: 2, marginBottom: 18 }}>Azad! What&rsquo;s tonight&rsquo;s story?</div>
          <div style={{ font: 'var(--text-section)', marginBottom: 12 }}>Tonight&rsquo;s story</div>
          <div className="lf-press" onClick={() => onOpenStory('miko-bridge')} style={{ position: 'relative', cursor: 'pointer' }} data-comment-anchor="sw-tonight-hero">
            <img src={tonight.coverImage} alt="" style={{ width: '100%', height: 380, objectFit: 'cover', borderRadius: 'var(--radius-arch)', display: 'block', boxShadow: 'var(--shadow-warm-lg)' }} />
            <span aria-hidden="true" style={{ position: 'absolute', right: 20, bottom: -16, width: 68, height: 68, borderRadius: '50%', background: 'var(--lf-coral)', boxShadow: 'var(--shadow-coral-glow)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sw-on-action)', fontSize: 26, paddingLeft: 5, boxSizing: 'border-box' }}>▶</span>
          </div>
          <div style={{ font: '700 23px var(--font-display)', marginTop: 22 }}>{tonight.title}</div>
          <div style={{ font: 'var(--text-meta)', color: 'var(--lf-espresso-soft)', marginTop: 2 }}>{tonight.meta}</div>
        </div>

        {/* Right: chips + bookshelf */}
        <div>
          <div style={{ display: 'flex', gap: 14 }}>
            {HOME_CHIPS.map((c) => (
              <div key={c.label} className="lf-press" style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}>
                <span aria-hidden="true" style={{ fontSize: 30, filter: 'var(--shadow-emoji)' }}>{c.emoji}</span>
                <div style={{ background: c.tint, borderRadius: 'var(--radius-scallop)', padding: '8px 0 10px', font: 'var(--text-label)', marginTop: 5 }}>{c.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '26px 0 13px' }}>
            <span style={{ font: 'var(--text-section)' }}>Bookshelf</span>
            <span className="lf-press" style={{ font: '700 15px var(--font-body)', color: 'var(--lf-espresso-soft)', cursor: 'pointer' }}>See all</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {window.SW_SHELF.map((id) => (
              <ShelfCover key={id} story={stories[id]} onOpen={() => onOpenStory(id)} />
            ))}
          </div>
          <div style={{ font: 'var(--text-meta)', color: 'var(--lf-espresso-faint)', marginTop: 16 }}>
            New stories appear here when Mom and Dad finish making them ✦
          </div>
        </div>
      </div>

      <PillNav active="home" onNav={(id) => { if (id === 'grownups') onGrownups(); }} />
    </div>
  );
}
window.HomeScreen = HomeScreen;
