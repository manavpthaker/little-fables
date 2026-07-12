/**
 * The ask card: the buddy poses a spoken question and offers the mic.
 * The live mic is the screen's single terracotta action.
 */
export interface AskCardProps {
  /** The spoken question — short, genuinely open. */
  question: string;
  /** Mic live (terracotta + pulse). */
  micActive?: boolean;
  onMic?: () => void;
  /** Card width px. Default 420. */
  width?: number;
  style?: React.CSSProperties;
}
