import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { applicationsApi, ApplicationResponse, PageResponse } from '../../core/api/services'
import toast from 'react-hot-toast'

interface AppState {
  myApplications: ApplicationResponse[]
  recruiterInbox: ApplicationResponse[]
  jobApplicants: ApplicationResponse[]
  stats: Record<string, number> | null
  totalPages: number
  recruiterInboxTotalPages: number
  recruiterInboxCurrentPage: number
  recruiterInboxTotalElements: number
  jobApplicantsTotalPages: number
  jobApplicantsCurrentPage: number
  loading: boolean
  error: string | null
}

const initialState: AppState = {
  myApplications: [],
  recruiterInbox: [],
  jobApplicants: [],
  stats: null,
  totalPages: 0,
  recruiterInboxTotalPages: 0,
  recruiterInboxCurrentPage: 0,
  recruiterInboxTotalElements: 0,
  jobApplicantsTotalPages: 0,
  jobApplicantsCurrentPage: 0,
  loading: false,
  error: null,
}

export const applyThunk = createAsyncThunk(
  'applications/apply',
  async ({ jobId, coverLetter, resumeUrl }: { jobId: string | number; coverLetter?: string; resumeUrl?: string }, { rejectWithValue }) => {
    try {
      const res = await applicationsApi.apply(jobId, coverLetter, resumeUrl)
      toast.success('Application submitted successfully')
      return res.data
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to submit your application. Please try again.'
      toast.error(msg)
      return rejectWithValue(msg)
    }
  },
)

export const applyWithResumeThunk = createAsyncThunk(
  'applications/applyWithResume',
  async ({ jobId, coverLetter, resume }: { jobId: string | number; coverLetter: string; resume: File }, { rejectWithValue }) => {
    try {
      const res = await applicationsApi.applyWithResume(jobId, coverLetter, resume)
      toast.success('Application submitted successfully with resume')
      return res.data
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to submit your application. Please try again.'
      toast.error(msg)
      return rejectWithValue(msg)
    }
  },
)

export const getMyApplicationsThunk = createAsyncThunk(
  'applications/getMy',
  async ({ page = 0, size = 10 }: { page?: number; size?: number }) => {
    const res = await applicationsApi.getMyApplications(page, size)
    return res.data
  },
)

export const getMyStatsThunk = createAsyncThunk('applications/getMyStats', async () => {
  const res = await applicationsApi.getMyStats()
  return res.data
})

export const getRecruiterInboxThunk = createAsyncThunk(
  'applications/getRecruiterInbox',
  async ({ page = 0, size = 20 }: { page?: number; size?: number }) => {
    const res = await applicationsApi.getRecruiterInbox(page, size)
    return res.data
  },
)

export const getJobApplicantsThunk = createAsyncThunk(
  'applications/getJobApplicants',
  async ({ jobId, page = 0, size = 20 }: { jobId: string | number; page?: number; size?: number }) => {
    const res = await applicationsApi.getJobApplicants(jobId, page, size)
    return res.data
  },
)

export const updateStatusThunk = createAsyncThunk(
  'applications/updateStatus',
  async ({ id, status, statusNote }: { id: string | number; status: string; statusNote?: string }, { rejectWithValue }) => {
    try {
      const res = await applicationsApi.updateStatus(id, status, statusNote)
      toast.success('Application status updated successfully')
      return res.data
    } catch {
      return rejectWithValue('Unable to update application status. Please try again.')
    }
  },
)

export const withdrawThunk = createAsyncThunk(
  'applications/withdraw',
  async (id: string | number, { rejectWithValue }) => {
    try {
      await applicationsApi.withdraw(id)
      toast.success('Application withdrawn successfully')
      return id
    } catch {
      return rejectWithValue('Unable to withdraw the application. Please try again.')
    }
  },
)

const applicationsSlice = createSlice({
  name: 'applications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getMyApplicationsThunk.pending, (state) => { state.loading = true })
      .addCase(getMyApplicationsThunk.fulfilled, (state, { payload }: { payload: PageResponse<ApplicationResponse> }) => {
        state.loading = false
        state.myApplications = payload.content
        state.totalPages = payload.totalPages
      })
      .addCase(getMyApplicationsThunk.rejected, (state) => { state.loading = false })

      .addCase(getMyStatsThunk.fulfilled, (state, { payload }) => {
        state.stats = payload
      })

      .addCase(getRecruiterInboxThunk.fulfilled, (state, { payload }: { payload: PageResponse<ApplicationResponse> }) => {
        state.recruiterInbox = payload.content
        state.recruiterInboxTotalPages = payload.totalPages
        state.recruiterInboxCurrentPage = payload.number
        state.recruiterInboxTotalElements = payload.totalElements
      })

      .addCase(getJobApplicantsThunk.fulfilled, (state, { payload }: { payload: PageResponse<ApplicationResponse> }) => {
        state.jobApplicants = payload.content
        state.jobApplicantsTotalPages = payload.totalPages
        state.jobApplicantsCurrentPage = payload.number
      })

      .addCase(applyThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })

      .addCase(applyThunk.fulfilled, (state, { payload }) => {
        state.loading = false
        state.myApplications = [payload, ...state.myApplications]
      })

      .addCase(applyThunk.rejected, (state, { payload }) => {
        state.loading = false
        state.error = (payload as string) || 'Unable to submit your application. Please try again.'
      })

      .addCase(applyWithResumeThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })

      .addCase(applyWithResumeThunk.fulfilled, (state, { payload }) => {
        state.loading = false
        state.myApplications = [payload, ...state.myApplications]
      })

      .addCase(applyWithResumeThunk.rejected, (state, { payload }) => {
        state.loading = false
        state.error = (payload as string) || 'Unable to submit your application. Please try again.'
      })

      .addCase(updateStatusThunk.fulfilled, (state, { payload }) => {
        state.recruiterInbox = state.recruiterInbox.map((a) => (a.id === payload.id ? payload : a))
        state.jobApplicants = state.jobApplicants.map((a) => (a.id === payload.id ? payload : a))
      })

      .addCase(withdrawThunk.fulfilled, (state, { payload }) => {
        state.myApplications = state.myApplications.filter((a) => a.id !== payload)
      })
  },
})

export default applicationsSlice.reducer
