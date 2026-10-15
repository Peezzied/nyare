# Interface Contract: TiptapToolbar.vue

**Component**: `src/components/editor/TiptapToolbar.vue`

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `editor` | `Editor \| undefined` | `undefined` | The active Tiptap editor instance. |
| `disabled` | `boolean` | `false` | Whether the entire toolbar is disabled. |

## Emits

| Event | Payload | Description |
|---|---|---|
| `upload-image` | `file: File` | Emitted when a user selects an image via the toolbar file input. |
| `upload-error` | `error: Error` | Emitted when image upload fails. |

## Slots

None. The toolbar renders standardized action controls.

## Internal Action Bindings

| Action | Icon | Trigger Command | Active Condition | Enabled Condition |
|---|---|---|---|---|
| Undo | `Undo2` | `editor.chain().focus().undo().run()` | N/A | `editor.can().undo()` |
| Redo | `Redo2` | `editor.chain().focus().redo().run()` | N/A | `editor.can().redo()` |
| Heading 1 | `Heading1` | `editor.chain().focus().toggleHeading({ level: 1 }).run()` | `editor.isActive('heading', { level: 1 })` | `true` |
| Heading 2 | `Heading2` | `editor.chain().focus().toggleHeading({ level: 2 }).run()` | `editor.isActive('heading', { level: 2 })` | `true` |
| Heading 3 | `Heading3` | `editor.chain().focus().toggleHeading({ level: 3 }).run()` | `editor.isActive('heading', { level: 3 })` | `true` |
| Bold | `Bold` | `editor.chain().focus().toggleBold().run()` | `editor.isActive('bold')` | `true` |
| Italic | `Italic` | `editor.chain().focus().toggleItalic().run()` | `editor.isActive('italic')` | `true` |
| Strike | `Strikethrough` | `editor.chain().focus().toggleStrike().run()` | `editor.isActive('strike')` | `true` |
| Code | `Code` | `editor.chain().focus().toggleCode().run()` | `editor.isActive('code')` | `true` |
| Bullet List | `List` | `editor.chain().focus().toggleBulletList().run()` | `editor.isActive('bulletList')` | `true` |
| Ordered List | `ListOrdered` | `editor.chain().focus().toggleOrderedList().run()` | `editor.isActive('orderedList')` | `true` |
| Blockquote | `Quote` | `editor.chain().focus().toggleBlockquote().run()` | `editor.isActive('blockquote')` | `true` |
| Divider | `Minus` | `editor.chain().focus().setHorizontalRule().run()` | N/A | `true` |
| Image | `ImageUp` | Triggers hidden `<input type="file" accept="image/*" />` | N/A | `!disabled` |
