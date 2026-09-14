# Architecture & Package Conventions

## 1. Layered Architecture

Nyare follows a strict four-layer architecture with unidirectional dependencies:

```text
Client (Calendar UI / Notes UI)
  ↓  HTTP JSON
Controller Layer (@RestController, @RequestMapping('/api/...'))
  ↓  Calls Interface (Passes DTOs)
Service Layer (Interface in service.*, Impl in service.impl.*)
  ↓  Spring Data JPA Queries (Encapsulates Entities)
Repository Layer (JpaRepository)
  ↓  SQL
Database (SQLite / nyare.db)
```

## 2. Layer Isolation Rules

1. **Controllers (`group.four.nyare.nyare.controller`)**:
   - Handle routing, validation (`@Valid`), HTTP status codes, and headers.
   - Interacts **only** with Service interfaces and DTOs.
   - Never accesses repositories or JPA entities directly.
2. **Services (`group.four.nyare.nyare.service`)**:
   - Contains business logic, cross-entity validation, and `@Transactional` boundaries.
   - Defined as an **Interface** in `service` and implemented in `service.impl`.
   - Maps between internal JPA Entities and external DTOs. Entities must never escape past this layer.
3. **Repositories (`group.four.nyare.nyare.repository`)**:
   - Spring Data JPA interfaces extending `JpaRepository` or `CrudRepository`.
   - Encapsulates database queries.
4. **Domain Model (`group.four.nyare.nyare.model`)**:
   - JPA Entities and enums. Internal to persistence and service layers.

## 3. Package Structure

All subpackages are **strictly lowercase**:
- `group.four.nyare.nyare.controller`
- `group.four.nyare.nyare.service`
- `group.four.nyare.nyare.service.impl`
- `group.four.nyare.nyare.repository`
- `group.four.nyare.nyare.model`
- `group.four.nyare.nyare.model.enums`
- `group.four.nyare.nyare.dto`
- `group.four.nyare.nyare.exception`
