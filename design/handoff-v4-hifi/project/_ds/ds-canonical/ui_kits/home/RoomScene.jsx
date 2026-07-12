import React, { useEffect, useRef, useState } from "react";

/* The room — inlines assets/room/north-star.svg as the living background.
   Children render in the same 1180×820 coordinate space on top. */

export function RoomScene({ children, hideBuddy = true, hideWords = false }) {
  const [svg, setSvg] = useState(null);
  const ref = useRef(null);

  useEffect(function () {
    fetch("../../assets/room/north-star.svg")
      .then(function (r) { return r.text(); })
      .then(setSvg);
  }, []);

  useEffect(
    function () {
      if (!svg || !ref.current) return;
      const root = ref.current;
      const b = root.querySelector("#ns-buddy");
      if (b) b.style.display = hideBuddy ? "none" : "";
      const w = root.querySelector("#ns-words");
      if (w) w.style.display = hideWords ? "none" : "";
      const s = root.querySelector("svg");
      if (s) { s.style.width = "100%"; s.style.height = "100%"; s.style.display = "block"; }
    },
    [svg, hideBuddy, hideWords]
  );

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div ref={ref} style={{ position: "absolute", inset: 0 }} dangerouslySetInnerHTML={{ __html: svg || "" }}></div>
      {children}
    </div>
  );
}

window.RoomScene = RoomScene;
