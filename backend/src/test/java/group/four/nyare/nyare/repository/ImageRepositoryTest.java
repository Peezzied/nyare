package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Image;
import group.four.nyare.nyare.model.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class ImageRepositoryTest {

    @Autowired
    private ImageRepository imageRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Save and retrieve image binary")
    void saveAndFindImage() {
        User user = userRepository.save(new User("image_repo_user"));
        byte[] data = new byte[]{1, 2, 3, 4};
        Image image = new Image(data, "image/png", "test.png", 4L, user);
        Image saved = imageRepository.save(image);

        Optional<Image> found = imageRepository.findById(saved.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getContentType()).isEqualTo("image/png");
        assertThat(found.get().getData()).isEqualTo(data);
    }
}
