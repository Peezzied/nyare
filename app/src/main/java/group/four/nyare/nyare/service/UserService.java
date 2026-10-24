package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.LoginRequest;
import group.four.nyare.nyare.dto.UserRequest;
import group.four.nyare.nyare.dto.UserResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;

import java.util.List;

/**
 * Service contract for user management and authentication operations.
 */
public interface UserService {

    /**
     * Creates a new user account.
     *
     * @param request the validated user payload
     * @return the created user response
     * @throws BadRequestException if the username already exists
     */
    UserResponse createUser(UserRequest request);

    /**
     * Retrieves all registered users.
     *
     * @return list of user responses
     */
    List<UserResponse> listUsers();

    /**
     * Retrieves a user by identifier.
     *
     * @param id the user identifier
     * @return the user response
     * @throws ResourceNotFoundException if user does not exist
     */
    UserResponse getUserById(Long id);

    /**
     * Deletes a user by identifier.
     *
     * @param id the user identifier
     * @throws ResourceNotFoundException if user does not exist
     */
    void deleteUser(Long id);

    /**
     * Authenticates a user by username.
     *
     * @param request the login payload
     * @return the authenticated user response
     * @throws ResourceNotFoundException if user does not exist
     */
    UserResponse authenticate(LoginRequest request);
}
