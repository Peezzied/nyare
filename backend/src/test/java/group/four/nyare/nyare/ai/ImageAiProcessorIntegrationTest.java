package group.four.nyare.nyare.ai;

import group.four.nyare.nyare.NyareApplication;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Image;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.ImageRepository;
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.repository.TaskRepository;
import group.four.nyare.nyare.service.StudyPlannerService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(classes = NyareApplication.class)
public class ImageAiProcessorIntegrationTest {

    @Autowired(required = false)
    private ImageAiProcessor imageAiProcessor;

    @Autowired
    private StudyPlannerService studyPlannerService;

    @Autowired
    private ImageRepository imageRepository;

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private group.four.nyare.nyare.repository.AcademicEventRepository academicEventRepository;

    @Autowired
    private group.four.nyare.nyare.repository.AcademicContextRepository academicContextRepository;

    @org.junit.jupiter.api.BeforeEach
    void cleanDatabase() {
        academicContextRepository.deleteAll();
        academicEventRepository.deleteAll();
        taskRepository.deleteAll();
        noteRepository.deleteAll();
        imageRepository.deleteAll();
        courseRepository.deleteAll();
    }

    @Test
    @DisplayName("Verify ImageAiProcessor bean is loaded into Spring Application Context")
    void verifyImageAiProcessorBeanLoads() {
        assertThat(imageAiProcessor).isNotNull();
    }

    @Test
    @DisplayName("describeImage processes synthetic academic diagram image and returns description")
    void describeImage_processesSyntheticImage() throws IOException {
        assertThat(imageAiProcessor).isNotNull();

        byte[] imageBytes = createSyntheticNoteImage("CS201 Algorithm: Binary Tree Traversal. Time Complexity: O(n).");

        String description = imageAiProcessor.describeImage(imageBytes, "image/png");

        assertThat(description).isNotBlank();
        assertThat(description.toLowerCase()).containsAnyOf("binary", "tree", "traversal", "algorithm", "cs201", "o(n)", "complexity");
    }

    @Test
    @DisplayName("End-to-end: processNotes updates missing Image description in database and extracts study items")
    void processNotes_endToEnd_updatesImageMetadataAndExtractsPlan() throws IOException {
        // Given: Seed course
        Course course = courseRepository.save(new Course("Data Structures", "Core CS"));

        // Given: Create synthetic image with handwritten note text
        byte[] imageBytes = createSyntheticNoteImage("Important: Submit Lab Report 3 before Friday midnight.");
        Image image = new Image(imageBytes, "image/png", "lab3_notice.png", imageBytes.length);
        // description is intentionally null
        Image savedImage = imageRepository.save(image);
        assertThat(savedImage.getDescription()).isNull();

        // Given: Seed note referencing the image
        String noteContent = "Instructor showed this slide today in class:\n\n![Lab Notice](/api/images/" + savedImage.getId() + ")";
        Note note = new Note(course, noteContent);
        noteRepository.save(note);

        LocalDate today = LocalDate.now();

        // When: Trigger study planner note processing
        studyPlannerService.processNotes(today);

        // Then: Image description is now populated in database
        Image reloadedImage = imageRepository.findById(savedImage.getId()).orElseThrow();
        assertThat(reloadedImage.getDescription()).isNotBlank();
        assertThat(reloadedImage.getDescription().toLowerCase()).containsAnyOf("lab", "report", "friday", "submit", "notice");

        // Then: Note is marked as processed
        Note reloadedNote = noteRepository.findById(note.getId()).orElseThrow();
        assertThat(reloadedNote.getLastProcessedAt()).isNotNull();
    }

    private byte[] createSyntheticNoteImage(String text) throws IOException {
        int width = 600;
        int height = 200;
        BufferedImage bufferedImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = bufferedImage.createGraphics();

        // White background
        g2d.setColor(Color.WHITE);
        g2d.fillRect(0, 0, width, height);

        // Black text
        g2d.setColor(Color.BLACK);
        g2d.setFont(new Font("SansSerif", Font.BOLD, 20));
        g2d.drawString(text, 20, 100);
        g2d.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(bufferedImage, "png", baos);
        return baos.toByteArray();
    }
}
