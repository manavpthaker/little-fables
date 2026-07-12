/**
 * The spread inside a book: art panel + text panel on paper. Word
 * highlight is a warm lamplight glow moving across words (never
 * marker-yellow blocks). Mic affordance is drawn, >=56px, terracotta
 * when live. Page turns are child-initiated (drawn corner).
 * @startingPoint section="Reading" subtitle="Book spread — lamplight word highlight, drawn mic, page-turn corner" viewport="1000x640"
 */
export interface ReadingPageProps {
  /** Art for the left panel (drawn in the house style). */
  art?: React.ReactNode;
  /** Story text, >=24px, ~65 words max. */
  text?: string;
  /** Word index to light (controlled). Use with real narration timing. */
  highlightIndex?: number;
  /** Demo mode: sweep the lamplight across words automatically. */
  autoHighlight?: boolean;
  /** Ms per word in autoHighlight. Default 460. */
  highlightMs?: number;
  /** The mic is live (terracotta + pulse) — the screen's one terracotta. */
  micActive?: boolean;
  onMic?: () => void;
  /** Shows the drawn page-turn corner (child-initiated). */
  onNext?: () => void;
  /** e.g. "page 3". Atmospheric, not required to operate. */
  pageLabel?: string;
  /** Spread width px (5:3.2 ratio). Default 1000. */
  width?: number;
  style?: React.CSSProperties;
}

/** Drawn mic button, standalone (>=56px). Terracotta + glow when active. */
export interface MicButtonProps {
  active?: boolean;
  onPress?: () => void;
  /** Diameter px, min 56. Default 64. */
  size?: number;
  /** aria-label; pair with a spoken cue. */
  label?: string;
}
