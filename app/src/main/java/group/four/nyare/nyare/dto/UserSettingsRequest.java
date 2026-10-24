package group.four.nyare.nyare.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request payload for updating user planning horizon preferences.
 */
public class UserSettingsRequest {

    @NotNull(message = "Planning horizon is required")
    @Min(value = 1, message = "Planning horizon must be at least 1 day")
    @Max(value = 60, message = "Planning horizon cannot exceed 60 days")
    private Integer planningHorizonDays;

    @NotNull(message = "Backdating horizon is required")
    @Min(value = 1, message = "Backdating horizon must be at least 1 day")
    @Max(value = 60, message = "Backdating horizon cannot exceed 60 days")
    private Integer backdatingHorizonDays;

    public UserSettingsRequest() {
    }

    public UserSettingsRequest(Integer planningHorizonDays, Integer backdatingHorizonDays) {
        this.planningHorizonDays = planningHorizonDays;
        this.backdatingHorizonDays = backdatingHorizonDays;
    }

    public Integer getPlanningHorizonDays() {
        return planningHorizonDays;
    }

    public void setPlanningHorizonDays(Integer planningHorizonDays) {
        this.planningHorizonDays = planningHorizonDays;
    }

    public Integer getBackdatingHorizonDays() {
        return backdatingHorizonDays;
    }

    public void setBackdatingHorizonDays(Integer backdatingHorizonDays) {
        this.backdatingHorizonDays = backdatingHorizonDays;
    }
}
