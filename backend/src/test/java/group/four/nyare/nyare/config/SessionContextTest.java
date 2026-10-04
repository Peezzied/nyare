package group.four.nyare.nyare.config;

import group.four.nyare.nyare.controller.UserController;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class SessionContextTest {

    @Test
    @DisplayName("getUserId returns user identifier when session is active")
    void getUserId_withActiveSession_returnsUserId() {
        // given
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(UserController.SESSION_USER_ID, 42L);
        request.setSession(session);

        SessionContext context = new SessionContext(request);

        // when
        Optional<Long> userId = context.getUserId();

        // then
        assertThat(userId).contains(42L);
    }

    @Test
    @DisplayName("getUserId returns empty when no session exists")
    void getUserId_withoutSession_returnsEmpty() {
        // given
        MockHttpServletRequest request = new MockHttpServletRequest();
        SessionContext context = new SessionContext(request);

        // when
        Optional<Long> userId = context.getUserId();

        // then
        assertThat(userId).isEmpty();
    }
}
