package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.UserSettingsRequest;
import group.four.nyare.nyare.dto.UserSettingsResponse;
import group.four.nyare.nyare.exception.ResourceNotFoundException;

/**
 * Service contract for reading and updating per-user planning horizon preferences.
 */
public interface UserSettingsService {

    /**
     * Retrieves the horizon preferences of a user.
     *
     * @param userId the session user identifier
     * @return the current horizon settings
     * @throws ResourceNotFoundException if the user does not exist
     */
    UserSettingsResponse getSettings(Long userId);

    /**
     * Updates the horizon preferences of a user.
     *
     * @param userId the session user identifier
     * @param request the validated horizon payload (1-60 days each)
     * @return the persisted horizon settings
     * @throws ResourceNotFoundException if the user does not exist
     */
    UserSettingsResponse updateSettings(Long userId, UserSettingsRequest request);
}
