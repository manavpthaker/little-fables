/**
 * Parent surfaces — the grown-up boundary. Quiet neutrals, Inter, plain
 * sentence case. Untouched by the drawn world; never leaks back into it.
 */
export interface ParentSurfaceProps {
  title?: string;
  children?: React.ReactNode;
  /** Panel width px. Default 360. */
  width?: number;
  style?: React.CSSProperties;
}

/** A label/value or label/control row inside a ParentSurface. */
export interface ParentRowProps {
  label: string;
  value?: string;
  control?: React.ReactNode;
}

/** Minimal neutral toggle for parent settings. */
export interface ParentToggleProps {
  on?: boolean;
  onChange?: (next: boolean) => void;
}
