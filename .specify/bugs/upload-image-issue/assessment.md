# Bug Assessment: Uploaded Images Do Not Display in TiptapEditor

- **Slug**: upload-image-issue
- **Created**: 2026-10-13T00:50:21+08:00
- **Source**: pasted text
- **Verdict**: valid
- **Severity**: high

## Report (verbatim or summarized)

> "when i upload an image in the tiptapeditor, the image does not show"

## Symptom

When a user selects an image through the TiptapEditor toolbar button, the image does not render inside the editor document. The editor content remains unchanged, and no error banner appears in the user interface.

## Reproduction

1. Run `npm run story` and navigate to `components/editor/TiptapEditor` (or run `npm run dev` without a live Spring Boot backend on port 8080).
2. Click the Image button in the toolbar.
3. Select an image file (e.g. `test.png`) from the local file picker.
4. Observe that the file input closes, `Uploading image...` flashes briefly, and no image node appears in the document area.

## Suspected Code Paths

- `frontend/src/components/editor/TiptapEditor.vue:70-87` — `handleUploadImage()` calls `await imagesApi.upload(file)`. If the network request fails (such as in Histoire or offline dev), the catch block swallows the error into an emit without updating the editor or presenting a visible alert.
- `frontend/src/components/editor/TiptapEditor.vue:37-42` — `Image.configure({ allowBase64: false })` blocks local data URL insertion.
- `frontend/src/components/editor/TiptapEditor.vue:104-126` — Template has `v-if="isUploading"` status message but has no user-visible error state display when `upload-error` occurs.
- `frontend/src/api/mocks/adapter.ts:543-555` — Mock adapter generates a server relative path `/api/images/{id}`. When the browser renders `<img src="/api/images/{id}">`, the native browser image loader bypasses the fetch interceptor and fails with HTTP 404 or 504.
- `frontend/src/histoire.setup.ts:1-5` — Histoire setup does not configure mock handlers or mock image resolution.

## Root Cause Hypothesis

High confidence. `TiptapEditor` couples image node insertion strictly to the backend `imagesApi.upload(file)` HTTP response (`/api/images`). When testing in preview environments (Histoire) or when the backend server is not active on port 8080, `fetch('/api/images')` throws a network failure. The catch block emits `upload-error` without setting a visible UI error state, leaving the user with no feedback and no inserted image. Furthermore, `allowBase64: false` blocks local data/object URL previews, and mock environments return relative `/api/images/...` endpoints that browser `<img>` tags cannot resolve without an active server.

## Proposed Remediation

**Preferred**:
1. In `TiptapEditor.vue`, update `Image.configure()` to allow data/object URLs (`allowBase64: true`).
2. Add visible error state and user-facing alert message in `TiptapEditor.vue` when image upload encounters an error.
3. Provide local preview insertion using `URL.createObjectURL(file)` or FileReader data URL so images render immediately in client/preview environments (with background sync to `imagesApi.upload`), or fall back gracefully when the backend is offline.
4. Update `frontend/src/api/mocks/adapter.ts` to store and serve in-memory data URLs or blob URLs for uploaded files so browser `<img>` tags render in mock mode.
5. Register the mock adapter in `frontend/src/histoire.setup.ts` to support interactive Histoire preview sessions.

**Alternatives**:
- Require a running backend for all preview scenarios: Rejected because Histoire stories and frontend development must run self-contained without mandatory backend services.

**Files likely to change**:
- `frontend/src/components/editor/TiptapEditor.vue`
- `frontend/src/components/editor/__tests__/TiptapEditor.spec.ts`
- `frontend/src/api/mocks/adapter.ts`
- `frontend/src/histoire.setup.ts`

**Tests to add or update**:
- Test in `TiptapEditor.spec.ts` verifying visible error notice displays when upload fails.
- Test in `TiptapEditor.spec.ts` verifying image insertion with fallback/preview when API upload encounters network unavailability.

## Risks & Considerations

- Object URLs created with `URL.createObjectURL` require cleanup (`URL.revokeObjectURL`) to prevent memory leaks if used long-term.
- Base64 data URLs in production notes could bloat database document size if persisted directly without backend replacement.

## Open Questions

- None.
