package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.AcademicEvent;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class AcademicEventRepositoryTest {

    @Autowired
    private AcademicEventRepository academicEventRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    private User user1;
    private User user2;
    private Course course1;
    private Course course2;

    @BeforeEach
    void setUp() {
        user1 = userRepository.save(new User("user1_" + UUID.randomUUID()));
        user2 = userRepository.save(new User("user2_" + UUID.randomUUID()));
        course1 = courseRepository.save(new Course("CS101", "Intro to CS", user1));
        course2 = courseRepository.save(new Course("CS202", "Data Structures", user2));
    }

    @Test
    @DisplayName("findAllFiltered isolates academic events between different users")
    void findAllFiltered_isolatesEventsBetweenUsers() {
        LocalDateTime deadline = LocalDateTime.now().plusDays(3);
        AcademicEvent event1 = academicEventRepository.save(
                new AcademicEvent(course1, "User 1 Exam", deadline)
        );
        AcademicEvent event2 = academicEventRepository.save(
                new AcademicEvent(course2, "User 2 Exam", deadline)
        );

        List<AcademicEvent> user1Events = academicEventRepository.findAllFiltered(
                user1.getId(), null, null, null
        );
        List<AcademicEvent> user2Events = academicEventRepository.findAllFiltered(
                user2.getId(), null, null, null
        );

        assertThat(user1Events).extracting(AcademicEvent::getId).containsExactly(event1.getId());
        assertThat(user2Events).extracting(AcademicEvent::getId).containsExactly(event2.getId());
    }

    @Test
    @DisplayName("findAllFiltered filters by course and upcoming flag")
    void findAllFiltered_filtersByCourseAndUpcoming() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime past = now.minusDays(2);
        LocalDateTime future1 = now.plusDays(1);
        LocalDateTime future2 = now.plusDays(5);

        Course course1b = courseRepository.save(new Course("CS103", "Algorithms", user1));

        AcademicEvent pastEvent = academicEventRepository.save(
                new AcademicEvent(course1, "Past Quiz", past)
        );
        AcademicEvent upcomingEvent1 = academicEventRepository.save(
                new AcademicEvent(course1, "Midterm Exam", future1)
        );
        AcademicEvent upcomingEvent2 = academicEventRepository.save(
                new AcademicEvent(course1b, "Final Project", future2)
        );

        List<AcademicEvent> allUser1Events = academicEventRepository.findAllFiltered(
                user1.getId(), null, null, now
        );
        assertThat(allUser1Events).extracting(AcademicEvent::getId)
                .containsExactly(pastEvent.getId(), upcomingEvent1.getId(), upcomingEvent2.getId());

        List<AcademicEvent> upcomingUser1Events = academicEventRepository.findAllFiltered(
                user1.getId(), null, true, now
        );
        assertThat(upcomingUser1Events).extracting(AcademicEvent::getId)
                .containsExactly(upcomingEvent1.getId(), upcomingEvent2.getId());

        List<AcademicEvent> upcomingCourse1Events = academicEventRepository.findAllFiltered(
                user1.getId(), course1.getId(), true, now
        );
        assertThat(upcomingCourse1Events).extracting(AcademicEvent::getId)
                .containsExactly(upcomingEvent1.getId());
    }
}
