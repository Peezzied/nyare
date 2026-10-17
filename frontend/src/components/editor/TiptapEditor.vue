<script setup lang="ts">
// Rich text body of NoteEditor. It uploads images that TiptapToolbar picks and inserts them.
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { AlertCircle } from '@lucide/vue'
import TiptapToolbar from './TiptapToolbar.vue'
import { imagesApi } from '@/api/images'
import type { ImageUploadResponse } from '@/types/api'

interface Props {
  /** Editor content as HTML. NoteEditor converts Markdown to HTML before it passes the value. */
  modelValue?: string
  placeholder?: string
  /** False makes the content read-only and disables the toolbar. */
  editable?: boolean
  /** Error text from the parent. It replaces the internal upload error in the banner. */
  errorMessage?: string | null
  /** Extra classes on the toolbar root. NoteEditor uses it for the staggered controls entrance. */
  toolbarClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Write note content...',
  editable: true,
  errorMessage: null,
  toolbarClass: undefined,
})

const emit = defineEmits<{
  /** Fires on each content change, including image inserts. Payload is the full editor HTML. */
  (e: 'update:modelValue', value: string): void
  /** Fires when the toolbar rejects a file or the upload request fails. Payload is the error. */
  (e: 'upload-error', error: Error): void
  /** Fires after the server stores an image and the editor inserts it. Payload is the upload response. */
  (e: 'image-uploaded', response: ImageUploadResponse): void
}>()

const isUploading = ref(false)
const internalError = ref<string | null>(null)

const activeError = computed(() => props.errorMessage ?? internalError.value)

const dismissError = () => {
  internalError.value = null
}

const editor = useEditor({
  content: props.modelValue,
  editable: props.editable,
  editorProps: {
    attributes: {
      class: 'font-editor outline-none focus:outline-none min-h-full min-h-[300px]',
    },
  },
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
    }),
    Image.configure({
      allowBase64: false,
      HTMLAttributes: {
        class: 'rounded-lg max-w-full h-auto my-3 shadow-xs',
      },
    }),
    Placeholder.configure({
      placeholder: () => props.placeholder,
    }),
  ],
  onUpdate: ({ editor: ed }) => {
    const html = ed.getHTML()
    emit('update:modelValue', html)
  },
})

// The parent echoes each emitted HTML back through modelValue. Skip equal values so
// setContent does not reset the cursor. emitUpdate false prevents an update loop.
watch(
  () => props.modelValue,
  (newValue) => {
    if (!editor.value) {
      return
    }
    const currentHtml = editor.value.getHTML()
    if (newValue !== currentHtml) {
      editor.value.commands.setContent(newValue, { emitUpdate: false })
    }
  },
)

// useEditor reads editable only at creation. This watcher applies later changes.
watch(
  () => props.editable,
  (newEditable) => {
    editor.value?.setEditable(newEditable)
  },
)

const handleUploadImage = async (file: File) => {
  if (!editor.value || isUploading.value) {
    return
  }

  isUploading.value = true
  internalError.value = null
  try {
    const response = await imagesApi.upload(file)
    if (response?.url) {
      editor.value.chain().focus().setImage({ src: response.url }).run()
      emit('image-uploaded', response)
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Image upload failed')
    internalError.value = error.message
    emit('upload-error', error)
  } finally {
    isUploading.value = false
  }
}

const handleUploadError = (error: Error) => {
  internalError.value = error.message
  emit('upload-error', error)
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div
    class="font-editor flex flex-col flex-1 min-h-0 w-full bg-background transition-colors overflow-hidden"
    :class="{ 'opacity-60 cursor-not-allowed select-none': !editable }"
  >
    <div
      v-if="activeError"
      role="alert"
      class="shrink-0 flex items-center justify-between border-b border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive transition-colors"
    >
      <div class="flex items-center gap-1.5">
        <AlertCircle class="size-4 shrink-0" />
        <span>{{ activeError }}</span>
      </div>
      <button
        type="button"
        class="ml-2 font-medium hover:underline cursor-pointer"
        aria-label="Dismiss error notice"
        @click="dismissError"
      >
        Dismiss
      </button>
    </div>

    <div
      v-if="isUploading"
      class="shrink-0 bg-accent/30 px-3 py-1.5 text-xs text-muted-foreground transition-all border-b border-border"
    >
      Uploading image...
    </div>

    <div
      class="flex-1 min-h-0 overflow-y-auto px-4 py-3"
      :class="{ 'pointer-events-none': !editable }"
      data-testid="editor-scroll-container"
    >
      <EditorContent
        :editor="editor"
        class="font-editor min-h-full text-foreground focus-within:outline-none [&_.tiptap]:font-editor [&_.tiptap]:min-h-full [&_.tiptap]:outline-none [&_.tiptap]:focus:outline-none"
      />
    </div>

    <!-- Optional row between the content and the toolbar. NoteEditor puts its status bar here. -->
    <slot name="status-bar" />

    <TiptapToolbar
      :editor="editor"
      :disabled="!editable || isUploading"
      class="shrink-0 mt-auto w-full"
      :class="toolbarClass"
      @upload-image="handleUploadImage"
      @upload-error="handleUploadError"
    />
  </div>
</template>

<style scoped>
:deep(.tiptap) {
  font-family: var(--font-editor, 'Inter', sans-serif);
}

:deep(.tiptap p.is-editor-empty:first-child::before) {
  color: #94a3b8;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

:deep(.tiptap h1) {
  font-family: var(--font-sans, 'Quicksand', sans-serif);
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.25;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
}

:deep(.tiptap h2) {
  font-family: var(--font-sans, 'Quicksand', sans-serif);
  font-size: 1.375rem;
  font-weight: 600;
  line-height: 1.3;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

:deep(.tiptap h3) {
  font-family: var(--font-sans, 'Quicksand', sans-serif);
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.4;
  margin-top: 0.75rem;
  margin-bottom: 0.375rem;
}

:deep(.tiptap p) {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

:deep(.tiptap ul) {
  list-style-type: disc;
  padding-left: 1.25rem;
  margin: 0.5rem 0;
}

:deep(.tiptap ol) {
  list-style-type: decimal;
  padding-left: 1.25rem;
  margin: 0.5rem 0;
}

:deep(.tiptap li) {
  margin: 0.25rem 0;
}

:deep(.tiptap blockquote) {
  border-left: 3px solid var(--color-app-border, #cbd5e1);
  padding-left: 0.875rem;
  margin: 0.75rem 0;
  color: var(--color-text-muted, #7b8b97);
  font-style: italic;
}

:deep(.tiptap hr) {
  border: none;
  border-top: 1px solid var(--color-app-border, #cbd5e1);
  margin: 1.25rem 0;
}

:deep(.tiptap code) {
  background-color: rgba(0, 0, 0, 0.06);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>
