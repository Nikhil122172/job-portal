import api from '../axios'
import type { UserResponse } from './auth'
import type { ApplicationResponse } from './applications'
import type { JobResponse } from './jobs'
import type { PageResponse } from './common'

interface AdminUserQuery {
  keyword?: string
  role?: string
  isActive?: boolean
  page?: number
  size?: number
}

interface AdminJobQuery {
  keyword?: string
  status?: string
  page?: number
  size?: number
}

interface AdminApplicationQuery {
  keyword?: string
  status?: string
  page?: number
  size?: number
}

export const adminApi = {
  getAnalytics: () =>
    api.get('/admin/analytics'),

  getDashboard: () =>
    api.get('/admin/dashboard'),

  getUsers: (params: AdminUserQuery) =>
    api.get<PageResponse<UserResponse>>('/admin/users', { params }),

  getJobs: (params: AdminJobQuery) =>
    api.get<PageResponse<JobResponse>>('/admin/jobs', { params }),

  deleteJob: (id: string | number) =>
    api.delete(`/admin/jobs/${id}`),

  getApplications: (params: AdminApplicationQuery) =>
    api.get<PageResponse<ApplicationResponse>>('/admin/applications', { params }),
}
