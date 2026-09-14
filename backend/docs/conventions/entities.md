# Domain Entity Guidelines

## 1. Identifier Strategy

- **`Course`**: `Long` with `@GeneratedValue(strategy = GenerationType.IDENTITY)`.
- **`Task`**, **`Note`**, **`AcademicEvent`**, **`AcademicContext`**: `UUID` with `@GeneratedValue(strategy = GenerationType.UUID)`.

## 2. Naming & Column Annotations

- Hibernate's `CamelCaseToUnderscoresNamingStrategy` maps fields automatically:
  - `createdAt` $\rightarrow$ `created_at`
  - `scheduledDate` $\rightarrow$ `scheduled_date`
  - `courseId` $\rightarrow$ `course_id`
- **Do not** write redundant `name = "..."` on `@Column`.
- Use `@Column` only for DB constraints (e.g. `@Column(nullable = false, length = 255)`).

## 3. Auditing Fields

Entities tracking creation/modification timestamps must include:
```java
@CreatedDate
@Column(nullable = false, updatable = false)
private Instant createdAt;

@LastModifiedDate
private Instant updatedAt;
```
Annotate the entity class with `@EntityListeners(AuditingEntityListener.class)`.

## 4. Association Fetching

- All `@ManyToOne` and `@OneToMany` associations must declare `fetch = FetchType.LAZY`.
- Lazy associations are traversed inside `@Transactional` service methods (`spring.jpa.open-in-view=false`).

## 5. Identity & Lifecycle

- Rely on default `Object.equals()` and `hashCode()` (instance identity). Do not write custom `equals`/`hashCode` overrides on entities.
- `StudyPlan` is a virtual UI construct; **never** create a table or entity for it.
- Deadlines (`AcademicEvent.deadline`) are fixed rigid constraints; task dates (`Task.scheduledDate`) are flexible suggestions (`null` = Later).
