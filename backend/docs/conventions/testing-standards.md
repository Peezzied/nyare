# Verification & Testing Standards

## 1. Test Slices

1. **Service Tests**: Pure unit tests with JUnit 5 + Mockito (`@ExtendWith(MockitoExtension.class)`). Fast, in-memory, no Spring context.
2. **Controller Tests**: `@WebMvcTest` + `MockMvc` verifying HTTP routing, Bean Validation, status codes, and JSON responses.
3. **Repository Tests**: `@DataJpaTest` verifying custom JPQL queries and database constraints.

## 2. Test Conventions

- Assertions: AssertJ (`assertThat(...)`).
- Structure: `// given`, `// when`, `// then`.
- Naming: `methodName_condition_expectedBehavior` (e.g. `createEvent_withInvalidCourse_throwsResourceNotFoundException`).
