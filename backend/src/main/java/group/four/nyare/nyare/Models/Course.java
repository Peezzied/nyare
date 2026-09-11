package group.four.nyare.nyare.Models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;

import java.time.LocalDate;

@Entity
public class Course {

    @Id
    @GeneratedValue
    private int id;
    private String name;
    private String description;
}
