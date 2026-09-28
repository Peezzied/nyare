# Persistence & SQLite Guidelines

## 1. Single-Writer Connection Pool

SQLite requires single-threaded write access. Configure:
```properties
spring.datasource.hikari.maximum-pool-size=1
```
This avoids `SQLITE_BUSY` or file-locking collisions.

## 2. Schema Management

`spring.jpa.hibernate.ddl-auto=update` is used during active MVP development.

## 3. Open-In-View Disabled

`spring.jpa.open-in-view=false` ensures all entity interaction stays strictly inside `@Transactional` service methods.

## 4. Batch Querying & N+1 Prevention

- Never perform database queries (`findById`, `findBy...`) inside loops over collections.
- Fetch all candidate entities in bulk before processing (e.g., using bulk `IN (:ids)` queries or collection fetching).
- Index loaded entities into in-memory maps (`Map<ID, Entity>`) for $O(1)$ lookups.
- Batch mutations using `saveAll(...)` rather than repeated single-entity saves.
