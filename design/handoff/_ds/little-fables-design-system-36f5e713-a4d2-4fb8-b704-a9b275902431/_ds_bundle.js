/* @ds-bundle: {"format":4,"namespace":"LittleFablesDesignSystem_36f5e7","components":[{"name":"AskBubble","sourcePath":"components/learning/AskBubble.jsx"},{"name":"ChoiceCards","sourcePath":"components/learning/ChoiceCards.jsx"},{"name":"VocabStar","sourcePath":"components/learning/VocabStar.jsx"},{"name":"Avatar","sourcePath":"components/parent/Avatar.jsx"},{"name":"Button","sourcePath":"components/parent/Button.jsx"},{"name":"Card","sourcePath":"components/parent/Card.jsx"},{"name":"Input","sourcePath":"components/parent/Input.jsx"},{"name":"MagicButton","sourcePath":"components/story-world/MagicButton.jsx"},{"name":"SceneStage","sourcePath":"components/story-world/SceneStage.jsx"},{"name":"StoryCover","sourcePath":"components/story-world/StoryCover.jsx"}],"sourceHashes":{"components/learning/AskBubble.jsx":"86a0bc021b7b","components/learning/ChoiceCards.jsx":"921ee598ce36","components/learning/VocabStar.jsx":"463d3c1c14cd","components/parent/Avatar.jsx":"94dbc7c3b97a","components/parent/Button.jsx":"74aef678dbc4","components/parent/Card.jsx":"067dee0548b1","components/parent/Input.jsx":"196f6fe130c3","components/story-world/MagicButton.jsx":"05db7993a462","components/story-world/SceneStage.jsx":"8ae723058609","components/story-world/StoryCover.jsx":"c878c93438da","ui_kits/composer/ComposerScreen.jsx":"254d5c3f3f17","ui_kits/composer/HomeScreen.jsx":"5770157fa855","ui_kits/composer/shared.jsx":"c2dd8bdd1ba4","ui_kits/story-world/LibraryScreen.jsx":"23783bbd7b6a","ui_kits/story-world/ReaderScreen.jsx":"8522b9f07610","ui_kits/story-world/story-data.js":"7bf5f4c22fcb"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.LittleFablesDesignSystem_36f5e7 = window.LittleFablesDesignSystem_36f5e7 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/learning/AskBubble.jsx
try { (() => {
/**
 * A teaching moment ("ask" block, Dream Paper) — coral mic + Quicksand question.
 * States: question (mic glowing), praise (mint), hint (peach).
 * Renders inline inside SceneStage's reading card, or standalone as a cream card.
 */
function AskBubble({
  question,
  praise,
  hint,
  skill,
  state = 'question',
  listening = false,
  onMicTap,
  standalone = false,
  style
}) {
  if (typeof document !== 'undefined' && !document.getElementById('lf-ask-css')) {
    const s = document.createElement('style');
    s.id = 'lf-ask-css';
    s.textContent = `
      @keyframes lf-ask-pulse { 0%,100% { box-shadow: 0 6px 14px rgba(244,129,60,.35); } 50% { box-shadow: 0 6px 22px rgba(244,129,60,.6); } }
      @media (prefers-reduced-motion: reduce) { .lf-ask-mic { animation: none !important; } }
    `;
    document.head.appendChild(s);
  }
  const tones = {
    question: {
      bg: 'transparent',
      text: question,
      icon: null
    },
    praise: {
      bg: 'var(--lf-pastel-mint)',
      text: praise,
      icon: '🎉'
    },
    hint: {
      bg: 'var(--lf-pastel-peach)',
      text: hint,
      icon: '💡'
    }
  };
  const t = tones[state] || tones.question;
  const inner = /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: t.bg,
      borderRadius: state === 'question' ? 0 : 14,
      padding: state === 'question' ? 0 : '12px 14px'
    }
  }, state === 'question' ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Answer out loud",
    onClick: onMicTap,
    className: "lf-press lf-ask-mic",
    style: {
      width: 46,
      height: 46,
      flexShrink: 0,
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      background: listening ? 'var(--lf-coral-deep)' : 'var(--lf-coral)',
      fontSize: 19,
      animation: 'lf-ask-pulse 1.8s ease-in-out infinite'
    }
  }, "\uD83C\uDFA4") : /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      fontSize: 22,
      flexShrink: 0
    }
  }, t.icon), /*#__PURE__*/React.createElement("div", null, skill && state === 'question' ? /*#__PURE__*/React.createElement("div", {
    style: {
      font: '700 10px var(--font-body)',
      color: 'var(--lf-espresso-faint)',
      textTransform: 'uppercase',
      letterSpacing: '.07em'
    }
  }, skill) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '700 14.5px/1.4 var(--font-body)',
      color: 'var(--lf-espresso)'
    }
  }, t.text)));
  if (!standalone) return /*#__PURE__*/React.createElement("div", {
    style: style
  }, inner);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--lf-cream-card)',
      border: '1.5px solid var(--lf-cream-line)',
      borderRadius: 'var(--radius-card)',
      padding: '14px 16px',
      ...style
    }
  }, inner);
}
Object.assign(__ds_scope, { AskBubble });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/learning/AskBubble.jsx", error: String((e && e.message) || e) }); }

// components/learning/ChoiceCards.jsx
try { (() => {
/**
 * A branching choice (Dream Paper) — 2-3 tappable cream cards; the child taps
 * or says a keyword and the story branches.
 */
function ChoiceCards({
  prompt,
  options = [],
  chosen,
  onChoose,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      boxSizing: 'border-box',
      fontFamily: 'var(--font-display)',
      ...style
    }
  }, prompt ? /*#__PURE__*/React.createElement("div", {
    style: {
      font: '700 18px/1.3 var(--font-display)',
      color: 'var(--lf-espresso)',
      textAlign: 'center',
      marginBottom: 12
    }
  }, prompt) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(' + Math.min(options.length, 3) + ', 1fr)',
      gap: 10
    }
  }, options.map((o, i) => {
    const isChosen = chosen === o.label;
    const dim = chosen != null && !isChosen;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "lf-press",
      onClick: () => onChoose && onChoose(o),
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        border: isChosen ? '2.5px solid var(--lf-coral)' : '2px solid var(--lf-cream-line)',
        background: isChosen ? 'var(--lf-pastel-peach)' : 'var(--lf-cream-card)',
        borderRadius: 'var(--radius-cover)',
        padding: '14px 10px',
        color: 'var(--lf-espresso)',
        opacity: dim ? 0.45 : 1,
        minHeight: 'var(--touch-target)',
        cursor: 'pointer',
        boxShadow: isChosen ? 'var(--shadow-coral-glow)' : 'none'
      }
    }, /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true",
      style: {
        fontSize: 38,
        lineHeight: 1.1,
        filter: 'var(--shadow-emoji)'
      }
    }, o.emoji), /*#__PURE__*/React.createElement("span", {
      style: {
        font: '600 14px/1.25 var(--font-display)'
      }
    }, o.label));
  })));
}
Object.assign(__ds_scope, { ChoiceCards });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/learning/ChoiceCards.jsx", error: String((e && e.message) || e) }); }

// components/learning/VocabStar.jsx
try { (() => {
/**
 * A "star word" (Dream Paper) — peach vocabulary pill; tap = the app says the
 * word and what it means. Lights coral while active.
 */
function VocabStar({
  word,
  active = false,
  onTap,
  style
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lf-press",
    onClick: onTap,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      border: 'none',
      background: active ? 'var(--lf-coral)' : 'var(--lf-pastel-peach)',
      color: active ? '#fff' : 'var(--lf-espresso)',
      borderRadius: 'var(--radius-pill)',
      padding: '9px 16px',
      font: '700 14px var(--font-body)',
      minHeight: 'var(--touch-target)',
      cursor: 'pointer',
      boxShadow: active ? 'var(--shadow-coral-glow)' : 'none',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\u2B50"), word);
}
Object.assign(__ds_scope, { VocabStar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/learning/VocabStar.jsx", error: String((e && e.message) || e) }); }

// components/parent/Avatar.jsx
try { (() => {
/**
 * Parent-surface avatar — round, image with initials fallback (shadcn/radix).
 */
function Avatar({
  src,
  fallback = 'U',
  size = 32,
  style
}) {
  const [errored, setErrored] = React.useState(false);
  const showImg = src && !errored;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      flexShrink: 0,
      overflow: 'hidden',
      borderRadius: '50%',
      background: 'var(--lf-p-muted)',
      color: 'var(--lf-p-foreground)',
      font: '500 ' + Math.round(size * 0.4) + 'px var(--font-ui)',
      ...style
    }
  }, showImg ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: "",
    onError: () => setErrored(true),
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : /*#__PURE__*/React.createElement("span", null, String(fallback).slice(0, 2).toUpperCase()));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/parent/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/parent/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Exact shadcn/ui button recreation (components/ui/button.tsx)
if (typeof document !== 'undefined' && !document.getElementById('lf-parent-css')) {
  const s = document.createElement('style');
  s.id = 'lf-parent-css';
  s.textContent = `
    .lfp-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap;
      border-radius: var(--radius-p-md, 6px); font: 500 14px/1.4 var(--font-ui); border: none; cursor: pointer;
      transition: background-color 150ms, color 150ms, opacity 150ms; background: transparent; color: var(--lf-p-foreground); }
    .lfp-btn:focus-visible { outline: none; box-shadow: 0 0 0 1px var(--lf-p-foreground); }
    .lfp-btn:disabled { pointer-events: none; opacity: .5; }
    .lfp-btn svg, .lfp-btn .lucide, .lfp-btn i { width: 16px; height: 16px; flex-shrink: 0; pointer-events: none; }
    .lfp-btn-default { background: var(--lf-p-primary); color: var(--lf-p-primary-foreground); box-shadow: var(--shadow-sm); }
    .lfp-btn-default:hover { background: rgba(23,23,23,.9); }
    .lfp-btn-destructive { background: var(--lf-danger); color: #fafafa; box-shadow: var(--shadow-sm); }
    .lfp-btn-destructive:hover { background: rgba(239,68,68,.9); }
    .lfp-btn-outline { border: 1px solid var(--lf-p-border); background: var(--lf-p-background); box-shadow: var(--shadow-sm); }
    .lfp-btn-outline:hover, .lfp-btn-ghost:hover { background: var(--lf-p-muted); }
    .lfp-btn-secondary { background: var(--lf-p-muted); box-shadow: var(--shadow-sm); }
    .lfp-btn-secondary:hover { background: rgba(245,245,245,.8); }
    .lfp-btn-link { color: var(--lf-p-primary); text-underline-offset: 4px; }
    .lfp-btn-link:hover { text-decoration: underline; }
    .lfp-size-default { height: 36px; padding: 8px 16px; }
    .lfp-size-sm { height: 32px; padding: 0 12px; font-size: 12px; }
    .lfp-size-lg { height: 40px; padding: 0 32px; }
    .lfp-size-icon { height: 36px; width: 36px; padding: 0; }
  `;
  document.head.appendChild(s);
}

/**
 * Parent-surface button — stock shadcn values (h-36px, 6px radius, Inter 14/500).
 */
function Button({
  variant = 'default',
  size = 'default',
  children,
  className = '',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: 'lfp-btn lfp-btn-' + variant + ' lfp-size-' + size + (className ? ' ' + className : ''),
    style: style
  }, rest), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/parent/Button.jsx", error: String((e && e.message) || e) }); }

// components/parent/Card.jsx
try { (() => {
/**
 * Parent-surface card — shadcn Card (rounded-xl, 1px border, soft shadow).
 * Compose with `title` / `description` / `footer` or raw children.
 */
function Card({
  title,
  description,
  children,
  footer,
  padded = true,
  style
}) {
  const hasHeader = title || description;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--lf-p-card)',
      color: 'var(--lf-p-foreground)',
      border: '1px solid var(--lf-p-border)',
      borderRadius: 'var(--radius-p-card)',
      boxShadow: 'var(--shadow)',
      fontFamily: 'var(--font-ui)',
      ...style
    }
  }, hasHeader ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      padding: 24,
      paddingBottom: children || footer ? 0 : 24
    }
  }, title ? /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 16px/1 var(--font-ui)',
      letterSpacing: '-0.01em'
    }
  }, title) : null, description ? /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 14px/1.4 var(--font-ui)',
      color: 'var(--lf-p-muted-foreground)'
    }
  }, description) : null) : null, children != null ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: padded ? 24 : 0,
      paddingTop: padded && hasHeader ? 16 : undefined
    }
  }, children) : null, footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      padding: 24,
      paddingTop: 0
    }
  }, footer) : null);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/parent/Card.jsx", error: String((e && e.message) || e) }); }

// components/parent/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Parent-surface input — shadcn recreation (h-36px, 6px radius, 1px border).
 */
function Input({
  style,
  ...rest
}) {
  if (typeof document !== 'undefined' && !document.getElementById('lf-input-css')) {
    const s = document.createElement('style');
    s.id = 'lf-input-css';
    s.textContent = `
      .lfp-input { display: flex; height: 36px; width: 100%; border-radius: var(--radius-p-md, 6px);
        border: 1px solid var(--lf-p-border); background: transparent; padding: 4px 12px;
        font: 400 14px/1.4 var(--font-ui); color: var(--lf-p-foreground); box-shadow: var(--shadow-sm);
        transition: border-color 150ms, box-shadow 150ms; box-sizing: border-box; }
      .lfp-input::placeholder { color: var(--lf-p-muted-foreground); }
      .lfp-input:focus-visible { outline: none; box-shadow: var(--shadow-sm), 0 0 0 1px var(--lf-p-foreground); }
      .lfp-input:disabled { cursor: not-allowed; opacity: .5; }
    `;
    document.head.appendChild(s);
  }
  return /*#__PURE__*/React.createElement("input", _extends({
    className: "lfp-input",
    style: style
  }, rest));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/parent/Input.jsx", error: String((e && e.message) || e) }); }

// components/story-world/MagicButton.jsx
try { (() => {
// Press-scale helper styles shared by kid components (injected once)
if (typeof document !== 'undefined' && !document.getElementById('lf-kid-css')) {
  const s = document.createElement('style');
  s.id = 'lf-kid-css';
  s.textContent = `
    .lf-press { transition: transform var(--duration-press,150ms), opacity var(--duration-press,150ms); cursor: pointer; user-select: none; -webkit-user-select: none; }
    .lf-press:active { transform: scale(var(--press-scale,.95)); }
    @media (hover:none) and (pointer:coarse) { .lf-press:active { opacity: var(--press-opacity,.8); } }
  `;
  document.head.appendChild(s);
}

/**
 * The primary action button — coral pill with a soft glow (Dream Paper).
 * One coral action per screen; bedtime surfaces use tone="butter".
 */
function MagicButton({
  emoji = '🪄',
  children = 'Make a New Story!',
  sub,
  onClick,
  size = 'lg',
  tone = 'coral',
  style
}) {
  const butter = tone === 'butter';
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lf-press",
    onClick: onClick,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      border: 'none',
      textAlign: 'center',
      background: butter ? 'var(--lf-butter)' : 'var(--lf-coral)',
      color: butter ? 'var(--lf-espresso)' : '#fff',
      borderRadius: 'var(--radius-pill)',
      boxShadow: butter ? 'var(--shadow-butter-glow)' : 'var(--shadow-coral-glow)',
      padding: size === 'lg' ? '14px 28px' : '9px 20px',
      fontFamily: 'var(--font-display)',
      minHeight: 'var(--touch-target)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: size === 'lg' ? '700 18px/1.25 var(--font-display)' : '700 15px/1.25 var(--font-display)'
    }
  }, emoji ? /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      marginRight: 8
    }
  }, emoji) : null, children), sub ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 12px/1.3 var(--font-body)',
      opacity: 0.85,
      marginTop: 1
    }
  }, sub) : null);
}
Object.assign(__ds_scope, { MagicButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/story-world/MagicButton.jsx", error: String((e && e.message) || e) }); }

// components/story-world/SceneStage.jsx
try { (() => {
/**
 * A story page (Dream Paper): art on top (illustration, or the emoji-on-gradient
 * placeholder), then the reading card — Quicksand on cream with the coral
 * highlight tracking the spoken word.
 */
function SceneStage({
  image,
  bg = 'var(--lf-scene-day)',
  emojis = [],
  text,
  highlightWord = -1,
  children,
  style
}) {
  const sizes = [72, 54, 44, 38, 32];
  const words = typeof text === 'string' ? text.split(/\s+/).filter(Boolean) : null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      ...style
    }
  }, image ? /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: "",
    style: {
      width: '100%',
      height: 260,
      objectFit: 'cover',
      borderRadius: 'var(--radius-hero)',
      display: 'block',
      boxShadow: 'var(--shadow-warm-lg)'
    }
  }) : /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      width: '100%',
      minHeight: 220,
      borderRadius: 'var(--radius-hero)',
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      flexWrap: 'wrap',
      boxShadow: 'var(--shadow-warm-lg)',
      padding: '18px 12px',
      boxSizing: 'border-box'
    }
  }, emojis.slice(0, 5).map((e, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      fontSize: sizes[i] || 32,
      lineHeight: 1.1,
      filter: 'var(--shadow-emoji)'
    }
  }, e))), words || children ? /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--lf-cream-card)',
      border: '1.5px solid var(--lf-cream-line)',
      borderRadius: 'var(--radius-card)',
      padding: '16px 18px'
    }
  }, words ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      font: 'var(--text-story-page)',
      color: 'var(--lf-espresso)',
      textWrap: 'pretty'
    }
  }, words.map((w, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: i === highlightWord ? {
      background: 'var(--lf-pastel-peach)',
      borderBottom: '3px solid var(--lf-coral)',
      borderRadius: 4,
      padding: '0 3px'
    } : undefined
  }, w, ' '))) : null, children ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: words ? 14 : 0,
      borderTop: words ? '1.5px dashed var(--lf-cream-line)' : 'none',
      paddingTop: words ? 14 : 0
    }
  }, children) : null) : null);
}
Object.assign(__ds_scope, { SceneStage });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/story-world/SceneStage.jsx", error: String((e && e.message) || e) }); }

// components/story-world/StoryCover.jsx
try { (() => {
/**
 * Bookshelf cover — square art squircle with title + meta below (Dream Paper).
 * Real illustration via `image`; falls back to the emoji-on-gradient placeholder
 * until per-story art exists.
 */
function StoryCover({
  title,
  image,
  emoji,
  bg = 'var(--lf-scene-day)',
  meta,
  badge,
  editMode = false,
  onDelete,
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      fontFamily: 'var(--font-display)',
      color: 'var(--lf-espresso)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lf-press",
    onClick: onClick,
    style: {
      display: 'block',
      width: '100%',
      border: 'none',
      padding: 0,
      background: 'none',
      textAlign: 'left',
      cursor: 'pointer',
      color: 'inherit'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'block'
    }
  }, image ? /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: "",
    style: {
      width: '100%',
      aspectRatio: '1 / 1',
      objectFit: 'cover',
      borderRadius: 'var(--radius-cover)',
      display: 'block',
      boxShadow: 'var(--shadow-warm)'
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      width: '100%',
      aspectRatio: '1 / 1',
      borderRadius: 'var(--radius-cover)',
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: 'var(--shadow-warm)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      fontSize: 56,
      filter: 'var(--shadow-emoji)'
    }
  }, emoji)), badge ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 8,
      bottom: 8,
      background: 'var(--lf-cream-card)',
      color: 'var(--lf-espresso)',
      borderRadius: 'var(--radius-pill)',
      padding: '4px 10px',
      font: '700 11px var(--font-body)',
      boxShadow: 'var(--shadow)'
    }
  }, badge) : null), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: 'var(--text-cover-title)',
      marginTop: 7
    }
  }, title), meta ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: 'var(--text-meta)',
      color: 'var(--lf-espresso-soft)',
      marginTop: 1
    }
  }, meta) : null), editMode ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": 'Delete ' + title,
    onClick: onDelete,
    style: {
      position: 'absolute',
      top: -8,
      right: -8,
      width: 34,
      height: 34,
      border: 'none',
      background: 'var(--lf-danger)',
      color: '#fff',
      borderRadius: '50%',
      fontSize: 16,
      boxShadow: 'var(--shadow)',
      cursor: 'pointer'
    }
  }, "\u2715") : null);
}
Object.assign(__ds_scope, { StoryCover });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/story-world/StoryCover.jsx", error: String((e && e.message) || e) }); }

// ui_kits/composer/ComposerScreen.jsx
try { (() => {
// Composer — recreation of app/story/create/page.tsx composed with
// TabletFirstLayout, BottomNavBar, AssetTray, PageNavigator, AIChat.
const {
  Button,
  Input,
  Avatar
} = window.LittleFablesDesignSystem_36f5e7;
const ASSETS = [{
  name: 'Happy Bear',
  emoji: '🐻',
  cat: 'Animals'
}, {
  name: 'Brave Knight',
  emoji: '🦸',
  cat: 'Heroes'
}, {
  name: 'Magic Forest',
  emoji: '🌲',
  cat: 'Nature'
}, {
  name: 'Castle',
  emoji: '🏰',
  cat: 'Buildings'
}, {
  name: 'Magic Wand',
  emoji: '🪄',
  cat: 'Magic'
}, {
  name: 'Treasure Chest',
  emoji: '📦',
  cat: 'Items'
}, {
  name: 'Happy Melody',
  emoji: '🎵',
  cat: 'Music'
}, {
  name: 'Adventure Template',
  emoji: '📖',
  cat: 'Stories'
}];
const CATEGORIES = [{
  id: 'characters',
  label: 'Characters',
  icon: 'Users',
  color: '#3b82f6'
}, {
  id: 'backgrounds',
  label: 'Backgrounds',
  icon: 'Image',
  color: '#22c55e'
}, {
  id: 'props',
  label: 'Props',
  icon: 'Palette',
  color: '#a855f7'
}, {
  id: 'audio',
  label: 'Audio',
  icon: 'Music',
  color: '#f97316'
}, {
  id: 'templates',
  label: 'Templates',
  icon: 'FileText',
  color: '#ec4899'
}, {
  id: 'ai',
  label: 'AI Generate',
  icon: 'Sparkles',
  color: '#eab308'
}];
function Sheet({
  open,
  height,
  children,
  onClose
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: open ? 'auto' : 'none',
      zIndex: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(0,0,0,.4)',
      opacity: open ? 1 : 0,
      transition: 'opacity 300ms'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height,
      background: '#fff',
      borderRadius: '16px 16px 0 0',
      boxShadow: 'var(--shadow-xl)',
      transform: open ? 'translateY(0)' : 'translateY(105%)',
      transition: 'transform 300ms var(--ease-out)',
      padding: 24,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column'
    }
  }, children));
}
function AssetTray({
  onClose
}) {
  const [cat, setCat] = React.useState(null);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 16,
      borderBottom: '1px solid var(--lf-p-border)'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      font: '600 18px var(--font-ui)'
    }
  }, "Assets Library"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "icon",
    onClick: onClose,
    "aria-label": "Close",
    style: {
      height: 32,
      width: 32
    }
  }, /*#__PURE__*/React.createElement(window.LIcon, {
    name: "X"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(window.LIcon, {
    name: "Search",
    size: 16,
    color: "var(--lf-p-muted-foreground)",
    style: {
      position: 'absolute',
      left: 12,
      top: 10
    }
  }), /*#__PURE__*/React.createElement(Input, {
    placeholder: "Search assets...",
    style: {
      paddingLeft: 36
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 16,
      overflowX: 'auto',
      paddingBottom: 8,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: cat === null ? 'secondary' : 'ghost',
    size: "sm",
    onClick: () => setCat(null)
  }, "All"), CATEGORIES.map(c => /*#__PURE__*/React.createElement(Button, {
    key: c.id,
    variant: cat === c.id ? 'secondary' : 'ghost',
    size: "sm",
    onClick: () => setCat(c.id),
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(window.LIcon, {
    name: c.icon,
    color: c.color,
    style: {
      marginRight: 4
    }
  }), c.label))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 12,
      marginTop: 16,
      overflowY: 'auto'
    }
  }, ASSETS.map(a => /*#__PURE__*/React.createElement("button", {
    key: a.name,
    type: "button",
    className: "lf-press",
    style: {
      border: '1px solid var(--lf-p-border)',
      borderRadius: 8,
      background: '#fff',
      padding: '16px 8px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 34
    },
    "aria-hidden": "true"
  }, a.emoji), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 13px var(--font-ui)'
    }
  }, a.name), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 11px var(--font-ui)',
      color: 'var(--lf-p-muted-foreground)'
    }
  }, a.cat)))));
}
function PageNavigator({
  current,
  total,
  onPick,
  onClose
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 16,
      borderBottom: '1px solid var(--lf-p-border)'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      font: '600 18px var(--font-ui)'
    }
  }, "Pages"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "icon",
    onClick: onClose,
    "aria-label": "Close",
    style: {
      height: 32,
      width: 32
    }
  }, /*#__PURE__*/React.createElement(window.LIcon, {
    name: "X"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginTop: 16,
      overflowX: 'auto'
    }
  }, Array.from({
    length: total
  }).map((_, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    type: "button",
    onClick: () => onPick(i + 1),
    style: {
      width: 110,
      aspectRatio: '3/4',
      flexShrink: 0,
      borderRadius: 8,
      border: current === i + 1 ? '2px solid var(--lf-p-primary)' : '1px solid var(--lf-p-border)',
      background: '#fff',
      boxShadow: 'var(--shadow-page)',
      font: '500 13px var(--font-ui)',
      color: 'var(--lf-p-muted-foreground)',
      cursor: 'pointer'
    }
  }, i + 1)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: {
      width: 110,
      aspectRatio: '3/4',
      flexShrink: 0,
      borderRadius: 8,
      border: '1px dashed var(--lf-p-border)',
      background: 'var(--lf-p-muted)',
      color: 'var(--lf-p-muted-foreground)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(window.LIcon, {
    name: "Plus",
    size: 20
  }))));
}
function ComposerScreen({
  onBack
}) {
  const [panel, setPanel] = React.useState(null);
  const [page, setPage] = React.useState(1);
  const totalPages = 3;
  const toggle = p => setPanel(panel === p ? null : p);
  const navItems = [{
    id: 'assets',
    icon: 'Library',
    label: 'Assets'
  }, {
    id: 'pages',
    icon: 'Layers',
    label: 'Pages',
    badge: page + '/' + totalPages
  }, {
    id: 'ai',
    icon: 'Bot',
    label: 'AI Assist',
    pulse: true
  }, {
    id: 'comments',
    icon: 'MessageSquare',
    label: 'Comments',
    badge: '3'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: '100%',
      overflow: 'hidden',
      background: '#fff',
      fontFamily: 'var(--font-ui)',
      color: 'var(--lf-p-foreground)',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottom: '1px solid var(--lf-p-border)',
      background: 'rgba(255,255,255,.95)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "icon",
    onClick: onBack,
    "aria-label": "Back",
    style: {
      height: 32,
      width: 32
    }
  }, /*#__PURE__*/React.createElement(window.LIcon, {
    name: "ArrowLeft"
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: {
      font: '500 14px var(--font-ui)',
      background: 'none',
      border: 'none',
      padding: '4px 8px',
      borderRadius: 4,
      cursor: 'pointer'
    }
  }, "Untitled Story"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 13px var(--font-ui)',
      color: 'var(--lf-p-muted-foreground)'
    }
  }, "Auto-saved")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm"
  }, /*#__PURE__*/React.createElement(window.LIcon, {
    name: "Eye",
    style: {
      marginRight: 4
    }
  }), "Preview"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm"
  }, /*#__PURE__*/React.createElement(window.LIcon, {
    name: "Settings",
    style: {
      marginRight: 4
    }
  }), "Settings"), /*#__PURE__*/React.createElement(Button, {
    size: "sm"
  }, /*#__PURE__*/React.createElement(window.LIcon, {
    name: "Save",
    style: {
      marginRight: 4
    }
  }), "Save"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: 'rgba(245,245,245,.5)',
      backgroundImage: 'radial-gradient(circle, #d4d4d4 1px, transparent 1px)',
      backgroundSize: '20px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      borderRadius: 8,
      boxShadow: 'var(--shadow-page)',
      width: 380,
      aspectRatio: '3/4',
      padding: 32,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      alignSelf: 'center',
      fontSize: 56
    },
    "aria-hidden": "true"
  }, "\uD83D\uDC3B"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 22px/1.3 var(--font-body)',
      textAlign: 'center'
    }
  }, "Barnaby\u2019s Big Day"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 16px/1.6 var(--font-body)',
      color: '#404040',
      textAlign: 'center'
    }
  }, "Once upon a time, a very happy bear woke up to the smell of honey pancakes..."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      font: '400 12px var(--font-ui)',
      color: 'var(--lf-p-muted-foreground)',
      textAlign: 'center'
    }
  }, "Page ", page, " of ", totalPages))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 64,
      borderTop: '1px solid var(--lf-p-border)',
      background: 'rgba(255,255,255,.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4
    }
  }, navItems.map(n => /*#__PURE__*/React.createElement("button", {
    key: n.id,
    type: "button",
    onClick: () => toggle(n.id),
    style: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      minWidth: 64,
      padding: '8px 10px',
      border: 'none',
      borderRadius: 8,
      background: panel === n.id ? 'var(--lf-p-muted)' : 'transparent',
      cursor: 'pointer',
      font: '500 11px var(--font-ui)',
      color: panel === n.id ? 'var(--lf-p-foreground)' : 'var(--lf-p-muted-foreground)'
    }
  }, /*#__PURE__*/React.createElement(window.LIcon, {
    name: n.icon,
    size: 18
  }), n.label, n.badge ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 2,
      right: 6,
      background: 'var(--lf-p-muted)',
      border: '1px solid var(--lf-p-border)',
      borderRadius: 999,
      font: '500 9px var(--font-ui)',
      padding: '1px 5px',
      color: 'var(--lf-p-muted-foreground)'
    }
  }, n.badge) : null, n.pulse ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 4,
      right: 14,
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: 'var(--lf-brand-purple)',
      animation: 'lf-fade-in 1.2s ease-in-out infinite alternate'
    }
  }) : null))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    fallback: "SM",
    size: 28,
    style: {
      boxShadow: '0 0 0 2px #fff'
    }
  }), /*#__PURE__*/React.createElement(Avatar, {
    fallback: "MT",
    size: 28,
    style: {
      marginLeft: -8,
      boxShadow: '0 0 0 2px #fff'
    }
  })), /*#__PURE__*/React.createElement(Button, {
    size: "sm"
  }, /*#__PURE__*/React.createElement(window.LIcon, {
    name: "Share2",
    style: {
      marginRight: 4
    }
  }), "Share"))), /*#__PURE__*/React.createElement(Sheet, {
    open: panel === 'assets',
    height: "60%",
    onClose: () => setPanel(null)
  }, /*#__PURE__*/React.createElement(AssetTray, {
    onClose: () => setPanel(null)
  })), /*#__PURE__*/React.createElement(Sheet, {
    open: panel === 'pages',
    height: "45%",
    onClose: () => setPanel(null)
  }, /*#__PURE__*/React.createElement(PageNavigator, {
    current: page,
    total: totalPages,
    onPick: p => {
      setPage(p);
      setPanel(null);
    },
    onClose: () => setPanel(null)
  })), /*#__PURE__*/React.createElement(Sheet, {
    open: panel === 'ai',
    height: "70%",
    onClose: () => setPanel(null)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 16,
      borderBottom: '1px solid var(--lf-p-border)'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      font: '600 18px var(--font-ui)',
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(window.LIcon, {
    name: "Bot",
    size: 18
  }), "AI Assistant"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "icon",
    onClick: () => setPanel(null),
    "aria-label": "Close",
    style: {
      height: 32,
      width: 32
    }
  }, /*#__PURE__*/React.createElement(window.LIcon, {
    name: "X"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px 0',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      alignSelf: 'flex-start',
      maxWidth: '75%',
      background: 'var(--lf-p-muted)',
      borderRadius: 12,
      padding: '10px 14px',
      font: '400 14px/1.5 var(--font-ui)'
    }
  }, "Hi! I can help write your story, suggest what happens next, or generate new characters. What are we making today?"), /*#__PURE__*/React.createElement("div", {
    style: {
      alignSelf: 'flex-end',
      maxWidth: '75%',
      background: 'var(--lf-p-primary)',
      color: 'var(--lf-p-primary-foreground)',
      borderRadius: 12,
      padding: '10px 14px',
      font: '400 14px/1.5 var(--font-ui)'
    }
  }, "A story about a bear who loves pancakes")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Ask the AI assistant..."
  }), /*#__PURE__*/React.createElement(Button, {
    size: "icon",
    "aria-label": "Send"
  }, /*#__PURE__*/React.createElement(window.LIcon, {
    name: "Sparkles"
  })))));
}
window.ComposerScreen = ComposerScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/composer/ComposerScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/composer/HomeScreen.jsx
try { (() => {
// Marketing home — recreation of app/page.tsx + components/shared/TopNavigation.tsx
const {
  Button
} = window.LittleFablesDesignSystem_36f5e7;
function HomeScreen({
  onStartCreating
}) {
  const features = [{
    icon: 'Sparkles',
    title: 'AI-Powered',
    desc: 'Create stories with AI assistance'
  }, {
    icon: 'Palette',
    title: 'Visual Canvas',
    desc: 'Design with drag-and-drop tools'
  }, {
    icon: 'Users',
    title: 'Share & Collaborate',
    desc: 'Work together on stories'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100%',
      background: '#fff',
      fontFamily: 'var(--font-ui)',
      color: 'var(--lf-p-foreground)',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("nav", {
    style: {
      height: 64,
      borderBottom: '1px solid var(--lf-p-border)',
      background: 'rgba(255,255,255,.95)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(window.Logo, null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost"
  }, "Sign In"), /*#__PURE__*/React.createElement(Button, null, "Sign Up"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 720,
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(window.LIcon, {
    name: "BookOpen",
    size: 64,
    color: "var(--lf-p-muted-foreground)",
    strokeWidth: 1.5
  }), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      font: '700 48px/1.1 var(--font-ui)',
      letterSpacing: '-0.02em'
    }
  }, "Create Stories for Little Ones"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      font: '400 18px/1.6 var(--font-ui)',
      color: 'var(--lf-p-muted-foreground)',
      maxWidth: 560
    }
  }, "AI-powered story creation platform for parents and teachers."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      paddingTop: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    onClick: onStartCreating
  }, "Start Creating"), /*#__PURE__*/React.createElement(Button, {
    variant: "outline"
  }, "Dashboard"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 24,
      marginTop: 64,
      maxWidth: 860,
      width: '100%'
    }
  }, features.map(f => /*#__PURE__*/React.createElement("div", {
    key: f.title,
    style: {
      padding: 16,
      border: '1px solid var(--lf-p-border)',
      borderRadius: 4
    }
  }, /*#__PURE__*/React.createElement(window.LIcon, {
    name: f.icon,
    size: 24,
    style: {
      marginBottom: 8
    }
  }), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 4px',
      font: '600 15px/1.4 var(--font-ui)'
    }
  }, f.title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      font: '400 14px/1.5 var(--font-ui)',
      color: 'var(--lf-p-muted-foreground)'
    }
  }, f.desc))))));
}
window.HomeScreen = HomeScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/composer/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/composer/shared.jsx
try { (() => {
// Shared helpers for the Composer kit: Lucide icon wrapper (same set the
// codebase imports via lucide-react) + Logo (plain type — no logo asset exists).
function LIcon({
  name,
  size = 16,
  color = 'currentColor',
  strokeWidth = 2,
  style
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const lib = window.lucide;
    if (ref.current && lib && lib.icons && lib.icons[name]) {
      ref.current.innerHTML = '';
      const el = lib.createElement(lib.icons[name]);
      el.setAttribute('width', String(size));
      el.setAttribute('height', String(size));
      el.setAttribute('stroke-width', String(strokeWidth));
      ref.current.appendChild(el);
    }
  }, [name, size, strokeWidth]);
  return /*#__PURE__*/React.createElement("span", {
    ref: ref,
    "aria-hidden": "true",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      color,
      flexShrink: 0,
      ...style
    }
  });
}
function Logo() {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-tree-ink.png",
    alt: "",
    style: {
      width: 30,
      height: 30
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 20px var(--font-ui)',
      color: 'var(--lf-p-foreground)'
    }
  }, "Little Fables"));
}
Object.assign(window, {
  LIcon,
  Logo
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/composer/shared.jsx", error: String((e && e.message) || e) }); }

// ui_kits/story-world/LibraryScreen.jsx
try { (() => {
// Library / home screen — Dream Paper (approved direction 3a)
const {
  StoryCover,
  MagicButton
} = window.LittleFablesDesignSystem_36f5e7;
const CHIPS = [{
  emoji: '🏍️',
  label: 'Motos',
  tint: 'var(--lf-pastel-peach)'
}, {
  emoji: '⚽',
  label: 'Soccer',
  tint: 'var(--lf-pastel-mint)'
}, {
  emoji: '🚀',
  label: 'Space',
  tint: 'var(--lf-pastel-lilac)'
}, {
  emoji: '🦕',
  label: 'Dinos',
  tint: 'var(--lf-pastel-blush)'
}];
function LibraryScreen({
  onOpenStory,
  onCreate
}) {
  return /*#__PURE__*/React.createElement("main", {
    style: {
      position: 'relative',
      minHeight: '100%',
      background: 'var(--lf-cream)',
      color: 'var(--lf-espresso)',
      fontFamily: 'var(--font-display)',
      paddingBottom: 110
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      top: 130,
      left: 18,
      fontSize: 26,
      color: '#7A6748',
      opacity: 0.07
    }
  }, "\u2726"), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      top: 420,
      right: 16,
      fontSize: 22,
      color: '#7A6748',
      opacity: 0.07
    }
  }, "\u2726"), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      bottom: 240,
      left: 14,
      fontSize: 24,
      color: '#7A6748',
      opacity: 0.06
    }
  }, "\u3030"), /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '26px 24px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-tree-ink.png",
    alt: "Little Fables",
    style: {
      width: 38,
      height: 38
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '700 20px var(--font-display)'
    }
  }, "Little Fables")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      background: 'var(--lf-pastel-peach)',
      borderRadius: 'var(--radius-pill)',
      padding: '6px 12px',
      font: '700 13px var(--font-display)',
      color: 'var(--lf-coral-deep)'
    }
  }, "\u2B50 12"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 38,
      height: 38,
      borderRadius: '50%',
      background: 'var(--lf-pastel-lilac)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      font: '700 16px var(--font-display)',
      color: '#5F5490'
    }
  }, "A"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 24px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 14px var(--font-body)',
      color: 'var(--lf-espresso-soft)'
    }
  }, "Welcome back,"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-greeting)'
    }
  }, "Azad! What\u2019s tonight\u2019s story?")), /*#__PURE__*/React.createElement("div", {
    className: "lf-press",
    onClick: onCreate,
    style: {
      margin: '16px 24px 0',
      background: 'var(--lf-cream-card)',
      border: '1.5px solid var(--lf-cream-line)',
      borderRadius: 'var(--radius-pill)',
      padding: '6px 6px 6px 18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 15px var(--font-body)',
      color: 'var(--lf-espresso-faint)'
    }
  }, "\u2315\xA0 Tell me your story idea\u2026"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: '50%',
      background: 'var(--lf-coral)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 17,
      boxShadow: 'var(--shadow-coral-glow)'
    }
  }, "\uD83C\uDFA4")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      padding: '18px 24px 0'
    }
  }, CHIPS.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.label,
    className: "lf-press",
    style: {
      flex: 1,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      fontSize: 26
    }
  }, c.emoji), /*#__PURE__*/React.createElement("div", {
    style: {
      background: c.tint,
      borderRadius: 'var(--radius-scallop)',
      padding: '6px 0 8px',
      font: 'var(--text-label)',
      marginTop: 4
    }
  }, c.label)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '22px 24px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-section)',
      marginBottom: 10
    }
  }, "Tonight\u2019s story"), /*#__PURE__*/React.createElement("div", {
    className: "lf-press",
    onClick: () => onOpenStory('starter-moto-rescue'),
    style: {
      position: 'relative',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      width: '100%',
      height: 185,
      borderRadius: 'var(--radius-arch)',
      background: 'linear-gradient(160deg,#f97316,#fbbf24)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 74,
      filter: 'var(--shadow-emoji)'
    }
  }, "\uD83E\uDD8A"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 48,
      filter: 'var(--shadow-emoji)'
    }
  }, "\uD83C\uDF09")), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: 14,
      bottom: -14,
      width: 54,
      height: 54,
      borderRadius: '50%',
      background: 'var(--lf-coral)',
      boxShadow: 'var(--shadow-coral-glow)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontSize: 20,
      paddingLeft: 3,
      boxSizing: 'border-box'
    }
  }, "\u25B6")), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '700 17px var(--font-display)',
      marginTop: 14
    }
  }, "Miko and the Wobbly Bridge"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-meta)',
      color: 'var(--lf-espresso-soft)',
      marginTop: 1
    }
  }, "\u23F1 5 min \xB7 counting \xB7 belly breaths")), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '20px 24px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-section)'
    }
  }, "Bookshelf"), /*#__PURE__*/React.createElement("span", {
    className: "lf-press",
    style: {
      font: '700 13px var(--font-body)',
      color: 'var(--lf-coral)'
    }
  }, "See all")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(StoryCover, {
    title: "Jujy\u2019s Christmas Adventure",
    image: "../../assets/illustration/jujy-cover.jpg",
    meta: "\u23F1 8 min \xB7 kindness",
    onClick: () => onOpenStory('starter-moto-rescue')
  }), /*#__PURE__*/React.createElement(StoryCover, {
    title: "Cooking with Dadi",
    image: "../../assets/illustration/azi-kitchen.jpg",
    meta: "\u23F1 5 min \xB7 counting",
    onClick: () => onOpenStory('starter-moto-rescue')
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      border: '2px dashed var(--lf-cream-line)',
      borderRadius: 14,
      padding: '12px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: 'rgba(255,253,246,.7)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 19,
      color: 'var(--lf-coral)'
    },
    "aria-hidden": "true"
  }, "\u270E"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 14px var(--font-display)'
    }
  }, "The Rocket That Wouldn\u2019t Roar"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-meta)',
      color: 'var(--lf-espresso-soft)',
      marginLeft: 'auto'
    }
  }, "writing itself\u2026"))), /*#__PURE__*/React.createElement("nav", {
    style: {
      position: 'fixed',
      left: 20,
      right: 20,
      bottom: 16,
      background: 'var(--lf-cream-card)',
      border: '1.5px solid var(--lf-cream-line)',
      borderRadius: 'var(--radius-pill)',
      boxShadow: 'var(--shadow-warm)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '8px 10px',
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "lf-press",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      background: 'var(--lf-coral)',
      borderRadius: 'var(--radius-pill)',
      padding: '8px 16px',
      color: '#fff',
      font: 'var(--text-label)',
      boxShadow: 'var(--shadow-coral-glow)'
    }
  }, "\u2302 Home"), /*#__PURE__*/React.createElement("span", {
    className: "lf-press",
    style: {
      font: '600 13px var(--font-body)',
      color: 'var(--lf-espresso-faint)',
      padding: 8
    }
  }, "\uD83D\uDCDA Library"), /*#__PURE__*/React.createElement("span", {
    className: "lf-press",
    onClick: onCreate,
    style: {
      font: '600 13px var(--font-body)',
      color: 'var(--lf-espresso-faint)',
      padding: 8,
      cursor: 'pointer'
    }
  }, "\u270E Create"), /*#__PURE__*/React.createElement("span", {
    className: "lf-press",
    style: {
      font: '600 13px var(--font-body)',
      color: 'var(--lf-espresso-faint)',
      padding: 8
    }
  }, "\u2699 Grown-ups")));
}
window.LibraryScreen = LibraryScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/story-world/LibraryScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/story-world/ReaderScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Reader screen — Dream Paper story player (approved direction 3b).
// Interaction model from types/story.ts + lib/read/speech.ts:
// read-aloud word tracking (timer stands in for speechSynthesis boundaries),
// ask → mic → praise/hint, choice → branch page, retell/vocab ending.
const DS = window.LittleFablesDesignSystem_36f5e7;
const {
  SceneStage,
  AskBubble,
  ChoiceCards,
  VocabStar,
  MagicButton
} = DS;
function CircleBtn({
  label,
  onClick,
  children,
  active = false,
  style
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": label,
    onClick: onClick,
    className: "lf-press",
    style: {
      width: 44,
      height: 44,
      borderRadius: '50%',
      background: 'var(--lf-cream-card)',
      border: '1.5px solid var(--lf-cream-line)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 16,
      color: active ? 'var(--lf-coral)' : 'var(--lf-espresso-soft)',
      cursor: 'pointer',
      flexShrink: 0,
      ...style
    }
  }, children);
}
function ReaderScreen({
  story,
  onExit
}) {
  const [pageIdx, setPageIdx] = React.useState(0);
  const [branchPage, setBranchPage] = React.useState(null);
  const [chosen, setChosen] = React.useState(null);
  const [askState, setAskState] = React.useState('question');
  const [listening, setListening] = React.useState(false);
  const [word, setWord] = React.useState(-1);
  const [reading, setReading] = React.useState(true);
  const [ended, setEnded] = React.useState(false);
  const [activeVocab, setActiveVocab] = React.useState(null);
  const page = branchPage || story.pages[pageIdx];
  const total = story.pages.length;
  React.useEffect(() => {
    if (!reading || ended) {
      setWord(-1);
      return;
    }
    const words = page.text.split(/\s+/).filter(Boolean);
    let i = -1;
    setWord(-1);
    const t = setInterval(() => {
      i += 1;
      if (i >= words.length) {
        clearInterval(t);
        setWord(-1);
        return;
      }
      setWord(i);
    }, 240);
    return () => clearInterval(t);
  }, [page, reading, ended]);
  const resetPageState = () => {
    setAskState('question');
    setListening(false);
    setChosen(null);
  };
  const goNext = () => {
    if (branchPage || pageIdx === total - 1) {
      setEnded(true);
      return;
    }
    setBranchPage(null);
    resetPageState();
    setPageIdx(pageIdx + 1);
  };
  const goPrev = () => {
    setEnded(false);
    if (branchPage) {
      setBranchPage(null);
      resetPageState();
      return;
    }
    if (pageIdx > 0) {
      resetPageState();
      setPageIdx(pageIdx - 1);
    }
  };
  const handleMic = () => {
    setListening(true);
    setTimeout(() => {
      setListening(false);
      setAskState(Math.random() < 0.75 ? 'praise' : 'hint');
    }, 1200);
  };
  const handleChoose = o => {
    setChosen(o.label);
    setTimeout(() => {
      setBranchPage(o.page);
      setAskState('question');
    }, 700);
  };
  const blocked = !!(page.choice && !branchPage && !chosen);
  const progress = ended ? 1 : (pageIdx + (branchPage ? 0.5 : 0)) / total;
  if (ended) {
    return /*#__PURE__*/React.createElement("main", {
      style: {
        minHeight: '100%',
        background: 'var(--lf-cream)',
        color: 'var(--lf-espresso)',
        fontFamily: 'var(--font-display)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 24px',
        boxSizing: 'border-box',
        gap: 18
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 64,
        filter: 'var(--shadow-emoji)'
      },
      "aria-hidden": "true"
    }, "\uD83C\uDF89"), /*#__PURE__*/React.createElement("h1", {
      style: {
        margin: 0,
        font: '700 28px/1.2 var(--font-display)',
        textAlign: 'center'
      }
    }, "The end! Great reading!"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        justifyContent: 'center'
      }
    }, story.vocab.map(v => /*#__PURE__*/React.createElement(VocabStar, {
      key: v,
      word: v,
      active: activeVocab === v,
      onTap: () => setActiveVocab(v)
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--lf-cream-card)',
        border: '1.5px solid var(--lf-cream-line)',
        borderRadius: 'var(--radius-card)',
        padding: '16px 18px',
        maxWidth: 460,
        width: '100%',
        boxSizing: 'border-box'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        font: '700 11px var(--font-body)',
        color: 'var(--lf-espresso-faint)',
        textTransform: 'uppercase',
        letterSpacing: '.07em',
        marginBottom: 8
      }
    }, "Tell it back \uD83C\uDFA4"), story.retellPrompts.map((r, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        font: '600 15px/1.6 var(--font-body)',
        marginBottom: 4
      }
    }, r))), /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%',
        maxWidth: 460
      }
    }, /*#__PURE__*/React.createElement(MagicButton, {
      emoji: "\uD83D\uDCDA",
      onClick: onExit
    }, "Back to the Bookshelf")));
  }
  return /*#__PURE__*/React.createElement("main", {
    style: {
      minHeight: '100%',
      background: 'var(--lf-cream)',
      color: 'var(--lf-espresso)',
      fontFamily: 'var(--font-display)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 24px 24px',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(CircleBtn, {
    label: "Back to bookshelf",
    onClick: onExit
  }, "\u2039"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '700 17px var(--font-display)'
    }
  }, "Story time"), /*#__PURE__*/React.createElement(CircleBtn, {
    label: reading ? 'Pause read-aloud' : 'Read aloud',
    onClick: () => setReading(!reading),
    active: reading
  }, reading ? '🔊' : '🔇')), /*#__PURE__*/React.createElement(SceneStage, {
    bg: page.scene.bg,
    emojis: page.scene.emojis,
    text: page.text,
    highlightWord: word,
    style: {
      flex: 1
    }
  }, page.ask ? /*#__PURE__*/React.createElement(AskBubble, _extends({}, page.ask, {
    state: askState,
    listening: listening,
    onMicTap: handleMic
  })) : null, page.choice && !branchPage ? /*#__PURE__*/React.createElement(ChoiceCards, {
    prompt: page.choice.prompt,
    options: page.choice.options,
    chosen: chosen,
    onChoose: handleChoose
  }) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 10px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      borderRadius: 999,
      background: 'var(--lf-cream-line)',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: progress * 100 + '%',
      borderRadius: 999,
      background: 'var(--lf-coral)',
      transition: 'width 300ms var(--ease-out)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: progress * 100 + '%',
      top: '50%',
      transform: 'translate(-50%,-50%)',
      width: 16,
      height: 16,
      borderRadius: '50%',
      background: 'var(--lf-coral)',
      boxShadow: '0 0 0 4px var(--lf-cream)',
      transition: 'left 300ms var(--ease-out)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      font: '600 11px var(--font-body)',
      color: 'var(--lf-espresso-soft)',
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("span", null, branchPage ? 'bonus page!' : 'page ' + (pageIdx + 1) + ' of ' + total), /*#__PURE__*/React.createElement("span", null, story.title))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 22,
      paddingTop: 10
    }
  }, /*#__PURE__*/React.createElement(CircleBtn, {
    label: "Previous page",
    onClick: goPrev,
    style: {
      width: 48,
      height: 48,
      opacity: pageIdx === 0 && !branchPage ? 0.4 : 1
    }
  }, "\u2039"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Next page",
    onClick: goNext,
    disabled: blocked,
    className: "lf-press",
    style: {
      width: 64,
      height: 64,
      borderRadius: '50%',
      border: 'none',
      background: blocked ? 'var(--lf-cream-line)' : 'var(--lf-coral)',
      boxShadow: blocked ? 'none' : 'var(--shadow-coral-glow)',
      color: blocked ? 'var(--lf-espresso-faint)' : '#fff',
      fontSize: 24,
      cursor: blocked ? 'default' : 'pointer',
      paddingLeft: 4,
      boxSizing: 'border-box'
    }
  }, "\u25B6"), /*#__PURE__*/React.createElement(CircleBtn, {
    label: "Read this page again",
    onClick: () => {
      setReading(false);
      setTimeout(() => setReading(true), 50);
    },
    style: {
      width: 48,
      height: 48
    }
  }, "\u21BA")));
}
window.ReaderScreen = ReaderScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/story-world/ReaderScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/story-world/story-data.js
try { (() => {
// "Miko and the Wobbly Bridge" — abridged from lib/read/starter-stories.ts
// (real story content, real ask/choice blocks, real scene gradients)
window.MIKO_STORY = {
  id: 'starter-moto-rescue',
  title: 'Miko and the Wobbly Bridge',
  coverEmoji: '🦊',
  coverBg: 'linear-gradient(160deg,#f97316,#fbbf24)',
  vocab: ['wobbly', 'steady', 'grateful'],
  retellPrompts: ['Who needed help in the story?', 'What was wrong with the bridge?', 'How did Miko calm down when he felt worried?', 'What would YOU have built?'],
  pages: [{
    text: 'Miko the fox zoomed through Zoomtown on his little blue moto. Vroom vroom! The wind whooshed past his ears.',
    scene: {
      bg: 'linear-gradient(160deg,#38bdf8,#a7f3d0)',
      emojis: ['🦊', '🏍️', '🏙️', '💨']
    }
  }, {
    text: 'Suddenly Miko squeezed his brakes. SCREEEECH! The bridge over Dino Canyon was wobbly. One, two, three planks were missing!',
    scene: {
      bg: 'linear-gradient(160deg,#fbbf24,#f97316)',
      emojis: ['🌉', '⚠️', '🦊']
    },
    ask: {
      question: 'Can you count the missing planks with me? How many were missing?',
      praise: 'Yes! THREE planks were missing. Great counting!',
      hint: 'Let’s count together: one... two... THREE!',
      skill: 'counting'
    }
  }, {
    text: 'Miko took one big belly breath. In... and out. His tummy felt softer. "I can’t fix this alone," he said. "But I know who can help!"',
    scene: {
      bg: 'linear-gradient(160deg,#a78bfa,#f0abfc)',
      emojis: ['🦊', '😮‍💨', '💜']
    }
  }, {
    text: 'Tara the spider swung down on a silver thread. "A web can fix it!" she said. But they needed something strong to hold the web.',
    scene: {
      bg: 'linear-gradient(160deg,#818cf8,#38bdf8)',
      emojis: ['🕷️', '🕸️', '🌉']
    },
    choice: {
      prompt: 'What should hold the web?',
      options: [{
        label: 'Boulder’s long neck',
        emoji: '🦕',
        page: {
          text: 'Boulder stretched his looooong neck across the canyon like a crane. Tara spun her web around it — zip zip zip! The web pulled the bridge tight and steady.',
          scene: {
            bg: 'linear-gradient(160deg,#34d399,#a7f3d0)',
            emojis: ['🦕', '🕸️', '🌉', '✨']
          }
        }
      }, {
        label: 'Miko’s moto',
        emoji: '🏍️',
        page: {
          text: 'Miko parked his moto and Tara tied her web to it — zip zip zip! Miko held the brakes tight. The web pulled the bridge steady like a seatbelt.',
          scene: {
            bg: 'linear-gradient(160deg,#34d399,#a7f3d0)',
            emojis: ['🏍️', '🕸️', '🌉', '✨']
          }
        }
      }]
    }
  }, {
    text: 'That night the soccer game was the best ever. Boulder gave everyone a ride on his neck, and Miko whispered, "I’m grateful for my friends." The end!',
    scene: {
      bg: 'linear-gradient(160deg,#1e3a8a,#7c3aed)',
      emojis: ['⚽', '🌟', '🦊', '🦕', '🕷️']
    }
  }]
};
window.SHELF_STORIES = [{
  id: 'starter-moto-rescue',
  title: 'Miko and the Wobbly Bridge',
  coverEmoji: '🦊',
  coverBg: 'linear-gradient(160deg,#f97316,#fbbf24)'
}, {
  id: 'starter-rocket-goal',
  title: 'The Rocket That Wouldn’t Roar',
  coverEmoji: '🚀',
  coverBg: 'linear-gradient(160deg,#1e3a8a,#7c3aed)'
}];
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/story-world/story-data.js", error: String((e && e.message) || e) }); }

__ds_ns.AskBubble = __ds_scope.AskBubble;

__ds_ns.ChoiceCards = __ds_scope.ChoiceCards;

__ds_ns.VocabStar = __ds_scope.VocabStar;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.MagicButton = __ds_scope.MagicButton;

__ds_ns.SceneStage = __ds_scope.SceneStage;

__ds_ns.StoryCover = __ds_scope.StoryCover;

})();
