package group.four.nyare.nyare.dto;

/**
 * Response payload representing user planning horizon preferences.
 */
public class UserSettingsResponse {

    private Integer planningHorizonDays;
    private Integer backdatingHorizonDays;

    public UserSettingsResponse() {
    }

    public UserSettingsResponse(Integer planningHorizonDays, Integer backdatingHorizonDays) {
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
