<script setup lang="ts">
// Bottom toolbar of TiptapEditor. It checks picked image files and emits them. TiptapEditor uploads them.
import { computed, ref } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import {
  Undo2,
  Redo2,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Underline,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Minus,
  ImageUp,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import type { ToolbarActionItem } from './types'

interface Props {
  /** Tiptap instance that the buttons control. Undefined disables all buttons. */
  editor?: Editor
  /** Disables all buttons. TiptapEditor sets it when the editor is locked or an upload runs. */
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editor: undefined,
  disabled: false,
})

const emit = defineEmits<{
  /** Fires when the user picks an image file of 10 MB or less. Payload is the file. */
  (e: 'upload-image', file: File): void
  /** Fires when the picked file is not an image or is larger than 10 MB. Payload is the error. */
  (e: 'upload-error', error: Error): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)

const triggerImagePicker = () => {
  if (fileInputRef.value) {
    // Clear the old value so that a second pick of the same file still fires change.
    fileInputRef.value.value = ''
    fileInputRef.value.click()
  }
}

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) {
    return
  }

  if (!file.type.startsWith('image/')) {
    emit('upload-error', new Error('Only image files are supported'))
    return
  }

  const maxBytes = 10 * 1024 * 1024
  if (file.size > maxBytes) {
    emit('upload-error', new Error('Image size must not exceed 10 MB'))
    return
  }

  emit('upload-image', file)
}

const formattingActions = computed<ToolbarActionItem[]>(() => {
  const ed = props.editor
  return [
    {
      id: 'image',
      label: 'Image',
      icon: ImageUp,
      group: 'media',
      canExecute: () => !props.disabled,
      action: triggerImagePicker,
    },
    {
      id: 'bold',
      label: 'Bold',
      icon: Bold,
      group: 'inline',
      isActive: () => !!ed?.isActive('bold'),
      action: () => ed?.chain().focus().toggleBold().run(),
    },
    {
      id: 'underline',
      label: 'Underline',
      icon: Underline,
      group: 'inline',
      isActive: () => !!ed?.isActive('underline'),
      action: () => ed?.chain().focus().toggleUnderline().run(),
    },
    {
      id: 'italic',
      label: 'Italic',
      icon: Italic,
      group: 'inline',
      isActive: () => !!ed?.isActive('italic'),
      action: () => ed?.chain().focus().toggleItalic().run(),
    },
    {
      id: 'strike',
      label: 'Strikethrough',
      icon: Strikethrough,
      group: 'inline',
      isActive: () => !!ed?.isActive('strike'),
      action: () => ed?.chain().focus().toggleStrike().run(),
    },
    {
      id: 'code',
      label: 'Code',
      icon: Code,
      group: 'inline',
      isActive: () => !!ed?.isActive('code'),
      action: () => ed?.chain().focus().toggleCode().run(),
    },
    {
      id: 'h1',
      label: 'Heading 1',
      icon: Heading1,
      group: 'block',
      isActive: () => !!ed?.isActive('heading', { level: 1 }),
      action: () => ed?.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      id: 'h2',
      label: 'Heading 2',
      icon: Heading2,
      group: 'block',
      isActive: () => !!ed?.isActive('heading', { level: 2 }),
      action: () => ed?.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      id: 'h3',
      label: 'Heading 3',
      icon: Heading3,
      group: 'block',
      isActive: () => !!ed?.isActive('heading', { level: 3 }),
      action: () => ed?.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      id: 'bullet-list',
      label: 'Bullet List',
      icon: List,
      group: 'list',
      isActive: () => !!ed?.isActive('bulletList'),
      action: () => ed?.chain().focus().toggleBulletList().run(),
    },
    {
      id: 'ordered-list',
      label: 'Ordered List',
      icon: ListOrdered,
      group: 'list',
      isActive: () => !!ed?.isActive('orderedList'),
      action: () => ed?.chain().focus().toggleOrderedList().run(),
    },
    {
      id: 'blockquote',
      label: 'Blockquote',
      icon: Quote,
      group: 'block',
      isActive: () => !!ed?.isActive('blockquote'),
      action: () => ed?.chain().focus().toggleBlockquote().run(),
    },
    {
      id: 'divider',
      label: 'Divider',
      icon: Minus,
      group: 'block',
      action: () => ed?.chain().focus().setHorizontalRule().run(),
    },
  ]
})

const historyActions = computed<ToolbarActionItem[]>(() => {
  const ed = props.editor
  return [
    {
      id: 'undo',
      label: 'Undo',
      icon: Undo2,
      group: 'history',
      canExecute: () => !props.disabled && !!ed?.can().undo(),
      action: () => ed?.chain().focus().undo().run(),
    },
    {
      id: 'redo',
      label: 'Redo',
      icon: Redo2,
      group: 'history',
      canExecute: () => !props.disabled && !!ed?.can().redo(),
      action: () => ed?.chain().focus().redo().run(),
    },
  ]
})

const isActionDisabled = (item: ToolbarActionItem): boolean => {
  if (props.disabled || !props.editor) {
    return true
  }
  if (item.canExecute) {
    return !item.canExecute()
  }
  return false
}
</script>

<template>
  <div class="flex flex-row border-t-2 border-[#00A4C8]">
    <div role="toolbar" aria-label="Rich text editor toolbar"
      class="minimal-scrollbar flex flex-nowrap items-center gap-2 overflow-x-auto bg-card p-2 text-card-foreground select-none">
      <input ref="fileInputRef" type="file" accept="image/*" class="hidden" data-testid="image-file-input"
        @change="onFileChange" />
      <!-- Formatting Tools (Left Cluster) -->
      <div class="flex items-center gap-1 shrink-0" data-testid="formatting-cluster">
        <template v-for="item in formattingActions" :key="item.id">
          <Button type="button" size="icon" :variant="item.isActive?.() ? 'secondary' : 'ghost'" :class="[
            'size-9 shrink-0 transition-colors',
            item.isActive?.()
              ? 'bg-accent text-accent-foreground shadow-xs font-semibold'
              : '',
          ]" :aria-label="item.label" :aria-pressed="item.isActive ? (item.isActive() ? 'true' : 'false') : undefined"
            :disabled="isActionDisabled(item)" @click="item.action">
            <component :is="item.icon" class="size-4" />
          </Button>
        </template>
      </div>
    </div>
    <!-- History Tools (Floating Right Cluster: Standout Undo & Redo) -->
    <div class="flex items-center gap-1.5 shrink-0 sticky right-0 ml-auto self-stretch bg-card px-2"
      data-testid="history-cluster">
      <template v-for="item in historyActions" :key="item.id">
        <Button type="button" size="icon" variant="ghost" :class="[
          'size-9 shrink-0 font-bold transition-all text-[#00A4C8] border border-[#00A4C8]/30 bg-[#00A4C8]/10 hover:bg-[#00A4C8]/20 active:scale-95 shadow-xs',
          isActionDisabled(item)
            ? 'opacity-30 pointer-events-none cursor-not-allowed'
            : '',
        ]" :aria-label="item.label" :disabled="isActionDisabled(item)" @click="item.action">
          <component :is="item.icon" class="size-4.5 stroke-[2.25]" />
        </Button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.minimal-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgb(0 0 0 / 0.2) transparent;
}

.minimal-scrollbar::-webkit-scrollbar {
  height: 4px;
}

.minimal-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.minimal-scrollbar::-webkit-scrollbar-thumb {
  background: rgb(0 0 0 / 0.2);
  border-radius: 9999px;
}
</style>
