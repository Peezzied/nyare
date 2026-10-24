package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.LoginRequest;
import group.four.nyare.nyare.dto.UserRequest;
import group.four.nyare.nyare.dto.UserResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.User;
import group.four.nyare.nyare.repository.UserRepository;
import group.four.nyare.nyare.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserServiceImpl userService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new User("alice");
        ReflectionTestUtils.setField(sampleUser, "id", 1L);
        ReflectionTestUtils.setField(sampleUser, "createdAt", Instant.now());
        ReflectionTestUtils.setField(sampleUser, "updatedAt", Instant.now());
    }

    @Test
    @DisplayName("createUser returns response when request is valid")
    void createUser_withValidRequest_returnsResponse() {
        // given
        UserRequest request = new UserRequest("alice");
        when(userRepository.existsByUsername("alice")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        // when
        UserResponse response = userService.createUser(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getUsername()).isEqualTo("alice");
    }

    @Test
    @DisplayName("createUser throws BadRequestException when username already exists")
    void createUser_withDuplicateUsername_throwsBadRequestException() {
        // given
        UserRequest request = new UserRequest("alice");
        when(userRepository.existsByUsername("alice")).thenReturn(true);

        // when & then
        assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Username already exists: alice");
    }

    @Test
    @DisplayName("listUsers returns all users mapped to responses")
    void listUsers_returnsAllUsers() {
        // given
        when(userRepository.findAll()).thenReturn(List.of(sampleUser));

        // when
        List<UserResponse> users = userService.listUsers();

        // then
        assertThat(users).hasSize(1);
        assertThat(users.get(0).getUsername()).isEqualTo("alice");
    }

    @Test
    @DisplayName("getUserById returns user when ID exists")
    void getUserById_withValidId_returnsResponse() {
        // given
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));

        // when
        UserResponse response = userService.getUserById(1L);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("getUserById throws ResourceNotFoundException when ID is unknown")
    void getUserById_withUnknownId_throwsResourceNotFoundException() {
        // given
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> userService.getUserById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found with ID: 99");
    }

    @Test
    @DisplayName("deleteUser removes user when ID exists")
    void deleteUser_withValidId_deletesUser() {
        // given
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));

        // when
        userService.deleteUser(1L);

        // then
        verify(userRepository).delete(sampleUser);
    }

    @Test
    @DisplayName("deleteUser throws ResourceNotFoundException when ID is unknown")
    void deleteUser_withUnknownId_throwsResourceNotFoundException() {
        // given
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> userService.deleteUser(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found with ID: 99");
    }

    @Test
    @DisplayName("authenticate returns user response when username exists")
    void authenticate_withValidUsername_returnsResponse() {
        // given
        LoginRequest request = new LoginRequest("alice");
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(sampleUser));

        // when
        UserResponse response = userService.authenticate(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getUsername()).isEqualTo("alice");
    }

    @Test
    @DisplayName("authenticate throws ResourceNotFoundException when username is unknown")
    void authenticate_withUnknownUsername_throwsResourceNotFoundException() {
        // given
        LoginRequest request = new LoginRequest("unknown");
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> userService.authenticate(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found with username: unknown");
    }
}
