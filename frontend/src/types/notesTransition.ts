/** Viewport geometry of the tapped element that seeds the container transform. */
export interface TapOriginRect {
  /** Distance in pixels from the top edge of the viewport. */
  top: number
  /** Distance in pixels from the left edge of the viewport. */
  left: number
  /** Bounding width in pixels. */
  width: number
  /** Bounding height in pixels. */
  height: number
  /** Initial corner radius such as '16px'. */
  borderRadius: string
}

/** Lifecycle phase of the note modal container transform. */
export type AnimationPhase = 'idle' | 'expanding' | 'settled' | 'collapsing'

/** Element category that triggered the modal expansion. */
export type NoteModalTriggerKind = 'card' | 'fab'

/** Reactive state driving the note editor modal overlay in NotesView. */
export interface ActiveNoteModalState {
  /** Whether the overlay is active or dismissing. */
  isOpen: boolean
  /** Selected note UUID, or null when creating a new note. */
  noteId: string | null
  /** The trigger element category. */
  triggerKind: NoteModalTriggerKind | null
  /** Origin coordinates captured before expansion. */
  originRect: TapOriginRect | null
  /** The active animation phase. */
  phase: AnimationPhase
  /** Enables CSS transition classes on the container. */
  isTransitioning: boolean
  /** Drives geometry styles between full screen and origin. */
  isExpanded: boolean
  /** Controls delayed entrance of header, title, and body. */
  showContent: boolean
  /** Controls delayed entrance of toolbar and action buttons. */
  showControls: boolean
}
