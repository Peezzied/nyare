import { apiClient } from './client'
import type { ImageUploadResponse } from '@/types/api'

export const imagesApi = {
  upload(file: File | FormData): Promise<ImageUploadResponse> {
    return apiClient.upload<ImageUploadResponse>('/api/images', file)
  },

  getImageUrl(id: string): string {
    return `/api/images/${id}`
  },

  delete(id: string): Promise<void> {
    return apiClient.delete(`/api/images/${id}`)
  },
}
