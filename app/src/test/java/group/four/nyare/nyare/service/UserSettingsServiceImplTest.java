package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.UserSettingsRequest;
import group.four.nyare.nyare.dto.UserSettingsResponse;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.User;
import group.four.nyare.nyare.repository.UserRepository;
import group.four.nyare.nyare.service.impl.UserSettingsServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserSettingsServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserSettingsServiceImpl userSettingsService;

    private static final Long USER_ID = 1L;

    @Test
    @DisplayName("getSettings returns the persisted horizon values of the user")
    void getSettings_existingUser_returnsPersistedHorizons() {
        // given
        User user = new User("alice");
        user.setPlanningHorizonDays(21);
        user.setBackdatingHorizonDays(30);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        // when
        UserSettingsResponse response = userSettingsService.getSettings(USER_ID);

        // then
        assertThat(response.getPlanningHorizonDays()).isEqualTo(21);
        assertThat(response.getBackdatingHorizonDays()).isEqualTo(30);
    }

    @Test
    @DisplayName("getSettings returns 14-day defaults for a new user")
    void getSettings_newUser_returnsDefaults() {
        // given
        User user = new User("bob");
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        // when
        UserSettingsResponse response = userSettingsService.getSettings(USER_ID);

        // then
        assertThat(response.getPlanningHorizonDays()).isEqualTo(14);
        assertThat(response.getBackdatingHorizonDays()).isEqualTo(14);
    }

    @Test
    @DisplayName("getSettings throws ResourceNotFoundException for an unknown user")
    void getSettings_unknownUser_throwsNotFound() {
        // given
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> userSettingsService.getSettings(USER_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("updateSettings persists new horizon values and returns them")
    void updateSettings_validRequest_persistsAndReturns() {
        // given
        User user = new User("alice");
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        UserSettingsRequest request = new UserSettingsRequest(21, 30);

        // when
        UserSettingsResponse response = userSettingsService.updateSettings(USER_ID, request);

        // then
        assertThat(user.getPlanningHorizonDays()).isEqualTo(21);
        assertThat(user.getBackdatingHorizonDays()).isEqualTo(30);
        verify(userRepository).save(user);
        assertThat(response.getPlanningHorizonDays()).isEqualTo(21);
        assertThat(response.getBackdatingHorizonDays()).isEqualTo(30);
    }

    @Test
    @DisplayName("updateSettings throws ResourceNotFoundException for an unknown user")
    void updateSettings_unknownUser_throwsNotFound() {
        // given
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());
        UserSettingsRequest request = new UserSettingsRequest(21, 30);

        // when & then
        assertThatThrownBy(() -> userSettingsService.updateSettings(USER_ID, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
