package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.dto.LoginRequest;
import group.four.nyare.nyare.dto.NoteRequest;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Image;
import group.four.nyare.nyare.model.User;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.ImageRepository;
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.ObjectMapper;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class NoteImageReferenceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private ImageRepository imageRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void cleanDatabase() {
        noteRepository.deleteAll();
        imageRepository.deleteAll();
        courseRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("note image references are validated against stored images")
    void createNote_imageReferences_validatesAgainstStoredImages() throws Exception {
        // given: a persisted image with a known UUID
        Image image = imageRepository.save(new Image(new byte[]{1, 2, 3}, "image/png", "slide.png", 3L));
        UUID existingImageId = image.getId();

        // given: a user + course, logged in for a session
        User user = userRepository.save(new User("ref_user"));
        Course course = courseRepository.save(new Course("CS 1", "Intro", user));
        MockHttpSession session = login("ref_user");

        // when/then: dangling reference -> 400 RFC 7807
        UUID randomImageId = UUID.randomUUID();
        NoteRequest badRequest = new NoteRequest(course.getId(), "see ![x](/api/images/" + randomImageId + ")");
        mockMvc.perform(post("/api/notes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badRequest))
                        .session(session))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail", containsString("unknown image")))
                .andExpect(jsonPath("$.detail", containsString(randomImageId.toString())));

        // when/then: existing reference -> 201 Created, note persisted
        NoteRequest goodRequest = new NoteRequest(course.getId(), "see ![x](/api/images/" + existingImageId + ")");
        MvcResult createResult = mockMvc.perform(post("/api/notes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(goodRequest))
                        .session(session))
                .andExpect(status().isCreated())
                .andReturn();

        String location = createResult.getResponse().getHeader("Location");
        assertThat(location).isNotNull();

        // then: GET /api/notes/{id} returns the stored markdown
        String noteId = location.replace("/api/notes/", "");
        mockMvc.perform(get("/api/notes/" + noteId).session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", containsString(existingImageId.toString())));
    }

    private MockHttpSession login(String username) throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(username))))
                .andExpect(status().isOk())
                .andReturn();
        return (MockHttpSession) loginResult.getRequest().getSession();
    }
}