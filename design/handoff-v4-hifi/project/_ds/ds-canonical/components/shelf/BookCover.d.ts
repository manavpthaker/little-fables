/**
 * Face-out book on the wooden shelf. Real cover art framed in a drawn
 * cover; progress is a drawn bookmark ribbon; the child's authored books
 * carry a star spine mark; "art still painting" shows as pencil sketch.
 * @startingPoint section="Shelf" subtitle="Face-out book — ribbon progress, authored star, sketch state, beacon" viewport="700x300"
 */
export interface BookCoverProps {
  /** Set-type title (Young Serif). */
  title: string;
  /** One of the 10 pigments for the cover wash. */
  pigment?: "marigold" | "butter" | "terracotta" | "sage" | "river" | "teal" | "berry" | "dusk" | "bark" | "plum";
  /** Cover width px (height = 1.38 × width). Default 150. */
  width?: number;
  /** The cover art (drawn in the house style). */
  art?: React.ReactNode;
  /** 0–1 → drawn bookmark ribbon length. Omit for no ribbon. */
  progress?: number;
  /** The child's own book — star spine mark. */
  authored?: boolean;
  /** "Art still painting" — pencil-sketch cover state. */
  sketch?: boolean;
  /** The Continue invitation: lamplight glow (the screen's one obvious next thing). */
  beacon?: boolean;
  /** Open the book. Whole cover is the target (≥56px by nature). */
  onOpen?: (e: any) => void;
  style?: React.CSSProperties;
}
