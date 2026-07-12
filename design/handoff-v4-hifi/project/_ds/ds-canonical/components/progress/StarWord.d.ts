/**
 * A collected star word pinned to the Language Wall like a postcard.
 * Words are lowercase italic; the pin is a pigment dot.
 */
export interface StarWordProps {
  /** The collected word, lowercase ("wobbly", "enormous"). */
  word: string;
  /** Pin pigment. Default "berry". */
  pin?: "berry" | "river" | "marigold" | "sage" | "teal" | "plum";
  /** Slight hang angle in degrees (−3…3 feels pinned). */
  rotate?: number;
  /** Card width px. Default 132. */
  width?: number;
  style?: React.CSSProperties;
}
