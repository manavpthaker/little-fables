/**
 * Hand-drawn balloon for buddy speech. Appears WITH the spoken line —
 * text is atmosphere, audio carries meaning (the child is 4).
 */
export interface SpeechBalloonProps {
  /** The spoken line, set in Alegreya 26px. Short — one breath. */
  children: React.ReactNode;
  /** calm = quiet settle (default). bouncy = excited pop + gentle rock. */
  variant?: "calm" | "bouncy";
  /** Which side the tail points from (toward the buddy). */
  tail?: "left" | "right" | "none";
  /** Show pulsing sound arcs while the line is being spoken aloud. */
  speaking?: boolean;
  /** Max balloon width in px. Default 360. */
  maxWidth?: number;
  style?: React.CSSProperties;
}
