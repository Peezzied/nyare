# Verification & Testing Standards

## 1. Test Slices

1. **Service Tests**: Pure unit tests with JUnit 5 + Mockito (`@ExtendWith(MockitoExtension.class)`). Fast, in-memory, no Spring context.
2. **Controller Tests**: `@WebMvcTest` + `MockMvc` verifying HTTP routing, Bean Validation, status codes, and JSON responses.

## 2. Mocking & Service Interface Conventions

- **Controller Tests (`@WebMvcTest`)**: Always mock service dependencies using `@MockitoBean` targeting the **service interface** (`XxxService`), never the concrete implementation class (`XxxServiceImpl`).
- **Service Unit Tests (`@ExtendWith(MockitoExtension.class)`)**:
  - Mock repository and external dependencies using `@Mock` against their interfaces.
  - Inject mocks into the concrete implementation using `@InjectMocks private XxxServiceImpl service;` or direct constructor instantiation (`new XxxServiceImpl(repositoryMock, ...)`).
  - Type the test subject or interface interactions cleanly against interface contracts.

### Controller Test Example (`@MockitoBean` on Interface)
```java
@WebMvcTest(CourseController.class)
class CourseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CourseService courseService; // Target interface, not CourseServiceImpl

    @Test
    void getCourse_withValidId_returnsCourse() throws Exception {
        // given
        when(courseService.getCourse(1L)).thenReturn(sampleResponse);

        // when & then
        mockMvc.perform(get("/api/courses/1"))
                .andExpect(status().isOk());
    }
}
```

### Service Unit Test Example (`@Mock` and `@InjectMocks`)
```java
@ExtendWith(MockitoExtension.class)
class CourseServiceImplTest {

    @Mock
    private CourseRepository courseRepository;

    @InjectMocks
    private CourseServiceImpl courseService; // Concrete impl under test

    @Test
    void getCourse_withValidId_returnsResponse() {
        // given
        when(courseRepository.findById(1L)).thenReturn(Optional.of(sampleCourse));

        // when
        CourseResponse response = courseService.getCourse(1L);

        // then
        assertThat(response).isNotNull();
    }
}
```

## 3. Test Conventions

- Assertions: AssertJ (`assertThat(...)`).
- Structure: `// given`, `// when`, `// then`.
- Naming: `methodName_condition_expectedBehavior` (e.g. `createEvent_withInvalidCourse_throwsResourceNotFoundException`).

