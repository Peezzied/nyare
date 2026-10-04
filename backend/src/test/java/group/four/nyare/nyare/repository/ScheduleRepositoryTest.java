package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Schedule;
import group.four.nyare.nyare.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class ScheduleRepositoryTest {

    @Autowired
    private ScheduleRepository scheduleRepository;

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
    @DisplayName("findAllFiltered isolates schedules between different users")
    void findAllFiltered_isolatesSchedulesBetweenUsers() {
        Schedule schedule1 = scheduleRepository.save(
                new Schedule(course1, DayOfWeek.MONDAY, LocalTime.of(9, 0), LocalTime.of(10, 30))
        );
        Schedule schedule2 = scheduleRepository.save(
                new Schedule(course2, DayOfWeek.MONDAY, LocalTime.of(11, 0), LocalTime.of(12, 30))
        );

        List<Schedule> user1Schedules = scheduleRepository.findAllFiltered(user1.getId(), null);
        List<Schedule> user2Schedules = scheduleRepository.findAllFiltered(user2.getId(), null);

        assertThat(user1Schedules).extracting(Schedule::getId).containsExactly(schedule1.getId());
        assertThat(user2Schedules).extracting(Schedule::getId).containsExactly(schedule2.getId());
    }

    @Test
    @DisplayName("findAllFiltered filters by course ID and orders chronologically")
    void findAllFiltered_filtersByCourseAndOrdersChronologically() {
        Course course1b = courseRepository.save(new Course("CS103", "Algorithms", user1));

        Schedule s1 = scheduleRepository.save(
                new Schedule(course1, DayOfWeek.WEDNESDAY, LocalTime.of(10, 0), LocalTime.of(11, 30))
        );
        Schedule s2 = scheduleRepository.save(
                new Schedule(course1, DayOfWeek.MONDAY, LocalTime.of(9, 0), LocalTime.of(10, 30))
        );
        Schedule s3 = scheduleRepository.save(
                new Schedule(course1b, DayOfWeek.FRIDAY, LocalTime.of(14, 0), LocalTime.of(15, 30))
        );

        List<Schedule> course1Schedules = scheduleRepository.findAllFiltered(user1.getId(), course1.getId());
        assertThat(course1Schedules).extracting(Schedule::getId).containsExactlyInAnyOrder(s1.getId(), s2.getId());

        List<Schedule> allUser1Schedules = scheduleRepository.findAllFiltered(user1.getId(), null);
        assertThat(allUser1Schedules).extracting(Schedule::getId).containsExactlyInAnyOrder(s1.getId(), s2.getId(), s3.getId());
    }
}
