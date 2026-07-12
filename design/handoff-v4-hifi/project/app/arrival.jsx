/* Little Fables — first arrival.
   After the endpaper open beat: the room in morning light, no buddy on the
   rug yet. The buddies are IN the room — peeking from behind the shelf, up
   on the windowsill — not in a carousel. Greeting one plays its intro
   (spoken); the rug then glows: choosing = the buddy walks to the rug.
   Objects and camera move continuously — there is no cut into Home. */

function ArrivalLayer({ nav }) {
  const { BookCover } = window.LittleFablesDesignSystem_d603a2;
  const { CreatureSprite, CREATURES, BuddyLine, holdToSpeak, CrateArt, LF_BOOKS, LF_SHELF_ORDER, ROOM_LAYOUT, bookRect, speakTTS } = window;
  const L = ROOM_LAYOUT.landscape; // first arrival is a landscape moment
  const [greeted, setGreeted] = React.useState(null);
  const [walking, setWalking] = React.useState(null);

  /* where each buddy hides in the room (peeking, perched, tucked) */
  const SPOTS = {
    bear:  { x: 706, y: 462, size: 150, peek: "shelf", label: "the bear, peeking from behind the shelf" },
    otter: { x: 196, y: 336, size: 96, label: "otter, up on the windowsill" },
    anky:  { x: 306, y: 690, size: 96, label: "little anky, beside the puzzle" },
    moto:  { x: 548, y: 556, size: 84, label: "moto, by the table leg" },
    rocky: { x: 98, y: 486, size: 104, label: "rocky, next to the guitar" },
    rusty: { x: 594, y: 646, size: 96, label: "rusty, at the edge of the rug" }
  };

  function greet(id) {
    if (walking) return;
    setGreeted(id);
    speakTTS(CREATURES[id].intro);
  }
  function choose(id) {
    if (walking) return;
    setWalking(id);
    /* the buddy walks to the rug — one continuous move, then Home */
    setTimeout(() => {
      nav.patchState({ buddy: id, history: { ...nav.state.history, chosen: true } });
      nav.setRoute({ screen: "home" });
    }, 1800);
  }

  const rugGlow = greeted && !walking;

  return (
    <div data-screen-label="First arrival — meeting the buddies" style={{ position: "absolute", inset: 0 }}>
      {/* the shelf carries the real library from day one (quiet — no beacon yet) */}
      {LF_SHELF_ORDER.map((id) => {
        const b = LF_BOOKS[id];
        const r = bookRect(L, id, []);
        const Art = window[b.coverArt];
        return (
          <div key={id} style={{ position: "absolute", left: r.x, top: r.y }}>
            <BookCover title={b.title} pigment={b.pigment} width={r.w} art={<Art></Art>}></BookCover>
          </div>
        );
      })}

      {/* the wrapped crate under the table — someone new is coming */}
      <div {...holdToSpeak("Someone new is coming — read two more days!")}
        aria-label="a wrapped crate: someone new is coming" style={{ position: "absolute", left: L.crate.x, top: L.crate.y, cursor: "pointer" }}>
        <CrateArt></CrateArt>
      </div>

      {/* the buddies, in the room */}
      {Object.keys(SPOTS).map((id) => {
        const s = SPOTS[id];
        const isGreeted = greeted === id;
        const isWalking = walking === id;
        const hidden = walking && !isWalking;
        const pos = isWalking ? { x: L.buddy.x + 40, y: L.buddy.y + 30, size: L.buddy.size * 0.9 } : s;
        return (
          <div key={id}
            style={{
              position: "absolute", left: pos.x, top: pos.y,
              opacity: hidden ? 0 : 1,
              zIndex: isWalking ? 8 : 3,
              transition: "left 1700ms var(--ease-drawn), top 1700ms var(--ease-drawn), opacity 700ms ease",
            }}>
            <div style={{
              overflow: s.peek === "shelf" && !isGreeted && !isWalking ? "hidden" : "visible",
              width: s.peek === "shelf" && !isGreeted && !isWalking ? s.size * 0.62 : undefined,
              transition: "width 500ms var(--ease-settle)"
            }}>
              <div style={{ transform: isWalking ? "scale(" + (L.buddy.size * 0.9 / s.size) + ")" : isGreeted ? "translateY(-6px)" : "none", transformOrigin: "50% 100%", transition: "transform 1700ms var(--ease-drawn)" }}>
                <CreatureSprite kind={id} pose={isGreeted && !isWalking ? "celebrating" : "idle"} size={s.size}></CreatureSprite>
              </div>
            </div>
            <button onClick={() => (isGreeted ? choose(id) : greet(id))}
              aria-label={isGreeted ? CREATURES[id].name + " — come to the rug" : "say hello to " + s.label}
              style={{ position: "absolute", inset: -14, cursor: "pointer", borderRadius: 30 }}></button>
          </div>
        );
      })}

      {/* intro line of whichever buddy was greeted (its one line) */}
      {greeted && !walking && (
        <window.BuddyLine key={greeted} line={CREATURES[greeted].intro} tail={SPOTS[greeted].x > 590 ? "right" : "left"} maxWidth={300}
          style={{
            position: "absolute",
            left: Math.min(Math.max(SPOTS[greeted].x - 90, 24), 830),
            top: Math.max(SPOTS[greeted].y - 116, 20),
            zIndex: 9
          }}></window.BuddyLine>
      )}

      {/* the rug invitation: the one glowing next thing once a buddy is greeted */}
      {rugGlow && (
        <button onClick={() => choose(greeted)} aria-label="pat the rug — come sit with me"
          className="lfp-beacon"
          style={{
            position: "absolute", left: 358, top: 650, width: 210, height: 70,
            borderRadius: "50%", cursor: "pointer", zIndex: 2
          }}></button>
      )}
      {rugGlow && (
        <div className="lfp-fade-in" style={{ position: "absolute", left: 380, top: 748, fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 20, color: "var(--ink-soft)", pointerEvents: "none" }}>
          tap {window.CREATURES[greeted].name} again — or pat the rug
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ArrivalLayer });
