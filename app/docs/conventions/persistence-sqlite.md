# Persistence & SQLite Guidelines

## 1. Connection Pool & WAL Pragmas

SQLite permits one writer at a time. WAL mode lets readers run concurrently with that writer. Configure:
```properties
spring.datasource.hikari.maximum-pool-size=4
spring.datasource.hikari.data-source-properties.journal_mode=WAL
spring.datasource.hikari.data-source-properties.synchronous=NORMAL
spring.datasource.hikari.data-source-properties.busy_timeout=30000
```

- Reads never queue behind a write transaction. Writers wait up to `busy_timeout` (ms) before `SQLITE_BUSY`.
- Set pragmas via `data-source-properties`. sqlite-jdbc executes only the first statement of `connection-init-sql`, so a multi-statement init string silently drops every pragma after the first.
- Do not enable `foreign_keys` without auditing delete paths first: JPA-generated FK constraints on existing tables would make deletes that leave orphaned records (e.g., note → image) fail.
- Test profile stays at pool size 1: the shared in-memory database (`cache=shared`) has no WAL and serializes all access.

## 2. Schema Management

`spring.jpa.hibernate.ddl-auto=update` is used during active MVP development.

## 3. Open-In-View Disabled

`spring.jpa.open-in-view=false` ensures all entity interaction stays strictly inside `@Transactional` service methods.

## 4. Batch Querying & N+1 Prevention

- Never perform database queries (`findById`, `findBy...`) inside loops over collections.
- Fetch all candidate entities in bulk before processing (e.g., using bulk `IN (:ids)` queries or collection fetching).
- Index loaded entities into in-memory maps (`Map<ID, Entity>`) for $O(1)$ lookups.
- Batch mutations using `saveAll(...)` rather than repeated single-entity saves.
