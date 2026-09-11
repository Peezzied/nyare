package group.four.nyare.nyare.Models;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;

import java.time.Instant;
import java.util.UUID;

@Entity
public class AcademicContext {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    private Course course;

    @ManyToOne
    private Note note;

    private String value;

    /**
     * Context's age.
     */
    @CreatedDate
    private Instant createdAt;
}
