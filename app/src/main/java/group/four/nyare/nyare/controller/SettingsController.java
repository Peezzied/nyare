package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.config.SessionContext;
import group.four.nyare.nyare.dto.UserSettingsRequest;
import group.four.nyare.nyare.dto.UserSettingsResponse;
import group.four.nyare.nyare.service.UserSettingsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller managing per-user planning horizon preferences.
 */
@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final UserSettingsService userSettingsService;
    private final SessionContext sessionContext;

    public SettingsController(UserSettingsService userSettingsService, SessionContext sessionContext) {
        this.userSettingsService = userSettingsService;
        this.sessionContext = sessionContext;
    }

    @GetMapping
    public ResponseEntity<UserSettingsResponse> getSettings() {
        UserSettingsResponse settings = userSettingsService.getSettings(sessionContext.requireUserId());
        return ResponseEntity.ok(settings);
    }

    @PutMapping
    public ResponseEntity<UserSettingsResponse> updateSettings(@Valid @RequestBody UserSettingsRequest request) {
        UserSettingsResponse updated = userSettingsService.updateSettings(sessionContext.requireUserId(), request);
        return ResponseEntity.ok(updated);
    }
}
