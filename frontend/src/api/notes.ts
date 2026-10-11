import { apiClient } from './client'
import type { NoteRequest, NoteResponse, NoteSummaryResponse } from '@/types/api'

export const notesApi = {
  list(courseId?: number): Promise<NoteSummaryResponse[]> {
    return apiClient.get<NoteSummaryResponse[]>('/api/notes', { courseId })
  },

  get(id: string): Promise<NoteResponse> {
    return apiClient.get<NoteResponse>(`/api/notes/${id}`)
  },

  create(request: NoteRequest): Promise<NoteResponse> {
    return apiClient.post<NoteResponse>('/api/notes', request)
  },

  update(id: string, request: NoteRequest): Promise<NoteResponse> {
    return apiClient.put<NoteResponse>(`/api/notes/${id}`, request)
  },

  delete(id: string): Promise<void> {
    return apiClient.delete(`/api/notes/${id}`)
  },
}
