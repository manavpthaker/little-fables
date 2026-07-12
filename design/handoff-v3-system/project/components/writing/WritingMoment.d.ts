/**
 * The writing moment — the generation-wait scene. A little open book on
 * the buddy's table; the child's own words appear one by one in
 * watercolor handwriting (Caveat). The ONE place hand-drawn text is
 * allowed: his words, not UI. This replaces any progress bar or spinner.
 */
export interface WritingMomentProps {
  /** The child's own words, verbatim. */
  words: string;
  /** Handwriting watercolor pigment. Default "river". */
  inkPigment?: "river" | "berry" | "sage" | "plum" | "teal";
  /** Scene width px. Default 460. */
  width?: number;
  /** Ms between words appearing. Default 650. */
  wordMs?: number;
  style?: React.CSSProperties;
}
