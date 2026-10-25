# Contract: Note API change

Only the note body shape changes. No new endpoint exists.

## `POST /api/notes` and `PUT /api/notes/{id}`

Request adds an optional field:

```json
{ "courseId": 1, "title": "Lecture 4", "content": "...", "entryDate": "2026-10-25", "excludedFromAi": true }
```

| Field | Type | Rule |
|-------|------|------|
| `excludedFromAi` | boolean, optional | `null` or omitted: create stores `false`, update keeps the stored value. |

## `GET /api/notes/{id}`, `POST`, `PUT` responses

Response adds:

```json
{ "excludedFromAi": true }
```

`GET /api/notes` (summary list) is unchanged.

## `GET /api/study-planner/status` and `POST /api/study-planner/process`

No shape change. Excluded notes do not appear in `pendingNotes` and do not count in `pendingCount`.

## Errors

Same as today. A note of another user answers 404 (RFC 7807). A note in an archived course answers 400.

# Contract: Editor UI

- **Toggle row** in the "Plan zone" card of `NoteEditor.vue`, below the date row.
  - shadcn-vue `Switch` inside a `Label`. Whole row is at least 44 pixels high.
  - Label text: "Skip AI processing". Helper text: "Nyare ignores this note when you process."
  - Disabled when the course is archived (same rule as other fields).
  - Changing it marks the editor dirty. The Save button persists it.
- **Status badge** (existing footer badge) shows "Skipped by AI" when the note is saved and excluded.
- Tokens, fonts, and colors come from `DESIGN.md`. No new color is introduced beyond a neutral badge class in `noteStatus.ts`.
