/* Little Fables — app root: routing, scaling stage, tweaks. */
const { useState, useEffect } = React;
const LF = window.LF;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "screen": "home",
  "buddy": "bear",
  "energy": "bouncy",
  "offline": false,
  "storyError": false,
  "emptyShelf": false,
  "reduceMotion": false
}/*EDITMODE-END*/;

const SCREENS = [
  { value: 'home', label: 'Home' },
  { value: 'carousel', label: 'Buddy carousel' },
  { value: 'arrival', label: 'Buddy arrival' },
  { value: 'map', label: 'Chapter map' },
  { value: 'recap', label: 'Recap on resume' },
  { value: 'reader', label: 'Reader' },
  { value: 'chapterEnd', label: 'Chapter end' },
  { value: 'bookComplete', label: 'Book complete' },
  { value: 'badgeEarn', label: 'Badge earning' },
  { value: 'badges', label: 'Badge shelf' },
  { value: 'words', label: 'My words' },
  { value: 'gate', label: 'Grown-ups gate' },
  { value: 'parent', label: 'Parent corner' },
  { value: 'maker', label: 'Parent — story maker' },
  { value: 'artnote', label: 'Designer note — buddy art' },
  { value: 'portraitHome', label: 'Portrait — Home' },
  { value: 'portraitMap', label: 'Portrait — Chapter map' },
];

function Stage({ w, h, rm, children }) {
  const [box, setBox] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const on = () => setBox({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const scale = Math.min(box.w / (w + 24), box.h / (h + 24), 1.1);
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#1c1712', overflow: 'hidden' }}>
      <div className={rm ? 'lf-rm' : ''} style={{
        position: 'absolute', left: '50%', top: '50%', width: w, height: h,
        transform: `translate(-50%,-50%) scale(${scale})`,
        borderRadius: 22, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.5)',
        background: 'var(--lf-cream)',
      }}>
        {children}
      </div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [reading, setReading] = useState({ storyId: 'miko', chapterIdx: 2 });
  const [earned, setEarned] = useState([]);
  const [justEarned, setJustEarned] = useState(null);

  const story = LF.STORIES[reading.storyId];
  const app = {
    t, setTweak,
    energy: t.energy,
    buddy: LF.BUDDIES.find((b) => b.id === t.buddy) || LF.BUDDIES[0],
    reading: { story, chapterIdx: reading.chapterIdx },
    earned, justEarned,
    nav: (r) => setTweak('screen', r),
    pickBuddy: (b) => { setTweak({ buddy: b.id, screen: 'home' }); },
    openChapter: (i) => {
      const ch = LF.STORIES.miko.chapters[i];
      if (!ch || !ch.pages) { setTweak('screen', 'map'); return; }
      setReading({ storyId: 'miko', chapterIdx: i });
      setTweak('screen', 'reader');
    },
    openQuick: (id) => { setReading({ storyId: id, chapterIdx: null }); setTweak('screen', 'reader'); },
    finishBook: () => setTweak('screen', 'bookComplete'),
    earnBadge: (id) => {
      setEarned((e) => (e.includes(id) ? e : [...e, id]));
      setJustEarned(id);
      setTweak('screen', 'badgeEarn');
    },
  };

  const portrait = t.screen === 'portraitHome' || t.screen === 'portraitMap';
  const view = {
    carousel: <BuddyCarousel app={app} />,
    arrival: <BuddyArrival app={app} />,
    home: <Home app={app} />,
    map: <ChapterMap app={app} />,
    recap: <Recap app={app} />,
    reader: <Reader key={`${reading.storyId}-${reading.chapterIdx}`} app={app} />,
    chapterEnd: <ChapterEnd app={app} />,
    bookComplete: <BookComplete app={app} />,
    badgeEarn: <BadgeEarn app={app} />,
    badges: <BadgeShelf app={app} />,
    words: <MyWords app={app} />,
    gate: <Gate app={app} />,
    parent: <ParentCorner app={app} />,
    maker: <StoryMaker app={app} />,
    artnote: <ArtNote app={app} />,
    portraitHome: <PortraitHome app={app} />,
    portraitMap: <PortraitMap app={app} />,
  }[t.screen] || <Home app={app} />;

  return (
    <>
      <Stage w={portrait ? 820 : 1180} h={portrait ? 1180 : 820} rm={t.reduceMotion}>
        {view}
      </Stage>
      <TweaksPanel>
        <TweakSection label="Jump to" />
        <TweakSelect label="Screen" value={t.screen} options={SCREENS} onChange={(v) => setTweak('screen', v)} />
        <TweakSection label="World" />
        <TweakSelect label="Buddy" value={t.buddy} options={LF.BUDDIES.map((b) => ({ value: b.id, label: `${b.emoji} ${b.name}` }))} onChange={(v) => setTweak('buddy', v)} />
        <TweakRadio label="Kid copy" value={t.energy} options={[{ value: 'calm', label: 'Calmer' }, { value: 'bouncy', label: 'Bouncier' }]} onChange={(v) => setTweak('energy', v)} />
        <TweakSection label="States" />
        <TweakToggle label="Offline banner" value={t.offline} onChange={(v) => setTweak({ offline: v, screen: 'home' })} />
        <TweakToggle label="Story error" value={t.storyError} onChange={(v) => setTweak({ storyError: v, screen: 'home' })} />
        <TweakToggle label="Empty bookshelf" value={t.emptyShelf} onChange={(v) => setTweak({ emptyShelf: v, screen: 'home' })} />
        <TweakSection label="Motion" />
        <TweakToggle label="Reduced motion" value={t.reduceMotion} onChange={(v) => setTweak('reduceMotion', v)} />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
