/**
 * Choice cards: 2–3 drawn objects the child picks up. Each is spoken
 * aloud when offered (sound-arc mark); tap or say it to pick.
 */
export interface ChoiceCardsProps {
  /** 2–3 choices. art = drawn object; pigment optional (auto-rotates sage/river/marigold). */
  choices: Array<{ id: string; label: string; art?: React.ReactNode; pigment?: string }>;
  onPick?: (id: string) => void;
  /** Currently picked id (lamplight ring). */
  picked?: string;
  /** Card size px (>=56 target by nature). Default 168. */
  size?: number;
  style?: React.CSSProperties;
}
