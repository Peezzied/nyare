package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.ImageMetadataUpdateRequest;
import group.four.nyare.nyare.dto.NoteRequest;
import group.four.nyare.nyare.dto.NoteResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;

import java.util.List;
import java.util.UUID;

/**
 * Service contract for course-linked journal note management and AI image metadata annotation.
 */
public interface NoteService {

    /**
     * Creates and persists a new journal note linked to a valid course.
     *
     * @param request the validated note creation payload
     * @return the persisted note response
     * @throws ResourceNotFoundException if the specified course does not exist
     */
    NoteResponse createNote(NoteRequest request);

    /**
     * Retrieves all notes for a course ordered by creation timestamp descending.
     *
     * @param courseId the course ID to filter by
     * @return list of note responses, newest first
     * @throws ResourceNotFoundException if the specified course does not exist
     */
    List<NoteResponse> listNotes(Long courseId);

    /**
     * Retrieves a single note by its unique identifier.
     *
     * @param id the unique UUID of the note
     * @return the note response
     * @throws ResourceNotFoundException if no note exists with the given identifier
     */
    NoteResponse getNote(UUID id);

    /**
     * Fully updates the content of an existing note.
     *
     * @param id      the unique UUID of the note to update
     * @param request the replacement note payload
     * @return the updated note response
     * @throws ResourceNotFoundException if the note or course does not exist
     */
    NoteResponse updateNote(UUID id, NoteRequest request);

    /**
     * Selectively updates the image metadata of an existing note while preserving its markdown text.
     * Verifies that all metadata keys correspond to existing image references in the markdown.
     *
     * @param id      the unique UUID of the note to update
     * @param request the image metadata update payload
     * @return the updated note response
     * @throws ResourceNotFoundException if the note does not exist
     * @throws BadRequestException       if the updated metadata keys do not match existing markdown image references
     */
    NoteResponse updateImageMetadata(UUID id, ImageMetadataUpdateRequest request);

    /**
     * Deletes a note by its unique identifier. Associated AI-extracted records
     * are not cascade-deleted.
     *
     * @param id the unique UUID of the note to delete
     * @throws ResourceNotFoundException if no note exists with the given identifier
     */
    void deleteNote(UUID id);
}
