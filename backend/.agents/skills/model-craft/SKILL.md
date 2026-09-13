---
name: model-craft
description: Use when creating, enhancing, or refactoring Java entity models, applying JPA annotations, Bean Validation, getters, setters, constructors, and Javadoc in the model package.
---

# Model Craft

## Overview
Model Craft is a reference guide and standard for crafting robust, high-quality, and lean domain models in Spring Boot 4.x / Jakarta Persistence (JPA) / Hibernate using **vanilla Java 25**.

It establishes the 5 pillars for every entity in the `group.four.nyare.nyare.model` package:
1. **Persistence Mappings**: Standard Jakarta JPA annotations, lazy relationship fetching, and JPA auditing. Rely on Hibernate's default naming strategy—do NOT manually specify column names.
2. **Bean Validation**: Input constraints (`@NotNull`, `@NotBlank`, `@Size`, etc.) enforcing domain invariants.
3. **Encapsulation & Accessors**: Pure Java getters, setters, protected no-arg constructor (for JPA proxies), and domain constructors.
4. **YAGNI Identity**: Rely on standard Java `Object.equals()` and `hashCode()` (identity equality `==`). Do not write boilerplate `equals`/`hashCode` methods. Scalar-only `toString()` is optional.
5. **Domain Javadoc**: Clear documentation of lifecycle, constraints, and relationships.

---

## 1. JPA & Persistence Annotations

### Entity & Table Declarations
- Always annotate entity classes with `@Entity` (`jakarta.persistence.Entity`).
- Use `@Table(name = "...")` only when mapping to a specific plural table name (e.g., `@Table(name = "courses")`).
- When entity auditing is used (`@CreatedDate`, `@LastModifiedDate`), always add `@EntityListeners(AuditingEntityListener.class)` to the class.

```java
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Table;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "courses")
@EntityListeners(AuditingEntityListener.class)
public class Course {
    // ...
}
```

### Primary Key Mappings
- **Important Import Rule**: Always import `jakarta.persistence.Id` and `jakarta.persistence.GeneratedValue`. **Never** import `org.springframework.data.annotation.Id` for JPA entities.
- For `UUID` primary keys:
  ```java
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(updatable = false, nullable = false)
  private UUID id;
  ```
- For auto-incrementing integer/long primary keys:
  ```java
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(updatable = false, nullable = false)
  private Long id;
  ```

### Naming Strategy (No Manual Column Names)
- Hibernate automatically maps `camelCase` field names to `snake_case` database columns (`scheduledDate` $\rightarrow$ `scheduled_date`, `createdAt` $\rightarrow$ `created_at`).
- **Do not manually specify `name = "..."` on `@Column`**. Only use `@Column` to set constraints:
  ```java
  @Column(nullable = false, length = 128)
  private String name;
  ```

### Relationships & Foreign Keys
- **Default Fetch Strategy**: Always use `FetchType.LAZY` for `@ManyToOne` and `@OneToMany` to prevent N+1 queries.
- **Join Columns**: Provide `@JoinColumn(nullable = false)` without redundant manual `name` unless necessary.
- **Cascades**: Unidirectional `@ManyToOne` is preferred. Avoid complex bidirectional collections unless required by parent aggregate lifecycle.

```java
@ManyToOne(fetch = FetchType.LAZY, optional = false)
@JoinColumn(nullable = false)
private Course course;
```

### Enumerations
- Always map enums using `@Enumerated(EnumType.STRING)`:
```java
@Enumerated(EnumType.STRING)
@Column(nullable = false, length = 32)
private TaskStatus status = TaskStatus.TODO;
```

### Auditing & Temporal Fields
- Use `Instant` for timestamps.
- Annotate with `@CreatedDate` / `@LastModifiedDate` (`org.springframework.data.annotation.*`).
```java
@CreatedDate
@Column(nullable = false, updatable = false)
private Instant createdAt;

@LastModifiedDate
private Instant updatedAt;
```

---

## 2. Bean Validation Constraints

Use Jakarta Bean Validation annotations (`jakarta.validation.constraints.*`) to enforce business rules before database operations:

| Constraint | Use Case | Example |
| :--- | :--- | :--- |
| `@NotNull` | Non-nullable references / IDs / enums | `@NotNull(message = "Course is required")` |
| `@NotBlank` | String that must contain non-whitespace text | `@NotBlank(message = "Title is required")` |
| `@Size` | String length bounds matching DB column bounds | `@Size(max = 255, message = "Title cannot exceed 255 chars")` |

---

## 3. Constructors & Accessors

- **Protected No-Arg Constructor**: Always provide `protected EntityName() {}` for JPA proxy instantiation.
- **Domain Constructor**: Provide parameterized constructors for required fields.
- **Standard Getters and Setters**: Pure Java accessors without Lombok or code generators.

---

## 4. YAGNI Identity (No `equals()` / `hashCode()` Bloat)

- In Nyare, entities remain strictly inside the `@Transactional` service layer. They are never placed into detached `Set` collections across persistence sessions.
- Hibernate's persistence context guarantees instance identity (`==`) within the transaction.
- **Do not write custom `equals()` and `hashCode()` implementations.** Rely on standard Java `Object.equals()` and `Object.hashCode()`.
- **Optional `toString()`**: If implemented for debugging, include only scalar fields (`id`, `title`, `status`) and **never** lazy associations.

---

## 5. Domain Javadoc

Document the class and critical domain concepts using Javadoc:
```java
/**
 * Represents an academic subject or course offering.
 * Acts as the aggregate root for schedules, notes, tasks, events, and academic context.
 */
@Entity
@Table(name = "courses")
public class Course { ... }
```

---

## 6. Canonical Reference Example

```java
package group.four.nyare.nyare.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Represents an academic course or subject offering.
 */
@Entity
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, updatable = false)
    private Long id;

    @NotBlank(message = "Course name is required")
    @Size(max = 128, message = "Course name cannot exceed 128 characters")
    @Column(nullable = false, length = 128)
    private String name;

    @Size(max = 1024, message = "Course description cannot exceed 1024 characters")
    @Column(length = 1024)
    private String description;

    protected Course() {
    }

    public Course(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    @Override
    public String toString() {
        return "Course{" +
                "id=" + id +
                ", name='" + name + '\'' +
                '}';
    }
}
```
