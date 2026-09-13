---
name: model-craft
description: Use when creating, enhancing, or refactoring Java entity models, applying JPA annotations, Bean Validation, getters, setters, constructors, JPA-safe identity methods, and Javadoc in the Models package.
---

# Model Craft

## Overview
Model Craft is a reference guide and standard for crafting robust, high-quality domain models in Spring Boot 4.x / Jakarta Persistence (JPA) / Hibernate using **vanilla Java 25**.

It establishes the 5 pillars for every model file in the `Models` package:
1. **Persistence Mappings**: Explicit Jakarta JPA annotations, column constraints, lazy relationship fetching, and JPA auditing.
2. **Bean Validation**: Input constraints (`@NotNull`, `@NotBlank`, `@Size`, etc.) enforcing domain invariants.
3. **Encapsulation & Accessors**: Pure Java getters, setters, defensive copies for mutable state/collections, and no-arg + parameterized constructors.
4. **JPA-Safe Identity**: Correct `equals()`, `hashCode()`, and `toString()` implementations that prevent lazy loading traps and recursion.
5. **Domain Javadoc**: Clear documentation of lifecycle, constraints, and relationships.

---

## 1. JPA & Persistence Annotations

### Entity & Table Declarations
- Always annotate entity classes with `@Entity` (`jakarta.persistence.Entity`).
- Use `@Table(name = "...")` with explicit snake_case table names when matching relational database schema conventions.
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
  @Column(name = "id", updatable = false, nullable = false)
  private UUID id;
  ```
- For auto-incrementing integer/long primary keys:
  ```java
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id", updatable = false, nullable = false)
  private Long id;
  ```

### Relationships & Foreign Keys
- **Default Fetch Strategy**: Default to `FetchType.LAZY` for `@ManyToOne` and `@OneToMany` to prevent N+1 queries.
- **Explicit Join Columns**: Always provide `@JoinColumn(name = "...", nullable = ...)` on the owning side of the relationship.
- **Collections**: For `@OneToMany` or `@ManyToMany`, initialize the collection to an empty `ArrayList` or `HashSet` to prevent null pointer exceptions.
- **Cascade Types**: Specify explicit `cascade = { CascadeType.PERSIST, CascadeType.MERGE }` only when parent-child lifecycle ownership demands it.

```java
@ManyToOne(fetch = FetchType.LAZY, optional = false)
@JoinColumn(name = "course_id", nullable = false)
private Course course;

@OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
private List<Schedule> schedules = new ArrayList<>();
```

### Enumerations
- Always map enums using `@Enumerated(EnumType.STRING)` to ensure schema readability and resilience against enum reordering:
```java
@Enumerated(EnumType.STRING)
@Column(name = "status", nullable = false, length = 32)
private TaskStatus status = TaskStatus.TODO;
```

### Auditing & Temporal Fields
- Use `Instant` or `LocalDateTime` for timestamps.
- Annotate with `@CreatedDate` / `@LastModifiedDate` (`org.springframework.data.annotation.*`).
```java
@CreatedDate
@Column(name = "created_at", nullable = false, updatable = false)
private Instant createdAt;

@LastModifiedDate
@Column(name = "updated_at")
private Instant updatedAt;
```

---

## 2. Bean Validation Constraints

Use Jakarta Bean Validation annotations (`jakarta.validation.constraints.*`) to enforce business rules before database operations:

| Constraint | Use Case | Example |
| :--- | :--- | :--- |
| `@NotNull` | Disallows null values on objects, numbers, enums, dates | `@NotNull(message = "Course is required")` |
| `@NotBlank` | String must not be null and must contain non-whitespace text | `@NotBlank(message = "Title cannot be blank")` |
| `@Size(min = ..., max = ...)` | Bounds string length or collection capacity | `@Size(max = 255, message = "Name exceeds 255 characters")` |
| `@Positive` / `@PositiveOrZero` | Numeric quantities, durations, or counts | `@PositiveOrZero` |
| `@Future` / `@FutureOrPresent` | Target deadlines or scheduled dates | `@FutureOrPresent` |
| `@Valid` | Cascade validation into nested entities / embeddables | `@Valid` |

---

## 3. Constructors & Accessors (Vanilla Java)

### Constructors
1. **No-Arg Constructor**: Always provide a `protected` (or `public`) no-arg constructor required by JPA proxy generation and reflection.
2. **Business/Required Constructor**: Provide a parameterized constructor containing required fields to allow clean domain object instantiation.

```java
protected Course() {
    // Required by JPA
}

public Course(String name, String description) {
    this.name = name;
    this.description = description;
}
```

### Getters & Setters
- Implement standard Java getter and setter methods.
- **Collection Defensive Copies & Helpers**: When exposing collections, return an unmodifiable view and provide helper methods to maintain bidirectional links:
```java
public List<Schedule> getSchedules() {
    return Collections.unmodifiableList(schedules);
}

public void addSchedule(Schedule schedule) {
    schedules.add(schedule);
    schedule.setCourse(this);
}

public void removeSchedule(Schedule schedule) {
    schedules.remove(schedule);
    schedule.setCourse(null);
}
```

---

## 4. JPA-Safe Identity (`equals`, `hashCode`, `toString`)

### Rules for `equals()` and `hashCode()`
- **Never** use raw field-based equality across all fields or generated UUIDs if entities can be transient (unpersisted).
- Use **Proxy-Safe Type Comparison** (`getClass() != o.getClass() || Hibernate.getClass(this) != Hibernate.getClass(o)`).
- For database-generated keys, compare the primary key `id` only when both objects have a non-null ID.
- Maintain a **constant hashCode** (or class-based hashCode) for entities whose IDs are assigned upon persist, guaranteeing hash consistency across `EntityManager` states.

```java
@Override
public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    Course course = (Course) o;
    return id != null && id.equals(course.id);
}

@Override
public int hashCode() {
    return getClass().hashCode();
}
```

### Rules for `toString()`
- **Never** include lazy-loaded relationships (`@ManyToOne`, `@OneToMany`, `@ManyToMany`) in `toString()` to avoid `LazyInitializationException` and infinite circular recursion.
- Print only scalar fields (`id`, `name`, `status`, dates):

```java
@Override
public String toString() {
    return "Course{" +
            "id=" + id +
            ", name='" + name + '\'' +
            ", description='" + description + '\'' +
            '}';
}
```

---

## 5. Domain Javadoc & Comments

Document the class and critical fields using Javadoc syntax:
- **Class Javadoc**: Purpose of the entity in the Nyare domain model, relationship to parent courses/notes/schedules.
- **Field Comments**: Units of measure (e.g. `Duration` in minutes), format constraints (e.g. TipTap JSON string), and scheduling flexibility vs rigid constraints.

```java
/**
 * Represents an academic subject or course offering.
 * Contains associated class schedules, journal notes, tasks, events, and context.
 */
@Entity
@Table(name = "courses")
public class Course { ... }
```

---

## 6. Step-by-Step Enhancement Checklist

When modifying any file in the `Models` package, execute these steps in order:

- [ ] **1. Package & Imports**: Verify imports come from `jakarta.persistence.*`, `jakarta.validation.constraints.*`, and `org.springframework.data.annotation.*`. Ensure no `org.springframework.data.annotation.Id` is used on JPA entities.
- [ ] **2. Class Annotations**: Add `@Entity`, `@Table`, and `@EntityListeners(AuditingEntityListener.class)` (if audited).
- [ ] **3. Primary Key**: Configure `@Id`, `@GeneratedValue`, and `@Column(updatable = false, nullable = false)`.
- [ ] **4. Fields & Relationships**:
  - Add explicit `@Column` definitions with `nullable`, `length`, and snake_case names.
  - Apply `@NotNull`, `@NotBlank`, `@Size`, etc.
  - Map relationships with `fetch = FetchType.LAZY` and `@JoinColumn`.
  - Annotate enums with `@Enumerated(EnumType.STRING)`.
- [ ] **5. Constructors**: Add protected no-arg constructor and domain constructor(s).
- [ ] **6. Getters & Setters**: Add standard getters/setters and defensive collection helper methods.
- [ ] **7. Identity Methods**: Implement proxy-safe `equals()`, constant `hashCode()`, and recursion-free `toString()`.
- [ ] **8. Javadoc**: Document class purpose, fields, and constraints.
- [ ] **9. Verification**: Run IntelliJ MCP diagnostics (`get_file_problems`) or `./gradlew compileJava` to confirm zero compilation errors.

---

## 7. Canonical Reference Example

### Before (Raw Scaffold)
```java
package group.four.nyare.nyare.Models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;

@Entity
public class Course {
    @Id
    @GeneratedValue
    private int id;
    private String name;
    private String description;
}
```

### After (Standardized with Model Craft)
```java
package group.four.nyare.nyare.Models;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.Objects;

/**
 * Represents an academic course or subject offering.
 * Acts as the aggregate root for schedules, notes, tasks, events, and academic context.
 */
@Entity
@Table(name = "courses")
@EntityListeners(AuditingEntityListener.class)
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @NotBlank(message = "Course name is required")
    @Size(max = 128, message = "Course name cannot exceed 128 characters")
    @Column(name = "name", nullable = false, length = 128)
    private String name;

    @Size(max = 1024, message = "Course description cannot exceed 1024 characters")
    @Column(name = "description", length = 1024)
    private String description;

    /**
     * Protected default constructor for JPA proxies.
     */
    protected Course() {
    }

    /**
     * Creates a new Course with required details.
     *
     * @param name        the name of the course
     * @param description optional description or course overview
     */
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
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Course course = (Course) o;
        return id != null && id.equals(course.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "Course{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", description='" + description + '\'' +
                '}';
    }
}
```

---

## 8. Common Mistakes & Anti-Patterns

| Anti-Pattern | Why It Breaks | Correct Pattern |
| :--- | :--- | :--- |
| `import org.springframework.data.annotation.Id;` | Breaks JPA entity mapping; Spring Data ignores JPA generation. | `import jakarta.persistence.Id;` |
| Default `FetchType.EAGER` | Generates massive N+1 query joins on relational traversals. | Specify `fetch = FetchType.LAZY`. |
| Bidirectional `toString()` / `hashCode()` recursion | Causes `StackOverflowError` when logging or adding entities to Sets. | Include only scalar fields in `toString()`; use class-based `hashCode()`. |
| Missing `@Enumerated(EnumType.STRING)` | Enums default to ordinal integers; inserting/reordering enums corrupts DB data. | Always add `@Enumerated(EnumType.STRING)`. |
| Missing protected no-arg constructor | Hibernate cannot instantiate entity proxies dynamically. | Always include a `protected ModelName() {}`. |
| Direct mutable collection setter (`setItems(List)`) | Detaches Hibernate's managed persistent collection wrapper. | Mutate collection in-place (`clear()` + `addAll()`) or use helper methods. |
