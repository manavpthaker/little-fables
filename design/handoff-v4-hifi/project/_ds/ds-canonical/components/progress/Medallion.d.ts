/**
 * A drawn medallion (badge) that lives on the shelf. Badges accumulate;
 * nothing dims, breaks, or is lost. No counters or currencies.
 */
export interface MedallionProps {
  /** Quiet caption under the medal (italic, adult-adjacent). */
  label?: string;
  /** Disc pigment. Default "marigold". */
  pigment?: "marigold" | "terracotta" | "sage" | "river" | "teal" | "berry" | "plum";
  /** Medal width px. Default 96. */
  size?: number;
  /** Custom drawn motif inside the disc (default: a star). */
  motif?: React.ReactNode;
  style?: React.CSSProperties;
}
