import api from '../axios'
import type { PageResponse } from './common'

export interface JobResponse {
  id: number
  uuid?: string
  title: string
  description: string
  company: string
  location: string
  jobType: string
  experienceLevel: string
  status: string
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string
  requirements?: string
  responsibilities?: string
  category?: string
  skills?: string
  recruiterId: number
  recruiterName?: string
  recruiterEmail?: string
  applicationDeadline?: string
  isRemote: boolean
  viewsCount: number
  applicationsCount: number
  createdAt: string
  updatedAt: string
}

export interface JobSearchParams {
  keyword?: string
  location?: string
  category?: string
  jobType?: string
  experienceLevel?: string
  salaryMin?: number
  salaryMax?: number
  isRemote?: boolean
  page?: number
  size?: number
  sortBy?: string
}

export interface CreateJobRequest {
  title: string
  description: string
  company: string
  location: string
  jobType: string
  experienceLevel: string
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string
  requirements?: string
  responsibilities?: string
  category?: string
  skills?: string
  applicationDeadline?: string
  isRemote?: boolean
}

export const jobsApi = {
  search: (params: JobSearchParams) =>
    api.get<PageResponse<JobResponse>>('/jobs/search', { params }),

  getById: (id: string | number, incrementViewCount = true) =>
    api.get<JobResponse>(`/jobs/${id}`, { params: { incrementViewCount } }),

  create: (data: CreateJobRequest) =>
    api.post<JobResponse>('/jobs', data),

  update: (id: string | number, data: Partial<CreateJobRequest> & { status?: string }) =>
    api.put<JobResponse>(`/jobs/${id}`, data),

  delete: (id: string | number) =>
    api.delete(`/jobs/${id}`),

  getMyJobs: (page = 0, size = 10) =>
    api.get<PageResponse<JobResponse>>('/jobs/recruiter/my-jobs', { params: { page, size } }),

  getStats: () =>
    api.get('/jobs/stats'),

  getCategories: () =>
    api.get<string[]>('/jobs/categories'),
}
