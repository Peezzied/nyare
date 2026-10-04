package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.Task;
import group.four.nyare.nyare.model.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("findByUsername returns user when username exists")
    void findByUsername_whenUserExists_returnsUser() {
        // given
        User user = new User("alice");
        entityManager.persistAndFlush(user);

        // when
        Optional<User> found = userRepository.findByUsername("alice");

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getUsername()).isEqualTo("alice");
        assertThat(found.get().getId()).isNotNull();
    }

    @Test
    @DisplayName("existsByUsername returns true when user exists")
    void existsByUsername_whenUserExists_returnsTrue() {
        // given
        User user = new User("bob");
        entityManager.persistAndFlush(user);

        // when
        boolean exists = userRepository.existsByUsername("bob");

        // then
        assertThat(exists).isTrue();
    }

    @Test
    @DisplayName("existsByUsername returns false when user does not exist")
    void existsByUsername_whenUserDoesNotExist_returnsFalse() {
        // when
        boolean exists = userRepository.existsByUsername("charlie");

        // then
        assertThat(exists).isFalse();
    }

    @Test
    @DisplayName("deleteUser cascades to courses, tasks, and notes")
    void deleteUser_cascadesToCourses() {
        // given
        User user = new User("david");
        entityManager.persist(user);

        Course course = new Course("CS101", "Computer Science", user);
        user.getCourses().add(course);
        entityManager.persist(course);

        Task task = new Task(course, "Read chapter 1");
        course.getTasks().add(task);
        entityManager.persist(task);

        Note note = new Note(course, "Class notes");
        course.getNotes().add(note);
        entityManager.persist(note);

        entityManager.flush();
        entityManager.clear();

        // when
        User managedUser = entityManager.find(User.class, user.getId());
        userRepository.delete(managedUser);
        entityManager.flush();
        entityManager.clear();

        // then
        assertThat(userRepository.findById(user.getId())).isEmpty();
        assertThat(entityManager.find(Course.class, course.getId())).isNull();
        assertThat(entityManager.find(Task.class, task.getId())).isNull();
        assertThat(entityManager.find(Note.class, note.getId())).isNull();
    }
}
