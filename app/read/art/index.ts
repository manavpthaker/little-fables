// Little Fables — drawn art library, TSX port.
// Source of truth: design/handoff-v4-hifi/project/app/art.jsx + art2.jsx.
// The full art library there covers ~50 SVG components; Phase 1 ports the
// ~20 the Drawn Room needs (buddies, sun, star pin, medallion mount, window
// frame, shelf, rug, crate, doorway/kitchen door, envelope). Story-page art
// (BridgeArt, WindArt, RopeArt, MooseSkyArt, ...) is stubbed and will be
// filled in a later phase — the reader still uses the v2 WashScene until
// the transport ships.
//
// All art is drawn with the same hand: watercolor wash under (#lf-wash-edge)
// and confident ink over (#lf-wobble). Ink is warm #46362A, never #000.
// Filters come from `<LfFilters />` mounted globally in app/read/layout.tsx.

export {
  OtterArt,
  AnkyArt,
  MotoArt,
  RockyArt,
  RustyArt,
  BrambleArt,
  CreatureSprite,
} from './buddies'
export type { BuddyKind, BuddyPose } from './buddies'

export {
  WindowFrame,
  ShelfNiche,
  Rug,
  WritingDesk,
  CrateArt,
  DoorEdgeArt,
  SunPin,
  StarWordPin,
  MedallionMount,
  EnvelopeArt,
  MicIcon,
  KitchenBack,
} from './props'

export { BookCoverArt } from './covers'
export type { CoverBook } from './covers'
