package group.four.nyare.nyare.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request payload for user authentication.
 */
public class LoginRequest {

    @NotBlank(message = "Username is required")
    private String username;

    public LoginRequest() {
    }

    public LoginRequest(String username) {
        this.username = username;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}
