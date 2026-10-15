# Research & Architecture Decisions: Rich Text Toolbar and Editor

**Branch**: `001-tiptap-toolbar` | **Feature**: Rich Text Toolbar and Editor

## 1. Premade Component Provider Selection

### Decision
Adopt the **Shadcn-Vue / Tiptap Primitives Pattern** using `@tiptap/vue-3`, `reka-ui`, Tailwind CSS v4, and `@/components/ui/button`.

### Rationale
- **Supply-Chain Security**: Monolithic third-party packages such as `tiptap-shadcn-vue` experienced severe supply-chain attacks (malicious credential exfiltration in npm releases).
- **Stack Alignment**: The repository already installs Vue 3.5, `@tiptap/vue-3` (v3.31), `reka-ui` (v2.11), Tailwind CSS v4, and `@lucide/vue`.
- **Ponytail Minimalism**: Direct composition of local UI primitives eliminates bloated abstractions, avoids external unmaintained wrapper dependencies, and ensures full control over styling and touch accessibility.

### Alternatives Considered
- **`tiptap-shadcn-vue`**: Rejected due to supply-chain vulnerabilities and unmaintained state.
- **`novel`**: Rejected because it is React-only and incompatible with Vue 3.
- **`tiptap-vue-pro`**: Rejected because it introduces heavy external framework adapters and commercial licensing constraints.

---

## 2. Image Node Management

### Decision
Install and configure the official `@tiptap/extension-image` (`^3.31.4`).

### Rationale
- Maintained directly by the Tiptap team.
- Matches installed `@tiptap/vue-3` and `@tiptap/starter-kit` versions.
- Standard declarative node insertion via `editor.chain().focus().setImage({ src, alt }).run()`.

### Alternatives Considered
- **Custom ProseMirror image node**: Rejected due to excessive boilerplate and maintenance overhead.

---

## 3. Image Upload and Storage Workflow

### Decision
Connect the toolbar upload action to `imagesApi.upload(file)` (`POST /api/images`) with fallback handling for local previews.

### Rationale
- The backend already defines `/api/images` returning `ImageUploadResponse` with an accessible `url`.
- The frontend already implements `imagesApi.upload` in `src/api/images.ts`.
- When network upload succeeds, the returned URL is set as the `src` attribute of the inserted image node.
- If upload fails or during offline/mock scenarios, a standard error notification alerts the user without altering the document.

### Alternatives Considered
- **Base64 inline data URLs**: Rejected for production storage because base64 strings inflate note payloads by ~33% and degrade SQLite performance.

---

## 4. Edit History (Undo & Redo) Integration

### Decision
Use Tiptap StarterKit's built-in `History` extension with `editor.can().undo()` and `editor.can().redo()` state checks.

### Rationale
- StarterKit already provides ProseMirror's battle-tested history plugin.
- `editor.can().undo()` and `editor.can().redo()` provide reliable boolean state to disable toolbar buttons when no actions exist.

### Alternatives Considered
- **Custom command history stack**: Rejected as redundant and bug-prone.

---

## 5. Mobile & Touch Responsive Layout

### Decision
Render a horizontal flex-wrap toolbar with icon buttons (`size="icon-sm"`, min 32x32px touch target) and semantic active state indicators (`bg-accent` / `data-active`).

### Rationale
- Satisfies mobile-first design requirements in `frontend/AGENTS.md`.
- Ensures toolbar buttons wrap gracefully on 360px mobile viewports without horizontal scroll clipping.
