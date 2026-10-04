package group.four.nyare.nyare.config;

import group.four.nyare.nyare.controller.UserController;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

import java.util.Optional;

/**
 * Request-scoped helper resolving the authenticated user identifier from the HTTP session.
 */
@Component
@RequestScope
public class SessionContext {

    private final HttpServletRequest request;

    public SessionContext(HttpServletRequest request) {
        this.request = request;
    }

    /**
     * Resolves the current user identifier from the active session.
     *
     * @return optional containing the user identifier if an authenticated session exists
     */
    public Optional<Long> getUserId() {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return Optional.empty();
        }
        Object userIdAttr = session.getAttribute(UserController.SESSION_USER_ID);
        if (userIdAttr instanceof Long userId) {
            return Optional.of(userId);
        }
        return Optional.empty();
    }
}
