// Grown-ups — math gate + Parent Corner. shadcn neutrals, Inter, quiet and
// plain: no emoji, no exclamation points, clearly separated from the kid world.
const DS_P = window.LittleFablesDesignSystem_36f5e7;
const PButton = DS_P.Button;
const PCard = DS_P.Card;
const PInput = DS_P.Input;

// Lucide glyphs (parent surfaces use the Lucide set — exact paths, 16px stroke style)
function Lucide({ d, size = 16, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      {d}
    </svg>
  );
}
const IconPlay = (p) => <Lucide {...p} d={<polygon points="6 3 20 12 6 21 6 3" />} />;
const IconPause = (p) => <Lucide {...p} d={<React.Fragment><rect x="14" y="4" width="4" height="16" rx="1" /><rect x="6" y="4" width="4" height="16" rx="1" /></React.Fragment>} />;
const IconPlus = (p) => <Lucide {...p} d={<React.Fragment><path d="M5 12h14" /><path d="M12 5v14" /></React.Fragment>} />;
const IconX = (p) => <Lucide {...p} d={<React.Fragment><path d="M18 6 6 18" /><path d="m6 6 12 12" /></React.Fragment>} />;
const IconChevronLeft = (p) => <Lucide {...p} d={<path d="m15 18-6-6 6-6" />} />;
const IconCheck = (p) => <Lucide {...p} d={<path d="M20 6 9 17l-5-5" />} />;

// ---- Math gate ----
function GateScreen({ onBack, onPass }) {
  const [wrong, setWrong] = React.useState(false);
  const answers = [18, 24, 28];
  const pick = (n) => {
    if (n === 24) { onPass(); return; }
    setWrong(false);
    requestAnimationFrame(() => setWrong(true));
  };
  return (
    <div data-screen-label="Grown-ups — math gate" style={{ height: '100%', background: 'var(--lf-p-muted)', color: 'var(--lf-p-foreground)', fontFamily: 'var(--font-ui)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px 28px' }}>
        <PButton variant="ghost" onClick={onBack} style={{ color: 'var(--lf-p-muted-foreground)' }}>
          <IconChevronLeft /> Back to Story World
        </PButton>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 40px 120px' }}>
        <div className={wrong ? 'sw-shake' : ''} style={{ width: 400 }}>
          <PCard title="Grown-ups only" description="Solve to open the parent corner.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ font: '600 32px/1.2 var(--font-ui)', letterSpacing: '-0.02em' }}>6 × 4 =</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {answers.map((n) => (
                  <PButton key={n} variant="outline" size="lg" onClick={() => pick(n)} style={{ fontSize: 16, height: 48 }}>{n}</PButton>
                ))}
              </div>
              <div style={{ font: '400 13px/1.4 var(--font-ui)', color: 'var(--lf-p-muted-foreground)', minHeight: 18 }}>
                {wrong ? 'Not quite — try once more.' : 'This keeps little fingers in the story world.'}
              </div>
            </div>
          </PCard>
        </div>
      </div>
    </div>
  );
}

// ---- Parent corner ----
const REC_INIT = [
  { id: 'r1', story: 'The Rocket That Wouldn’t Roar', date: 'Jul 9', dur: 37 },
  { id: 'r2', story: 'Miko and the Wobbly Bridge', date: 'Jul 8', dur: 42 },
  { id: 'r3', story: 'Azi’s Little Bhen', date: 'Jul 5', dur: 63 },
];
const fmtDur = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');

function RecordingRow({ rec, playing, progress, onToggle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0' }}>
      <button type="button" aria-label={(playing ? 'Pause ' : 'Play ') + rec.story} onClick={onToggle}
        style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid var(--lf-p-border)', background: playing ? 'var(--lf-p-primary)' : 'var(--lf-p-background)', color: playing ? 'var(--lf-p-primary-foreground)' : 'var(--lf-p-foreground)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background 150ms' }}>
        {playing ? <IconPause size={14} /> : <IconPlay size={14} style={{ marginLeft: 2 }} />}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: '500 14px/1.4 var(--font-ui)' }}>{rec.story}</div>
        <div style={{ font: '400 12.5px/1.4 var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>{rec.date} · {fmtDur(rec.dur)} · retell</div>
        <div style={{ height: 4, borderRadius: 999, background: 'var(--lf-p-muted)', marginTop: 8, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: (playing ? progress : 0) + '%', background: 'var(--lf-p-primary)', borderRadius: 999, transition: 'width 300ms linear' }}></div>
        </div>
      </div>
      <span style={{ font: '400 12.5px var(--font-ui)', color: 'var(--lf-p-muted-foreground)', flexShrink: 0 }}>{playing ? fmtDur(Math.round(rec.dur * progress / 100)) : fmtDur(rec.dur)}</span>
    </div>
  );
}

function ParentScreen({ onBack }) {
  const [playingId, setPlayingId] = React.useState(null);
  const [progress, setProgress] = React.useState(0);
  const [interests, setInterests] = React.useState(['motos', 'soccer', 'space', 'dinos']);
  const [newInterest, setNewInterest] = React.useState('');
  const [goals, setGoals] = React.useState({ 'counting to 10': true, 'belly breaths': true, 'being grateful': true, 'trying again': false });
  const [words, setWords] = React.useState([
    { w: 'Bhen', m: 'sister' },
    { w: 'Dadi', m: 'grandmother' },
    { w: 'Masi', m: 'auntie' },
  ]);
  const [newWord, setNewWord] = React.useState('');
  const [newMeaning, setNewMeaning] = React.useState('');

  React.useEffect(() => {
    if (!playingId) return;
    setProgress(0);
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(t); setPlayingId(null); return 0; }
        return p + 4;
      });
    }, 300);
    return () => clearInterval(t);
  }, [playingId]);

  const addInterest = () => {
    const v = newInterest.trim().toLowerCase();
    if (v && !interests.includes(v)) setInterests([...interests, v]);
    setNewInterest('');
  };
  const addWord = () => {
    const w = newWord.trim(), m = newMeaning.trim();
    if (w && m) { setWords([...words, { w, m }]); setNewWord(''); setNewMeaning(''); }
  };

  const chipStyle = { display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid var(--lf-p-border)', background: 'var(--lf-p-background)', borderRadius: 999, padding: '6px 12px', font: '500 13px var(--font-ui)', color: 'var(--lf-p-foreground)' };

  return (
    <div className="sw-screen" data-screen-label="Parent corner" style={{ background: 'var(--lf-p-muted)', color: 'var(--lf-p-foreground)', fontFamily: 'var(--font-ui)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 32px 60px' }}>
        <PButton variant="ghost" onClick={onBack} style={{ color: 'var(--lf-p-muted-foreground)', marginLeft: -12 }}>
          <IconChevronLeft /> Back to Story World
        </PButton>
        <h1 style={{ margin: '18px 0 4px', font: '700 26px/1.3 var(--font-ui)', letterSpacing: '-0.02em' }}>Parent corner</h1>
        <p style={{ margin: '0 0 24px', font: '400 14px/1.5 var(--font-ui)', color: 'var(--lf-p-muted-foreground)' }}>Azad · 4 years old · 12 stories read</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Retell recordings */}
          <PCard title="Retell recordings" description="Azad tells each story back in his own words.">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {REC_INIT.map((rec, i) => (
                <div key={rec.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--lf-p-border)' }}>
                  <RecordingRow rec={rec} playing={playingId === rec.id} progress={progress}
                    onToggle={() => setPlayingId(playingId === rec.id ? null : rec.id)} />
                </div>
              ))}
            </div>
          </PCard>

          {/* Universe editor */}
          <PCard title="Azad’s universe" description="What the story engine draws from. Changes apply to the next story.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <div style={{ font: '500 14px/1 var(--font-ui)', marginBottom: 10 }}>Interests</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {interests.map((it) => (
                    <span key={it} style={chipStyle}>
                      {it}
                      <button type="button" aria-label={'Remove ' + it} onClick={() => setInterests(interests.filter((x) => x !== it))}
                        style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: 'var(--lf-p-muted-foreground)', display: 'inline-flex' }}>
                        <IconX size={13} />
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <PInput placeholder="Add an interest" value={newInterest} onChange={(e) => setNewInterest(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addInterest()} style={{ flex: 1 }} />
                  <PButton variant="secondary" onClick={addInterest}><IconPlus /> Add</PButton>
                </div>
              </div>

              <div>
                <div style={{ font: '500 14px/1 var(--font-ui)', marginBottom: 10 }}>Teaching goals</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {Object.keys(goals).map((g) => {
                    const on = goals[g];
                    return (
                      <button key={g} type="button" onClick={() => setGoals({ ...goals, [g]: !on })}
                        style={{ ...chipStyle, cursor: 'pointer', background: on ? 'var(--lf-p-primary)' : 'var(--lf-p-background)', color: on ? 'var(--lf-p-primary-foreground)' : 'var(--lf-p-muted-foreground)', borderColor: on ? 'var(--lf-p-primary)' : 'var(--lf-p-border)' }}>
                        {on ? <IconCheck size={13} /> : null}
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={{ font: '500 14px/1 var(--font-ui)', marginBottom: 4 }}>Family words</div>
                <div style={{ font: '400 12.5px/1.4 var(--font-ui)', color: 'var(--lf-p-muted-foreground)', marginBottom: 10 }}>Gujarati words woven into Azad’s stories.</div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {words.map((fw, i) => (
                    <div key={fw.w + i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: i === 0 ? 'none' : '1px solid var(--lf-p-border)' }}>
                      <span style={{ font: '500 14px var(--font-ui)', width: 90 }}>{fw.w}</span>
                      <span style={{ font: '400 13px var(--font-ui)', color: 'var(--lf-p-muted-foreground)', flex: 1 }}>{fw.m}</span>
                      <button type="button" aria-label={'Remove ' + fw.w} onClick={() => setWords(words.filter((_, j) => j !== i))}
                        style={{ border: 'none', background: 'none', padding: 4, cursor: 'pointer', color: 'var(--lf-p-muted-foreground)', display: 'inline-flex' }}>
                        <IconX size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <PInput placeholder="Word" value={newWord} onChange={(e) => setNewWord(e.target.value)} style={{ width: 130 }} />
                  <PInput placeholder="Meaning" value={newMeaning} onChange={(e) => setNewMeaning(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addWord()} style={{ flex: 1 }} />
                  <PButton variant="secondary" onClick={addWord}><IconPlus /> Add</PButton>
                </div>
              </div>
            </div>
          </PCard>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: '400 12px var(--font-ui)', color: 'var(--lf-p-muted-foreground)', justifyContent: 'center' }}>
            <IconCheck size={13} /> Auto-saved
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { GateScreen, ParentScreen });
