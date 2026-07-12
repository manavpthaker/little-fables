/**
 * Reading-day suns — drawn suns accumulating on the window sill (or a
 * wall calendar). No empty slots, no streak-breaking: progress only
 * accumulates. The newest sun glows softly.
 */
export interface ReadingSunsProps {
  /** How many suns exist (reading days). Only earned suns render. */
  count?: number;
  /** Sun size px. Default 44. */
  size?: number;
  /** Draw the wooden sill line under the row. Default true. */
  sill?: boolean;
  style?: React.CSSProperties;
}
