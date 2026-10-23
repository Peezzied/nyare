import { apiClient } from './client'
import type { NoteRequest, NoteResponse, NoteSummaryResponse } from '@/types/api'

/** Server-side filters for `GET /api/notes`. */
export interface NoteListParams {
  courseId?: number
  /** `true` returns notes of archived courses only. `false` returns notes of active courses. */
  archived?: boolean
  /** Case-insensitive substring match on title and body. */
  q?: string
  /** ISO `YYYY-MM-DD` inclusive lower bound on `entryDate`. */
  from?: string
  /** ISO `YYYY-MM-DD` inclusive upper bound on `entryDate`. */
  to?: string
}

/** API service for course-linked journal notes. */
export const notesApi = {
  /**
   * Lists note summaries with `GET /api/notes`.
   * Each summary has a content preview. Call `get()` for the full content.
   */
  list(params?: NoteListParams): Promise<NoteSummaryResponse[]> {
    return apiClient.get<NoteSummaryResponse[]>('/api/notes', params)
  },

  /**
   * Fetches one note with its full content with `GET /api/notes/{id}`.
   * @throws ApiError with status 404 when the note does not exist.
   */
  get(id: string): Promise<NoteResponse> {
    return apiClient.get<NoteResponse>(`/api/notes/${id}`)
  },

  /**
   * Creates a note with `POST /api/notes`. The new note is dirty until the next Process run.
   * @returns the saved DTO.
   * @throws ApiError with status 400 when the entry date is in the future.
   * It also rejects when the entry date is older than the backdate limit.
   */
  create(request: NoteRequest): Promise<NoteResponse> {
    return apiClient.post<NoteResponse>('/api/notes', request)
  },

  /**
   * Replaces a note with `PUT /api/notes/{id}`. The edit makes the note dirty again.
   * @returns the saved DTO.
   * @throws ApiError with a ProblemDetail when the note does not exist or validation fails.
   */
  update(id: string, request: NoteRequest): Promise<NoteResponse> {
    return apiClient.put<NoteResponse>(`/api/notes/${id}`, request)
  },

  /** Deletes a note with `DELETE /api/notes/{id}`. */
  delete(id: string): Promise<void> {
    return apiClient.delete(`/api/notes/${id}`)
  },
}
