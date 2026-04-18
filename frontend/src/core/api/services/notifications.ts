import api from '../axios'
import type { PageResponse } from './common'

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
const BASE_URL = (viteEnv?.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '')
const API_BASE_URL = `${BASE_URL}/api/v1`

export interface NotificationApiResponse {
  id: number
  uuid?: string
  userId: number
  applicationId?: number
  to?: string
  subject: string
  body: string
  type?: string
  status?: string
  isRead?: boolean
  errorMessage?: string
  readAt?: string
  sentAt?: string
  createdAt: string
}

export const notificationsApi = {
  getMyNotifications: (page = 0, size = 20) =>
    api.get<PageResponse<NotificationApiResponse>>('/notifications/my', { params: { page, size } }),

  subscribeToMyNotifications: (token: string) =>
    new EventSource(`${API_BASE_URL}/notifications/my/stream?token=${encodeURIComponent(token)}`),

  markAsRead: (id: string | number) =>
    api.patch(`/notifications/my/${id}/read`),

  markAllAsRead: () =>
    api.patch('/notifications/my/read-all'),

  clearAll: () =>
    api.delete('/notifications/my'),

  deleteOne: (id: string | number) =>
    api.delete(`/notifications/my/${id}`),
}
