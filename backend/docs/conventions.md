# Nyare Backend Conventions and Standards (Index)

This document is the root directory for Nyare backend design patterns and conventions. Consult the modular guides below:

1. [Architecture & Layering](conventions/architecture.md) — Layer isolation rules and package structure.
2. [Domain Entities](conventions/entities.md) — JPA rules, UUIDs, auditing fields, LAZY fetching.
3. [DTOs & Validation](conventions/dtos-and-validation.md) — Request/Response POJOs and Jakarta Validation.
4. [Services & Transactions](conventions/services-and-tx.md) — Interface/impl pattern and `@Transactional` boundaries.
5. [Canonical Exceptions](conventions/exceptions.md) — No custom exception explosion policy and RFC 7807 matrix.
6. [REST API & Controllers](conventions/controllers-and-rest.md) — Paths, verbs, status codes, and unversioned endpoints.
7. [Persistence & SQLite](conventions/persistence-sqlite.md) — Hikari pool settings and open-in-view rules.
8. [Testing Standards](conventions/testing-standards.md) — Unit, WebMvc, and DataJpa test slices.
