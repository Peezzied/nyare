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
