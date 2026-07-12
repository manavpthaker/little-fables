/**
 * The buddy — Little Fables' bear companion. The app's voice and hands:
 * drawn in the house style, alive (breath loop), never pleading.
 * @startingPoint section="Characters" subtitle="The bear companion — idle, listening, pointing, celebrating" viewport="700x280"
 */
export interface BuddyProps {
  /** What the buddy is doing. idle = resting breath; listening = lean-in
   *  while the child speaks; pointing = directing attention up-right;
   *  celebrating = arms up with lantern-light glow (light, not confetti). */
  pose?: "idle" | "listening" | "pointing" | "celebrating";
  /** Rendered height in px. Default 200. */
  size?: number;
  /** Breath loop (2.6s). Disable only in static contexts; reduced motion
   *  disables it automatically. */
  breathing?: boolean;
  /** Extra styles on the root svg. */
  style?: React.CSSProperties;
}
