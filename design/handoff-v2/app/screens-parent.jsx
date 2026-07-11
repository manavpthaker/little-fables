/* Little Fables — grown-up surfaces: gate + parent corner (shadcn neutrals, Inter). */
const { useState } = React;
const { Button, Card, Input } = window.LittleFablesDesignSystem_36f5e7;
const LF = window.LF;

/* Minimal Lucide glyphs (stroke style, 16px) */
function Icon({ d, size = 16, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }} aria-hidden="true">
      {d.map((p, i) => <path key={i} d={p}></path>)}
    </svg>
  );
}
const IC = {
  plus: ['M5 12h14', 'M12 5v14'],
  play: ['M6 4l14 8-14 8z'],
  chevronLeft: ['M15 18l-6-6 6-6'],
  mic: ['M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z', 'M19 10v2a7 7 0 0 1-14 0v-2', 'M12 19v3'],
  x: ['M18 6 6 18', 'm6 6 12 12'],
};

/* ================= 11a · GROWN-UPS GATE ================= */
function Gate({ app }) {
  const [miss, setMiss] = useState(0);
  const answer = (v) => {
    if (v === 12) app.nav('parent');
    else setMiss((m) => m + 1);
  };
  return (
    <div data-screen-label="Grown-ups gate" className="lf-screen-in" style={{ position: 'absolute', inset: 0, background: 'var(--lf-p-muted)', fontFamily: 'var(--font-ui)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button type="button" onClick={() => app.nav('home')} style={{ position: 'absolute', top: 24, left: 28, display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', cursor: 'pointer', font: '500 14px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
        <Icon d={IC.chevronLeft} /> Back to Azad's world
      </button>
      <div key={miss} className={miss ? 'lf-shake' : ''} style={{ width: 380 }}>
        <Card title="For grown-ups" description="Answer to open the parent corner." padded>
          <div style={{ font: '600 28px var(--font-ui)', color: 'var(--lf-p-foreground)', margin: '4px 0 16px' }}>3 × 4 = ?</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[7, 12, 11].map((v) => (
              <Button key={v} variant="outline" size="lg" style={{ flex: 1, fontSize: 16 }} onClick={() => answer(v)}>{v}</Button>
            ))}
          </div>
          <p style={{ margin: '14px 0 0', font: '400 13px var(--font-ui)', color: 'var(--lf-p-muted-foreground)', minHeight: 18 }}>
            {miss ? 'Not quite — try once more.' : ''}
          </p>
        </Card>
      </div>
    </div>
  );
}

/* ================= 11b · PARENT CORNER ================= */
function ParentCorner({ app }) {
  const [tab, setTab] = useState('stories');
  const [goals, setGoals] = useState(LF.PARENT.goals);
  const [interests, setInterests] = useState(LF.PARENT.interests);
  const [playing, setPlaying] = useState(null);
  return (
    <div data-screen-label="Parent corner" className="lf-screen-in" style={{ position: 'absolute', inset: 0, background: 'var(--lf-p-muted)', fontFamily: 'var(--font-ui)', color: 'var(--lf-p-foreground)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: 'var(--lf-p-background)', borderBottom: '1px solid var(--lf-p-border)', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 18 }}>
        <button type="button" onClick={() => app.nav('home')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', cursor: 'pointer', font: '500 14px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
          <Icon d={IC.chevronLeft} /> Azad's world
        </button>
        <h1 style={{ margin: 0, font: '700 18px var(--font-ui)' }}>Parent corner</h1>
        <nav style={{ marginLeft: 24, display: 'flex', gap: 4 }}>
          {[['stories', 'Stories'], ['retells', 'Retellings'], ['universe', 'Azad\'s universe']].map(([id, label]) => (
            <button key={id} type="button" onClick={() => setTab(id)} style={{
              border: 'none', cursor: 'pointer', padding: '7px 14px', borderRadius: 6,
              background: tab === id ? 'var(--lf-p-muted)' : 'transparent',
              font: `500 14px var(--font-ui)`, color: tab === id ? 'var(--lf-p-foreground)' : 'var(--lf-p-muted-foreground)',
            }}>{label}</button>
          ))}
        </nav>
        <span style={{ marginLeft: 'auto', font: '400 12.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>Auto-saved</span>
      </header>

      <main style={{ flex: 1, overflow: 'hidden', padding: '22px 28px' }}>
        {tab === 'stories' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ margin: 0, font: '400 13.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>Stories the family has made. Published stories appear on Azad's shelf.</p>
              <span style={{ marginLeft: 'auto' }}>
                <Button size="default" onClick={() => app.nav('maker')}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><Icon d={IC.plus} size={15} /> New story</span></Button>
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {LF.PARENT.stories.map((s) => (
                <Card key={s.title} padded={false}>
                  <div style={{ height: 116, borderRadius: '12px 12px 0 0', overflow: 'hidden', position: 'relative', background: s.img ? `center / cover url("${s.img}")` : washBg(s.wash), filter: s.status === 'Draft' ? 'saturate(.55) opacity(.8)' : 'none' }}>
                    {!s.img && <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }} aria-hidden="true">{s.emoji}</span>}
                  </div>
                  <div style={{ padding: '12px 14px 14px' }}>
                    <div style={{ font: '600 14px/1.3 var(--font-ui)' }}>{s.title}</div>
                    <div style={{ font: '400 12.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)', margin: '3px 0 8px' }}>by {s.author} · {s.pages} pages</div>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 9px', borderRadius: 999,
                      font: '500 11.5px var(--font-ui)',
                      background: s.status === 'Published' ? '#f0fdf4' : 'var(--lf-p-muted)',
                      color: s.status === 'Published' ? '#15803d' : 'var(--lf-p-muted-foreground)',
                      border: `1px solid ${s.status === 'Published' ? '#bbf7d0' : 'var(--lf-p-border)'}`,
                    }}>
                      {s.status}{s.note ? ` — ${s.note}` : ''}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {tab === 'retells' && (
          <div style={{ maxWidth: 640 }}>
            <p style={{ margin: '0 0 14px', font: '400 13.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>Azad's story retellings, in his own words.</p>
            <Card padded={false}>
              {LF.PARENT.retells.map((r, i) => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderTop: i ? '1px solid var(--lf-p-border)' : 'none' }}>
                  <Button variant={playing === i ? 'secondary' : 'outline'} size="icon" onClick={() => setPlaying(playing === i ? null : i)} aria-label="Play">
                    <Icon d={IC.play} size={14} />
                  </Button>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: '500 14px var(--font-ui)' }}>{r.label}</div>
                    <div style={{ font: '400 12.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>{r.when} · {r.dur}</div>
                  </div>
                  <div style={{ width: 220, height: 4, borderRadius: 2, background: 'var(--lf-p-muted)', position: 'relative', overflow: 'hidden' }}>
                    <div className={playing === i ? 'lf-play-progress' : ''} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: playing === i ? undefined : 0, background: 'var(--lf-p-primary)' }}></div>
                  </div>
                  <Icon d={IC.mic} size={15} style={{ color: 'var(--lf-p-muted-foreground)' }} />
                </div>
              ))}
            </Card>
          </div>
        )}

        {tab === 'universe' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, maxWidth: 1060 }}>
            <Card title="Interests" description="Woven into new stories.">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {interests.map((c) => (
                  <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, border: '1px solid var(--lf-p-border)', font: '500 13px var(--font-ui)', color: 'var(--lf-p-foreground)' }}>
                    {c}
                    <button type="button" aria-label={`Remove ${c}`} onClick={() => setInterests(interests.filter((x) => x !== c))} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: 'var(--lf-p-muted-foreground)', display: 'inline-flex' }}>
                      <Icon d={IC.x} size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <Input placeholder="Add an interest…" />
            </Card>
            <Card title="Teaching goals" description="What stories gently practice.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {goals.map((g, i) => (
                  <label key={g.label} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <button type="button" role="switch" aria-checked={g.on} onClick={() => setGoals(goals.map((x, j) => j === i ? { ...x, on: !x.on } : x))} style={{
                      width: 34, height: 20, borderRadius: 999, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
                      background: g.on ? 'var(--lf-p-primary)' : 'var(--lf-p-border)', transition: 'background 150ms',
                    }}>
                      <span style={{ position: 'absolute', top: 2, left: g.on ? 16 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 150ms' }}></span>
                    </button>
                    <span style={{ font: '400 13.5px var(--font-ui)' }}>{g.label}</span>
                  </label>
                ))}
              </div>
            </Card>
            <Card title="Gujarati family words" description="Real words from home.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {LF.PARENT.gujarati.map((g) => (
                  <div key={g.w} style={{ display: 'flex', gap: 10, alignItems: 'baseline', borderBottom: '1px solid var(--lf-p-border)', paddingBottom: 8 }}>
                    <span style={{ font: '600 14px var(--font-ui)', minWidth: 54 }}>{g.w}</span>
                    <span style={{ font: '400 13.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>{g.m}</span>
                  </div>
                ))}
              </div>
              <Input placeholder="word — meaning" />
            </Card>
          </div>
        )}
      </main>
      <footer style={{ padding: '10px 28px', borderTop: '1px solid var(--lf-p-border)', background: 'var(--lf-p-background)', font: '400 12.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
        Auto-saved · Changes appear in Azad's app right away
      </footer>
    </div>
  );
}

/* ================= 11c · STORY MAKER (guided wizard) ================= */
function StoryMaker({ app }) {
  const [step, setStep] = useState(1);
  const [format, setFormat] = useState(null); // quick | chapter
  const [fields, setFields] = useState({ hero: '', want: '', place: '', teaches: '' });
  const [writing, setWriting] = useState(false);
  const [wIdx, setWIdx] = useState(0); // chapters completed
  const chapters = format === 'chapter' ? 3 : 1;
  const done = writing && wIdx >= chapters;

  React.useEffect(() => {
    if (!writing || done) return;
    const t = setTimeout(() => setWIdx((i) => i + 1), 1600);
    return () => clearTimeout(t);
  }, [writing, wIdx]);

  const Q = [
    { id: 'hero', label: 'Who is the hero?', chips: ['Miko the fox', 'A brave otter', 'Rusty the rocket', 'A little dinosaur'] },
    { id: 'want', label: 'What do they want?', chips: ['to cross the canyon', 'to find a lost star', 'to make a new friend', 'to fix something broken'] },
    { id: 'place', label: 'Where does it happen?', chips: ['Dino Canyon', 'Zoomtown', 'a snowy village', 'the Star Garage'] },
    { id: 'teaches', label: 'What does it gently teach?', chips: ['counting', 'star words', 'feelings', 'living vs. nonliving', 'Gujarati words'] },
  ];
  const ready2 = Q.every((q) => fields[q.id]);

  return (
    <div data-screen-label="Parent — story maker" className="lf-screen-in" style={{ position: 'absolute', inset: 0, background: 'var(--lf-p-muted)', fontFamily: 'var(--font-ui)', color: 'var(--lf-p-foreground)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: 'var(--lf-p-background)', borderBottom: '1px solid var(--lf-p-border)', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button type="button" onClick={() => app.nav('parent')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', cursor: 'pointer', font: '500 14px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
          <Icon d={IC.chevronLeft} /> Parent corner
        </button>
        <h1 style={{ margin: 0, font: '700 18px var(--font-ui)' }}>New story</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }} aria-label={`Step ${step} of 3`}>
          {[1, 2, 3].map((s) => (
            <span key={s} style={{ width: s === step ? 20 : 7, height: 7, borderRadius: 99, background: s <= step ? 'var(--lf-p-primary)' : 'var(--lf-p-border)', transition: 'width 200ms' }}></span>
          ))}
        </div>
      </header>

      <main style={{ flex: 1, overflow: 'auto', padding: '26px 28px', display: 'flex', justifyContent: 'center' }}>
        {step === 1 && (
          <div style={{ width: 640 }}>
            <p style={{ margin: '0 0 14px', font: '400 14px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>What shape of story?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[{ id: 'quick', t: 'Quick story', d: 'One sitting · 10–14 pages · good for car rides' }, { id: 'chapter', t: 'Chapter book', d: '3–5 chapters · a week of reading · one big arc' }].map((f) => (
                <button key={f.id} type="button" onClick={() => setFormat(f.id)} style={{
                  textAlign: 'left', cursor: 'pointer', borderRadius: 12, padding: '18px 18px 16px',
                  color: 'var(--lf-p-foreground)',
                  border: format === f.id ? '2px solid var(--lf-p-primary)' : '1px solid var(--lf-p-border)',
                  background: 'var(--lf-p-background)',
                }}>
                  <div style={{ font: '600 15px var(--font-ui)' }}>{f.t}</div>
                  <div style={{ font: '400 13px/1.5 var(--font-ui)', color: 'var(--lf-p-muted-foreground)', marginTop: 4 }}>{f.d}</div>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
              <Button size="lg" disabled={!format} style={{ opacity: format ? 1 : .5 }} onClick={() => format && setStep(2)}>Continue</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ width: 760 }}>
            <p style={{ margin: '0 0 14px', font: '400 14px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>One question at a time — suggestions come from Azad's interests and teaching goals.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {Q.map((q) => (
                <Card key={q.id} title={q.label} padded>
                  <Input placeholder="Type… or tap a suggestion" value={fields[q.id]} onChange={(e) => setFields({ ...fields, [q.id]: e.target.value })} />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
                    {q.chips.map((c) => (
                      <button key={c} type="button" onClick={() => setFields((f) => ({ ...f, [q.id]: c }))} style={{
                        cursor: 'pointer', borderRadius: 999, padding: '4px 11px', font: '500 12.5px var(--font-ui)',
                        color: 'var(--lf-p-foreground)',
                        border: fields[q.id] === c ? '1.5px solid var(--lf-p-primary)' : '1px solid var(--lf-p-border)',
                        background: fields[q.id] === c ? 'var(--lf-p-muted)' : 'var(--lf-p-background)',
                      }}>{c}</button>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button size="lg" disabled={!ready2} style={{ opacity: ready2 ? 1 : .5 }} onClick={() => ready2 && setStep(3)}>Review</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ width: 560 }}>
            <Card title={done ? 'On the shelf' : writing ? 'Writing…' : 'Ready to write'} description={done ? 'Published as a draft — art is still painting.' : writing ? 'This takes about a minute per chapter.' : 'Check the ingredients, then let it write.'} padded>
              {!writing && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[['Format', format === 'chapter' ? 'Chapter book · 3 chapters' : 'Quick story'], ['Hero', fields.hero], ['Wants', fields.want], ['Place', fields.place], ['Teaches', fields.teaches]].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--lf-p-border)', paddingBottom: 8 }}>
                      <span style={{ font: '500 13px var(--font-ui)', color: 'var(--lf-p-muted-foreground)', width: 70, flexShrink: 0 }}>{k}</span>
                      <span style={{ font: '500 13.5px var(--font-ui)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
              {writing && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Array.from({ length: chapters }).map((_, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, font: '500 13.5px var(--font-ui)' }}>
                      <span style={{ width: 18, textAlign: 'center' }}>{i < wIdx ? '✓' : i === wIdx ? <span className="lf-spin" style={{ display: 'inline-block' }}>◌</span> : '·'}</span>
                      <span style={{ color: i <= wIdx ? 'var(--lf-p-foreground)' : 'var(--lf-p-muted-foreground)' }}>
                        {format === 'chapter' ? `Chapter ${i + 1}` : 'Story text'} — {i < wIdx ? 'written' : i === wIdx ? 'writing…' : 'waiting'}
                      </span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, font: '500 13.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
                    <span style={{ width: 18, textAlign: 'center' }}>{done ? '◑' : '·'}</span>
                    Art — {done ? 'still painting (publishes as draft first)' : 'waiting for the words'}
                  </div>
                </div>
              )}
            </Card>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: writing ? 'flex-end' : 'space-between' }}>
              {!writing && <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>}
              {!writing && <Button size="lg" onClick={() => { setWIdx(0); setWriting(true); }}>Write it</Button>}
              {done && <Button size="lg" onClick={() => app.nav('parent')}>Back to stories</Button>}
            </div>
          </div>
        )}
      </main>
      <footer style={{ padding: '10px 28px', borderTop: '1px solid var(--lf-p-border)', background: 'var(--lf-p-background)', font: '400 12.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>
        Auto-saved · Drafts never appear on Azad's shelf until published
      </footer>
    </div>
  );
}

Object.assign(window, { Gate, ParentCorner, StoryMaker });
