# Service & Transaction Guidelines

## 1. Interface + Implementation Structure

- Define business contracts in `service/XxxService.java`.
- Implement business logic in `service/impl/XxxServiceImpl.java` annotated with `@Service`.

## 2. Dependency Injection Standards

- **Constructor Injection**: All dependencies (repositories, other services) must be declared as `private final` fields and injected via an explicit constructor.
- **No Field Injection**: Avoid `@Autowired` on private fields so service implementations can be directly instantiated in unit tests without Spring context or reflection overhead.

## 3. Transaction Demarcation

- Class-level: `@Transactional(readOnly = true)` to optimize read operations and disable unnecessary Hibernate dirty checks.
- Mutating methods (`create`, `update`, `delete`): explicitly annotate with `@Transactional`.

```java
@Service
@Transactional(readOnly = true)
public class AcademicEventServiceImpl implements AcademicEventService {

    private final AcademicEventRepository academicEventRepository;
    private final CourseRepository courseRepository;

    public AcademicEventServiceImpl(AcademicEventRepository academicEventRepository,
                                   CourseRepository courseRepository) {
        this.academicEventRepository = academicEventRepository;
        this.courseRepository = courseRepository;
    }

    @Override
    @Transactional
    public AcademicEventResponse createEvent(AcademicEventRequest request) { ... }

    @Override
    public List<AcademicEventResponse> listEvents(Long courseId, Boolean upcoming) { ... }
}
```

## 4. Boundary & Error Encapsulation

- Services validate incoming references (e.g. verifying `courseId` or `noteId` exists and belongs to course).
- Throw domain runtime exceptions (`ResourceNotFoundException`, `BadRequestException`).
- Services must **never** return HTTP status codes, `ResponseEntity`, or `ProblemDetail` directly.
