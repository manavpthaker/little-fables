// Little Fables — drawn art library, TSX port.
// Source of truth: design/handoff-v4-hifi/project/app/art.jsx + art2.jsx.
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
  SpeakerIcon,
  StarBurstArt,
  MoonPin,
  TransportPlayIcon,
  TransportPauseIcon,
  BackArrowIcon,
  DotsIcon,
} from './props'

export { BookCoverArt } from './covers'
export type { CoverBook } from './covers'

// v3.2 — drawn replacements for the deleted app/read/components.tsx kit.
export { SpeechBubble } from './SpeechBubble'
export { KidScreen } from './KidScreen'
export { DrawnCircleBtn } from './DrawnCircleBtn'
export { DrawnConfetti } from './DrawnConfetti'
export { DrawnProgressRing } from './DrawnProgressRing'
export { IntentToast } from './IntentToast'
export { IntentHighlight } from './IntentHighlight'
export { OfflineBanner } from './OfflineBanner'
export { BuddyMicButton } from './BuddyMicButton'
