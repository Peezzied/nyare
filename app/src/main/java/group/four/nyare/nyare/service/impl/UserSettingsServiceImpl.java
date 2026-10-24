package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.dto.UserSettingsRequest;
import group.four.nyare.nyare.dto.UserSettingsResponse;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.User;
import group.four.nyare.nyare.repository.UserRepository;
import group.four.nyare.nyare.service.UserSettingsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service implementation for per-user planning horizon preferences.
 */
@Service
@Transactional(readOnly = true)
public class UserSettingsServiceImpl implements UserSettingsService {

    private final UserRepository userRepository;

    public UserSettingsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserSettingsResponse getSettings(Long userId) {
        return toResponse(findUser(userId));
    }

    @Override
    @Transactional
    public UserSettingsResponse updateSettings(Long userId, UserSettingsRequest request) {
        User user = findUser(userId);
        user.setPlanningHorizonDays(request.getPlanningHorizonDays());
        user.setBackdatingHorizonDays(request.getBackdatingHorizonDays());
        userRepository.save(user);
        return toResponse(user);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
    }

    private UserSettingsResponse toResponse(User user) {
        return new UserSettingsResponse(user.getPlanningHorizonDays(), user.getBackdatingHorizonDays());
    }
}
