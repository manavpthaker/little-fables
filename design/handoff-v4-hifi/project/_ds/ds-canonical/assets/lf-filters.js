/* Little Fables — shared SVG filter defs, injected once per page.
   <script src="assets/lf-filters.js"></script>  (path-relative)
   Provides: #lf-wobble  — hand-drawn wobble for borders/lines (static)
             #lf-wobble-bold — heavier wobble for big edges
             #lf-wash-edge   — watercolor bleed for pigment fields
             #lf-dry         — dry-brush breakup for rules/accents
             #lf-boil        — 2s / 3-frame line boil (skipped when
                               prefers-reduced-motion)                    */
(function () {
  if (document.getElementById("lf-filter-defs")) return;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var boilAnim = reduced ? "" :
    '<animate attributeName="seed" values="3;7;12" dur="2s" calcMode="discrete" repeatCount="indefinite"/>';
  var svg =
    '<svg id="lf-filter-defs" width="0" height="0" style="position:absolute" aria-hidden="true">' +
      '<defs>' +
        '<filter id="lf-wobble" x="-8%" y="-8%" width="116%" height="116%">' +
          '<feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="2" seed="3" result="n"/>' +
          '<feDisplacementMap in="SourceGraphic" in2="n" scale="4.5"/>' +
        '</filter>' +
        '<filter id="lf-wobble-bold" x="-12%" y="-12%" width="124%" height="124%">' +
          '<feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="7" result="n"/>' +
          '<feDisplacementMap in="SourceGraphic" in2="n" scale="8"/>' +
        '</filter>' +
        '<filter id="lf-wash-edge" x="-15%" y="-15%" width="130%" height="130%">' +
          '<feGaussianBlur in="SourceGraphic" stdDeviation="0.6" result="b"/>' +
          '<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="9" result="n"/>' +
          '<feDisplacementMap in="b" in2="n" scale="13"/>' +
        '</filter>' +
        '<filter id="lf-dry" x="-15%" y="-40%" width="130%" height="180%">' +
          '<feTurbulence type="fractalNoise" baseFrequency="0.3 0.05" numOctaves="2" seed="8" result="n"/>' +
          '<feDisplacementMap in="SourceGraphic" in2="n" scale="5" result="d"/>' +
          '<feTurbulence type="fractalNoise" baseFrequency="0.14 0.4" numOctaves="2" seed="5" result="m"/>' +
          '<feColorMatrix in="m" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1.7 -0.3" result="mask"/>' +
          '<feComposite in="d" in2="mask" operator="in"/>' +
        '</filter>' +
        '<filter id="lf-boil" x="-8%" y="-8%" width="116%" height="116%">' +
          '<feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="2" seed="3" result="n">' + boilAnim + '</feTurbulence>' +
          '<feDisplacementMap in="SourceGraphic" in2="n" scale="4.5"/>' +
        '</filter>' +
      '</defs>' +
    '</svg>';
  var host = document.createElement("div");
  host.innerHTML = svg;
  var el = host.firstChild;
  function mount() { document.body.insertBefore(el, document.body.firstChild); }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
