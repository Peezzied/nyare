package group.four.nyare.nyare.Models;

import group.four.nyare.nyare.Models.Enums.TaskStatus;
import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
public class Task {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    private Course course;

    private LocalDate scheduledDate;
    private Duration duration;

    @Enumerated(EnumType.STRING)
    private TaskStatus status;

    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;
}
