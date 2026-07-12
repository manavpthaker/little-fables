/**
 * Endpaper — a wash-color field with a tiny motif. The open/close beat
 * of every book (900ms) and the app's ONLY loading state: while waiting,
 * the motif blooms gently. There is no spinner anywhere.
 */
export interface EndpaperProps {
  /** Wash pigment (usually the book's own). Default "plum". */
  pigment?: "marigold" | "butter" | "terracotta" | "sage" | "river" | "teal" | "berry" | "dusk" | "bark" | "plum";
  /** Tiny motif. Default "star". */
  motif?: "star" | "moon" | "leaf" | "boat";
  /** Waiting state: the motif blooms on the breath cycle. */
  loading?: boolean;
  /** Optional overlay content (rare). */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
