# UI Loading Contract: Perceived Performance

No API contracts change — the backend surface is untouched. This file pins the observable loading contracts the implementation must satisfy, so tasks and tests can assert them without re-reading the spec.

## C1 — Route → capability boundaries

| Surface | May load | Must NOT trigger load of |
|---------|----------|--------------------------|
| Start / entry screens | App shell, fonts (non-blocking), session + catalog data | Schedule-X engine, Tiptap graph, calendar week engine |
| `/tasks`, `/calendar`, `/notes` (first visit) | Their view chunks + independent list data, concurrently | The other tabs' data |
| `/notes` list | Notes list data | Tiptap editor graph (deferred to first note open) |
| Onboarding (`/create-schedule`) | Its own lazy chunk incl. schedule preview | — (isolated from entry) |
| Note editor modal | Note DTO + Tiptap chunk, concurrently | Full notes list reload |
| Task detail | Task DTO + catalog, concurrently | Tasks list reload (cache upsert only) |

## C2 — Concurrency contract

- Independent data for one screen is requested in one `Promise.all` fan-out. A screen's first usable render waits on at most one network round-trip stage beyond what the router guard already performed.
- The navigation guard performs at most one dependent round-trip (`session → catalog`); it never waits on view-level data.

## C3 — Revisit contract

- Returning to a kept-alive tab emits zero data requests for already-cached lists and zero component rebuilds.
- Returning to any other screen shows cached data immediately; stale-while-revalidate is only permitted where a mutation invalidated the cache.

## C4 — Imagery contract

- Any `<img>` that appears with a surface is fetched before that surface's first presentation (bundled art) or renders into reserved space (user-attached note images).
- No layout shift is permitted when a late image resolves.

## C5 — Freshness contract (inherited, unchanged)

- Mutation responses update local state; no post-mutation collection reloads.
- Planner runs refetch tasks/events only for `affectedCourseIds` (full refetch when counts are positive without IDs).
- Course delete/archive/unarchive resets dependent caches exactly as today.
