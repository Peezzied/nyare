# Contracts: Manage Courses Page

## HTTP

### `PUT /api/courses/{id}` (new)

- Session required. Unauthenticated: 401 (RFC 7807).
- Body: `CourseRequest { name, description?, color? }`. `color` is a palette slug (e.g. `"flamingo"`); null or absent means unset.
- 200: `CourseResponse { id, name, description, color, userId }`.
- 400: invalid body (`@Valid`, handled by `GlobalExceptionHandler`).
- 404: course not found or owned by another user (`ResourceNotFoundException`).
- Layering: `CourseController.updateCourse` -> `CourseService.updateCourse(Long id, CourseRequest, Long userId)` -> `CourseServiceImpl`. Class-level `@Transactional(readOnly = true)`. Explicit `@Transactional` on the method.

### Existing endpoints used

`POST/PUT/DELETE /api/schedules`, `DELETE /api/courses/{id}`, `POST /api/courses`, `GET` lists through `useCatalog`.

## Frontend

### `coursesApi.update(id, request): Promise<CourseResponse>`

Calls `PUT /api/courses/{id}`. The doc comment "The backend has no update endpoint" is removed. The mock adapter (`api/mocks/adapter.ts`) handles `PUT /api/courses/{id}`.

### `useCatalog().applyCourseUpdated(course)`

Replaces the course in the cache by id.

### `CourseEditorDrawer.vue`

| Prop | Type | Notes |
|------|------|-------|
| `editor` | `CourseEditor` | Active editor. |
| `open` | `boolean` | `v-model:open`. |
| `stage` | `'partial' \| 'full'` | `v-model:stage`. |
| `saving` | `boolean` | Disables inputs and shows busy state. |
| `showColor` | `boolean` | Default true. |
| `portal` | `boolean` | Passed to `DrawerContent`. |
| `unavailableDays` | `(block) => DayOfWeek[]` | Supplied by the parent. |

| Event | Meaning |
|-------|---------|
| `update:open`, `update:stage` | Model updates. |
| `save` | Student taps Save. |
| `close` | Student taps the close button. |

Slot `footer`: extra controls under the form. Create Schedule puts "Retry failed blocks" here.

All existing `data-testid` values stay: `save-course`, `course-details-section`, `color-toggle`, `color-swatch`, `add-another-time`.

### `ManageCoursesView.vue` test ids

`manage-courses-page`, `manage-course-card`, `manage-course-edit`, `manage-course-delete`, `manage-add-course`, `manage-empty-state`.

### `HamburgerMenu.vue`

New button `data-testid="manage-courses-item"`, label "Manage courses". It sits above "Select Account". On tap it closes the panel and calls `router.push({ name: 'manage-courses' })`.
