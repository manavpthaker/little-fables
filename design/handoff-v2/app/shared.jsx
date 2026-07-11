/* Little Fables — shared kid-app primitives (Dream Paper). */
const { useState, useEffect, useRef } = React;
const DS = window.LittleFablesDesignSystem_36f5e7;
const { cp } = window.LF;

/* ---------- Watercolor wash (ink-and-wash placeholder painting) ---------- */
function washBg(key) {
  const c = window.LF.WASH[key] || window.LF.WASH.canyon;
  return [
    `radial-gradient(90% 75% at 18% 12%, ${c[0]} 0%, rgba(0,0,0,0) 62%)`,
    `radial-gradient(85% 80% at 85% 30%, ${c[1]} 0%, rgba(0,0,0,0) 60%)`,
    `radial-gradient(110% 85% at 50% 105%, ${c[2]} 0%, rgba(0,0,0,0) 58%)`,
    'var(--lf-paper, #f7f1e3)',
  ].join(', ');
}

function WashScene({ wash = 'canyon', img, emojis = [], doodle = true, slot, slotLabel, children, style }) {
  const base = style && style.height && typeof style.height === 'number' ? style.height : 200;
  const k = Math.min(1, base / 200);
  const sizes = [96, 60, 44, 34, 30].map((s) => Math.max(12, Math.round(s * k)));
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: img ? `center / cover no-repeat url("${img}")` : washBg(wash),
      ...style,
    }}>
      {slot && (
        <image-slot id={slot} shape="rect" placeholder={`Drop art — ${slotLabel || slot}`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}></image-slot>
      )}
      {!img && !slot && doodle && (
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, color: 'var(--lf-espresso)', opacity: .07, font: '700 20px var(--font-body)' }}>
          <span style={{ position: 'absolute', top: '12%', right: '14%' }}>✦</span>
          <span style={{ position: 'absolute', bottom: '16%', left: '10%' }}>〰</span>
          <span style={{ position: 'absolute', top: '30%', left: '22%', fontSize: 13 }}>✦</span>
        </div>
      )}
      {!img && !slot && emojis.length > 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: Math.max(3, Math.round(14 * k)), filter: 'var(--shadow-emoji)' }}>
          {emojis.map((e, i) => (
            <span key={i} style={{ fontSize: sizes[i] || sizes[sizes.length - 1], transform: `translateY(${(i % 2 ? -10 : 8) * k}px) rotate(${i % 2 ? 4 : -3}deg)` }}>{e}</span>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}

/* ---------- Buddy medallion ---------- */
function BuddyFace({ buddy, size = 88, tag = false, style }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, ...style }}>
      <div style={{
        width: size, height: size, borderRadius: '50%', background: washBg(buddy.wash),
        border: '3px solid var(--lf-cream-card)', boxShadow: 'var(--shadow-warm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * .52,
      }}>
        <span style={{ filter: 'var(--shadow-emoji)' }}>{buddy.emoji}</span>
      </div>
      {tag && <NatureTag nature={buddy.nature} style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)' }} />}
    </div>
  );
}

function NatureTag({ nature, style }) {
  const living = nature === 'living';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
      background: living ? 'var(--lf-pastel-mint)' : 'var(--lf-pastel-peach)',
      color: 'var(--lf-espresso)', borderRadius: 'var(--radius-scallop)',
      padding: '4px 11px', font: 'var(--text-label)', ...style,
    }}>
      <span aria-hidden="true" style={{ fontSize: 12 }}>{living ? '🌿' : '🪨'}</span>
      {living ? 'living' : 'nonliving'}
    </span>
  );
}

/* ---------- Speech bubble (audio always shown visually) ---------- */
function SpeechBubble({ children, tail = 'left', big = false, style }) {
  const tailPos = { left: { left: -7, top: 26 }, bottom: { bottom: -7, left: 34 }, right: { right: -7, top: 26 } }[tail];
  return (
    <div style={{
      position: 'relative', background: 'var(--lf-cream-card)', border: '1.5px solid var(--lf-cream-line)',
      borderRadius: 18, padding: big ? '16px 20px' : '12px 16px', boxShadow: 'var(--shadow-warm)',
      font: big ? '700 21px/1.45 var(--font-body)' : '700 16px/1.45 var(--font-body)',
      color: 'var(--lf-espresso)', maxWidth: 480, ...style,
    }}>
      <span aria-hidden="true" style={{
        position: 'absolute', width: 14, height: 14, background: 'var(--lf-cream-card)',
        borderLeft: '1.5px solid var(--lf-cream-line)', borderBottom: '1.5px solid var(--lf-cream-line)',
        transform: tail === 'bottom' ? 'rotate(-45deg)' : tail === 'right' ? 'rotate(135deg)' : 'rotate(45deg)', ...tailPos,
      }}></span>
      <span aria-hidden="true" style={{ marginRight: 8, fontSize: big ? 18 : 14 }}>🔊</span>
      {children}
    </div>
  );
}

/* ---------- Weekly suns ---------- */
function SunRow({ size = 30, style }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', ...style }}>
      {window.LF.SUNS.map((s, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div className={s.today && s.lit ? 'lf-sun-today' : ''} style={{
            width: size, height: size, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * .62, background: s.lit ? 'rgba(251,191,36,.18)' : 'transparent',
            border: s.lit ? '1.5px solid rgba(251,191,36,.55)' : '1.5px solid var(--lf-cream-line)',
            boxShadow: s.lit ? '0 2px 8px rgba(251,191,36,.30)' : 'none',
          }}>
            <span style={{ opacity: s.lit ? 1 : .28, filter: s.lit ? 'none' : 'grayscale(1)' }}>☀️</span>
          </div>
          <span style={{ font: '700 10.5px var(--font-body)', color: s.lit ? 'var(--lf-espresso-soft)' : 'var(--lf-espresso-faint)' }}>{s.d}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Floating nav pill: Home / Grown-ups only ---------- */
function NavPill({ active, nav }) {
  const items = [
    { id: 'home', label: 'Home', glyph: '⌂' },
    { id: 'gate', label: 'Grown-ups', glyph: '⚙' },
  ];
  return (
    <nav style={{
      position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 30,
      display: 'flex', gap: 4, background: 'var(--lf-cream-card)', border: '1.5px solid var(--lf-cream-line)',
      borderRadius: 'var(--radius-pill)', padding: 5, boxShadow: 'var(--shadow-warm)',
    }}>
      {items.map((it) => {
        const on = active === it.id;
        return (
          <button key={it.id} type="button" className="lf-press" onClick={() => nav(it.id)} style={{
            display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer',
            minHeight: 44, padding: '8px 20px', borderRadius: 'var(--radius-pill)',
            background: on ? 'var(--lf-pastel-peach)' : 'transparent',
            color: on ? 'var(--lf-espresso)' : 'var(--lf-espresso-faint)',
            font: '700 15px var(--font-display)',
          }}>
            <span aria-hidden="true" style={{ fontSize: 17 }}>{it.glyph}</span>{it.label}
          </button>
        );
      })}
    </nav>
  );
}

/* ---------- Small round quiet button (prev / replay / back) ---------- */
function RoundBtn({ glyph, label, onClick, size = 56, disabled = false, style }) {
  return (
    <button type="button" className="lf-press" aria-label={label} onClick={onClick} disabled={disabled} style={{
      width: size, height: size, borderRadius: '50%', cursor: disabled ? 'default' : 'pointer',
      background: 'var(--lf-cream-card)', border: '1.5px solid var(--lf-cream-line)',
      color: disabled ? 'var(--lf-espresso-faint)' : 'var(--lf-espresso-soft)',
      fontSize: size * .4, display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: 'var(--shadow-warm)', opacity: disabled ? .5 : 1, flexShrink: 0, ...style,
    }}>{glyph}</button>
  );
}

/* ---------- Progress ring ---------- */
function ProgressRing({ value = 0, size = 44, stroke = 5, style }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={style} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="var(--lf-cream-card)" stroke="var(--lf-cream-line)" strokeWidth={stroke}></circle>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--lf-coral)" strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={`${c * value} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`}></circle>
    </svg>
  );
}

/* ---------- Mini chapter dots: ● done · ▶ current · ○ future ---------- */
function ChapterDots({ chapters, style }) {
  return (
    <span style={{ display: 'inline-flex', gap: 7, alignItems: 'center', ...style }}>
      {chapters.filter((c) => c.status !== 'painting').map((ch, i) => (
        <span key={i} aria-hidden="true" style={{
          font: '700 13px var(--font-body)',
          color: ch.status === 'current' ? 'var(--lf-coral)' : ch.status === 'done' ? 'var(--lf-espresso-soft)' : 'var(--lf-espresso-faint)',
        }}>{ch.status === 'current' ? '▶' : ch.status === 'done' ? '●' : '○'}</span>
      ))}
    </span>
  );
}

/* ---------- Cover in a cream mat (mixed art reads as one family) ---------- */
function MatCover({ story, size = 128, onClick, ring, badge }) {
  return (
    <button type="button" className="lf-press" onClick={onClick} style={{
      border: '1.5px solid var(--lf-cream-line)', background: 'var(--lf-cream-card)',
      borderRadius: 'var(--radius-cover)', padding: 9, cursor: 'pointer', position: 'relative',
      boxShadow: 'var(--shadow-warm)', display: 'block', textAlign: 'left', flexShrink: 0,
    }}>
      <WashScene wash={story.wash} img={story.coverImg} slot={story.coverSlot} slotLabel="Square cover"
        emojis={story.coverEmoji ? [story.coverEmoji] : []} doodle={!story.coverImg}
        style={{ width: size, height: size, borderRadius: 12 }} />
      {ring !== undefined && (
        <span style={{ position: 'absolute', top: 2, right: 2 }}><ProgressRing value={ring} size={36} stroke={4.5} /></span>
      )}
      {badge && (
        <span style={{
          position: 'absolute', left: '50%', bottom: 44, transform: 'translateX(-50%)', whiteSpace: 'nowrap',
          background: 'var(--lf-cream-card)', border: '1.5px solid var(--lf-cream-line)', borderRadius: 'var(--radius-pill)',
          padding: '3px 10px', font: '700 11px var(--font-body)', color: 'var(--lf-espresso-soft)',
        }}>{badge}</span>
      )}
      <div style={{ width: size, marginTop: 7 }}>
        <div style={{ font: '700 14px/1.25 var(--font-display)', color: 'var(--lf-espresso)', textWrap: 'balance' }}>{story.title}</div>
        <div style={{ font: 'var(--text-meta)', color: 'var(--lf-espresso-soft)', marginTop: 2 }}>{story.meta}</div>
      </div>
    </button>
  );
}

/* ---------- Watercolor badge medallion ---------- */
function Medallion({ badge, size = 108, silhouette = false, style }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', position: 'relative', flexShrink: 0,
      background: silhouette ? 'var(--lf-cream)' : washBg(badge.wash),
      border: silhouette ? '2px dashed var(--lf-cream-line)' : '3px solid var(--lf-cream-card)',
      boxShadow: silhouette ? 'none' : 'var(--shadow-warm)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', ...style,
    }}>
      <span style={{ fontSize: size * .42, filter: silhouette ? 'grayscale(1) opacity(.35)' : 'var(--shadow-emoji)' }}>{badge.emoji}</span>
      {!silhouette && (
        <span aria-hidden="true" style={{ position: 'absolute', inset: 5, borderRadius: '50%', border: '1.5px solid rgba(255,253,247,.8)' }}></span>
      )}
    </div>
  );
}

/* ---------- Confetti (celebrations; gated by reduced motion via .lf-rm) ---------- */
function Confetti({ n = 14 }) {
  const bits = ['✦', '●', '▲', '✶'];
  const colors = ['var(--lf-coral)', 'var(--lf-wc-sage)', 'var(--lf-wc-dustyblue)', 'var(--lf-wc-ochre)', '#fbbf24'];
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} className="lf-confetti" style={{
          position: 'absolute', left: `${6 + (i * 89) % 90}%`, top: -20,
          color: colors[i % colors.length], fontSize: 12 + (i * 7) % 14,
          animationDelay: `${(i * .17) % 1.4}s`, animationDuration: `${2.6 + (i % 4) * .5}s`,
        }}>{bits[i % bits.length]}</span>
      ))}
    </div>
  );
}

/* ---------- Big coral mic (primary kid target ≥56px) ---------- */
function BigMic({ listening, onTap, size = 68, style }) {
  return (
    <button type="button" className="lf-press lf-mic-pulse" aria-label="Answer out loud" onClick={onTap} style={{
      width: size, height: size, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
      background: listening ? 'var(--lf-coral-deep)' : 'var(--lf-coral)', fontSize: size * .42,
      display: 'flex', alignItems: 'center', justifyContent: 'center', ...style,
    }}>🎤</button>
  );
}

/* ---------- Listening dots ---------- */
function Dots({ color = 'var(--lf-coral)' }) {
  return (
    <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span key={i} className="lf-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: color, animationDelay: `${i * .18}s` }}></span>
      ))}
    </span>
  );
}

/* ---------- Kid screen shell ---------- */
function KidScreen({ label, children, style }) {
  return (
    <div data-screen-label={label} className="lf-screen-in" style={{
      position: 'absolute', inset: 0, background: 'var(--lf-cream)', overflow: 'hidden',
      color: 'var(--lf-espresso)', fontFamily: 'var(--font-body)', ...style,
    }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, color: 'var(--lf-espresso)', opacity: .05, pointerEvents: 'none', font: '700 22px var(--font-body)' }}>
        <span style={{ position: 'absolute', top: 26, right: 60 }}>✦</span>
        <span style={{ position: 'absolute', bottom: 90, left: 36 }}>〰</span>
        <span style={{ position: 'absolute', top: '44%', right: 24, fontSize: 14 }}>✦</span>
      </div>
      {children}
    </div>
  );
}

Object.assign(window, {
  washBg, WashScene, BuddyFace, NatureTag, SpeechBubble, SunRow, NavPill, RoundBtn,
  ProgressRing, ChapterDots, MatCover, Medallion, Confetti, BigMic, Dots, KidScreen,
});
