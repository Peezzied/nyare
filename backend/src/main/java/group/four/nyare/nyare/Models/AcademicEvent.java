package group.four.nyare.nyare.Models;

import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
public class AcademicEvent {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    private Course course;

    @ManyToMany
    private Note note;

    private String title;
    private String description;
    private LocalDateTime deadline;
}
