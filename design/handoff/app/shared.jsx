// Story World — shared chrome: canvas CSS (iPad type scale + bedtime flip),
// status bar, doodles, pill nav, circle buttons, big mic, offline banner.

(function injectSwCss() {
  if (document.getElementById('sw-css')) return;
  const s = document.createElement('style');
  s.id = 'sw-css';
  s.textContent = `
    /* ---- iPad-portrait type scale (bumped from the phone tokens; same fonts/weights) ---- */
    .sw-app {
      --text-greeting: 700 2.125rem/1.15 var(--font-display);      /* 34px */
      --text-story-title: 700 1.625rem/1.2 var(--font-display);    /* 26px */
      --text-section: 700 1.375rem/1.3 var(--font-display);        /* 22px */
      --text-story-page: 600 1.5rem/1.65 var(--font-body);         /* 24px, tweakable 22-26 */
      --text-cover-title: 700 1.125rem/1.25 var(--font-display);   /* 18px */
      --text-cta: 700 1.375rem/1.2 var(--font-display);            /* 22px */
      --text-meta: 600 0.9375rem/1.4 var(--font-body);             /* 15px */
      --text-label: 700 1rem/1.3 var(--font-body);                 /* 16px */
      --sw-on-action: #fff;
      --sw-doodle: #7A6748;
      background: var(--lf-cream);
      color: var(--lf-espresso);
      font-family: var(--font-display);
    }

    /* ---- Bedtime: the tokenized flip (cream->night indigo, coral->butter) ---- */
    .sw-app.sw-bedtime {
      --lf-cream: var(--lf-night);
      --lf-cream-card: var(--lf-night-mid);
      --lf-cream-line: rgba(199, 210, 254, 0.22);
      --lf-espresso: #FBF4E6;
      --lf-espresso-soft: #c7d2fe;
      --lf-espresso-faint: #a5b4fc;
      --lf-coral: var(--lf-butter);
      --lf-coral-deep: var(--lf-butter-deep);
      --lf-pastel-peach: rgba(251, 191, 36, 0.16);
      --lf-pastel-mint: rgba(52, 211, 153, 0.16);
      --lf-pastel-lilac: rgba(167, 139, 250, 0.20);
      --lf-pastel-blush: rgba(251, 113, 133, 0.16);
      --shadow-coral-glow: var(--shadow-butter-glow);
      --shadow-warm: 0 10px 24px rgba(0, 0, 0, 0.35);
      --shadow-warm-lg: 0 14px 30px rgba(0, 0, 0, 0.45);
      --sw-on-action: var(--lf-night);
      --sw-doodle: #c7d2fe;
    }
    .sw-bedtime .lf-ask-mic { animation-name: sw-ask-pulse-butter !important; }
    @keyframes sw-ask-pulse-butter {
      0%, 100% { box-shadow: 0 6px 14px rgba(251, 191, 36, .35); }
      50% { box-shadow: 0 6px 22px rgba(251, 191, 36, .6); }
    }

    /* ---- Scale phone-sized DS learning components up for the iPad canvas ---- */
    .sw-zoom { zoom: 1.22; }

    /* ---- Motion ---- */
    @keyframes sw-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    .sw-breathe { animation: sw-breathe 2.4s ease-in-out infinite; }
    @keyframes sw-ring { 0% { transform: scale(1); opacity: .55; } 100% { transform: scale(2); opacity: 0; } }
    .sw-ring { position: absolute; inset: 0; border-radius: 50%; border: 3px solid var(--lf-coral); animation: sw-ring 1.6s ease-out infinite; pointer-events: none; }
    .sw-ring2 { animation-delay: .55s; }
    .sw-ring3 { animation-delay: 1.1s; }
    @keyframes sw-dot { 0%, 100% { transform: translateY(0); opacity: .45; } 50% { transform: translateY(-7px); opacity: 1; } }
    .sw-dot { display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: var(--lf-coral); animation: sw-dot 1.1s ease-in-out infinite; }
    @keyframes sw-fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .sw-fade-up { animation: sw-fade-up 300ms var(--ease-out) both; }
    @keyframes sw-pen { 0%, 100% { opacity: .45; } 50% { opacity: 1; } }
    .sw-pen { animation: sw-pen 1.6s ease-in-out infinite; }
    @keyframes sw-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-7px); } 75% { transform: translateX(7px); } }
    .sw-shake { animation: sw-shake 220ms ease-in-out 2; }
    @media (prefers-reduced-motion: reduce) {
      .sw-breathe, .sw-dot, .sw-pen { animation: none; }
      .sw-ring { animation: none; opacity: 0; }
      .sw-fade-up, .sw-shake { animation: none; }
    }

    .sw-screen { position: relative; height: 100%; overflow-y: auto; overflow-x: hidden; scrollbar-width: none; }
    .sw-screen::-webkit-scrollbar { display: none; }
  `;
  document.head.appendChild(s);
})();

// ---- iPad status bar (OS chrome) ----
function StatusBar() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 30px 0', color: 'var(--lf-espresso-soft)', font: '700 15px var(--font-body)', flexShrink: 0 }}>
      <span>9:41</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span>100%</span>
        <span aria-hidden="true" style={{ position: 'relative', width: 27, height: 13, border: '1.5px solid currentColor', borderRadius: 4, display: 'inline-block', opacity: 0.9 }}>
          <span style={{ position: 'absolute', inset: 2, borderRadius: 1.5, background: 'currentColor' }}></span>
          <span style={{ position: 'absolute', right: -4.5, top: 3.5, width: 2.5, height: 6, borderRadius: '0 2px 2px 0', background: 'currentColor' }}></span>
        </span>
      </span>
    </div>
  );
}

// ---- Faint paper doodles ----
function Doodles() {
  const marks = [
    { ch: '✦', top: 130, left: 30, size: 30 },
    { ch: '✦', top: 90, right: 260, size: 22 },
    { ch: '〰', bottom: 120, left: 380, size: 28 },
    { ch: '✦', bottom: 160, right: 40, size: 26 },
  ];
  return (
    <React.Fragment>
      {marks.map((m, i) => (
        <span key={i} aria-hidden="true" style={{ position: 'absolute', color: 'var(--sw-doodle)', opacity: 0.07, fontSize: m.size, top: m.top, bottom: m.bottom, left: m.left, right: m.right, pointerEvents: 'none' }}>{m.ch}</span>
      ))}
    </React.Fragment>
  );
}

// ---- Circle icon button ----
function CircleBtn({ label, onClick, children, size = 52, style, ...rest }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="lf-press" {...rest}
      style={{ width: size, height: size, borderRadius: '50%', background: 'var(--lf-cream-card)', border: '1.5px solid var(--lf-cream-line)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(size * 0.42), color: 'var(--lf-espresso-soft)', cursor: 'pointer', flexShrink: 0, fontFamily: 'var(--font-display)', ...style }}>
      {children}
    </button>
  );
}

// ---- THE coral mic (breathes; pulsing rings while listening) ----
function BigMic({ size = 104, listening = false, onTap, label = 'Say it out loud' }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: size, height: size, flexShrink: 0 }}>
      {listening ? (
        <React.Fragment>
          <span className="sw-ring"></span>
          <span className="sw-ring sw-ring2"></span>
          <span className="sw-ring sw-ring3"></span>
        </React.Fragment>
      ) : null}
      <button type="button" aria-label={label} onClick={onTap} className={'lf-press' + (listening ? '' : ' sw-breathe')}
        style={{ position: 'relative', width: size, height: size, borderRadius: '50%', border: 'none', cursor: 'pointer', background: listening ? 'var(--lf-coral-deep)' : 'var(--lf-coral)', boxShadow: 'var(--shadow-coral-glow)', fontSize: Math.round(size * 0.42), display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <span aria-hidden="true">🎤</span>
      </button>
    </span>
  );
}

// ---- Offline banner (edge state) ----
function OfflineBanner() {
  return (
    <div data-comment-anchor="sw-offline-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'var(--lf-pastel-peach)', padding: '12px 24px', font: 'var(--text-label)', color: 'var(--lf-espresso)' }}>
      <span aria-hidden="true" style={{ fontSize: 20 }}>☁️</span>
      <span>No internet — your saved stories still work!</span>
    </div>
  );
}

// ---- Floating pill nav ----
function PillNav({ active, onNav }) {
  const items = [
    { id: 'home', emoji: '⌂', label: 'Home' },
    { id: 'grownups', emoji: '⚙', label: 'Grown-ups' },
  ];
  return (
    <nav style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 18, background: 'var(--lf-cream-card)', border: '1.5px solid var(--lf-cream-line)', borderRadius: 'var(--radius-pill)', boxShadow: 'var(--shadow-warm)', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', zIndex: 10 }}>
      {items.map((it) => {
        const isActive = active === it.id;
        return (
          <button key={it.id} type="button" className="lf-press" onClick={() => onNav(it.id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 9, border: 'none', cursor: 'pointer',
              background: isActive ? 'var(--lf-espresso)' : 'transparent',
              color: isActive ? 'var(--lf-cream)' : 'var(--lf-espresso-faint)',
              borderRadius: 'var(--radius-pill)', padding: isActive ? '12px 26px' : '12px 20px',
              font: 'var(--text-label)', fontFamily: 'var(--font-display)', minHeight: 'var(--touch-target)',
            }}>
            <span aria-hidden="true" style={{ fontSize: 19 }}>{it.emoji}</span>
            {it.label}
          </button>
        );
      })}
    </nav>
  );
}

Object.assign(window, { StatusBar, Doodles, CircleBtn, BigMic, OfflineBanner, PillNav });
