/**
 * "Last time…" — three small hand-drawn comic panels with one caption
 * each. The home of the comic grammar; captions are also spoken.
 */
export interface RecapStripProps {
  /** Exactly three panels: drawn art + one short caption each. */
  panels: Array<{ art?: React.ReactNode; caption: string }>;
  /** Panel width px. Default 190. */
  panelWidth?: number;
  style?: React.CSSProperties;
}
