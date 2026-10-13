import type { Component } from 'vue'
import type { Editor } from '@tiptap/vue-3'

export type ToolbarActionGroup = 'history' | 'block' | 'inline' | 'list' | 'media'

export interface ToolbarActionItem {
  id: string
  label: string
  icon: Component
  group: ToolbarActionGroup
  isActive?: () => boolean
  canExecute?: () => boolean
  action: () => void
}

export interface TiptapToolbarProps {
  editor?: Editor
  disabled?: boolean
}

export interface TiptapToolbarEmits {
  (e: 'upload-image', file: File): void
  (e: 'upload-error', error: Error): void
}

export interface TiptapEditorProps {
  modelValue?: string
  placeholder?: string
  editable?: boolean
  errorMessage?: string | null
}

export interface TiptapEditorEmits {
  (e: 'update:modelValue', value: string): void
}
