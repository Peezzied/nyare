package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Spring Data JPA repository for {@link User} entities.
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Finds a user by their unique username.
     *
     * @param username the username to query
     * @return optional containing the user if present
     */
    Optional<User> findByUsername(String username);

    /**
     * Checks if a user exists with the given username.
     *
     * @param username the username to query
     * @return true if user exists, false otherwise
     */
    boolean existsByUsername(String username);
}
