# Interface Contract: TiptapEditor.vue

**Component**: `src/components/editor/TiptapEditor.vue`

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `modelValue` | `string` | `''` | Document HTML content bound via `v-model`. |
| `placeholder` | `string` | `'Write note content...'` | Placeholder text when empty. |
| `editable` | `boolean` | `true` | Whether editor content can be edited. |

## Emits

| Event | Payload | Description |
|---|---|---|
| `update:modelValue` | `value: string` | Emitted when document content changes. |

## Extensions Configured
1. `StarterKit` (headings, lists, blockquote, history, bold, italic, strike, code)
2. `Image` (from `@tiptap/extension-image`)

## Layout Composition
- Header: `<TiptapToolbar :editor="editor" @upload-image="handleImageUpload" />`
- Body: `<EditorContent :editor="editor" class="prose max-w-none p-4 min-h-[200px]" />`
