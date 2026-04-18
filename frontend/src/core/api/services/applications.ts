import api from '../axios'
import type { PageResponse } from './common'

export interface ApplicationResponse {
  id: number
  uuid?: string
  userId: number
  jobId: number
  recruiterId: number
  status: string
  resumeUrl?: string
  coverLetter?: string
  applicantName?: string
  applicantEmail?: string
  applicantPhone?: string
  jobTitle?: string
  companyName?: string
  statusNote?: string
  appliedAt: string
  updatedAt: string
}

export const applicationsApi = {
  apply: (jobId: string | number, coverLetter?: string, resumeUrl?: string) =>
    api.post<ApplicationResponse>('/applications', { jobId, coverLetter, resumeUrl }),

  applyWithResume: (jobId: string | number, coverLetter: string, resume: File) => {
    const form = new FormData()
    form.append('jobId', String(jobId))
    form.append('coverLetter', coverLetter)
    form.append('resume', resume)
    return api.post<ApplicationResponse>('/applications/with-resume', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getMyApplications: (page = 0, size = 10) =>
    api.get<PageResponse<ApplicationResponse>>('/applications/my', { params: { page, size } }),

  getMyStats: () =>
    api.get('/applications/my/stats'),

  getJobApplicants: (jobId: string | number, page = 0, size = 10) =>
    api.get<PageResponse<ApplicationResponse>>(`/applications/job/${jobId}`, { params: { page, size } }),

  getRecruiterInbox: (page = 0, size = 10) =>
    api.get<PageResponse<ApplicationResponse>>('/applications/recruiter/inbox', { params: { page, size } }),

  getById: (id: string | number) =>
    api.get<ApplicationResponse>(`/applications/${id}`),

  updateStatus: (id: string | number, status: string, statusNote?: string) =>
    api.patch<ApplicationResponse>(`/applications/${id}/status`, { status, statusNote }),

  withdraw: (id: string | number) =>
    api.patch(`/applications/${id}/withdraw`),

  getAllApplications: (page = 0, size = 20) =>
    api.get<PageResponse<ApplicationResponse>>('/applications/admin/all', { params: { page, size } }),
}
