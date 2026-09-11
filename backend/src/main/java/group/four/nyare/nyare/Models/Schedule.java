package group.four.nyare.nyare.Models;

import jakarta.persistence.*;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Entity
public class Schedule {

    @Id
    @GeneratedValue
    private int id;

    @ManyToOne
    private Course course;

    @OneToMany
    private Note note;

    private DayOfWeek day;
    private LocalTime startTime;
    private LocalTime endTime;
}
