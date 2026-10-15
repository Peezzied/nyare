import { apiClient } from './client'
import type { ImageUploadResponse } from '@/types/api'

/** API service for images in note content. */
export const imagesApi = {
  /**
   * Uploads an image with `POST /api/images` as multipart form data.
   * @returns the saved image metadata.
   */
  upload(file: File | FormData): Promise<ImageUploadResponse> {
    return apiClient.upload<ImageUploadResponse>('/api/images', file)
  },

  /** Builds the `GET /api/images/{id}` URL for an `<img>` source. This call sends no request. */
  getImageUrl(id: string): string {
    return `/api/images/${id}`
  },

  /** Deletes an image with `DELETE /api/images/{id}`. */
  delete(id: string): Promise<void> {
    return apiClient.delete(`/api/images/${id}`)
  },
}
