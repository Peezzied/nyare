package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.NoteRequest;
import group.four.nyare.nyare.dto.NoteResponse;
import group.four.nyare.nyare.dto.NoteSummaryResponse;
import group.four.nyare.nyare.exception.ResourceNotFoundException;

import java.util.List;
import java.util.UUID;

/**
 * Service contract for course-linked journal note management and AI image metadata annotation.
 */
public interface NoteService {

    /**
     * Creates and persists a new journal note owned by the session user.
     *
     * @param request the validated note creation payload
     * @param userId  the owner user identifier from the active session
     * @return the persisted note response
     * @throws ResourceNotFoundException if the specified course does not exist or belongs to another user
     */
    NoteResponse createNote(NoteRequest request, Long userId);

    /**
     * Retrieves note summaries ordered by creation timestamp descending.
     * If courseId is provided, returns summaries for that course.
     * If courseId is null, returns all note summaries.
     * Each summary carries a truncated markdown preview instead of full content.
     *
     * @param courseId the optional course ID to filter by
     * @param archived {@code true} to list notes of archived courses, {@code false} for active courses
     * @return list of note summaries, newest first
     * @throws ResourceNotFoundException if the specified course does not exist
     */
    List<NoteSummaryResponse> listNotes(Long userId, Long courseId, Boolean archived);

    /**
     * Retrieves a single note owned by the session user.
     *
     * @param id     the unique UUID of the note
     * @param userId the owner user identifier from the active session
     * @return the note response
     * @throws ResourceNotFoundException if the note does not exist or belongs to another user
     */
    NoteResponse getNote(UUID id, Long userId);

    /**
     * Fully updates the content of an existing note owned by the session user.
     *
     * @param id      the unique UUID of the note to update
     * @param request the replacement note payload
     * @param userId  the owner user identifier from the active session
     * @return the updated note response
     * @throws ResourceNotFoundException if the note or course does not exist or belongs to another user
     */
    NoteResponse updateNote(UUID id, NoteRequest request, Long userId);

    /**
     * Deletes a note owned by the session user. Associated AI-extracted records
     * are not cascade-deleted.
     *
     * @param id     the unique UUID of the note to delete
     * @param userId the owner user identifier from the active session
     * @throws ResourceNotFoundException if the note does not exist or belongs to another user
     */
    void deleteNote(UUID id, Long userId);
}
