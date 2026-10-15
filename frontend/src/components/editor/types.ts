import type { Component } from 'vue'
import type { Editor } from '@tiptap/vue-3'

/** Category of a toolbar action. TiptapToolbar does not use it for layout now. */
export type ToolbarActionGroup = 'history' | 'block' | 'inline' | 'list' | 'media'

/** One button in TiptapToolbar. */
export interface ToolbarActionItem {
  /** Stable key for the button list. */
  id: string
  /** Button aria-label. */
  label: string
  icon: Component
  group: ToolbarActionGroup
  /** Returns true when the format applies at the cursor. The toolbar then sets aria-pressed to true. */
  isActive?: () => boolean
  /** Returns false to disable the button. When it is absent, only the toolbar disabled state and a missing editor disable the button. */
  canExecute?: () => boolean
  action: () => void
}

/** Copy of the TiptapToolbar props. TiptapToolbar.vue declares its own interface and does not import this one. */
export interface TiptapToolbarProps {
  editor?: Editor
  disabled?: boolean
}

/** Copy of the TiptapToolbar emits. No component imports it now. */
export interface TiptapToolbarEmits {
  (e: 'upload-image', file: File): void
  (e: 'upload-error', error: Error): void
}

/** Copy of the TiptapEditor props. TiptapEditor.vue declares its own interface and does not import this one. */
export interface TiptapEditorProps {
  modelValue?: string
  placeholder?: string
  editable?: boolean
  errorMessage?: string | null
}

/**
 * Partial copy of the TiptapEditor emits. No component imports it now.
 * TiptapEditor.vue also emits upload-error and image-uploaded.
 */
export interface TiptapEditorEmits {
  (e: 'update:modelValue', value: string): void
}
