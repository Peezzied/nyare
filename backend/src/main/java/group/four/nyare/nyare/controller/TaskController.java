package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.dto.TaskRequest;
import group.four.nyare.nyare.dto.TaskResponse;
import group.four.nyare.nyare.dto.TaskStatusRequest;
import group.four.nyare.nyare.model.enums.TaskStatus;
import group.four.nyare.nyare.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for study task management.
 * Provides endpoints for creating, filtering, querying, updating, and deleting academic tasks.
 */
@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    /**
     * Creates a new academic study task.
     *
     * @param request validated task creation payload
     * @return 201 Created with Location header and persisted task response
     */
    @PostMapping
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody TaskRequest request) {
        TaskResponse response = taskService.createTask(request);
        URI location = URI.create("/api/tasks/" + response.getId());
        return ResponseEntity.created(location).body(response);
    }

    /**
     * Retrieves tasks matching optional course, status, and scheduling filter parameters.
     *
     * @param courseId  optional course ID filter
     * @param status    optional lifecycle status filter
     * @param scheduled optional scheduled state filter (true for scheduled, false for unscheduled/later)
     * @return 200 OK with list of matching tasks
     */
    @GetMapping
    public ResponseEntity<List<TaskResponse>> listTasks(
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) Boolean scheduled) {
        List<TaskResponse> tasks = taskService.listTasks(courseId, status, scheduled);
        return ResponseEntity.ok(tasks);
    }

    /**
     * Retrieves a single task by its unique identifier.
     *
     * @param id unique UUID of the task
     * @return 200 OK with task response
     */
    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getTask(@PathVariable UUID id) {
        TaskResponse response = taskService.getTask(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Fully replaces an existing task.
     *
     * @param id      unique UUID of the task to update
     * @param request validated replacement payload
     * @return 200 OK with updated task response
     */
    @PutMapping("/{id}")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable UUID id,
            @Valid @RequestBody TaskRequest request) {
        TaskResponse response = taskService.updateTask(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Updates only the lifecycle status of an existing task.
     *
     * @param id      unique UUID of the task
     * @param request validated status update payload
     * @return 200 OK with updated task response
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskResponse> updateTaskStatus(
            @PathVariable UUID id,
            @Valid @RequestBody TaskStatusRequest request) {
        TaskResponse response = taskService.updateTaskStatus(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Deletes a task by its unique identifier.
     *
     * @param id unique UUID of the task to delete
     * @return 204 No Content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable UUID id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }
}
