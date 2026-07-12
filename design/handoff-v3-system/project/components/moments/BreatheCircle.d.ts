/**
 * Breathe-along circle: an ink circle that swells like a wash bloom on a
 * slow breath cycle (5.6s in-hold-out). The buddy's voice carries the
 * cadence; this is the visual anchor. Static under reduced motion.
 */
export interface BreatheCircleProps {
  /** Rendered size px. Default 260. */
  size?: number;
  /** Wash pigment. Default "teal" (calm). */
  pigment?: "teal" | "dusk" | "sage" | "river" | "plum";
  /** Pause the swell (holds mid-size). Default true. */
  running?: boolean;
  style?: React.CSSProperties;
}
